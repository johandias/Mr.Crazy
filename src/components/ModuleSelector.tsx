"use client";

import React from "react";
import { LearningMap } from "@/components/map/LearningMap";

export type ModuleProgressItem = {
  module_id: string;
  status: "not_started" | "in_progress" | "completed";
  progress_percent: number;
  total_turns: number;
  completed_missions: string[];
  last_practiced_at?: string;
};

export type ModuleEvaluationItem = {
  id?: string;
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

export interface ModuleSelectorProps {
  activeModuleId: string;
  onSelectModule: (moduleId: string) => void;
  onClose?: () => void;
  userName?: string;
  streakDays?: number;
  xp?: number;
}

export function ModuleSelector({
  activeModuleId,
  onSelectModule,
  onClose,
  userName = "Aluno",
  streakDays = 7,
  xp = 630
}: ModuleSelectorProps) {
  return (
    <LearningMap
      activeModuleId={activeModuleId}
      onSelectModule={onSelectModule}
      onClose={onClose}
      userName={userName}
      streakDays={streakDays}
      xp={xp}
    />
  );
}
