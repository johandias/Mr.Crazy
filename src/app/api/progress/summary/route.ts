import { NextResponse } from "next/server";
import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { LEARNING_MODULES } from "@/lib/modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type {
  ModuleProgressEntry,
  WeeklyStat,
  ComputedLevel,
  ProgressSummaryResponse
} from "@/lib/progress-types";

export type {
  ModuleProgressEntry,
  WeeklyStat,
  ComputedLevel,
  ProgressSummaryResponse
};

/**
 * Calcula o nível efetivo do aluno baseado no progresso real dos módulos.
 * Módulos 1-4 = Básico, 5-8 = Intermediário, 9-12 = Avançado.
 */
function computeLevel(completedModuleIds: string[]): ComputedLevel {
  const n = completedModuleIds.length;
  const basicCompleted = LEARNING_MODULES.filter(
    (m) => m.stageNumber <= 4 && completedModuleIds.includes(m.id)
  ).length;
  const intermediateCompleted = LEARNING_MODULES.filter(
    (m) => m.stageNumber >= 5 && m.stageNumber <= 8 && completedModuleIds.includes(m.id)
  ).length;
  const advancedCompleted = LEARNING_MODULES.filter(
    (m) => m.stageNumber >= 9 && completedModuleIds.includes(m.id)
  ).length;

  if (advancedCompleted >= 4) {
    return { level: "advanced", label: "Avançado", tag: "C1", modulesCompleted: n, nextMilestone: "Todos os módulos concluídos! 🎉", progressToNext: 100 };
  }
  if (intermediateCompleted >= 2 || basicCompleted >= 4) {
    return { level: "intermediate", label: "Intermediário", tag: "B1-B2", modulesCompleted: n, nextMilestone: `Conclua ${4 - intermediateCompleted} módulo(s) intermediário(s) para avançar`, progressToNext: Math.round((intermediateCompleted / 4) * 100) };
  }
  if (advancedCompleted > 0) {
    return { level: "advanced", label: "Avançado", tag: "C1", modulesCompleted: n, nextMilestone: `Conclua ${4 - advancedCompleted} módulo(s) avançado(s)`, progressToNext: Math.round((advancedCompleted / 4) * 100) };
  }
  return { level: "basic", label: "Básico", tag: "A1-A2", modulesCompleted: n, nextMilestone: `Conclua ${4 - basicCompleted} módulo(s) básico(s) para subir de nível`, progressToNext: Math.round((basicCompleted / 4) * 100) };
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await getCurrentUser();
  const userEmail = session.email.toLowerCase().trim();

  const profile = user
    ? {
        id: user.id,
        nickname: user.nickname || "Aluno",
        email: user.email,
        learning_level: user.learning_level || "basic",
        xp: user.xp || 0,
        streak_days: user.streak_days || 1,
        practice_time_seconds: user.practice_time_seconds || 0,
        evolution_score: user.evolution_score || 0,
        main_difficulties: Array.isArray(user.main_difficulties) ? user.main_difficulties : [],
        onboarding_completed: user.onboarding_completed || false,
        learning_goal: (user as Record<string, unknown>).learning_goal as string | null ?? null
      }
    : null;

  let progressRows: Array<{
    module_id: string;
    status: string;
    progress_percent: number;
    total_turns: number;
    completed_missions: string[];
    last_practiced_at: string | null;
  }> = [];
  let evaluationsRows: Array<{ module_id: string; overall_score: number; evaluated_at: string }> = [];
  let sessionRows: Array<{ started_at: string; turns_count: number; duration_seconds: number; xp_earned: number }> = [];

  if (isSupabaseConfigured) {
    try {
      const [progRes, evalRes] = await Promise.all([
        supabaseAdmin
          .from("mrcrazy_module_progress")
          .select("module_id, status, progress_percent, total_turns, completed_missions, last_practiced_at")
          .eq("user_email", userEmail),
        supabaseAdmin
          .from("mrcrazy_module_evaluations")
          .select("module_id, overall_score, evaluated_at")
          .eq("user_email", userEmail)
          .order("evaluated_at", { ascending: false })
      ]);

      progressRows = (progRes.data || []) as typeof progressRows;
      evaluationsRows = (evalRes.data || []) as typeof evaluationsRows;
    } catch { /* fallback silencioso */ }

    // Sessões da semana (tabela pode não existir ainda)
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const sessRes = await supabaseAdmin
        .from("mrcrazy_practice_sessions")
        .select("started_at, turns_count, duration_seconds, xp_earned")
        .eq("user_email", userEmail)
        .gte("started_at", weekAgo)
        .order("started_at", { ascending: true });
      sessionRows = (sessRes.data || []) as typeof sessionRows;
    } catch { /* tabela ainda não criada */ }
  }

  // Mapa de melhor nota por módulo
  const bestScoreByModule = new Map<string, number>();
  for (const ev of evaluationsRows) {
    const cur = bestScoreByModule.get(ev.module_id) ?? 0;
    bestScoreByModule.set(ev.module_id, Math.max(cur, Number(ev.overall_score)));
  }

  const progressByModuleId = new Map(progressRows.map((p) => [p.module_id, p]));
  const completedModuleIds: string[] = [];

  const moduleProgress: ModuleProgressEntry[] = LEARNING_MODULES.map((mod) => {
    const row = progressByModuleId.get(mod.id);
    const status = (row?.status ?? "not_started") as ModuleProgressEntry["status"];
    if (status === "completed") completedModuleIds.push(mod.id);
    return {
      moduleId: mod.id,
      moduleTitle: mod.title,
      moduleBadge: mod.levelBadge,
      difficulty: mod.difficulty,
      status,
      progressPercent: row?.progress_percent ?? 0,
      totalTurns: row?.total_turns ?? 0,
      completedMissions: Array.isArray(row?.completed_missions) ? row!.completed_missions : [],
      lastPracticedAt: row?.last_practiced_at ?? null,
      bestScore: bestScoreByModule.get(mod.id) ?? null,
      xpReward: mod.xpReward
    };
  });

  // Estatísticas semanais por dia
  const weeklyMap = new Map<string, WeeklyStat>();
  for (const s of sessionRows) {
    const date = s.started_at.slice(0, 10);
    const e = weeklyMap.get(date) ?? { date, turnsCount: 0, durationSeconds: 0, xpEarned: 0 };
    weeklyMap.set(date, { date, turnsCount: e.turnsCount + (s.turns_count || 0), durationSeconds: e.durationSeconds + (s.duration_seconds || 0), xpEarned: e.xpEarned + (s.xp_earned || 0) });
  }
  const weeklyStats = Array.from(weeklyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const moduleById = new Map(LEARNING_MODULES.map((m) => [m.id, m]));
  const recentEvaluations = evaluationsRows.slice(0, 5).map((ev) => ({
    moduleId: ev.module_id,
    moduleTitle: moduleById.get(ev.module_id)?.title ?? ev.module_id,
    score: Number(ev.overall_score),
    evaluatedAt: ev.evaluated_at
  }));

  const totalTurns = progressRows.reduce((acc, p) => acc + (p.total_turns || 0), 0);
  const totalModulesCompleted = completedModuleIds.length;
  const totalSessions = sessionRows.length || Math.max(1, Math.round((user?.practice_time_seconds || 0) / 600));

  return NextResponse.json({
    ok: true,
    profile,
    computedLevel: computeLevel(completedModuleIds),
    moduleProgress,
    totalModulesCompleted,
    totalTurns,
    totalSessions,
    weeklyStats,
    recentEvaluations
  } satisfies ProgressSummaryResponse);
}
