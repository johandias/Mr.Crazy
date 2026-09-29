import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/server-auth";
import { getModuleById } from "@/lib/modules";
import { getFallbackPhaseTargets, normalizePhaseTargets } from "@/lib/lesson-target";
import { getLessonTargetPhrases } from "@/lib/lesson-progress";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { memoryProgress, getMemoryKey } from "@/app/api/modules/progress/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

async function getAlreadyTrainedPhrases(userEmail: string, moduleId: string, phaseId?: string) {
  if (!isSupabaseConfigured) {
    const mem = memoryProgress.get(getMemoryKey(userEmail, moduleId));
    if (!mem || !Array.isArray(mem.completed_missions)) return [];
    return getLessonTargetPhrases(mem.completed_missions, phaseId).slice(-12);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("mrcrazy_module_progress")
      .select("completed_missions")
      .eq("user_email", userEmail)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (error || !Array.isArray(data?.completed_missions)) {
      const mem = memoryProgress.get(getMemoryKey(userEmail, moduleId));
      if (!mem || !Array.isArray(mem.completed_missions)) return [];
      return getLessonTargetPhrases(mem.completed_missions, phaseId).slice(-12);
    }
    return getLessonTargetPhrases(data.completed_missions, phaseId).slice(-12);
  } catch {
    const mem = memoryProgress.get(getMemoryKey(userEmail, moduleId));
    if (!mem || !Array.isArray(mem.completed_missions)) return [];
    return getLessonTargetPhrases(mem.completed_missions, phaseId).slice(-12);
  }
}

function getModels() {
  return Array.from(
    new Set(
      [process.env.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash"]
        .filter((model): model is string => Boolean(model?.trim()))
        .map((model) => model.replace(/^models\//u, "").trim())
    )
  );
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { moduleId?: string; phaseIndex?: number };
    const moduleId = body.moduleId?.trim();
    if (!moduleId) {
      return NextResponse.json({ error: "moduleId é obrigatório." }, { status: 400 });
    }

    const currentModule = getModuleById(moduleId);
    const phases = currentModule.concepts.filter((concept) => !concept.isExam);
    const phaseIndex = Math.min(
      Math.max(0, Math.trunc(body.phaseIndex ?? 0)),
      Math.max(0, phases.length - 1)
    );
    const phase = phases[phaseIndex];
    const fallbackTargets = getFallbackPhaseTargets(currentModule, phaseIndex);
    const trainedPhrases = await getAlreadyTrainedPhrases(
      session.email.toLowerCase().trim(),
      moduleId,
      phase?.id
    );
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.MRCRAZY_TEST_KEY;

    if (!apiKey || !phase) {
      return NextResponse.json({ ok: true, targets: fallbackTargets, provider: "fallback" });
    }

    const prompt = `Você cria um plano oral curto de inglês americano para um brasileiro.

Módulo: ${currentModule.cleanTitle}
Cenário: ${currentModule.scenario}
Fase ${phaseIndex + 1}/${phases.length}: ${phase.title}
Objetivo imutável da fase: ${phase.objective}
Referências: ${phase.samplePhrases.join(" | ")}
Já treinado nesta fase: ${trainedPhrases.length ? trainedPhrases.join(" | ") : "nada registrado ainda"}

Crie exatamente 3 alvos conectados e progressivos para a mesma fase:
1. Descobrir: modelo simples e essencial.
2. Praticar: variação curta do mesmo objetivo.
3. Aplicar: uso real dentro do cenário do módulo.

A IA tem liberdade para escolher o conteúdo, mas não pode sair do módulo nem do objetivo desta fase. Evite repetir frases já treinadas, salvo se for a base indispensável da fase. Cada frase deve ter no máximo 10 palavras.

Metodologia obrigatória:
- Descobrir ensina o termo central e quando usar.
- Praticar muda uma palavra ou intenção, mantendo o mesmo objetivo.
- Aplicar coloca a frase numa situação real do cenário.
- meaningPt deve explicar o uso, não só traduzir seco.
- phoneticPt deve ser uma aproximação brasileira fiel à frase inglesa, com sílaba forte quando útil.

Responda somente JSON válido:
{"targets":[{"phraseEn":"...","meaningPt":"...","phoneticPt":"..."},{"phraseEn":"...","meaningPt":"...","phoneticPt":"..."},{"phraseEn":"...","meaningPt":"...","phoneticPt":"..."}]}`;

    for (const model of getModels()) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 420,
                responseMimeType: "application/json"
              }
            }),
            signal: controller.signal
          }
        );
        clearTimeout(timer);
        if (!response.ok) continue;

        const payload = (await response.json()) as GeminiResponse;
        const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
        if (!raw) continue;
        const parsed = JSON.parse(raw) as { targets?: unknown };
        const targets = normalizePhaseTargets(parsed.targets, currentModule, phaseIndex);
        return NextResponse.json({ ok: true, targets, provider: "gemini", model });
      } catch {
        clearTimeout(timer);
      }
    }

    return NextResponse.json({ ok: true, targets: fallbackTargets, provider: "fallback" });
  } catch {
    return NextResponse.json({ error: "Falha ao preparar a fase." }, { status: 400 });
  }
}
