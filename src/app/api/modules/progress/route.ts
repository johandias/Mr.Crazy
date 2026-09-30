import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getModuleById } from "@/lib/modules";
import {
  calculateLessonProgressPercent,
  getLessonTargetMarker,
  getLessonStepMarker,
  LESSON_STEPS_PER_PHASE
} from "@/lib/lesson-progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ModuleProgressRecord = {
  id?: string;
  user_email: string;
  module_id: string;
  status: "not_started" | "in_progress" | "completed";
  progress_percent: number;
  total_turns: number;
  completed_missions: string[];
  last_practiced_at: string;
};

export type ModuleEvaluationRecord = {
  id?: string;
  user_email: string;
  module_id: string;
  overall_score: number;
  pronunciation_score: number;
  grammar_score: number;
  fluency_score: number;
  performance_level: string;
  summary_feedback: string;
  strengths: string[];
  improvement_areas: string[];
  evaluated_at: string;
};

// Memória local de fallback para resiliência
export const memoryProgress = new Map<string, ModuleProgressRecord>();
export const memoryEvaluations = new Map<string, ModuleEvaluationRecord[]>();

export function getMemoryKey(email: string, moduleId: string): string {
  return `${email.toLowerCase().trim()}:${moduleId}`;
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const userEmail = session.email.toLowerCase().trim();

  if (!isSupabaseConfigured) {
    const userProg = Array.from(memoryProgress.values()).filter((p) => p.user_email === userEmail);
    const userEval = memoryEvaluations.get(userEmail) ?? [];
    return NextResponse.json({ ok: true, progress: userProg, evaluations: userEval });
  }

  try {
    const [progRes, evalRes] = await Promise.all([
      supabaseAdmin
        .from("mrcrazy_module_progress")
        .select("*")
        .eq("user_email", userEmail),
      supabaseAdmin
        .from("mrcrazy_module_evaluations")
        .select("*")
        .eq("user_email", userEmail)
        .order("evaluated_at", { ascending: false })
    ]);

    if (progRes.error) throw progRes.error;
    if (evalRes.error) throw evalRes.error;

    const progress = progRes.data ?? Array.from(memoryProgress.values()).filter((p) => p.user_email === userEmail);
    const evaluations = evalRes.data ?? (memoryEvaluations.get(userEmail) ?? []);

    return NextResponse.json({
      ok: true,
      progress,
      evaluations
    });
  } catch (error) {
    console.error("[Module Progress GET] Persistent read failed:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar seu progresso salvo." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const userEmail = session.email.toLowerCase().trim();

  try {
    const body = (await request.json()) as {
      moduleId?: string;
      addTurns?: number;
      completedMission?: string;
      progressPercent?: number;
      completed?: boolean;
      phaseIndex?: number;
      stepIndex?: number;
      teachingTarget?: {
        phaseId?: string;
        phraseEn?: string;
      };
    };

    const moduleId = body.moduleId?.trim();
    if (!moduleId) {
      return NextResponse.json({ error: "moduleId é obrigatório." }, { status: 400 });
    }

    const turnsToAdd = typeof body.addTurns === "number" ? Math.min(50, Math.max(0, Math.trunc(body.addTurns))) : 0;
    const currentModule = getModuleById(moduleId);
    const teachingPhases = currentModule.concepts.filter((concept) => !concept.isExam);
    const phaseIds = teachingPhases.map((phase) => phase.id);
    const memoryKey = getMemoryKey(userEmail, moduleId);
    const existingMemory = memoryProgress.get(memoryKey);

    let currentTurns = existingMemory?.total_turns ?? 0;
    let currentMissions = existingMemory?.completed_missions ?? [];
    let currentPercent = existingMemory?.progress_percent ?? 0;
    let wasCompletedBefore = existingMemory?.status === "completed";

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from("mrcrazy_module_progress")
          .select("*")
          .eq("user_email", userEmail)
          .eq("module_id", moduleId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          currentTurns = data.total_turns ?? currentTurns;
          currentMissions = Array.isArray(data.completed_missions) ? data.completed_missions : currentMissions;
          currentPercent = data.progress_percent ?? currentPercent;
          wasCompletedBefore = data.status === "completed";
        }
      } catch (dbErr) {
        console.error("[Module Progress POST] Failed to read current progress:", dbErr);
        return NextResponse.json(
          { error: "Não foi possível carregar seu progresso atual. Tente novamente." },
          { status: 503 }
        );
      }
    }

    const newTurns = currentTurns + turnsToAdd;
    let newMissions = [...currentMissions];
    const mission = typeof body.completedMission === "string" ? body.completedMission.trim().slice(0, 200) : "";
    if (mission && !newMissions.includes(mission)) {
      newMissions.push(mission);
    }
    if (newMissions.length > 120) {
      newMissions = newMissions.slice(-120);
    }

    if (typeof body.phaseIndex === "number" && typeof body.stepIndex === "number") {
      const phaseIndex = Math.min(
        teachingPhases.length - 1,
        Math.max(0, Math.trunc(body.phaseIndex))
      );
      const stepIndex = Math.min(
        LESSON_STEPS_PER_PHASE - 1,
        Math.max(0, Math.trunc(body.stepIndex))
      );
      const phase = teachingPhases[phaseIndex];
      if (phase) {
        const marker = getLessonStepMarker(phase.id, stepIndex);
        if (!newMissions.includes(marker)) newMissions.push(marker);

        const targetPhrase = body.teachingTarget?.phraseEn?.trim();
        const targetPhaseId = body.teachingTarget?.phaseId?.trim() || phase.id;
        if (targetPhrase) {
          const targetMarker = getLessonTargetMarker(targetPhaseId, stepIndex, targetPhrase);
          if (!newMissions.includes(targetMarker)) newMissions.push(targetMarker);
        }
      }
    }

    // Calcula percentual com base em turnos, missões ou sinal explícito de conclusão
    let newPercent: number;
    if (body.completed === true) {
      newPercent = 100;
    } else if (typeof body.progressPercent === "number") {
      newPercent = Math.min(100, Math.max(0, body.progressPercent));
    } else {
      const lessonPercent = calculateLessonProgressPercent(newMissions, phaseIds);
      const engagementPercent = Math.min(20, newTurns * 2);
      const calculated = Math.min(95, Math.max(lessonPercent, engagementPercent));
      newPercent = Math.max(currentPercent, calculated);
    }

    const newStatus: "not_started" | "in_progress" | "completed" =
      wasCompletedBefore || newPercent >= 100 ? "completed" : "in_progress";

    const record: ModuleProgressRecord = {
      user_email: userEmail,
      module_id: moduleId,
      status: newStatus,
      progress_percent: newPercent,
      total_turns: newTurns,
      completed_missions: newMissions,
      last_practiced_at: new Date().toISOString()
    };

    memoryProgress.set(memoryKey, record);

    if (isSupabaseConfigured) {
      try {
        const { error: upsertError } = await supabaseAdmin.from("mrcrazy_module_progress").upsert(
          {
            user_id: session.userId || null,
            user_email: userEmail,
            module_id: moduleId,
            status: newStatus,
            progress_percent: newPercent,
            total_turns: newTurns,
            completed_missions: newMissions,
            last_practiced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { onConflict: "user_email,module_id" }
        );
        if (upsertError) throw upsertError;

        // Se concluiu o módulo agora (e não estava concluído antes), bonifica com XP
        if (newStatus === "completed" && !wasCompletedBefore) {
          try {
            const { data: userRow } = await supabaseAdmin
              .from("mrcrazy_users")
              .select("xp, evolution_score")
              .eq("email", userEmail)
              .maybeSingle();

            if (userRow) {
              const bonusXp = (userRow.xp || 0) + 100;
              const bonusScore = Math.min(100, (userRow.evolution_score || 0) + 10);
              await supabaseAdmin
                .from("mrcrazy_users")
                .update({ xp: bonusXp, evolution_score: bonusScore, updated_at: new Date().toISOString() })
                .eq("email", userEmail);
            }
          } catch (xpErr) {
            console.warn("[Module Progress POST] XP bonus update error:", xpErr);
          }
        }

        // Registra sessão de prática para histórico e telemetria
        if (turnsToAdd > 0) try {
          await supabaseAdmin.from("mrcrazy_practice_sessions").insert({
            user_id: session.userId || null,
            user_email: userEmail,
            module_id: moduleId,
            turns_count: turnsToAdd,
            duration_seconds: turnsToAdd * 25,
            xp_earned: turnsToAdd * 5 + (newStatus === "completed" ? 100 : 0),
            session_type: body.completed ? "exam" : "voice",
            started_at: new Date(Date.now() - turnsToAdd * 25000).toISOString(),
            ended_at: new Date().toISOString()
          });
        } catch {
          // Ignora se tabela de sessões não estiver acessível
        }
      } catch (dbErr) {
        console.error("[Module Progress POST] Persistent save failed:", dbErr);
        return NextResponse.json(
          { error: "Não foi possível registrar seu avanço. Tente novamente." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ ok: true, progress: record });
  } catch {
    return NextResponse.json({ error: "Falha ao registrar progresso." }, { status: 400 });
  }
}
