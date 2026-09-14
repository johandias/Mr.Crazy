"use client";

import { useState } from "react";
import { useState, useEffect } from "react";
import {
  Handshake,
  Utensils,
  ShoppingBag,
  Plane,
  Briefcase,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Compass,
  Volume2,
  ChevronRight,
  Flame,
  BookOpen
} from "lucide-react";
  BookOpen,
  X,
  Star,
  TrendingUp,
  Target
import { LEARNING_MODULES, type LearningModule, type ModuleDifficulty } from "@/lib/modules";
import { ModuleEvaluationModal } from "@/components/ModuleEvaluationModal";

const ICON_MAP = {
  Handshake,
  Utensils,
  ShoppingBag,
  Plane,
  Briefcase,
  Award,
  Sparkles
};

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

interface ModuleSelectorProps {
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
  streakDays = 1,
  xp = 0
}: ModuleSelectorProps) {
  const [filter, setFilter] = useState<ModuleDifficulty | "all">("all");
  const [progressMap, setProgressMap] = useState<Record<string, ModuleProgressItem>>({});
  const [evaluationsMap, setEvaluationsMap] = useState<Record<string, ModuleEvaluationItem>>({});
  const [selectedEvaluation, setSelectedEvaluation] = useState<ModuleEvaluationItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/modules/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.ok) return;

        if (Array.isArray(data.progress)) {
          const pMap: Record<string, ModuleProgressItem> = {};
          for (const item of data.progress) {
            if (item?.module_id) pMap[item.module_id] = item;
          }
          setProgressMap(pMap);
        }

        if (Array.isArray(data.evaluations)) {
          const eMap: Record<string, ModuleEvaluationItem> = {};
          // data.evaluations ordenado por evaluated_at desc
          for (const item of data.evaluations) {
            if (item?.module_id && !eMap[item.module_id]) {
              eMap[item.module_id] = item;
            }
          }
          setEvaluationsMap(eMap);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredModules = LEARNING_MODULES.filter((mod) => {
    if (filter === "all") return true;
    return mod.difficulty === filter || mod.difficulty === "all";
  });

  return (
    <div className="module-selector-view animate-fade-in">
      {/* Header com Boas-Vindas & Trilha de Aprendizado */}
      <div className="module-selector-hero">
        <div className="module-hero-top">
          <span className="module-journey-tag">
            <Compass size={14} />
            Trilha de Conversação Prática
            Trilha de Conversação Pedagógica
          </span>
          {onClose && (
            <button
              type="button"
              className="module-back-to-practice-btn"
              onClick={onClose}
              title="Voltar para a prática atual"
            >
              Voltar ao Treino <ArrowRight size={14} />
            </button>
          )}
        </div>

        <h1 className="module-hero-title">
          Escolha seu Módulo de Inglês
          Escolha seu Módulo de Conversação
        </h1>
        <p className="module-hero-subtitle">
          Comece pelo básico das saudações, avance por restaurantes, compras e viagens até entrevistas e conversação livre com o Mr.Crazy.
          Comece pelo básico das saudações, avance por restaurantes, compras e viagens até entrevistas e conversação livre. O Mr. Crazy avalia seu progresso a cada etapa!
        </p>

        {/* Filtros de Dificuldade */}
        <div className="module-filter-bar">
          <button
            type="button"
            className={`module-filter-chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todos ({LEARNING_MODULES.length})
          </button>
          <button
            type="button"
            className={`module-filter-chip ${filter === "basic" ? "active" : ""}`}
            onClick={() => setFilter("basic")}
          >
            Básico (A1-A2)
          </button>
          <button
            type="button"
            className={`module-filter-chip ${filter === "intermediate" ? "active" : ""}`}
            onClick={() => setFilter("intermediate")}
          >
            Intermediário (B1-B2)
          </button>
          <button
            type="button"
            className={`module-filter-chip ${filter === "advanced" ? "active" : ""}`}
            onClick={() => setFilter("advanced")}
          >
            Avançado (C1)
          </button>
        </div>
      </div>

      {/* Grid de Módulos */}
      <div className="module-cards-grid">
        {filteredModules.map((module) => {
          const IconComponent = ICON_MAP[module.iconName] || Sparkles;
          const isActive = module.id === activeModuleId;
          const isFreeConversation = module.id === "free-conversation";
          const prog = progressMap[module.id];
          const evaluation = evaluationsMap[module.id];
          const progressPercent = prog?.progress_percent ?? (prog?.status === "completed" ? 100 : 0);
          const isCompleted = prog?.status === "completed" || progressPercent >= 100;

          return (
            <div
              key={module.id}
              className={`module-card ${isActive ? "is-active" : ""} ${
                isFreeConversation ? "is-free-conversation" : ""
              }`}
              onClick={() => onSelectModule(module.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelectModule(module.id);
                }
              }}
            >
              {/* Header do Card */}
              <div className="module-card-top">
                <div className="module-icon-wrap">
                  <IconComponent size={24} />
                </div>
                <div className="module-badge-group">
                  <span className={`module-level-badge ${module.difficulty}`}>
                    {module.levelBadge}
                  </span>
                  {isActive && (
                  {isCompleted ? (
                    <span className="module-completed-tag">
                      <Award size={12} /> Concluído
                    </span>
                  ) : isActive ? (
                    <span className="module-active-tag">
                      <CheckCircle2 size={12} /> Ativo
                    </span>
                  )}
                  ) : null}
                </div>
              </div>

              {/* Título e Subtítulo */}
              <h3 className="module-card-title">{module.title}</h3>
              <p className="module-card-subtitle">{module.subtitle}</p>

              {/* Barra de Progresso do Módulo */}
              <div className="module-progress-wrapper">
                <div className="module-progress-meta">
                  <span className="module-progress-text">
                    {prog?.total_turns ? `${prog.total_turns} turnos praticados` : "Não iniciado"}
                  </span>
                  <span className="module-progress-pct">{progressPercent}%</span>
                </div>
                <div className="module-progress-track">
                  <div
                    className="module-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Cenário e Descrição */}
              <p className="module-card-desc">{module.description}</p>

              {/* Missão */}
              <div className="module-mission-box">
                <span className="module-mission-label">Sua Missão:</span>
                <p className="module-mission-text">{module.mission}</p>
              </div>

              {/* Frases-Chave do Módulo */}
              <div className="module-phrases-preview">
                <span className="module-phrases-title">
                  <BookOpen size={12} /> Frases que você vai treinar:
                </span>
                <div className="module-phrases-tags">
                  {module.samplePhrases.slice(0, 3).map((phrase, i) => (
                  {module.samplePhrases.slice(0, 2).map((phrase, i) => (
                    <span key={i} className="module-phrase-pill">
                      "{phrase}"
                    </span>
                  ))}
                </div>
              </div>

              {/* Avaliação do Mr. Crazy (se houver) */}
              {evaluation && (
                <div className="module-eval-banner">
                  <div className="module-eval-pill">
                    <Star size={13} className="eval-star-icon" />
                    <span>Nota: {evaluation.overall_score}/100</span>
                    <span className="eval-pill-lvl">({evaluation.performance_level})</span>
                  </div>
                  <button
                    type="button"
                    className="module-eval-view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvaluation(evaluation);
                    }}
                  >
                    Ver Avaliação
                  </button>
                </div>
              )}

              {/* Botão de Ação */}
              <button
                type="button"
                className={`module-action-btn ${isActive ? "active-btn" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectModule(module.id);
                }}
              >
                <span>{isActive ? "Continuar Treino" : "Iniciar este Módulo"}</span>
                <span>
                  {isActive
                    ? "Continuar Treino"
                    : isCompleted
                    ? "Treinar Novamente"
                    : "Iniciar este Módulo"}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de Avaliação Detalhada do Módulo */}
      <ModuleEvaluationModal
        evaluation={selectedEvaluation}
        onClose={() => setSelectedEvaluation(null)}
        onActionAgain={(moduleId) => {
          onSelectModule(moduleId);
          setSelectedEvaluation(null);
        }}
      />
    </div>
  );
}

