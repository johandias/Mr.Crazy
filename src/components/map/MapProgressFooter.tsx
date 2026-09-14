"use client";

import React from "react";
import { Lock, Check, ArrowRight } from "lucide-react";
import { MrCrazyCharacter } from "@/components/map/MrCrazyCharacter";

interface MapProgressFooterProps {
  currentStageNumber: number;
  completedStagesCount: number;
  totalStages?: number;
  onSelectStageNumber?: (stageNum: number) => void;
}

export function MapProgressFooter({
  currentStageNumber,
  completedStagesCount,
  totalStages = 7,
  onSelectStageNumber
}: MapProgressFooterProps) {
  const overallPercent = Math.round((completedStagesCount / totalStages) * 100);

  return (
    <footer className="map-footer-grid" aria-label="Progresso e recompensas">
      {/* Card 1: Mensagem de incentivo e avatar do Mr. Crazy */}
      <div className="map-footer-card card-journey-advice">
        <div className="advice-avatar-box">
          <MrCrazyCharacter mode="avatar" size={44} animated={false} />
        </div>
        <div className="advice-text-box">
          <h3 className="advice-card-title">Continue sua jornada!</h3>
          <p className="advice-card-desc">
            Você está na etapa {currentStageNumber}. Complete os desafios de fala e desbloqueie a próxima aventura.
          </p>
        </div>
      </div>

      {/* Card 2: Stepper de Progresso Geral (1 a 7) */}
      <div className="map-footer-card card-general-progress">
        <div className="general-progress-top">
          <span className="general-progress-title">Progresso Geral</span>
          <div className="general-progress-meta">
            <span>{completedStagesCount} de {totalStages} etapas concluídas</span>
            <strong className="meta-pct-accent">{overallPercent}%</strong>
          </div>
        </div>

        {/* Linha do tempo com nós 1 a 7 */}
        <div className="timeline-stepper">
          <div className="stepper-track-bg" />
          <div
            className="stepper-track-fill"
            style={{
              width: `${Math.max(0, Math.min(100, ((currentStageNumber - 1) / (totalStages - 1)) * 100))}%`
            }}
          />

          <div className="stepper-nodes-row">
            {Array.from({ length: totalStages }, (_, idx) => {
              const stageNum = idx + 1;
              const isCompleted = completedStagesCount >= stageNum;
              const isCurrent = currentStageNumber === stageNum;
              const isLocked = !isCompleted && !isCurrent;

              return (
                <div
                  key={stageNum}
                  className={`stepper-node-item ${
                    isCompleted
                      ? "is-completed"
                      : isCurrent
                      ? "is-current"
                      : "is-locked"
                  }`}
                  onClick={() => onSelectStageNumber?.(stageNum)}
                  role="button"
                  tabIndex={0}
                  title={`Etapa ${stageNum}`}
                >
                  <div className="node-badge-circle">
                    {isCompleted ? (
                      <Check size={12} className="node-check-icon" />
                    ) : isLocked ? (
                      <Lock size={10} className="node-lock-icon" />
                    ) : (
                      <span className="node-active-dot" />
                    )}
                  </div>
                  <span className="node-label-number">{stageNum}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card 3: Baú de Tesouro e Grandes Conquistas */}
      <div className="map-footer-card card-treasure-reward">
        <div className="treasure-chest-box">
          <img
            src="/assets/character/chest_clean.png"
            alt="Baú de Recompensas"
            className="treasure-chest-img"
            width={48}
            height={48}
          />
        </div>

        <div className="treasure-text-box">
          <h3 className="treasure-card-title">Grandes conquistas te esperam!</h3>
          <p className="treasure-card-desc">
            Complete todas as etapas e torne-se um craque no inglês com o Mr. Crazy!
          </p>
        </div>

        <button
          type="button"
          className="treasure-action-circle"
          title="Ver conquistas e recompensas"
          aria-label="Ver conquistas"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </footer>
  );
}

