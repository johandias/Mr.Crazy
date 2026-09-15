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
  AlertCircle,
  Volume2,
  Sliders,
  ChevronRight
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
    fetchInsights();
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
            if (!insights) fetchInsights();
          }}
        >
          <Sparkles size={18} />
          <span>Técnicas com IA</span>
        </button>
      </div>

      {/* ABA 1: ESTATÍSTICAS E TELEMETRIA REAL */}
      {activeTab === "stats" && (
        <div className="evolution-section-content">
          <div className="evolution-banner-header">
            <div>
              <span className="badge-pill">Dados Reais das suas Aulas</span>
              <h2>Olá, {profile?.nickname || "Aluno"}!</h2>
              <p>
                Estas métricas refletem sua dedicação real no Mr.Crazy, tempo de fala ativa acumulado e os padrões de pronúncia que a IA está acompanhando.
              </p>
            </div>
            <Link href="/practice" className="primary-link quick-practice-btn">
              <span>Continuar Praticando</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Dica de deslize no mobile */}
          <div className="mobile-swipe-hint">
            <span>👉 Arraste para o lado para ver suas métricas</span>
          </div>

          {/* Grid / Carrossel de Métricas Principais */}
          <div className="stats-metric-grid horizontal-swipe-track">
            <div className="metric-card highlight-metric swipe-card-wide">
              <div className="metric-icon-box clock-color">
                <Clock size={22} />
              </div>
              <div className="metric-body">
                <span className="metric-label">Tempo Real de Fala</span>
                <strong className="metric-value">{formatPracticeTime(practiceMinutes)}</strong>
                <span className="metric-footnote">Medição real de prática oral</span>
              </div>
            </div>

            <div className="metric-card highlight-metric swipe-card-wide">
              <div className="metric-icon-box flame-color">
                <Flame size={22} />
              </div>
              <div className="metric-body">
                <span className="metric-label">Sequência de Dias</span>
                <strong className="metric-value">{profile?.streak_days || 1} dias</strong>
                <span className="metric-footnote">Constância registrada</span>
              </div>
            </div>

            <div className="metric-card highlight-metric swipe-card-wide">
              <div className="metric-icon-box target-color">
                <Target size={22} />
              </div>
              <div className="metric-body">
                <span className="metric-label">Nível Atual</span>
                <strong className="metric-value">{currentLevel.label} ({currentLevel.tag})</strong>
                <span className="metric-footnote">{currentLevel.desc}</span>
              </div>
            </div>

            <div className="metric-card highlight-metric swipe-card-wide">
              <div className="metric-icon-box xp-color">
                <Award size={22} />
              </div>
              <div className="metric-body">
                <span className="metric-label">XP & Evolução</span>
                <strong className="metric-value">{profile?.xp || 0} XP</strong>
                <span className="metric-footnote">Score de evolução: {profile?.evolution_score || 0}%</span>
              </div>
            </div>
          </div>

          {/* Seção 1: Sons e Sílabas Monitorados pela IA */}
          {/* Diagnóstico Executivo de 1 Frase */}
          {insights?.diagnostic && (
            <div className="clean-diagnostic-banner">
              <Sparkles size={18} className="diagnostic-icon" />
              <p>{insights.diagnostic}</p>
            </div>
          )}

          {/* Desafio do Dia Direto e Prático */}
          {insights?.dailyChallenge && (
            <div className="daily-challenge-clean-card">
              <div className="challenge-tag">
                <Target size={14} />
                <span>Desafio de Hoje</span>
              </div>
              <p className="challenge-text">{insights.dailyChallenge}</p>
            </div>
          )}

          {/* Seção 1: Fonemas & Sons Críticos (Clean & Compacto) */}
          {insights?.soundSyllables && insights.soundSyllables.length > 0 && (
            <div className="evolution-card-panel">
              <div className="panel-header">
                <Volume2 size={20} />
                <h3>Diagnóstico de Sons & Sílabas nas Aulas</h3>
                <div>
                  <h3>Ajustes Fonéticos Recomendados</h3>
                  <p className="panel-subtext">Posicionamento muscular direto para destravar sons nativos:</p>
                </div>
              </div>
              <p className="panel-subtext">
                O Mr.Crazy monitora a anatomia da sua boca nas conversas. Arraste para o lado para ver como destravar cada som desafiador:
              </p>

              <div className="mobile-swipe-hint">
                <span>👉 Arraste para o lado para ver todos os sons</span>
              </div>

              <div className="sound-syllables-track horizontal-swipe-track">
              <div className="sound-syllables-clean-grid">
                {insights.soundSyllables.map((item) => (
                  <div key={item.sound} className="sound-insight-card swipe-card-wide">
                  <div key={item.sound} className="sound-insight-clean-card">
                    <div className="sound-card-header">
                      <span className="sound-badge">{item.sound}</span>
                    </div>

                    <div className="sound-anatomy-box">
                      <strong>Anatomia da boca:</strong>
                      <p>{item.anatomy}</p>
                    </div>
                    <p className="sound-clean-tip">
                      <strong>Como posicionar:</strong> {item.anatomy}
                    </p>

                    <div className="sound-obs-box">
                      <strong>O que a IA identificou:</strong>
                      <p>{item.observation}</p>
                    </div>

                    <div className="sound-help-box">
                      <strong>Como o Mr.Crazy ajuda nas aulas:</strong>
                      <p>{item.agentHelp}</p>
                    </div>

                    {item.drillWords && item.drillWords.length > 0 && (
                      <div className="drill-chips-wrap">
                        <small>Palavras de treino:</small>
                        <div className="drill-chips">
                          {item.drillWords.map((word) => (
                            <span key={word} className="drill-chip">{word}</span>
                          ))}
                        </div>
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

          {/* Seção 2: Correções Frequentes da IA nas Aulas */}
          {/* Seção 2: Correções Práticas (Evite ➔ Diga) */}
          {insights?.agentCorrections && insights.agentCorrections.length > 0 && (
            <div className="evolution-card-panel">
              <div className="panel-header">
                <Sliders size={20} />
                <h3>Onde a IA Mais Está Intervindo nas Suas Aulas</h3>
                <div>
                  <h3>Padrões de Correção da IA</h3>
                  <p className="panel-subtext">Substitua vícios comuns por estruturas de nativos:</p>
                </div>
              </div>
              <p className="panel-subtext">
                Padrões recorrentes observados durante seus diálogos para acelerar sua fluência:
              </p>

              <div className="mobile-swipe-hint">
                <span>👉 Arraste para o lado para ver as correções</span>
              </div>

              <div className="corrections-track horizontal-swipe-track">
              <div className="corrections-clean-grid">
                {insights.agentCorrections.map((corr) => (
                  <div key={corr.area} className="correction-insight-card swipe-card-wide">
                  <div key={corr.area} className="correction-clean-card">
                    <div className="correction-card-header">
                      <CheckCircle2 size={18} />
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <h4>{corr.area}</h4>
                    </div>

                    <div className="corr-block">
                      <span className="corr-label">Padrão comum nas falas:</span>
                      <p className="corr-pattern">{corr.pattern}</p>
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

                    <div className="corr-block solution">
                      <span className="corr-label">Como falar corretamente:</span>
                      <p className="corr-solution">{corr.solution}</p>
                    </div>

                    <div className="corr-impact">
                      <strong>Impacto:</strong> {corr.impact}
                    </div>
                    <p className="corr-quick-rule">
                      <strong>Regra:</strong> {corr.solution}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dificuldades cadastradas e monitoradas */}
          <div className="evolution-card-panel">
            <div className="panel-header">
              <BookOpen size={18} />
              <h3>Pontos de Foco Cadastrados</h3>
            </div>
            <p className="panel-subtext">
              Preferências selecionadas para calibrar a sensibilidade de correção do professor:
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

          {/* Chamada para técnicas com IA */}
          <div className="ai-insight-cta-card" onClick={() => setActiveTab("techniques")}>
            <div className="cta-icon-wrap">
              <Sparkles size={26} />
            </div>
            <div className="cta-text">
              <h4>Quer saber exatamente como acelerar seu aprendizado?</h4>
              <p>Acesse os Insights & Técnicas com IA para dicas de filmes, séries, músicas e leitura adaptadas para o seu nível.</p>
            </div>
            <button type="button" className="ghost-cta-btn">
              <span>Ver Técnicas</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ABA 2: TÉCNICAS E INSIGHTS COM IA */}
      {activeTab === "techniques" && (
        <div className="evolution-section-content">
          <div className="evolution-banner-header">
            <div>
              <span className="badge-pill ai-badge">
                <Sparkles size={13} /> Análise com IA
              </span>
              <h2>Técnicas e Hábitos para o Dia a Dia</h2>
              <p>
                Aprenda inglês com métodos que funcionam de verdade na sua rotina: usando filmes, séries, músicas e leitura ativa.
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
              {/* Diagnóstico Geral */}
              <div className="ai-diagnostic-card">
                <div className="diagnostic-header">
                  <Sparkles size={18} />
                  <strong>Diagnóstico das suas Aulas</strong>
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

              {/* Lista de Técnicas Práticas - Com Carrossel Horizontal Mobile */}
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

              {/* Áreas de Foco Imediato - Com Carrossel Horizontal Mobile */}
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
