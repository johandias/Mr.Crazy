import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import {
  completeUserOnboarding,
  createAuthToken,
  AUTH_COOKIE_NAME,
  getSessionMaxAge
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session || !session.userId) {
      return NextResponse.json({ error: "Sessão expirada ou não autenticada." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<{
      learningGoal: string;
      level: "basic" | "intermediate" | "advanced";
      score: number;
      answers: unknown[];
    }>;

    const learningGoal = typeof body.learningGoal === "string" ? body.learningGoal.trim() : "Conversação prática do dia a dia";
    const validLevels = ["basic", "intermediate", "advanced"] as const;
    const level = validLevels.includes(body.level as (typeof validLevels)[number])
      ? (body.level as (typeof validLevels)[number])
      : "basic";
    const score = typeof body.score === "number" ? body.score : 0;
    const answers = Array.isArray(body.answers) ? body.answers : [];

    const updatedUser = await completeUserOnboarding(session.userId, {
      learningGoal,
      level,
      score,
      answers
    });

    const response = NextResponse.json({
      ok: true,
      learningLevel: level,
      learningGoal,
      redirectTo: "/practice",
      user: updatedUser
    });

    // Atualiza o cookie de sessão indicando onboarding concluído
    const token = createAuthToken({
      userId: session.userId,
      email: session.email,
      role: session.role,
      status: session.status,
      onboardingCompleted: true
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: request.url.startsWith("https://") || process.env.VERCEL === "1",
      path: "/",
      maxAge: getSessionMaxAge()
    });

    return response;
  } catch (error) {
    console.error("[api/user/onboarding error]:", error);
    return NextResponse.json(
      { error: "Erro ao salvar questionário de nivelamento." },
      { status: 500 }
    );
  }
}
