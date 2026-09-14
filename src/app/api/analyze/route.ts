import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { analyzeEnglishSentence, normalizeLearningLevel, type AnalysisRequest, type ConversationTurn } from "@/lib/mr-crazy";
import { analyzeEnglishSentenceLive } from "@/lib/gemini-analysis";
import { checkRateLimit, acquireUserQueueSlot } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeContextHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const turn = item as Partial<ConversationTurn>;
      const role = turn.role === "user" || turn.role === "crazy" ? turn.role : null;
      // Limita o tamanho de cada turno para 280 caracteres para poupar tokens de entrada
      const text = typeof turn.text === "string" ? turn.text.trim().slice(0, 280) : "";

      return role && text ? { role, text } : null;
    })
    .filter((item): item is ConversationTurn => Boolean(item))
    // Reduzido para os últimos 4 turnos essenciais (economia de tokens de prompt)
    .slice(-4);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  // 1. Verificação de Limite de Taxa e Cota Diária
  const rateLimit = await checkRateLimit(session, "analyze");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error, code: rateLimit.code },
      {
        status: rateLimit.status,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 10),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining)
        }
      }
    );
  }

  // 2. Controle de Fila e Concorrência por Usuário (Single-flight)
  let releaseSlot: (() => void) | null = null;
  const userIdentifier = session.userId || session.email;

  try {
    releaseSlot = await acquireUserQueueSlot(userIdentifier, "analyze", 1, 8000);
  } catch (queueErr: unknown) {
    const isBusy = (queueErr as { code?: string })?.code === "QUEUE_BUSY";
    return NextResponse.json(
      {
        error: isBusy
          ? "Outra frase sua já está sendo processada. Aguarde o Mr.Crazy terminar!"
          : "Tempo de espera na fila excedido. Tente novamente.",
        code: isBusy ? "QUEUE_BUSY" : "QUEUE_TIMEOUT"
      },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as Partial<AnalysisRequest>;
    // Limita o tamanho da frase enviada a 300 caracteres (evita spam e estouro de tokens)
    const rawSentence = typeof body.sentence === "string" ? body.sentence.trim() : "";
    const sentence = rawSentence.slice(0, 300);

    if (!sentence) {
      return NextResponse.json({ error: "sentence is required" }, { status: 400 });
    }

    const analysisRequest: AnalysisRequest = {
      sentence,
      previousMistakes: Array.isArray(body.previousMistakes) ? body.previousMistakes.slice(0, 6) : [],
      crazyLevel: typeof body.crazyLevel === "number" ? body.crazyLevel : 14,
      mode: typeof body.mode === "string" ? body.mode : "free-conversation",
      moduleId: typeof body.moduleId === "string" ? body.moduleId : undefined,
      learningLevel: normalizeLearningLevel(body.learningLevel),
      contextHistory: normalizeContextHistory(body.contextHistory),
      contextHistory: normalizeContextHistory(body.contextHistory).slice(-2),
      inputSource:
        body.inputSource === "voice_realtime" || body.inputSource === "voice_fallback" ? body.inputSource : "manual"
    };

    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.MRCRAZY_TEST_KEY;
    const result = apiKey
      ? await analyzeEnglishSentenceLive(analysisRequest, apiKey)
      : analyzeEnglishSentence(analysisRequest, "local-simulator");

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      }
    });
  } catch {
    return NextResponse.json({ error: "Falha ao processar a frase." }, { status: 400 });
  } finally {
    releaseSlot?.();
  }
}
