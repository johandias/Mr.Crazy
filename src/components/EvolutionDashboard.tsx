"use client";

import { useEffect, useState } from "react";
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
  AlertCircle
} from "lucide-react";
import type { UserProfile } from "@/lib/auth";
import type { LearningInsightData } from "@/app/api/insights/route";

const LEVEL_LABELS: Record<string, { label: string; tag: string; desc: string }> = {
  basic: {
    label: "Básico",
    tag: "A1-A2",
    desc: "Destravando a fala inicial, comandos simples e vocabulário do cotidiano."
  },
  intermediate: {
    label: "Intermediário",
    tag: "B1-B2",
    desc: "Construindo frases completas, tempos no passado e expressando motivos."
  },
  advanced: {
    label: "Avançado",
    tag: "C1",
    desc: "Refinando pronúncia nativa, phrasal verbs, ritmo e debates complexos."
  }
};

export function EvolutionDashboard() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "techniques" ? "techniques" : "stats";

  const [activeTab, setActiveTab] = useState<"stats" | "techniques">(initialTab);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [insights, setInsights] = useState<LearningInsightData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  useEffect(() => {
    if (searchParams.get("tab") === "techniques") {
      setActiveTab("techniques");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok && data.profile) {
          setProfile(data.profile);
        }
      } catch {
        // silencioso
      } finally {
        setLoadingProfile(false);
      }
    }
    loadData();
  }, []);

  async function fetchInsights(force = false) {
    if (insights && !force) return;
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
      setLoadingInsights(false);
    }
  }

  useEffect(() => {
    if (activeTab === "techniques" && !insights && !loadingInsights) {
      fetchInsights();
    }
  }, [activeTab]);

  const practiceMinutes = Math.round((profile?.practice_time_seconds || 0) / 60);
  const formatPracticeTime = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h} horas`;
  };

  const currentLevel = LEVEL_LABELS[profile?.learning_level || "basic"] || LEVEL_LABELS.basic;

  if (loadingProfile) {
    return (
      <div className="evolution-loading-container">
        <div className="evolution-spinner" />
        <p>Carregando seus dados de desenvolvimento...</p>
      </div>
    );
  }

  return (
    <div className="evolution-dashboard">
      {/* Seletor de Abas */}
      <div className="evolution-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "stats"}
          className={`evolution-tab-btn ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <Award size={18} />
          <span>Meu Desenvolvimento Real</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "techniques"}
          className={`evolution-tab-btn ${activeTab === "techniques" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("techniques");
            fetchInsights();
          }}
        >
          <Sparkles size={18} />
          <span>Técnicas com IA (Gemini)</span>
        </button>
      </div>

      {/* ABA 1: ESTATÍSTICAS E TELEMETRIA REAL */}
      {activeTab === "stats" && (
        <div className="evolution-section-content">
          <div className="evolution-banner-header">
            <div>
              <span className="badge-pill">Dados Reais Capturados</span>
              <h2>Olá, {profile?.nickname || "Aluno"}!</h2>
              <p>
                Estas métricas refletem sua dedicação real no Mr.Crazy, tempo de fala ativa acumulado e seu momento no aprendizado.
              </p>
            </div>
            <Link href="/practice" className="primary-link quick-practice-btn">
              <span>Continuar Praticando</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Grid de Métricas Principais */}
          <div className="stats-metric-grid">
            <div className="metric-card highlight-metric">
              <div className="metric-icon-box clock-color">
                <Clock size={22} />
              </div>
              <div className="metric-body">
                <span className="metric-label">Tempo Real de Uso</span>
                <strong className="metric-value">{formatPracticeTime(practiceMinutes)}</strong>
                <span className="metric-footnote">Medição real de prática de fala</span>
              </div>
            </div>

            <div className="metric-card highlight-metric">
              <div className="metric-icon-box flame-color">
                <Flame size={22} />
              </div>
              <div className="metric-body">
                <span className="metric-label">Dias de Acesso (Sequência)</span>
                <strong className="metric-value">{profile?.streak_days || 1} dias</strong>
                <span className="metric-footnote">Constância registrada</span>
              </div>
            </div>

            <div className="metric-card highlight-metric">
              <div className="metric-icon-box target-color">
                <Target size={22} />
              </div>
              <div className="metric-body">
                <span className="metric-label">Nível Atual</span>
                <strong className="metric-value">{currentLevel.label} ({currentLevel.tag})</strong>
                <span className="metric-footnote">{currentLevel.desc}</span>
              </div>
            </div>

            <div className="metric-card highlight-metric">
              <div className="metric-icon-box xp-color">
                <Award size={22} />
              </div>
              <div className="metric-body">
                <span className="metric-label">XP Acumulado</span>
                <strong className="metric-value">{profile?.xp || 0} XP</strong>
                <span className="metric-footnote">Score de evolução: {profile?.evolution_score || 0}%</span>
              </div>
            </div>
          </div>

          {/* Dificuldades cadastradas e monitoradas */}
          <div className="evolution-card-panel">
            <div className="panel-header">
              <BookOpen size={18} />
              <h3>Pontos de Dificuldade Mapeados</h3>
            </div>
            <p className="panel-subtext">
              O Mr.Crazy presta atenção especial nestes pontos durante os diálogos para corrigir a anatomia da boca e destravar sua fluência:
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
                Nenhuma dificuldade específica selecionada. Você pode calibrar suas preferências em{" "}
                <Link href="/settings">Ajustes</Link>.
              </p>
            )}
          </div>

          {/* Chamada para técnicas do Gemini */}
          <div className="ai-insight-cta-card" onClick={() => setActiveTab("techniques")}>
            <div className="cta-icon-wrap">
              <Sparkles size={26} />
            </div>
            <div className="cta-text">
              <h4>Quer saber exatamente como acelerar seu aprendizado?</h4>
              <p>Acesse as Técnicas com IA (Gemini) para dicas de filmes, séries, músicas e leitura adaptadas para o seu nível.</p>
            </div>
            <button type="button" className="ghost-cta-btn">
              <span>Ver Técnicas</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ABA 2: TÉCNICAS E INSIGHTS COM GEMINI */}
      {activeTab === "techniques" && (
        <div className="evolution-section-content">
          <div className="evolution-banner-header">
            <div>
              <span className="badge-pill ai-badge">
                <Sparkles size={13} /> Análise com Gemini
              </span>
              <h2>Técnicas para o Dia a Dia</h2>
              <p>
                Aprenda inglês com métodos que funcionam de verdade na rotina: usando filmes, séries, músicas e leitura ativa.
              </p>
            </div>
            <button
              type="button"
              className="ghost-action refresh-insights-btn"
              disabled={loadingInsights}
              onClick={() => fetchInsights(true)}
            >
              <RefreshCw size={16} className={loadingInsights ? "spinning" : ""} />
              <span>{loadingInsights ? "Atualizando..." : "Atualizar com Gemini"}</span>
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
              <p>O Mr.Crazy está gerando técnicas personalizadas com o Gemini...</p>
            </div>
          ) : null}

          {insights && (
            <div className="insights-feed">
              {/* Diagnóstico Geral */}
              <div className="ai-diagnostic-card">
                <div className="diagnostic-header">
                  <Sparkles size={18} />
                  <strong>Diagnóstico do Momento Atual</strong>
                </div>
                <p>{insights.diagnostic}</p>
              </div>

              {/* Desafio Diário */}
              {insights.dailyChallenge && (
                <div className="daily-challenge-box">
                  <div className="challenge-icon">🎯</div>
                  <div>
                    <span className="challenge-title">Desafio Prático de Hoje</span>
                    <p className="challenge-desc">{insights.dailyChallenge}</p>
                  </div>
                </div>
              )}

              {/* Lista de Técnicas Práticas */}
              <h3 className="section-subtitle">Técnicas que Realmente Funcionam</h3>
              <div className="techniques-grid">
                {insights.techniques.map((tech) => {
                  const CategoryIcon =
                    tech.category === "movies" ? Film : tech.category === "music" ? Music : BookOpen;

                  return (
                    <article key={tech.title} className="technique-card">
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

                      <div className="technique-steps">
                        <strong>Passo a passo prático:</strong>
                        <ol>
                          {tech.stepByStep.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>

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

              {/* Áreas de Foco Imediato */}
              {insights.focusAreas && insights.focusAreas.length > 0 && (
                <div className="focus-areas-container">
                  <h3 className="section-subtitle">Onde Focar Agora</h3>
                  <div className="focus-grid">
                    {insights.focusAreas.map((focus) => (
                      <div key={focus.title} className="focus-card">
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
