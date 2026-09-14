import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getModuleById } from "@/lib/modules";
import {
  memoryProgress,
  memoryEvaluations,
  getMemoryKey,
  type ModuleEvaluationRecord,
  type ModuleProgressRecord
} from "@/app/api/modules/progress/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EvaluateRequestBody = {
  moduleId: string;
  turns?: number;
  contextHistory?: Array<{ role: string; text: string }>;
  mistakes?: string[];
  completedMissions?: string[];
  isExam?: boolean;
  confusionCount?: number;
};

function getGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    null
  );
}

function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const userEmail = session.email.toLowerCase().trim();

  try {
    const body = (await request.json()) as EvaluateRequestBody;
    const moduleId = body.moduleId?.trim();
    if (!moduleId) {
      return NextResponse.json({ error: "moduleId é obrigatório." }, { status: 400 });
    }

    const currentModule = getModuleById(moduleId);
    const turns = Math.max(1, body.turns || 1);
    const isExam = Boolean(body.isExam);
    const confusionCount = Math.max(0, body.confusionCount || 0);
    const mistakes = Array.isArray(body.mistakes) ? body.mistakes : [];
    const context = Array.isArray(body.contextHistory) ? body.contextHistory.slice(-10) : [];
    const completedMissions = Array.isArray(body.completedMissions) ? body.completedMissions : [];

    const apiKey = getGeminiApiKey();
    let evaluationData: {
      overall_score: number;
      pronunciation_score: number;
      grammar_score: number;
      fluency_score: number;
      performance_level: "Iniciante" | "Em Desenvolvimento" | "Bom" | "Excelente" | "Dominado";
      summary_feedback: string;
      strengths: string[];
      improvement_areas: string[];
    } | null = null;

    if (apiKey) {
      try {
        const conversationSnippet = context
          .map((m) => `${m.role === "user" ? "Aluno" : currentModule.examNpc.name}: "${m.text}"`)
          .join("\n");

        const prompt = isExam
          ? `Você é o avaliador oficial da PROVA PRÁTICA DE INGLÊS do curso Mr. Crazy!
O aluno acaba de realizar a prova do módulo comunicando-se diretamente com o avatar:
- Módulo: "${currentModule.title}" (${currentModule.levelBadge})
- Examinador: "${currentModule.examNpc.name}" (${currentModule.examNpc.rolePt})
- Cenário: "${currentModule.scenario}"
- Objetivo do Aluno: "${currentModule.examNpc.scenarioGoal}"

Dados da Prova:
- Total de falas do aluno: ${turns}
- Vezes em que o examinador NÃO ENTENDEU (ficou com cara de confuso): ${confusionCount}
- Diálogo realizado:
${conversationSnippet || "(Diálogo prático em inglês)"}

REGRAS DE PONTUAÇÃO (Escala 0 a 100):
- Se a nota final for MENOR que 60 (equivalente a < 6.0), o aluno é REPROVADO.
- Se a nota for 60 ou mais (>= 6.0), o aluno é APROVADO.
- Se o aluno falou em português, não conseguiu se comunicar ou teve muitas confusões, a nota DEVE ser abaixo de 60.
- Se conseguiu cumprir o objetivo em inglês, atribua de 60 a 100 baseado na clareza e vocabulário.

Responda em formato JSON estrito:
{
  "overall_score": número inteiro de 0 a 100,
  "pronunciation_score": número inteiro de 0 a 100,
  "grammar_score": número inteiro de 0 a 100,
  "fluency_score": número inteiro de 0 a 100,
  "performance_level": "Bom",
  "summary_feedback": "Mensagem avaliativa direta indicando se foi aprovado ou reprovado (nota mínima 6.0), o que o avatar compreendeu e o que precisa ser ajustado.",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "improvement_areas": ["Ponto de melhoria 1", "Ponto de melhoria 2"]
}
Observação: performance_level deve ser exatamente um destes: "Iniciante", "Em Desenvolvimento", "Bom", "Excelente" ou "Dominado". Responda apenas com JSON puro.`
          : `Você é o Mr. Crazy, o professor de inglês mais carismático e motivador do Brasil!
Você acabou de concluir uma sessão de treino prático com seu aluno no módulo de conversação:
- Módulo: "${currentModule.title}" (${currentModule.levelBadge})
- Cenário: "${currentModule.subtitle}" - ${currentModule.description}
- Missão: "${currentModule.mission}"

Dados do treino:
- Total de turnos falados: ${turns}
- Amostra da conversa recente:
${conversationSnippet || "(Diálogo fluido focado no módulo)"}
- Tipos de deslizes anotados: ${mistakes.join(", ") || "Nenhum deslize grave detectado"}

Gere uma avaliação pedagógica justa e motivadora no seguinte formato JSON estrito:
{
  "overall_score": número inteiro de 50 a 100,
  "pronunciation_score": número inteiro de 50 a 100,
  "grammar_score": número inteiro de 50 a 100,
  "fluency_score": número inteiro de 50 a 100,
  "performance_level": "Bom",
  "summary_feedback": "Mensagem calorosa e empolgante do Mr. Crazy parabenizando a dedicação, citando o cenário e motivando o próximo passo.",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "improvement_areas": ["Dica de melhoria 1", "Dica de melhoria 2"]
}
Observação: O campo performance_level deve ser exatamente um destes valores: "Iniciante", "Em Desenvolvimento", "Bom", "Excelente" ou "Dominado". Responda apenas com o JSON puro.`;

        const models = ["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"];
        for (const model of models) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.6,
                    maxOutputTokens: 380,
                    responseMimeType: "application/json",
                    thinkingConfig: { thinkingBudget: 0 }
                  }
                }),
                signal: controller.signal
              }
            );

            clearTimeout(timeoutId);

            if (geminiRes.ok) {
              const resJson = await geminiRes.json();
              const textContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textContent) {
                const parsed = JSON.parse(stripJsonFences(textContent));
                if (typeof parsed.overall_score === "number") {
                  evaluationData = {
                    overall_score: Math.min(100, Math.max(0, Math.round(parsed.overall_score))),
                    pronunciation_score: Math.min(100, Math.max(0, Math.round(parsed.pronunciation_score || 75))),
                    grammar_score: Math.min(100, Math.max(0, Math.round(parsed.grammar_score || 72))),
                    fluency_score: Math.min(100, Math.max(0, Math.round(parsed.fluency_score || 74))),
                    performance_level: ["Iniciante", "Em Desenvolvimento", "Bom", "Excelente", "Dominado"].includes(parsed.performance_level)
                      ? parsed.performance_level
                      : "Bom",
                    summary_feedback: String(parsed.summary_feedback || `Avaliação concluída no módulo ${currentModule.title}.`),
                    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : ["Participou da conversa", "Compreensão geral"],
                    improvement_areas: Array.isArray(parsed.improvement_areas) ? parsed.improvement_areas.slice(0, 3) : ["Aumentar vocabulário", "Mais precisão gramatical"]
                  };
                  break;
                }
              }
            }
          } catch {
            // tenta próximo modelo
          }
        }
      } catch (err) {
        console.warn("[Module Evaluate] Gemini attempt failed, falling back to heuristic:", err);
      }
    }

    // Heurística de fallback em caso de ausência ou falha de LLM
    if (!evaluationData) {
      let calculatedScore: number;
      if (isExam) {
        // Na prova: cada confusão retira 15 pontos; cada turno adiciona 18 pontos (base 30)
        calculatedScore = Math.min(100, Math.max(20, 35 + turns * 16 - confusionCount * 18));
      } else {
        calculatedScore = Math.min(98, Math.max(65, 70 + turns * 3 - mistakes.length * 4));
      }

      const performanceLevel =
        calculatedScore >= 90 ? "Dominado" :
        calculatedScore >= 80 ? "Excelente" :
        calculatedScore >= 60 ? "Bom" :
        calculatedScore >= 45 ? "Em Desenvolvimento" : "Iniciante";

      const score10 = (calculatedScore / 10).toFixed(1);

      const feedback = isExam
        ? calculatedScore >= 60
          ? `Parabéns! Você foi APROVADO na prova com nota ${score10}/10.0! O avatar ${currentModule.examNpc.name} compreendeu bem seus pedidos. Etapa liberada com sucesso!`
          : `Você obteve nota ${score10}/10.0. Como a nota mínima para aprovação é 6.0, você foi REPROVADO nesta tentativa. Revise os conceitos com o Mr. Crazy e tente novamente!`
        : `Great job, campeão! Você completou ${turns} rodadas intensas no módulo ${currentModule.title}. O segredo do inglês não é perfeição, é consistência e ousadia!`;

      evaluationData = {
        overall_score: calculatedScore,
        pronunciation_score: Math.min(100, Math.max(20, calculatedScore + (isExam ? 0 : 2))),
        grammar_score: Math.max(20, calculatedScore - confusionCount * 6),
        fluency_score: Math.min(96, Math.max(20, calculatedScore + (turns > 3 ? 4 : -5))),
        performance_level: performanceLevel,
        summary_feedback: feedback,
        strengths: isExam
          ? [
              "Enfrentou o diálogo sem auxílio em português",
              `Manteve ${turns} turnos de interação direta em inglês`,
              "Focou na missão do cenário"
            ]
          : [
              "Enfrentou o cenário sem medo de errar",
              `Praticou ${turns} rodadas com consistência no vocabulário de ${currentModule.title}`,
              "Excelente assimilação das dicas do Mr. Crazy"
            ],
        improvement_areas: isExam
          ? [
              confusionCount > 0 ? `Evite pausas e palavras em português (${confusionCount} dúvidas do avatar)` : "Fale com ritmo mais natural",
              "Estruture respostas completas para passar segurança"
            ]
          : [
              mistakes.length > 0 ? `Atenção aos deslizes de ${mistakes[0]}` : "Continue expandindo respostas mais longas",
              "Revisite as frases-chave para ganhar mais naturalidade"
            ]
      };
    }

    const isApproved = evaluationData.overall_score >= 60;

    const evaluationRecord: ModuleEvaluationRecord = {
      user_email: userEmail,
      module_id: moduleId,
      overall_score: evaluationData.overall_score,
      pronunciation_score: evaluationData.pronunciation_score,
      grammar_score: evaluationData.grammar_score,
      fluency_score: evaluationData.fluency_score,
      performance_level: evaluationData.performance_level,
      summary_feedback: evaluationData.summary_feedback,
      strengths: evaluationData.strengths,
      improvement_areas: evaluationData.improvement_areas,
      evaluated_at: new Date().toISOString()
    };

    // Atualiza progresso do módulo:
    // Se for prova e reprovado (nota < 6.0), NÃO marca completed!
    const memoryKey = getMemoryKey(userEmail, moduleId);
    const existingProg = memoryProgress.get(memoryKey);
    const updatedTurns = (existingProg?.total_turns ?? 0) + turns;
    const allMissions = isApproved
      ? Array.from(new Set([...(existingProg?.completed_missions ?? []), ...completedMissions, currentModule.mission]))
      : (existingProg?.completed_missions ?? []);

    const progressPercent = isApproved
      ? 100
      : Math.max(existingProg?.progress_percent ?? 50, 75);

    const progressStatus = isApproved
      ? "completed"
      : existingProg?.status === "completed"
      ? "completed"
      : "in_progress";

    const progressRecord: ModuleProgressRecord = {
      user_email: userEmail,
      module_id: moduleId,
      status: progressStatus,
      progress_percent: progressPercent,
      total_turns: updatedTurns,
      completed_missions: allMissions,
      last_practiced_at: new Date().toISOString()
    };

    // Salva em memória
    memoryProgress.set(memoryKey, progressRecord);
    const userEvals = memoryEvaluations.get(userEmail) ?? [];
    memoryEvaluations.set(userEmail, [evaluationRecord, ...userEvals]);

    // Persiste no Supabase
    if (isSupabaseConfigured) {
      try {
        await Promise.all([
          supabaseAdmin.from("mrcrazy_module_evaluations").insert({
            user_id: session.userId || null,
            user_email: userEmail,
            module_id: moduleId,
            overall_score: evaluationRecord.overall_score,
            pronunciation_score: evaluationRecord.pronunciation_score,
            grammar_score: evaluationRecord.grammar_score,
            fluency_score: evaluationRecord.fluency_score,
            performance_level: evaluationRecord.performance_level,
            summary_feedback: evaluationRecord.summary_feedback,
            strengths: evaluationRecord.strengths,
            improvement_areas: evaluationRecord.improvement_areas,
            evaluated_at: evaluationRecord.evaluated_at
          }),
          supabaseAdmin.from("mrcrazy_module_progress").upsert(
            {
              user_id: session.userId || null,
              user_email: userEmail,
              module_id: moduleId,
              status: progressRecord.status,
              progress_percent: progressRecord.progress_percent,
              total_turns: updatedTurns,
              completed_missions: allMissions,
              last_practiced_at: progressRecord.last_practiced_at,
              updated_at: new Date().toISOString()
            },
            { onConflict: "user_email,module_id" }
          )
        ]);
      } catch (dbErr) {
        console.warn("[Module Evaluate] Supabase persist fallback:", dbErr);
      }
    }

    return NextResponse.json({
      ok: true,
      evaluation: evaluationRecord,
      progress: progressRecord,
      isApproved,
      score10: +(evaluationData.overall_score / 10).toFixed(1)
    });
  } catch (error) {
    console.error("[Module Evaluate POST] Error:", error);
    return NextResponse.json({ error: "Erro ao gerar avaliação do módulo." }, { status: 500 });
  }
}
