import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

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

    const progress = progRes.data ?? Array.from(memoryProgress.values()).filter((p) => p.user_email === userEmail);
    const evaluations = evalRes.data ?? (memoryEvaluations.get(userEmail) ?? []);

    return NextResponse.json({
      ok: true,
      progress,
      evaluations
    });
  } catch (error) {
    console.error("[Module Progress GET] Fallback to memory:", error);
    const userProg = Array.from(memoryProgress.values()).filter((p) => p.user_email === userEmail);
    const userEval = memoryEvaluations.get(userEmail) ?? [];
    return NextResponse.json({ ok: true, progress: userProg, evaluations: userEval });
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
    };

    const moduleId = body.moduleId?.trim();
    if (!moduleId) {
      return NextResponse.json({ error: "moduleId é obrigatório." }, { status: 400 });
    }

    const turnsToAdd = typeof body.addTurns === "number" ? Math.max(1, body.addTurns) : 1;
    const memoryKey = getMemoryKey(userEmail, moduleId);
    const existingMemory = memoryProgress.get(memoryKey);

    let currentTurns = existingMemory?.total_turns ?? 0;
    let currentMissions = existingMemory?.completed_missions ?? [];
    let currentPercent = existingMemory?.progress_percent ?? 0;

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabaseAdmin
          .from("mrcrazy_module_progress")
          .select("*")
          .eq("user_email", userEmail)
          .eq("module_id", moduleId)
          .maybeSingle();

        if (data) {
          currentTurns = data.total_turns ?? currentTurns;
          currentMissions = Array.isArray(data.completed_missions) ? data.completed_missions : currentMissions;
          currentPercent = data.progress_percent ?? currentPercent;
        }
      } catch {}
    }

    const newTurns = currentTurns + turnsToAdd;
    let newMissions = [...currentMissions];
    if (body.completedMission && !newMissions.includes(body.completedMission)) {
      newMissions.push(body.completedMission);
    }

    // Calcula percentual com base em turnos e missões
    let newPercent: number;
    if (typeof body.progressPercent === "number") {
      newPercent = Math.min(100, Math.max(0, body.progressPercent));
    } else {
      // Cada turno adiciona ~5%, cada missão completada adiciona 25%
      const calculated = Math.min(95, newTurns * 6 + newMissions.length * 25);
      newPercent = Math.max(currentPercent, calculated);
    }

    const newStatus: "not_started" | "in_progress" | "completed" =
      newPercent >= 100 ? "completed" : "in_progress";

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
        await supabaseAdmin.from("mrcrazy_module_progress").upsert(
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
      } catch (dbErr) {
        console.warn("[Module Progress POST] DB upsert fallback:", dbErr);
      }
    }

    return NextResponse.json({ ok: true, progress: record });
  } catch {
    return NextResponse.json({ error: "Falha ao registrar progresso." }, { status: 400 });
  }
}
