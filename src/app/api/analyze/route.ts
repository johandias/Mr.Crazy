import { NextResponse } from "next/server";
import { analyzeEnglishSentence, normalizeLearningLevel, type AnalysisRequest } from "@/lib/mr-crazy";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AnalysisRequest>;
    const sentence = typeof body.sentence === "string" ? body.sentence.trim() : "";

    if (!sentence) {
      return NextResponse.json({ error: "sentence is required" }, { status: 400 });
    }

    const result = analyzeEnglishSentence(
      {
        sentence,
        previousMistakes: Array.isArray(body.previousMistakes) ? body.previousMistakes : [],
        crazyLevel: typeof body.crazyLevel === "number" ? body.crazyLevel : 14,
        mode: typeof body.mode === "string" ? body.mode : "free-conversation",
        learningLevel: normalizeLearningLevel(body.learningLevel)
      },
      process.env.MRCRAZY_TEST_KEY ? "test-key-ready" : "local-simulator"
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
