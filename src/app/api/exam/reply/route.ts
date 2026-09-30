import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { getModuleById, type ExamNpcConfig } from "@/lib/modules";
import { getExamCompletionReply, getExamQuestionPlan, getNextExamReply } from "@/lib/exam";
import { checkRateLimit, acquireUserQueueSlot } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExamReplyRequestBody = {
  moduleId: string;
  userMessage: string;
  dialogue?: Array<{ role: "npc" | "user"; text: string }>;
  confusionCount?: number;
  attemptNumber?: number;
};

const PORTUGUESE_MARKERS = [
  /\b(como\s+fala|como\s+se\s+diz|n[aã]o\s+sei|n[aã]o\s+consigo|o\s+que\s+[eé]|me\s+ajuda|socorro)\b/i,
  /\b(oi|ol[aá]|bom\s+dia|boa\s+tarde|boa\s+noite|tudo\s+bem|como\s+vai)\b/i,
  /\b(eu\s+quero|eu\s+gostaria|quero\s+pedir|quanto\s+custa|onde\s+fica|por\s+favor|obrigad[oa])\b/i,
  /\b(sim|n[aã]o|mas|porque|pra|para\s+mim|meu\s+nome\s+[eé])\b/i
];

function containsPortuguese(text: string): boolean {
  return PORTUGUESE_MARKERS.some((regex) => regex.test(text));
}

function getGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    null
  );
}

