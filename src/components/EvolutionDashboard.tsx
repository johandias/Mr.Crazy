"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Flame,
  Award,
  BookOpen,
  Sparkles,
  Film,
  Music,
  RefreshCw,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Sliders,
  ChevronRight,
  BarChart3,
  Lock,
  Star,
  TrendingUp,
  Zap,
  MessageSquare
} from "lucide-react";
import type {
  LearningInsightData,
  ProgressSummaryResponse,
  ModuleProgressEntry
} from "@/lib/progress-types";

// ────────────────────────────────────────────────────────────
// Constantes de UI
// ────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  basic: "#22d3ee",
  intermediate: "#f59e0b",
  advanced: "#a78bfa",
  all: "#6ee7b7"
};

const STATUS_LABELS: Record<ModuleProgressEntry["status"], string> = {
  not_started: "Não iniciado",
  in_progress: "Em progresso",
  completed: "Concluído"
};

function formatTime(secs: number): string {
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} horas`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Módulo individual
// ────────────────────────────────────────────────────────────

function ModuleProgressCard({ mod }: { mod: ModuleProgressEntry }) {
  const color = DIFFICULTY_COLORS[mod.difficulty] || "#6ee7b7";
  const isLocked = mod.status === "not_started" && mod.progressPercent === 0;
  const isDone = mod.status === "completed";

  return (
    <div className={`module-progress-card${isDone ? " module-done" : ""}${isLocked ? " module-locked" : ""}`}>
      {/* Cabeçalho */}
      <div className="module-card-header">
        <span className="module-badge-pill" style={{ borderColor: color, color }}>{mod.moduleBadge}</span>
        <span className={`module-status-tag status-${mod.status}`}>
          {isDone ? <CheckCircle2 size={13} /> : isLocked ? <Lock size={13} /> : <TrendingUp size={13} />}
          {STATUS_LABELS[mod.status]}
        </span>
      </div>

      {/* Título */}
      <h4 className="module-card-title">{mod.moduleTitle}</h4>

      {/* Barra de progresso */}
      <div className="module-progress-bar-wrap">
        <div
          className="module-progress-bar-fill"
          style={{ width: `${mod.progressPercent}%`, background: color }}
        />
      </div>
      <div className="module-progress-meta">
        <span>{mod.progressPercent}% completo</span>
        <span>{mod.totalTurns} turnos</span>
      </div>

      {/* Nota da prova prática */}
      {mod.bestScore !== null && (
        <div className="module-best-score">
          <Star size={13} />
          <span>Nota da prova: <strong>{mod.bestScore.toFixed(1)}/10</strong></span>
        </div>
      )}

      {/* Última prática */}
      {mod.lastPracticedAt && (
        <div className="module-last-practice">
          <Clock size={12} />
          <span>Última prática: {formatDate(mod.lastPracticedAt)}</span>
        </div>
      )}

      {/* XP reward */}
      <div className="module-xp-reward">
        <Zap size={12} />
        <span>+{mod.xpReward} XP ao concluir</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────

export function EvolutionDashboard() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "techniques" ? "techniques" : searchParams.get("tab") === "modules" ? "modules" : "stats";

  const [activeTab, setActiveTab] = useState<"stats" | "modules" | "techniques">(initialTab as "stats" | "modules" | "techniques");
  const [summary, setSummary] = useState<ProgressSummaryResponse | null>(null);
  const [insights, setInsights] = useState<LearningInsightData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const insightsRequest = useRef(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "techniques" || tab === "modules" || tab === "stats") {
      setActiveTab(tab as "stats" | "modules" | "techniques");
    }
  }, [searchParams]);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    setSummaryError("");
    try {
      const res = await fetch("/api/progress/summary");
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "O painel não respondeu agora.");
      setSummary(data as ProgressSummaryResponse);
    } catch (error: unknown) {
      setSummaryError(error instanceof Error ? error.message : "Não consegui carregar sua evolução.");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchInsights = useCallback(async (force = false) => {
    if (insightsRequest.current || (insights && !force)) return;
    insightsRequest.current = true;
    setLoadingInsights(true);
    setInsightsError("");
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      if (res.ok && data.data) {
        setInsights(data.data);
      } else {
        throw new Error(data.error || "Não foi possível carregar os insights.");
      }
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : "Erro ao carregar insights.");
    } finally {
      insightsRequest.current = false;
      setLoadingInsights(false);
    }
  }, [insights]);

  useEffect(() => {
    fetchSummary();
    // Carrega insights em segundo plano para a aba stats
    setTimeout(() => fetchInsights(), 800);
  }, [fetchSummary]); // eslint-disable-line react-hooks/exhaustive-deps

  const profile = summary?.profile;
  const computedLevel = summary?.computedLevel;
  const moduleProgress = summary?.moduleProgress ?? [];
  const practiceMinutes = Math.round((profile?.practice_time_seconds || 0) / 60);

  if (loadingSummary) {
    return (
      <div className="evolution-loading-container" role="status" aria-live="polite">
        <div className="evolution-loading-heading">
          <span className="evolution-skeleton eyebrow-skeleton" />
          <span className="evolution-skeleton title-skeleton" />
          <p>Mr.Crazy está organizando o que você já destravou...</p>
        </div>
        <div className="evolution-loading-metrics" aria-hidden="true">
          {[1, 2, 3, 4].map((item) => <span key={item} className="evolution-skeleton metric-skeleton" />)}
        </div>
      </div>
    );
  }

  if (summaryError && !summary) {
    return (
      <div className="evolution-error-state" role="alert">
        <AlertCircle size={22} aria-hidden="true" />
        <div>
          <h2>Seu painel ficou sem sinal.</h2>
          <p>{summaryError} Seus treinos não foram apagados.</p>
        </div>
        <button type="button" className="secondary-action-btn" onClick={() => void fetchSummary()}>
          <RefreshCw size={15} /> Tentar de novo
        </button>
      </div>
    );
  }

  // Módulos agrupados por dificuldade para a aba de módulos
  const basicModules = moduleProgress.filter((m) => m.difficulty === "basic");
  const intermediateModules = moduleProgress.filter((m) => m.difficulty === "intermediate");
  const advancedModules = moduleProgress.filter((m) => m.difficulty === "advanced" || m.difficulty === "all");
  const inProgressModules = moduleProgress.filter((m) => m.status === "in_progress").slice(0, 3);

  return (
    <div className="evolution-dashboard">
      {/* ── Seletor de Abas ── */}
      <div className="evolution-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "stats"}
          className={`evolution-tab-btn ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <Award size={18} />
          <span>Minha Evolução</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "modules"}
          className={`evolution-tab-btn ${activeTab === "modules" ? "active" : ""}`}
          onClick={() => setActiveTab("modules")}
        >
          <BarChart3 size={18} />
          <span>Módulos</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "techniques"}
          className={`evolution-tab-btn ${activeTab === "techniques" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("techniques");
            if (!insights) fetchInsights();
          }}
        >
          <Sparkles size={18} />
          <span>IA</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ABA 1: ESTATÍSTICAS E TELEMETRIA REAL               */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeTab === "stats" && (
        <div className="evolution-section-content">
          <div className="evolution-banner-header">
            <div>
              <span className="badge-pill">Dados Reais das suas Aulas</span>
              <h2>Olá, {profile?.nickname || "Aluno"}! 👋</h2>
              <p>
                Métricas baseadas no seu progresso real — tempo de fala ativa, XP acumulado e nível calculado pelos módulos concluídos.
              </p>
            </div>
            <Link href="/practice" className="primary-link quick-practice-btn">
              <span>Continuar Praticando</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Nível calculado pelo progresso real */}
          {computedLevel && (
            <div className="computed-level-banner">
              <div className="computed-level-left">
                <span className="computed-level-icon">🎯</span>
                <div>
                  <span className="computed-level-label">Seu Nível Real</span>
                  <strong className="computed-level-value">
                    {computedLevel.label} <span className="level-tag">{computedLevel.tag}</span>
                  </strong>
                </div>
              </div>
              <div className="computed-level-progress">
                <span className="next-milestone-text">{computedLevel.nextMilestone}</span>
                <div className="level-progress-track">
                  <div
                    className="level-progress-fill"
                    style={{ width: `${computedLevel.progressToNext}%` }}
                  />
                </div>
                <span className="level-progress-pct">{computedLevel.progressToNext}%</span>
              </div>
            </div>
          )}

          {/* Dica de deslize no mobile */}
          <div className="mobile-swipe-hint">
            <span>👉 Arraste para ver suas métricas</span>
          </div>

          {/* Grid de Métricas */}
          <div className="stats-metric-grid horizontal-swipe-track">
            <div className="metric-card highlight-metric swipe-card-wide">
              <div className="metric-icon-box clock-color"><Clock size={22} /></div>
              <div className="metric-body">
                <span className="metric-label">Tempo Real de Fala</span>
                <strong className="metric-value">{formatTime(profile?.practice_time_seconds || 0)}</strong>
                <span className="metric-footnote">Medição real de prática oral</span>
              </div>
            </div>

            <div className="metric-card highlight-metric swipe-card-wide">
              <div className="metric-icon-box flame-color"><Flame size={22} /></div>
              <div className="metric-body">
                <span className="metric-label">Sequência de Dias</span>
                <strong className="metric-value">{profile?.streak_days || 1} dias 🔥</strong>
                <span className="metric-footnote">Constância registrada</span>
              </div>
            </div>

            <div className="metric-card highlight-metric swipe-card-wide">
              <div className="metric-icon-box target-color"><Target size={22} /></div>
              <div className="metric-body">
                <span className="metric-label">Módulos Concluídos</span>
                <strong className="metric-value">{summary?.totalModulesCompleted || 0}/12</strong>
                <span className="metric-footnote">{summary?.totalTurns || 0} turnos de prática</span>
              </div>
            </div>

            <div className="metric-card highlight-metric swipe-card-wide">
              <div className="metric-icon-box xp-color"><Award size={22} /></div>
              <div className="metric-body">
                <span className="metric-label">XP Total</span>
                <strong className="metric-value">{profile?.xp || 0} XP</strong>
                <span className="metric-footnote">Score de evolução: {profile?.evolution_score || 0}%</span>
              </div>
            </div>
          </div>

          {/* Módulos em progresso (resumo rápido) */}
          {inProgressModules.length > 0 && (
            <div className="evolution-card-panel">
              <div className="panel-header">
                <TrendingUp size={18} />
                <div>
                  <h3>Módulos em Andamento</h3>
                  <p className="panel-subtext">Continue de onde parou:</p>
                </div>
              </div>
              <div className="in-progress-list">
                {inProgressModules.map((mod) => (
                  <div key={mod.moduleId} className="in-progress-row">
                    <span className="in-progress-title">{mod.moduleTitle}</span>
                    <div className="in-progress-bar-wrap">
                      <div
                        className="in-progress-bar-fill"
                        style={{ width: `${mod.progressPercent}%`, background: DIFFICULTY_COLORS[mod.difficulty] || "#6ee7b7" }}
                      />
                    </div>
                    <span className="in-progress-pct">{mod.progressPercent}%</span>
                    <Link href="/practice" className="in-progress-btn">
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
                <button
                  type="button"
                  className="ghost-action see-all-modules-btn"
                  onClick={() => setActiveTab("modules")}
                >
                  <BarChart3 size={14} />
                  <span>Ver todos os módulos</span>
                </button>
              </div>
            </div>
          )}

          {/* Diagnóstico da IA */}
          {insights?.diagnostic && (
            <div className="insight-summary-track">
              <div className="clean-diagnostic-banner">
                <Sparkles size={18} className="diagnostic-icon" />
                <p>{insights.diagnostic}</p>
              </div>
              {insights.dailyChallenge && (
                <div className="daily-challenge-clean-card">
                  <div className="challenge-tag">
                    <Target size={14} />
                    <span>Desafio de Hoje</span>
                  </div>
                  <p className="challenge-text">{insights.dailyChallenge}</p>
                </div>
              )}
            </div>
          )}

          {/* Sons e Sílabas */}
          {insights?.soundSyllables && insights.soundSyllables.length > 0 && (
            <div className="evolution-card-panel">
              <div className="panel-header">
                <Volume2 size={20} />
                <div>
                  <h3>Ajustes Fonéticos Recomendados</h3>
                  <p className="panel-subtext">Posicionamento muscular direto para destravar sons nativos:</p>
                </div>
              </div>
              <div className="sound-syllables-clean-grid horizontal-swipe-track">
                {insights.soundSyllables.map((item) => (
                  <div key={item.sound} className="sound-insight-clean-card swipe-card-wide">
                    <div className="sound-card-header">
                      <span className="sound-badge">{item.sound}</span>
                    </div>
                    <p className="sound-clean-tip">
                      <strong>Como posicionar:</strong> {item.anatomy}
                    </p>
                    <details className="insight-details">
                      <summary>Ver análise</summary>
                      {item.observation && (
                        <div className="sound-obs-box">
                          <strong>O que a IA identificou:</strong>
                          <p>{item.observation}</p>
                        </div>
                      )}
                      {item.agentHelp && (
                        <div className="sound-help-box">
                          <strong>Como o Mr.Crazy ajuda:</strong>
                          <p>{item.agentHelp}</p>
                        </div>
                      )}
                    </details>
                    {item.drillWords?.length > 0 && (
                      <div className="drill-chips-clean">
                        {item.drillWords.map((word) => (
                          <span key={word} className="drill-chip">{word}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correções */}
          {insights?.agentCorrections && insights.agentCorrections.length > 0 && (
            <div className="evolution-card-panel">
              <div className="panel-header">
                <Sliders size={20} />
                <div>
                  <h3>Padrões de Correção da IA</h3>
                  <p className="panel-subtext">Substitua vícios comuns por estruturas de nativos:</p>
                </div>
              </div>
              <div className="corrections-clean-grid horizontal-swipe-track">
                {insights.agentCorrections.map((corr) => (
                  <div key={corr.area} className="correction-clean-card swipe-card-wide">
                    <div className="correction-card-header">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <h4>{corr.area}</h4>
                    </div>
                    <div className="corr-comparison-row">
                      <div className="corr-pill-avoid">
                        <span className="pill-tag">Evite</span>
                        <span className="pill-text">{corr.avoid || corr.pattern}</span>
                      </div>
                      <div className="corr-pill-say">
                        <span className="pill-tag">Diga</span>
                        <span className="pill-text">{corr.say || corr.solution}</span>
                      </div>
                    </div>
                    <details className="insight-details">
                      <summary>Entender o ajuste</summary>
                      {corr.impact && <div className="corr-impact"><strong>Impacto:</strong> {corr.impact}</div>}
                      <p className="corr-quick-rule"><strong>Regra:</strong> {corr.solution}</p>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dificuldades cadastradas */}
          <div className="evolution-card-panel">
            <div className="panel-header">
              <BookOpen size={18} />
              <h3>Pontos de Foco Cadastrados</h3>
            </div>
            <p className="panel-subtext">
              Preferências para calibrar a sensibilidade de correção do professor:
            </p>
            {profile?.main_difficulties && profile.main_difficulties.length > 0 ? (
              <div className="difficulties-chip-grid">
                {profile.main_difficulties.map((diff) => (
                  <div key={diff} className="difficulty-pill">
                    <CheckCircle2 size={16} />
                    <span>{diff}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-diff-notice">
                Nenhuma dificuldade selecionada.{" "}
                <Link href="/settings">Calibre em Ajustes</Link>.
              </p>
            )}
          </div>

          {/* CTA para técnicas */}
          <div className="ai-insight-cta-card" onClick={() => { setActiveTab("techniques"); if (!insights) fetchInsights(); }}>
            <div className="cta-icon-wrap"><Sparkles size={26} /></div>
            <div className="cta-text">
              <h4>Quer acelerar seu aprendizado?</h4>
              <p>Veja insights e técnicas com IA adaptadas para o seu nível.</p>
            </div>
            <button type="button" className="ghost-cta-btn">
              <span>Ver Técnicas</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ABA 2: MÓDULOS (PROGRESSO REAL POR MÓDULO)          */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeTab === "modules" && (
        <div className="evolution-section-content">
          <div className="evolution-banner-header">
            <div>
              <span className="badge-pill">Progresso Real</span>
              <h2>Jornada de Módulos</h2>
              <p>
                {summary?.totalModulesCompleted || 0} módulo(s) concluído(s) de 12 • {summary?.totalTurns || 0} turnos de prática no total
              </p>
            </div>
            {computedLevel && (
              <div className="modules-level-badge">
                <Target size={14} />
                <span>{computedLevel.label} {computedLevel.tag}</span>
              </div>
            )}
          </div>

          {/* Avaliações recentes */}
          {summary?.recentEvaluations && summary.recentEvaluations.length > 0 && (
            <div className="recent-evals-strip">
              <span className="recent-evals-label">
                <Star size={13} /> Notas das provas:
              </span>
              {summary.recentEvaluations.map((ev, i) => (
                <span key={i} className="eval-chip">
                  {ev.moduleTitle.split(" ")[0]}: <strong>{ev.score.toFixed(1)}</strong>
                </span>
              ))}
            </div>
          )}

          {/* Básico */}
          {basicModules.length > 0 && (
            <div className="module-group">
              <div className="module-group-header">
                <span className="module-group-dot" style={{ background: DIFFICULTY_COLORS.basic }} />
                <h3>Básico <span className="module-group-tag">A1-A2</span></h3>
                <span className="module-group-count">
                  {basicModules.filter((m) => m.status === "completed").length}/{basicModules.length}
                </span>
              </div>
              <div className="module-cards-grid">
                {basicModules.map((mod) => (
                  <ModuleProgressCard key={mod.moduleId} mod={mod} />
                ))}
              </div>
            </div>
          )}

          {/* Intermediário */}
          {intermediateModules.length > 0 && (
            <div className="module-group">
              <div className="module-group-header">
                <span className="module-group-dot" style={{ background: DIFFICULTY_COLORS.intermediate }} />
                <h3>Intermediário <span className="module-group-tag">B1-B2</span></h3>
                <span className="module-group-count">
                  {intermediateModules.filter((m) => m.status === "completed").length}/{intermediateModules.length}
                </span>
              </div>
              <div className="module-cards-grid">
                {intermediateModules.map((mod) => (
                  <ModuleProgressCard key={mod.moduleId} mod={mod} />
                ))}
              </div>
            </div>
          )}

          {/* Avançado */}
          {advancedModules.length > 0 && (
            <div className="module-group">
              <div className="module-group-header">
                <span className="module-group-dot" style={{ background: DIFFICULTY_COLORS.advanced }} />
                <h3>Avançado <span className="module-group-tag">C1</span></h3>
                <span className="module-group-count">
                  {advancedModules.filter((m) => m.status === "completed").length}/{advancedModules.length}
                </span>
              </div>
              <div className="module-cards-grid">
                {advancedModules.map((mod) => (
                  <ModuleProgressCard key={mod.moduleId} mod={mod} />
                ))}
              </div>
            </div>
          )}

          <div className="modules-cta">
            <Link href="/practice" className="primary-link">
              <MessageSquare size={16} />
              <span>Praticar Agora</span>
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ABA 3: TÉCNICAS E INSIGHTS COM IA                   */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeTab === "techniques" && (
        <div className="evolution-section-content">
          <div className="evolution-banner-header">
            <div>
              <span className="badge-pill ai-badge">
                <Sparkles size={13} /> Análise com IA
              </span>
              <h2>Técnicas e Hábitos para o Dia a Dia</h2>
              <p>
                Aprenda inglês com métodos que funcionam de verdade: filmes, séries, músicas e leitura ativa.
              </p>
            </div>
            <button
              type="button"
              className="ghost-action refresh-insights-btn"
              disabled={loadingInsights}
              onClick={() => fetchInsights(true)}
            >
              <RefreshCw size={16} className={loadingInsights ? "spinning" : ""} />
              <span>{loadingInsights ? "Atualizando..." : "Atualizar com IA"}</span>
            </button>
          </div>

          {insightsError ? (
            <div className="auth-notice error-notice">
              <AlertCircle size={18} />
              <span>{insightsError}</span>
            </div>
          ) : null}

          {loadingInsights && !insights ? (
            <div className="evolution-loading-container">
              <div className="evolution-spinner" />
              <p>O Mr.Crazy está gerando técnicas e insights personalizados com a IA...</p>
            </div>
          ) : null}

          {insights && (
            <div className="insights-feed">
              <div className="insight-summary-track">
                <div className="ai-diagnostic-card">
                  <div className="diagnostic-header">
                    <Sparkles size={18} />
                    <strong>Diagnóstico das suas Aulas</strong>
                  </div>
                  <p>{insights.diagnostic}</p>
                </div>

                {insights.dailyChallenge && (
                  <div className="daily-challenge-box">
                    <div className="challenge-icon">🎯</div>
                    <div>
                      <span className="challenge-title">Desafio Prático de Hoje</span>
                      <p className="challenge-desc">{insights.dailyChallenge}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="section-title-row">
                <h3 className="section-subtitle">Técnicas que Realmente Funcionam</h3>
                <span className="desktop-hide swipe-badge-pill">👉 Arraste para o lado</span>
              </div>

              <div className="techniques-grid horizontal-swipe-track">
                {insights.techniques.map((tech) => {
                  const CategoryIcon =
                    tech.category === "movies" ? Film : tech.category === "music" ? Music : BookOpen;
                  return (
                    <article key={tech.title} className="technique-card swipe-card-wide">
                      <div className="technique-card-top">
                        <div className={`technique-category-icon ${tech.category}`}>
                          <CategoryIcon size={20} />
                        </div>
                        <div className="technique-meta">
                          <h4>{tech.title}</h4>
                          <span className="difficulty-tag">{tech.difficulty}</span>
                        </div>
                      </div>
                      <p className="technique-desc">{tech.description}</p>
                      <details className="technique-steps insight-details">
                        <summary>Como praticar</summary>
                        <ol>
                          {tech.stepByStep.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </details>
                      {tech.example && (
                        <div className="technique-example">
                          <strong>Exemplo prático:</strong>
                          <span>{tech.example}</span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {insights.focusAreas && insights.focusAreas.length > 0 && (
                <div className="focus-areas-container">
                  <div className="section-title-row">
                    <h3 className="section-subtitle">Onde Focar Agora</h3>
                    <span className="desktop-hide swipe-badge-pill">👉 Arraste para o lado</span>
                  </div>
                  <div className="focus-grid horizontal-swipe-track">
                    {insights.focusAreas.map((focus) => (
                      <div key={focus.title} className="focus-card swipe-card-wide">
                        <div className="focus-header">
                          <CheckCircle2 size={18} />
                          <strong>{focus.title}</strong>
                        </div>
                        <p className="focus-desc">{focus.description}</p>
                        <div className="focus-action">
                          <strong>Ação:</strong> {focus.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
