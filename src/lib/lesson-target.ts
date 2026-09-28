import type { LearningModule, ModuleConcept } from "./modules";
import { LESSON_STEP_LABELS, LESSON_STEPS_PER_PHASE } from "./lesson-progress";

export type TeachingTarget = {
  phaseId: string;
  phaseIndex: number;
  stepIndex: number;
  stepLabel: (typeof LESSON_STEP_LABELS)[number];
  phraseEn: string;
  meaningPt: string;
  phoneticPt: string;
};

function getTeachingConcept(module: LearningModule, phaseIndex: number): ModuleConcept | undefined {
  const phases = module.concepts.filter((concept) => !concept.isExam);
  return phases[Math.min(Math.max(0, phaseIndex), Math.max(0, phases.length - 1))];
}

export function getFallbackPhaseTargets(
  module: LearningModule,
  phaseIndex: number
): TeachingTarget[] {
  const concept = getTeachingConcept(module, phaseIndex);
  const phraseEn = concept?.targetPhrase || concept?.samplePhrases[0] || module.samplePhrases[0] || "Let's practice.";
  const meaningPt = concept?.meaningPt || concept?.objective || module.mission;
  const phoneticPt = concept?.phoneticPt || "Ouça e copie o modelo do Mr.Crazy.";
  const candidatePhrases = [
    phraseEn,
    ...(concept?.samplePhrases ?? []),
    ...(module.samplePhrases ?? [])
  ]
    .map((phrase) => phrase.replace(/\s+/gu, " ").trim())
    .filter(Boolean);
  const uniquePhrases = Array.from(new Set(candidatePhrases));

  return LESSON_STEP_LABELS.map((stepLabel, stepIndex) => ({
    phaseId: concept?.id || `${module.id}-phase-${phaseIndex + 1}`,
    phaseIndex,
    stepIndex,
    stepLabel,
    phraseEn: uniquePhrases[stepIndex] || phraseEn,
    meaningPt: stepIndex === 0 ? meaningPt : `${meaningPt} (${stepLabel.toLowerCase()} na cena real).`,
    phoneticPt: uniquePhrases[stepIndex] === phraseEn ? phoneticPt : "Ouça o modelo americano e copie o ritmo."
  }));
}

function cleanTargetText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const clean = value.replace(/[\r\n]+/gu, " ").replace(/\s+/gu, " ").trim();
  return clean ? clean.slice(0, maxLength) : fallback;
}

export function normalizePhaseTargets(
  value: unknown,
  module: LearningModule,
  phaseIndex: number
): TeachingTarget[] {
  const fallback = getFallbackPhaseTargets(module, phaseIndex);
  if (!Array.isArray(value)) return fallback;

  return fallback.map((base, stepIndex) => {
    const candidate = value[stepIndex];
    if (!candidate || typeof candidate !== "object") return base;
    const target = candidate as Partial<TeachingTarget>;
    return {
      ...base,
      phraseEn: cleanTargetText(target.phraseEn, base.phraseEn, 120),
      meaningPt: cleanTargetText(target.meaningPt, base.meaningPt, 140),
      phoneticPt: cleanTargetText(target.phoneticPt, base.phoneticPt, 160)
    };
  });
}

export function getTeachingTargetForStep(targets: TeachingTarget[], stepIndex: number) {
  const boundedStep = Math.min(LESSON_STEPS_PER_PHASE - 1, Math.max(0, stepIndex));
  return targets[boundedStep] || targets[0];
}
