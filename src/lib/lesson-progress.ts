export const LESSON_STEP_LABELS = ["Descobrir", "Praticar", "Aplicar"] as const;
export const LESSON_STEPS_PER_PHASE = LESSON_STEP_LABELS.length;

const LESSON_MARKER_PREFIX = "lesson-step:";

export type LessonResumePosition = {
  phaseIndex: number;
  stepIndex: number;
  lessonCompleted: boolean;
  completedSteps: number;
};

export function getLessonStepMarker(phaseId: string, stepIndex: number) {
  const boundedStep = Math.min(
    LESSON_STEPS_PER_PHASE - 1,
    Math.max(0, Math.trunc(stepIndex))
  );
  return `${LESSON_MARKER_PREFIX}${phaseId}:${boundedStep}`;
}

export function isLessonStepMarker(value: string) {
  return value.startsWith(LESSON_MARKER_PREFIX);
}

export function getLessonResumePosition(
  completedMissions: string[],
  phaseIds: string[]
): LessonResumePosition {
  if (phaseIds.length === 0) {
    return { phaseIndex: 0, stepIndex: 0, lessonCompleted: false, completedSteps: 0 };
  }

  const completed = new Set(completedMissions.filter(isLessonStepMarker));
  let completedSteps = 0;

  for (let phaseIndex = 0; phaseIndex < phaseIds.length; phaseIndex += 1) {
    const phaseId = phaseIds[phaseIndex];
    for (let stepIndex = 0; stepIndex < LESSON_STEPS_PER_PHASE; stepIndex += 1) {
      if (!completed.has(getLessonStepMarker(phaseId, stepIndex))) {
        return { phaseIndex, stepIndex, lessonCompleted: false, completedSteps };
      }
      completedSteps += 1;
    }
  }

  return {
    phaseIndex: phaseIds.length - 1,
    stepIndex: LESSON_STEPS_PER_PHASE - 1,
    lessonCompleted: true,
    completedSteps
  };
}

export function calculateLessonProgressPercent(
  completedMissions: string[],
  phaseIds: string[]
) {
  if (phaseIds.length === 0) return 0;
  const { completedSteps } = getLessonResumePosition(completedMissions, phaseIds);
  const totalSteps = phaseIds.length * LESSON_STEPS_PER_PHASE;
  return Math.min(95, Math.round((completedSteps / totalSteps) * 95));
}