function getFallbackQuestion(examNpc: ExamNpcConfig, turnIndex: number): string {
  switch (examNpc.avatarType) {
    case "neighbor":
      if (turnIndex === 0) {
        return "Nice to meet you! Brazil is an incredible country. Have you been living in this neighborhood long, or did you just move in?";
      }
      if (turnIndex === 1) {
        return "That's wonderful! What do you do for work or study around here?";
      }
      if (turnIndex === 2) {
        return "Sounds great! Do you know any good cafes or restaurants to recommend nearby?";
      }
      return "Thank you for the conversation. This part is complete. You can now click 'Finalizar Prova' to receive your evaluation.";

    case "waiter":
      if (turnIndex === 0) {
        return "Right this way! Here is a comfortable table by the window. Can I start you off with something to drink?";
      }
      if (turnIndex === 1) {
        return "Excellent choice! I will bring that right away. What would you like for your main dish today?";
      }
      if (turnIndex === 2) {
        return "Delicious! I have placed your food order. Would you like to see the dessert menu, or are you ready for the check?";
      }
      return "Certainly, here is the check for your table. We accept card or cash. You can now click 'Finalizar Prova' to complete your assessment!";

    case "cashier":
      if (turnIndex === 0) {
        return "Hi there! That item is on sale today for twenty-nine dollars. Would you like to try it on in the fitting room?";
      }
      if (turnIndex === 1) {
        return "Awesome! How did it fit? Do you need a different size or color?";
      }
      if (turnIndex === 2) {
        return "Perfect, we can head to the register. Will you be paying with credit card or cash today?";
      }
      return "All set! Here is your bag and receipt. Have a wonderful day! Click 'Finalizar Prova' to check your final grade.";

    case "receptionist":
      if (turnIndex === 0) {
        return "Welcome. May I see your passport and declaration form? What is the main purpose of your visit to the United States?";
      }
      if (turnIndex === 1) {
        return "Understood. How many days will you be staying in the country?";
      }
      if (turnIndex === 2) {
        return "And where will you be staying during your visit? Do you have your hotel address?";
      }
      return "Everything is in order. Welcome to the country, enjoy your stay! You can now finalize your exam.";

    case "coworker":
      if (turnIndex === 0) {
        return "Hey! Good to see you at the coffee corner. How was your weekend? Did you do anything fun?";
      }
      if (turnIndex === 1) {
        return "Nice! How is your current project coming along? Any big challenges?";
      }
      if (turnIndex === 2) {
        return "Totally agree! Are you going to join the team for lunch later today?";
      }
      return "Thank you for the conversation. This part is complete. You can now click 'Finalizar Prova' to receive your evaluation.";

    case "executive":
      if (turnIndex === 0) {
        return "Good afternoon. Thank you for making time for this sync. Could you summarize the core value proposition of your proposal?";
      }
      if (turnIndex === 1) {
        return "Understood. What are the key risks and how does your team plan to mitigate them?";
      }
      if (turnIndex === 2) {
        return "Strong points. What is the expected timeline for delivering the first milestone?";
      }
      return "Thank you for the presentation. This part is complete. You can now click 'Finalizar Prova' to receive your evaluation.";

    case "examiner":
    default:
      if (turnIndex === 0) {
        return "Welcome to your assessment. Please tell me about your background and primary motivation for mastering English.";
      }
      if (turnIndex === 1) {
        return "Insightful. How do you handle challenging communication situations when working under pressure?";
      }
      if (turnIndex === 2) {
        return "Excellent reflection. Finally, what is your long-term vision for utilizing English in your career?";
      }
      return "Thank you for your answers. This part is complete. You can now click 'Finalizar Prova' to receive your evaluation.";
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(session, "analyze");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error, code: rateLimit.code },
      { status: rateLimit.status, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 10) } }
    );
  }

  let releaseSlot: (() => void) | null = null;
  try {
    const userIdentifier = session.userId || session.email;
    releaseSlot = await acquireUserQueueSlot(userIdentifier, "exam-reply", 1, 8000);

    const body = (await request.json()) as ExamReplyRequestBody;
    const moduleId = body.moduleId?.trim();
    const userMessage = (body.userMessage?.trim() || "").slice(0, 500);
    const rawDialogue = Array.isArray(body.dialogue) ? body.dialogue : [];
    const dialogue = rawDialogue.slice(-10).map((d) => ({
      role: d.role === "npc" || d.role === "user" ? d.role : ("user" as const),
      text: typeof d.text === "string" ? d.text.trim().slice(0, 300) : ""
    }));
    const attemptNumber = Math.max(1, Math.min(2, Math.round(body.attemptNumber || 1)));

    if (!moduleId || !userMessage) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const currentModule = getModuleById(moduleId);
    const examNpc = currentModule.examNpc;

    // 1. Verificação se o aluno falou em português ou fala ininteligível
    if (containsPortuguese(userMessage) || userMessage.length < 3) {
      const randomIndex = Math.floor(Math.random() * examNpc.confusionPhrases.length);
      const confusionReply = examNpc.confusionPhrases[randomIndex];
      return NextResponse.json({
        ok: true,
        isConfusion: true,
        reply: confusionReply
      });
    }

    const answeredQuestions = dialogue.filter((d) => d.role === "user").length;
    const questionPlan = getExamQuestionPlan(moduleId, attemptNumber, examNpc.minTurns);
    const nextPlannedQuestion = getNextExamReply(moduleId, attemptNumber, answeredQuestions);
    const isExamComplete = answeredQuestions >= questionPlan.length;
    const apiKey = getGeminiApiKey();

    if (isExamComplete) {
      return NextResponse.json({
        ok: true,
        isConfusion: false,
        isExamComplete: true,
        reply: getExamCompletionReply(examNpc)
      });
    }

    if (apiKey) {
      try {
        const conversationHistoryText = dialogue
          .slice(-6)
          .map((d) => `${d.role === "npc" ? examNpc.name : "Student"}: "${d.text}"`)
          .join("\n");

        const nextQuestion = questionPlan[answeredQuestions];
        const prompt = `You are ${examNpc.name}, ${examNpc.roleEn} in the following practical English exam scenario:
- Scenario: ${currentModule.scenario}
- Mission/Goal: ${examNpc.scenarioGoal}
- Current conversation history:
${conversationHistoryText}
Student just said: "${userMessage}"
Questions answered by the student so far: ${answeredQuestions} of ${questionPlan.length}
Question plan for this attempt:
${questionPlan.map((q, index) => `${index + 1}. ${q.question} [focus: ${q.focus}]`).join("\n")}
Next required exam question to ask now:
"${nextPlannedQuestion}"
Question focus: ${nextQuestion?.focus || "scenario communication"}
What the candidate must demonstrate: ${nextQuestion?.responseGoal || "a complete, relevant answer"}
Correction focus for the evaluator: ${nextQuestion?.correctionFocus || "clarity and relevance"}

INSTRUCTIONS:
1. Speak 100% in natural American English.
2. Keep your response SHORT (1 to 2 sentences, 15 to 25 words maximum).
3. React naturally to what the student said in character.
4. Ask the next required exam question above. You may make it sound natural, but do not change the skill being tested.
5. This is an assessment: NEVER give hints, corrections, translations, grammar explanations, suggested wording, or pronunciation guidance. Keep the conversation moving without revealing whether an answer was correct.
6. If all planned questions have been answered, thank them and tell them they can now click 'Finalizar Prova' to calculate their grade.
7. Return ONLY the plain spoken English text. No quotation marks, no emojis, no commentary.`;

        const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
        for (const model of models) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300
                  }
                }),
                signal: controller.signal
              }
            );

            clearTimeout(timeoutId);

            if (geminiRes.ok) {
              const data = await geminiRes.json();
              const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              if (replyText) {
                const cleanedReply = replyText.replace(/^["']|["']$/g, "").trim();
                return NextResponse.json({
                    ok: true,
                    isConfusion: false,
                    reply: cleanedReply,
                    nextQuestionId: nextQuestion?.id ?? null,
                    questionFocus: nextQuestion?.focus ?? null
                  });
              }
            }
          } catch {
            // tenta o próximo modelo
          }
        }
      } catch {
        // cai no fallback determinístico
      }
    }

    // Fallback inteligente determinístico por turno
    const fallbackReply = nextPlannedQuestion || getFallbackQuestion(examNpc, answeredQuestions);
    return NextResponse.json({
      ok: true,
      isConfusion: false,
      isExamComplete: answeredQuestions >= questionPlan.length,
      reply: fallbackReply,
      nextQuestionId: questionPlan[answeredQuestions]?.id ?? null,
      questionFocus: questionPlan[answeredQuestions]?.focus ?? null
    });
  } catch (error) {
    const isBusy = (error as { code?: string })?.code === "QUEUE_BUSY";
    console.error("[Exam Reply API Error]:", error);
    return NextResponse.json(
      { error: isBusy ? "Aguarde a resposta anterior do examinador antes de falar novamente." : "Erro ao gerar resposta do examinador." },
      { status: isBusy ? 429 : 500 }
    );
  } finally {
    releaseSlot?.();
  }
}
