import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { checkRateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"]);

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  // 1. Verificação de Limite de Taxa e Cota Diária de Áudio
  const rateLimit = await checkRateLimit(session, "speech");
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Voz neural não configurada." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { text?: unknown };
    // Limita o texto para no máximo 500 caracteres (evita gastos acidentais de tokens de áudio)
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 500) : "";
    if (!text) {
      return NextResponse.json({ error: "Texto obrigatório." }, { status: 400 });
    }

    const configuredVoice = process.env.OPENAI_TTS_VOICE?.trim().toLowerCase();
    const voice = configuredVoice && VOICES.has(configuredVoice) ? configuredVoice : "echo";
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts",
        voice,
        input: text,
        response_format: "mp3",
        speed: 1.05,
        instructions: "Você é um homem brasileiro, com voz masculina encorpada, natural e realista. Fale português do Brasil com pronúncia 100% nativa e natural, sem sotaque estrangeiro. Pronuncie termos e frases em inglês com pronúncia americana nativa clara (en-US). Delivery: masculino, caloroso, direto, humano, descontraído e próximo ao microfone. Mantenha conciso."
      }),
      cache: "no-store"
    });

    if (!response.ok || !response.body) {
      console.error("OpenAI speech request failed", response.status);
      return NextResponse.json({ error: "Não foi possível gerar a voz agora." }, { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      }
    });
  } catch (error) {
    console.error("OpenAI speech route failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Falha ao preparar a voz." }, { status: 500 });
  }
}
