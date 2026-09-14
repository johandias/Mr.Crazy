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
        className="stage-drawer-panel stage-horizontal-modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Resumo da ${module.title}`}
      >
        {/* Header Compacto com Ações Diretas */}
        <div className="stage-drawer-header compact-header">
          <div className="drawer-title-group">
            <div className="drawer-stage-pill">
              <span className="stage-number">ETAPA {module.stageNumber}</span>
              <span className="stage-level">{module.levelBadge}</span>
              <span className="stage-xp-tag">+{module.xpReward} XP</span>
            </div>
            <h2 className="drawer-title">{module.cleanTitle}</h2>
          </div>

          <div className="drawer-header-actions">
            {onStartExam && (
              <button
                type="button"
                className="drawer-header-exam-btn"
                onClick={() => {
                  onStartExam(module.id);
                  onClose();
                }}
                title="Fazer prova prática com avatar nativo"
              >
                <Award size={15} />
                <span>Fazer Prova</span>
              </button>
            )}

            <button
              type="button"
              className="drawer-header-play-btn"
              onClick={() => {
                onEnterStage(module.id);
                onClose();
              }}
            >
              <ArrowRight size={15} />
              <span>{isCurrent ? "Continuar" : isCompleted ? "Praticar" : "Iniciar"}</span>
            </button>

            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo Horizontal em 2 Colunas */}
        <div className="stage-drawer-horizontal-body">
          {/* Coluna Esquerda: Briefing Executivo Resumido */}
          <div className="stage-briefing-col">
            {/* Missão e Cenário Rápidos */}
            <div className="compact-card-box">
              <div className="compact-box-header">
                <Target size={13} className="text-amber-400" />
                <span>Missão da Etapa</span>
              </div>
              <p className="compact-box-text">{module.mission}</p>
            </div>

            {/* Cenário */}
            <div className="compact-card-box">
              <span className="compact-box-sublabel">Cenário:</span>
              <p className="compact-box-text">{module.scenario}</p>
            </div>

            {/* Examinador Oficial */}
            <div className="compact-examiner-badge">
              <div className="examiner-line-top">
                <span className="examiner-label">
                  <Award size={12} /> Examinador Nativo
                </span>
                <span className="examiner-nota">Nota mín: 6.0</span>
              </div>
              <p className="examiner-desc">
                <strong>{module.examNpc.name}</strong> ({module.examNpc.rolePt}). Fala 100% inglês sem dicas do professor.
              </p>
            </div>

            {/* Frases-chave */}
            <div className="compact-phrases-row">
              <span className="phrases-mini-label">
                <Volume2 size={12} /> Expressões:
              </span>
              <div className="phrases-horizontal-chips">
                {module.samplePhrases.slice(0, 3).map((phrase, i) => (
                  <span key={i} className="mini-phrase-chip">
                    &ldquo;{phrase}&rdquo;
                  </span>
                ))}
              </div>
            </div>

            {/* Avaliação prévia */}
            {evaluation && onViewEvaluation && (
              <div className="compact-eval-bar">
                <span>Nota: <strong>{evaluation.overall_score}/100</strong></span>
                <button
                  type="button"
                  className="compact-eval-link"
                  onClick={() => onViewEvaluation(evaluation)}
                >
                  Ver Relatório
                </button>
              </div>
            )}
          </div>

          {/* Coluna Direita: Pipeline Horizontal de Conceitos */}
          <div className="stage-pipeline-col">
            <div className="pipeline-header-row">
              <div className="pipeline-title-group">
                <BookOpen size={14} className="text-amber-400" />
                <span className="pipeline-title">Conceitos & Desafios ({module.concepts.length})</span>
              </div>
              <span className="pipeline-swipe-hint">Deslize para o lado →</span>
            </div>

            {/* Trilha Horizontal de Conceitos (Scroll/Swipe Lateral) */}
            <div className="horizontal-concepts-track custom-scrollbar">
              {module.concepts.map((concept, idx) => {
                const conceptCompleted = progressPercent >= Math.round(((idx + 1) / module.concepts.length) * 100);
                const isExamItem = Boolean(concept.isExam);

                return (
                  <div
                    key={concept.id}
                    className={`horizontal-concept-card ${conceptCompleted ? "completed" : ""} ${isExamItem ? "exam-card-accent" : ""}`}
                    onClick={() => {
                      if (isExamItem && onStartExam) {
                        onStartExam(module.id);
                        onClose();
                      }
                    }}
                    style={{ cursor: isExamItem ? "pointer" : "default" }}
                    title={isExamItem ? "Clique para iniciar a Prova da Etapa!" : undefined}
                  >
                    <div className="concept-card-top">
                      <div className="concept-number-badge">
                        {conceptCompleted ? (
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      {isExamItem ? (
                        <span className="exam-pill-badge">
                          <Award size={10} /> PROVA
                        </span>
                      ) : (
                        <span className="step-pill-badge">Passo {idx + 1}</span>
                      )}
                    </div>

                    <strong className="concept-title-text">{concept.title}</strong>
                    <p className="concept-desc-text">{concept.description}</p>
                    <div className="concept-obj-box">
                      <small>Foco: {concept.objective}</small>
                    </div>

                    {isExamItem && (
                      <button
                        type="button"
                        className="concept-exam-launch-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStartExam) {
                            onStartExam(module.id);
                            onClose();
                          }
                        }}
                      >
                        <Sparkles size={11} /> Iniciar Prova
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
