"use client";

import { Award, CheckCircle2, Sparkles, Target, X } from "lucide-react";
import type { ModuleEvaluationItem } from "@/components/ModuleSelector";

interface ModuleEvaluationModalProps {
  evaluation: ModuleEvaluationItem | null;
  isLoading?: boolean;
  onClose: () => void;
  onActionAgain?: (moduleId: string) => void;
  onNextModule?: () => void;
}

export function ModuleEvaluationModal({
  evaluation,
  isLoading = false,
  onClose,
  onActionAgain,
  onNextModule
}: ModuleEvaluationModalProps) {
  if (isLoading) {
    return (
      <div className="module-eval-modal-backdrop" onClick={onClose}>
        <div
          className="module-eval-modal-content animate-slide-up eval-loading-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="eval-loading-spinner" />
          <h3 className="eval-loading-title">O Mr. Crazy está avaliando seu desempenho...</h3>
          <p className="eval-loading-desc">
            Analisando sua pronúncia, gramática e fluência nas missões do módulo!
          </p>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  return (
    <div className="module-eval-modal-backdrop" onClick={onClose}>
      <div
        className="module-eval-modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="module-eval-modal-header">
          <div className="eval-modal-header-left">
            <span className="eval-modal-badge">
              <Award size={14} /> Avaliação de Desempenho
            </span>
            <h2 className="eval-modal-title">Feedback do Mr. Crazy</h2>
          </div>
          <button
            type="button"
            className="eval-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar avaliação"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overall Score Banner */}
        <div className="eval-overall-box">
          <div className="eval-overall-number">
            <span className="eval-num">{evaluation.overall_score}</span>
            <span className="eval-max">/100</span>
          </div>
          <div className="eval-overall-details">
            <span className="eval-status-label">Nível de Performance:</span>
            <strong className="eval-status-val">{evaluation.performance_level}</strong>
            <span className="eval-date">
              Avaliado em {new Date(evaluation.evaluated_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>

        {/* Grid com Métricas Detalhadas */}
        <div className="eval-metrics-grid">
          <div className="eval-metric-card">
            <span className="metric-name">Pronúncia</span>
            <span className="metric-score">{evaluation.pronunciation_score}%</span>
            <div className="metric-bar">
              <div
                className="metric-fill pronunciation"
                style={{ width: `${evaluation.pronunciation_score}%` }}
              />
            </div>
          </div>

          <div className="eval-metric-card">
            <span className="metric-name">Gramática & Vocabulário</span>
            <span className="metric-score">{evaluation.grammar_score}%</span>
            <div className="metric-bar">
              <div
                className="metric-fill grammar"
                style={{ width: `${evaluation.grammar_score}%` }}
              />
            </div>
          </div>

          <div className="eval-metric-card">
            <span className="metric-name">Fluência & Ritmo</span>
            <span className="metric-score">{evaluation.fluency_score}%</span>
            <div className="metric-bar">
              <div
                className="metric-fill fluency"
                style={{ width: `${evaluation.fluency_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Feedback Qualitativo do Mr. Crazy */}
        <div className="eval-feedback-speech-bubble">
          <div className="eval-bubble-title">
            <Sparkles size={14} /> Recado do Mr. Crazy:
          </div>
          <p className="eval-bubble-text">"{evaluation.summary_feedback}"</p>
        </div>

        {/* Pontos Fortes e Oportunidades */}
        <div className="eval-points-row">
          <div className="eval-strengths-box">
            <h4 className="eval-points-heading strengths">
              <CheckCircle2 size={14} /> Pontos Fortes:
            </h4>
            <ul className="eval-points-list">
              {evaluation.strengths.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="eval-improvements-box">
            <h4 className="eval-points-heading improvements">
              <Target size={14} /> Dicas para Evoluir:
            </h4>
            <ul className="eval-points-list">
              {evaluation.improvement_areas.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="eval-modal-actions">
          {onActionAgain && (
            <button
              type="button"
              className="eval-modal-secondary-btn"
              onClick={() => {
                onActionAgain(evaluation.module_id);
                onClose();
              }}
            >
              Treinar Módulo Novamente
            </button>
          )}
          {onNextModule && (
            <button
              type="button"
              className="eval-modal-action-btn"
              onClick={() => {
                onNextModule();
                onClose();
              }}
            >
              Escolher Próximo Módulo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

