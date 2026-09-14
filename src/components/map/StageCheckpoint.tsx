"use client";

import React from "react";
import { Lock, Check, ArrowRight, Sparkles } from "lucide-react";
import type { LearningModule } from "@/lib/modules";
import { MrCrazyCharacter } from "@/components/map/MrCrazyCharacter";

export type StageStatus = "current" | "completed" | "available" | "locked";

interface StageCheckpointProps {
  module: LearningModule;
  status: StageStatus;
  progressPercent: number;
  isActiveSelection: boolean;
  onSelect: (module: LearningModule) => void;
}

export function StageCheckpoint({
  module,
  status,
  progressPercent,
  isActiveSelection,
  onSelect
}: StageCheckpointProps) {
  const isCurrent = status === "current";
  const isCompleted = status === "completed";
  const isLocked = status === "locked";

  // Determina o texto de status do card da etapa
  const getStatusText = () => {
    if (isCompleted) return "Concluído";
    if (isCurrent) return "Em andamento";
    if (isLocked) return "Bloqueado";
    return "Liberado";
  };

  return (
    <div
      className={`map-checkpoint-node status-${status} ${
        isActiveSelection ? "is-selected" : ""
      }`}
      style={{
        left: `${module.mapCoords.xPct}%`,
        top: `${module.mapCoords.yPct}%`
      }}
      onClick={() => onSelect(module)}
      role="button"
      tabIndex={0}
      aria-label={`Etapa ${module.stageNumber}: ${module.cleanTitle}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(module);
        }
      }}
    >
      {/* Personagem Mr. Crazy em pé ao lado da etapa atual */}
      {isCurrent && (
        <div className="checkpoint-character-anchor">
          <MrCrazyCharacter
            mode="standing"
            size={46}
            animated={true}
            speechBubble={module.stageNumber === 1 ? "Start your journey!" : undefined}
          />
        </div>
      )}

      {/* Círculo do Checkpoint (1 a 7) */}
      <div className="checkpoint-circle-wrap">
        {/* Glow e Pulsos para etapa atual */}
        {isCurrent && <div className="checkpoint-pulse-ring" />}

        <div className="checkpoint-circle">
          {isLocked && <Lock size={13} className="checkpoint-lock-icon" />}
          {isCompleted ? (
            <Check size={18} className="checkpoint-check-icon" />
          ) : (
            <span className="checkpoint-number">{module.stageNumber}</span>
          )}
        </div>
      </div>

      {/* Card Flutuante da Etapa (Fiel à referência visual) */}
      <div className={`checkpoint-card-pill ${isCurrent ? "card-current-glow" : ""}`}>
        <div className="checkpoint-card-header">
          <span className="checkpoint-card-title">{module.title}</span>
          {isCurrent && <ArrowRight size={13} className="current-arrow-icon" />}
        </div>

        <div className="checkpoint-card-footer">
          <span className={`level-pill-badge badge-${module.difficulty}`}>
            {module.levelBadge}
          </span>

          <div className="checkpoint-card-status">
            {isCurrent && <span className="status-indicator-dot dot-active" />}
            {isCompleted && <span className="status-indicator-dot dot-completed" />}
            {isLocked && <Lock size={11} className="status-lock-mini" />}
            <span className="status-label">{getStatusText()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

