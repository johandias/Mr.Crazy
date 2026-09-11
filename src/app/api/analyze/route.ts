import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/server-auth";
import { analyzeEnglishSentence, normalizeLearningLevel, type AnalysisRequest, type ConversationTurn } from "@/lib/mr-crazy";
import { analyzeEnglishSentenceLive } from "@/lib/gemini-analysis";

function normalizeContextHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const turn = item as Partial<ConversationTurn>;
      const role = turn.role === "user" || turn.role === "crazy" ? turn.role : null;
      const text = typeof turn.text === "string" ? turn.text.trim().slice(0, 360) : "";

      return role && text ? { role, text } : null;
    })
    .filter((item): item is ConversationTurn => Boolean(item))
    .slice(-10);
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<AnalysisRequest>;
    const sentence = typeof body.sentence === "string" ? body.sentence.trim() : "";

    if (!sentence) {
      return NextResponse.json({ error: "sentence is required" }, { status: 400 });
    }

    const analysisRequest: AnalysisRequest = {
      sentence,
      previousMistakes: Array.isArray(body.previousMistakes) ? body.previousMistakes : [],
      crazyLevel: typeof body.crazyLevel === "number" ? body.crazyLevel : 14,
      mode: typeof body.mode === "string" ? body.mode : "free-conversation",
      learningLevel: normalizeLearningLevel(body.learningLevel),
      contextHistory: normalizeContextHistory(body.contextHistory),
      inputSource:
        body.inputSource === "voice_realtime" || body.inputSource === "voice_fallback" ? body.inputSource : "manual"
    };
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.MRCRAZY_TEST_KEY;
    const result = apiKey
      ? await analyzeEnglishSentenceLive(analysisRequest, apiKey)
      : analyzeEnglishSentence(analysisRequest, "local-simulator");

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
