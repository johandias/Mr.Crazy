import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { updateUserProfile, type UserProfile } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safeProfile } = user;
  return NextResponse.json({ ok: true, profile: safeProfile });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<UserProfile> & {
      addPracticeSeconds?: number;
      addXp?: number;
    };

    const updates: Partial<UserProfile> = {};

    if (typeof body.nickname === "string") updates.nickname = body.nickname.trim();
    if (body.gender === "masculino" || body.gender === "feminino" || body.gender === "outro") {
      updates.gender = body.gender;
    }
    if (
      body.learning_level === "basic" ||
      body.learning_level === "intermediate" ||
      body.learning_level === "advanced"
    ) {
      updates.learning_level = body.learning_level;
    }
    if (typeof body.self_assessed_level === "string") {
      updates.self_assessed_level = body.self_assessed_level.trim();
    }
    if (typeof body.learning_style === "string") {
      updates.learning_style = body.learning_style.trim();
    }
    if (Array.isArray(body.main_difficulties)) {
      updates.main_difficulties = body.main_difficulties
        .filter((d) => typeof d === "string" && d.trim().length > 0)
        .map((d) => d.trim());
    }

    // Telemetria incremental
    if (typeof body.addPracticeSeconds === "number" && body.addPracticeSeconds > 0) {
      updates.practice_time_seconds = (user.practice_time_seconds || 0) + Math.round(body.addPracticeSeconds);
    } else if (typeof body.practice_time_seconds === "number") {
      updates.practice_time_seconds = Math.round(body.practice_time_seconds);
    }

    if (typeof body.addXp === "number" && body.addXp > 0) {
      updates.xp = (user.xp || 0) + Math.round(body.addXp);
    } else if (typeof body.xp === "number") {
      updates.xp = Math.round(body.xp);
    }

    if (typeof body.evolution_score === "number") {
      updates.evolution_score = Math.round(body.evolution_score);
    }

    const updated = await updateUserProfile(user.id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Falha ao atualizar perfil." }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeProfile } = updated;
    return NextResponse.json({ ok: true, profile: safeProfile });
  } catch {
    return NextResponse.json({ error: "Erro ao processar atualização." }, { status: 400 });
  }
}

