import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/server-auth";
import { analyzeEnglishSentence, normalizeLearningLevel, type AnalysisRequest } from "@/lib/mr-crazy";
import { analyzeEnglishSentenceLive } from "@/lib/gemini-analysis";

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
      learningLevel: normalizeLearningLevel(body.learningLevel)
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
