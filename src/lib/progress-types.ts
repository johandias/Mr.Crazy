export interface SoundSyllableInsight {
  sound: string;
  anatomy: string;
  observation?: string;
  agentHelp?: string;
  drillWords: string[];
}

export interface AgentCorrectionInsight {
  area: string;
  avoid?: string;
  say?: string;
  pattern: string;
  solution: string;
  impact: string;
}

export interface LearningInsightData {
  diagnostic: string;
  sessionSummary: {
    totalSessions: number;
    practiceMinutes: number;
    primaryFocus: string;
    pronunciationScore: number;
  };
  soundSyllables: SoundSyllableInsight[];
  agentCorrections: AgentCorrectionInsight[];
  focusAreas: Array<{
    title: string;
    description: string;
    action: string;
  }>;
  techniques: Array<{
    category: "movies" | "music" | "reading" | "daily";
    title: string;
    icon: string;
    difficulty: string;
    description: string;
    stepByStep: string[];
    example: string;
  }>;
  dailyChallenge: string;
}

export interface ModuleProgressEntry {
  moduleId: string;
  moduleTitle: string;
  moduleBadge: string;
  difficulty: string;
  status: "not_started" | "in_progress" | "completed";
  progressPercent: number;
  totalTurns: number;
  completedMissions: string[];
  lastPracticedAt: string | null;
  bestScore: number | null;
  xpReward: number;
}

export interface WeeklyStat {
  date: string;
  turnsCount: number;
  durationSeconds: number;
  xpEarned: number;
}

export interface ComputedLevel {
  level: "basic" | "intermediate" | "advanced";
  label: string;
  tag: string;
  modulesCompleted: number;
  nextMilestone: string;
  progressToNext: number;
}

export interface ProgressSummaryResponse {
  ok: boolean;
  profile: {
    id: string;
    nickname: string;
    email: string;
    learning_level: string;
    xp: number;
    streak_days: number;
    practice_time_seconds: number;
    evolution_score: number;
    main_difficulties: string[];
    onboarding_completed: boolean;
    learning_goal: string | null;
  } | null;
  computedLevel: ComputedLevel;
  moduleProgress: ModuleProgressEntry[];
  totalModulesCompleted: number;
  totalTurns: number;
  totalSessions: number;
  weeklyStats: WeeklyStat[];
  recentEvaluations: Array<{
    moduleId: string;
    moduleTitle: string;
    score: number;
    evaluatedAt: string;
  }>;
}
