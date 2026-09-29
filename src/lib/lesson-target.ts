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
  variationPt?: string;
};

const COMMON_VARIATIONS: Array<{ pattern: RegExp; variation: string }> = [
  { pattern: /\bgood morning\b/i, variation: "Casual entre amigos: 'Morning!'" },
  { pattern: /\bhow are you\b/i, variation: "Mais natural no dia a dia: 'How's it going?' ou 'What's up?'" },
  { pattern: /\ba table for two\b/i, variation: "Rápido e direto: 'Table for two, please!'" },
  { pattern: /\bcould i get (a |the )?coffee\b/i, variation: "No balcão: 'Can I grab a coffee?' ou 'Coffee to go!'" },
  { pattern: /\bwhere is the (restroom|bathroom)\b/i, variation: "Espontâneo: 'Where's the restroom?'" },
  { pattern: /\bthe check\b/i, variation: "Direto ao garçom: 'Check, please!'" },
  { pattern: /\bnice to meet you\b/i, variation: "Super comum: 'Great to meet you!' ou 'Good meeting you!'" },
  { pattern: /\bthank you\b/i, variation: "Expressivo e nativo: 'Thanks a lot!' ou 'I appreciate it!'" },
  { pattern: /\bi would like\b/i, variation: "No dia a dia: 'I'll have...' ou 'Can I get...'" },
  { pattern: /\bi don't understand\b/i, variation: "Coloquial: 'I didn't catch that' ou 'Say again?'" },
  { pattern: /\bsee you later\b/i, variation: "Nativo e descontraído: 'Catch you later!' ou 'Take care!'" },
  { pattern: /\bi have to go\b/i, variation: "Redução conectada: 'I gotta run!' ou 'I gotta go!'" },
  { pattern: /\bexcuse me\b/i, variation: "Pra chamar atenção ou passar: 'Pardon me' ou 'Sorry, excuse me!'" }
];

export function getNaturalVariation(phraseEn: string): string | undefined {
  for (const entry of COMMON_VARIATIONS) {
    if (entry.pattern.test(phraseEn)) return entry.variation;
  }
  return undefined;
}

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

  return LESSON_STEP_LABELS.map((stepLabel, stepIndex) => {
    const currentPhrase = uniquePhrases[stepIndex] || phraseEn;
    return {
      phaseId: concept?.id || `${module.id}-phase-${phaseIndex + 1}`,
      phaseIndex,
      stepIndex,
      stepLabel,
      phraseEn: currentPhrase,
      meaningPt: stepIndex === 0 ? meaningPt : `${meaningPt} (${stepLabel.toLowerCase()} na cena real).`,
      phoneticPt: uniquePhrases[stepIndex] === phraseEn ? phoneticPt : "Ouça o modelo americano e copie o ritmo.",
      variationPt: getNaturalVariation(currentPhrase)
    };
  });
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
    const phrase = cleanTargetText(target.phraseEn, base.phraseEn, 120);
    return {
      ...base,
      phraseEn: phrase,
      meaningPt: cleanTargetText(target.meaningPt, base.meaningPt, 140),
      phoneticPt: cleanTargetText(target.phoneticPt, base.phoneticPt, 160),
      variationPt: typeof target.variationPt === "string"
        ? cleanTargetText(target.variationPt, "", 160)
        : getNaturalVariation(phrase) || base.variationPt
    };
  });
}

export function getTeachingTargetForStep(targets: TeachingTarget[], stepIndex: number) {
  const boundedStep = Math.min(LESSON_STEPS_PER_PHASE - 1, Math.max(0, stepIndex));
  return targets[boundedStep] || targets[0];
}
