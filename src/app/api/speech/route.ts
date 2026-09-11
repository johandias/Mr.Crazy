import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"]);

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Voz neural não configurada." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 4000) : "";
    if (!text) {
      return NextResponse.json({ error: "Texto obrigatório." }, { status: 400 });
    }

    const configuredVoice = process.env.OPENAI_TTS_VOICE?.trim().toLowerCase();
    const voice = configuredVoice && VOICES.has(configuredVoice) ? configuredVoice : "ash";
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
        instructions: "Speak naturally in Brazilian Portuguese and clear American English for English phrases. Delivery: friendly, direct, human, conversational, close to the microphone. Keep it concise. Pronounce quoted English phrases in natural American English. Do not add, remove or replace any words."
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
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    console.error("OpenAI speech route failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Falha ao preparar a voz." }, { status: 500 });
  }
}
