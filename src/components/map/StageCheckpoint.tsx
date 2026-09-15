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
  onEnterStage?: (moduleId: string) => void;
  onStartExam?: (moduleId: string) => void;
}

export function StageCheckpoint({
  module,
  status,
  progressPercent,
  isActiveSelection,
  onSelect,
  onEnterStage,
  onStartExam
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

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) {
      onSelect(module);
      return;
    }
    // Se o usuário clicar no checkpoint, inicia diretamente se tiver onEnterStage
    if (onEnterStage) {
      onEnterStage(module.id);
    } else {
      onSelect(module);
    }
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
      role="group"
      aria-label={`Etapa ${module.stageNumber}: ${module.cleanTitle}`}
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

      {/* Círculo do Checkpoint (1 a 7) - Clicável para iniciar diretamente */}
      <div
        className="checkpoint-circle-wrap"
        onClick={handleNodeClick}
        title={isLocked ? "Etapa bloqueada" : `Clique para entrar na Etapa ${module.stageNumber}`}
      >
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

      {/* Card Flutuante da Etapa com Ações Diretas */}
      <div className={`checkpoint-card-pill ${isCurrent ? "card-current-glow" : ""}`}>
        <div
          className="checkpoint-card-header"
          onClick={() => onSelect(module)}
          title="Ver resumo da etapa"
          style={{ cursor: "pointer" }}
        >
          <span className="checkpoint-card-title">{module.cleanTitle}</span>
          <span className={`level-pill-badge badge-${module.difficulty}`}>
            {module.levelBadge}
          </span>
        </div>

        <div className="checkpoint-card-status-row">
          <div className="checkpoint-card-status">
            {isCurrent && <span className="status-indicator-dot dot-active" />}
            {isCompleted && <span className="status-indicator-dot dot-completed" />}
            {isLocked && <Lock size={11} className="status-lock-mini" />}
            <span className="status-label">{getStatusText()}</span>
          </div>

          {!isLocked && (
            <button
              type="button"
              className="checkpoint-details-link"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(module);
              }}
              title="Ver detalhes dos conceitos"
            >
              Info
            </button>
          )}
        </div>

        {/* Botões de Ação Direta no próprio card do mapa */}
        {!isLocked && (
          <div className="checkpoint-card-actions">
            <button
              type="button"
              className="checkpoint-direct-start-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onEnterStage) {
                  onEnterStage(module.id);
                } else {
                  onSelect(module);
                }
              }}
              title={`Iniciar prática da Etapa ${module.stageNumber}`}
            >
              <ArrowRight size={12} className="inline-block mr-1" />
              {isCurrent ? "Praticar" : isCompleted ? "Revisar" : "Iniciar"}
            </button>

            {onStartExam && (
              <button
                type="button"
                className="checkpoint-direct-exam-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartExam(module.id);
                }}
                title="Fazer Prova prática em inglês com o Avatar"
              >
                <Sparkles size={11} className="inline-block mr-1" />
                Prova
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

