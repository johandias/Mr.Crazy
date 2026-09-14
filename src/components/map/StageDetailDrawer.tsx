"use client";

import React from "react";
import {
  X,
  Target,
  Star,
  Award,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  BookOpen,
  Volume2,
  HelpCircle
} from "lucide-react";
import type { LearningModule } from "@/lib/modules";
import type { ModuleProgressItem, ModuleEvaluationItem } from "@/components/ModuleSelector";

interface StageDetailDrawerProps {
  module: LearningModule | null;
  progress?: ModuleProgressItem;
  evaluation?: ModuleEvaluationItem;
  isCurrent: boolean;
  isCompleted: boolean;
  onClose: () => void;
  onEnterStage: (moduleId: string) => void;
  onViewEvaluation?: (evaluation: ModuleEvaluationItem) => void;
  onStartExam?: (moduleId: string) => void;
}

export function StageDetailDrawer({
  module,
  progress,
  evaluation,
  isCurrent,
  isCompleted,
  onClose,
  onEnterStage,
  onViewEvaluation,
  onStartExam
}: StageDetailDrawerProps) {
  if (!module) return null;

  const currentTurns = progress?.total_turns ?? 0;
  const progressPercent = Math.min(100, Math.max(0, progress?.progress_percent ?? (isCompleted ? 100 : isCurrent ? 25 : 0)));

  return (
    <div className="stage-drawer-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="stage-drawer-panel animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da ${module.title}`}
      >
        {/* Header do Drawer */}
        <div className="stage-drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-stage-pill">
              <span className="stage-number">ETAPA {module.stageNumber}</span>
              <span className="stage-level">{module.levelBadge}</span>
            </div>
            <h2 className="drawer-title">{module.cleanTitle}</h2>
            <p className="drawer-subtitle">{module.subtitle}</p>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            title="Fechar detalhes"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="stage-drawer-body custom-scrollbar">
          {/* Barra de Progresso da Etapa */}
          <div className="drawer-progress-card">
            <div className="drawer-progress-info">
              <span className="drawer-progress-label">Progresso da Etapa</span>
              <span className="drawer-progress-value">{progressPercent}%</span>
            </div>
            <div className="drawer-progress-track">
              <div
                className="drawer-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="drawer-progress-meta">
              <span>{currentTurns} rodadas de conversação</span>
              <span className="xp-reward">+{module.xpReward} XP ao dominar</span>
            </div>
          </div>

          {/* Missão Principal */}
          <div className="drawer-mission-box">
            <div className="mission-tag">
              <Target size={14} />
              <span>Missão Principal</span>
            </div>
            <p className="mission-desc">{module.mission}</p>
          </div>

          {/* Cenário de Prática */}
          <div className="drawer-scenario-box">
            <span className="scenario-label">Cenário:</span>
            <p className="scenario-text">{module.scenario}</p>
          </div>

          {/* Card do Examinador da Prova */}
          <div className="drawer-examiner-preview">
            <div className="examiner-preview-top">
              <span className="examiner-tag">
                <Award size={13} /> Examinador Oficial da Prova
              </span>
              <span className="examiner-threshold">Nota mínima: 6.0</span>
            </div>
            <div className="examiner-details">
              <strong className="examiner-name">{module.examNpc.name}</strong>
              <span className="examiner-role">({module.examNpc.rolePt})</span>
            </div>
            <p className="examiner-rule">
              Fala 100% em inglês sem auxílio do professor. Se você falar português ou hesitar, ele demonstrará dúvida!
            </p>
          </div>

          {/* Lista de Conceitos Progressivos (4 a 10 etapas escalonadas) */}
          <div className="drawer-concepts-section">
            <div className="concepts-header">
              <BookOpen size={16} className="text-amber-400" />
              <h3>Conceitos e Desafios Progressivos ({module.concepts.length})</h3>
            </div>
            <p className="concepts-subinfo">
              Suba degrau por degrau até a Prova Prática com o avatar nativo:
            </p>

            <div className="concepts-flow-list">
              {module.concepts.map((concept, idx) => {
                const conceptCompleted = progressPercent >= Math.round(((idx + 1) / module.concepts.length) * 100);
                const isExamItem = Boolean(concept.isExam);

                return (
                  <div
                    key={concept.id}
                    className={`concept-flow-card ${conceptCompleted ? "completed" : ""} ${isExamItem ? "exam-card-highlight" : ""}`}
                    onClick={() => {
                      if (isExamItem && onStartExam) {
                        onStartExam(module.id);
                        onClose();
                      }
                    }}
                    style={{ cursor: isExamItem ? "pointer" : "default" }}
                    title={isExamItem ? "Clique para iniciar a Prova da Etapa!" : undefined}
                  >
                    <div className="concept-order-badge">
                      {conceptCompleted ? (
                        <CheckCircle2 size={16} className="concept-check-icon" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <div className="concept-info-col">
                      <div className="concept-row-top">
                        <span className="concept-item-title">{concept.title}</span>
                        {isExamItem && (
                          <span className="concept-exam-tag">
                            <Award size={11} /> Fazer Prova
                          </span>
                        )}
                      </div>
                      <p className="concept-item-desc">{concept.description}</p>
                      <small className="concept-item-obj">
                        Objetivo: {concept.objective}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frases Modelo Essenciais */}
          <div className="drawer-phrases-box">
            <span className="phrases-header-label">
              <Volume2 size={13} /> Frases essenciais que você vai dominar:
            </span>
            <div className="phrases-list-pills">
              {module.samplePhrases.map((phrase, i) => (
                <span key={i} className="drawer-phrase-pill">
                  &ldquo;{phrase}&rdquo;
                </span>
              ))}
            </div>
          </div>

          {/* Banner de Avaliação Prévia se houver */}
          {evaluation && (
            <div className="drawer-eval-preview">
              <div className="eval-preview-top">
                <Award size={16} className="eval-star" />
                <span>
                  Sua última nota: <strong>{evaluation.overall_score}/100</strong> ({evaluation.performance_level})
                </span>
              </div>
              {onViewEvaluation && (
                <button
                  type="button"
                  className="eval-preview-btn"
                  onClick={() => onViewEvaluation(evaluation)}
                >
                  Ver Relatório do Mr. Crazy
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer com Botões de Ação */}
        <div className="stage-drawer-footer">
          {onStartExam && (
            <button
              type="button"
              className="drawer-exam-action-btn"
              onClick={() => {
                onStartExam(module.id);
                onClose();
              }}
              title="Iniciar simulação da prova 100% em inglês com o avatar"
            >
              <Award size={18} />
              <span>Fazer Prova da Etapa</span>
            </button>
          )}

          <button
            type="button"
            className="drawer-action-btn"
            onClick={() => {
              onEnterStage(module.id);
              onClose();
            }}
          >
            <span>
              {isCurrent
                ? "Continuar Treino nesta Etapa"
                : isCompleted
                ? "Praticar Novamente esta Etapa"
                : "Entrar nesta Etapa"}
            </span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
