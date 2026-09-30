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

    if (typeof body.nickname === "string") updates.nickname = body.nickname.trim().slice(0, 50);
    if (
      body.gender === "masculino" ||
      body.gender === "feminino" ||
      body.gender === "outro" ||
      body.gender === "prefiro_nao_dizer"
    ) {
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
      updates.self_assessed_level = body.self_assessed_level.trim().slice(0, 50);
    }
    if (typeof body.learning_style === "string") {
      updates.learning_style = body.learning_style.trim().slice(0, 200);
    }
    if (typeof body.learning_goal === "string") {
      updates.learning_goal = body.learning_goal.trim().slice(0, 200);
    }
    if (Array.isArray(body.main_difficulties)) {
      updates.main_difficulties = body.main_difficulties
        .filter((d) => typeof d === "string" && d.trim().length > 0)
        .slice(0, 10)
        .map((d) => d.trim().slice(0, 50));
    }

    // Telemetria incremental com limites defensivos
    if (typeof body.addPracticeSeconds === "number" && body.addPracticeSeconds > 0) {
      const secondsToAdd = Math.min(7200, Math.max(0, Math.round(body.addPracticeSeconds)));
      updates.practice_time_seconds = Math.min(100_000_000, (user.practice_time_seconds || 0) + secondsToAdd);
      
      // Lógica de Streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastPractice = user.last_practice_date ? new Date(user.last_practice_date) : null;
      if (lastPractice) lastPractice.setHours(0, 0, 0, 0);
      
      if (!lastPractice) {
        updates.streak_days = 1;
        updates.last_practice_date = new Date().toISOString();
      } else {
        const diffTime = Math.abs(today.getTime() - lastPractice.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          updates.streak_days = (user.streak_days || 0) + 1;
          updates.last_practice_date = new Date().toISOString();
        } else if (diffDays > 1) {
          updates.streak_days = 1;
          updates.last_practice_date = new Date().toISOString();
        }
      }
    } else if (typeof body.practice_time_seconds === "number") {
      updates.practice_time_seconds = Math.min(100_000_000, Math.max(0, Math.round(body.practice_time_seconds)));
    }

    if (typeof body.addXp === "number" && body.addXp > 0) {
      const xpToAdd = Math.min(1000, Math.max(0, Math.round(body.addXp)));
      updates.xp = Math.min(10_000_000, (user.xp || 0) + xpToAdd);
    } else if (typeof body.xp === "number") {
      updates.xp = Math.min(10_000_000, Math.max(0, Math.round(body.xp)));
    }

    if (typeof body.evolution_score === "number") {
      updates.evolution_score = Math.min(100, Math.max(0, Math.round(body.evolution_score)));
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

