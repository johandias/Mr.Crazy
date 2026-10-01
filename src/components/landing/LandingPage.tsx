"use client";

import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  Mic, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Zap, 
  Trophy, 
  Compass, 
  Clock, 
  HeartHandshake,
  TrendingUp,
  BrainCircuit,
  Headphones
} from "lucide-react";
import { MrCrazyAudioShowcase } from "./MrCrazyAudioShowcase";
import { LandingInteractiveDemo } from "./LandingInteractiveDemo";
import { LandingFaq } from "./LandingFaq";
import "@/app/landing.css";

interface LandingPageProps {
  user?: {
    email: string;
    nickname?: string;
    role?: string;
  } | null;
}

export function LandingPage({ user }: LandingPageProps) {
  const scrollToAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("o-mr-crazy");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing-wrapper">
      {/* ================================================================= */}
      {/* 1. HEADER / NAVBAR                                                */}
      {/* ================================================================= */}
      <header className="landing-navbar">
        <div className="landing-container">
          <div className="landing-navbar-inner">
            <Link href="/convite" className="landing-brand" aria-label="Mr.Crazy Convite">
              <div className="landing-brand-avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/assets/email/mrcrazy-fala-ai-email.png" 
                  alt="Mr.Crazy Logo"
                  width={42}
                  height={42}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="landing-brand-name">
                  MR.CRAZY
                </span>
                <span className="landing-brand-tag">Inglês sem frescura</span>
              </div>
            </Link>

            <nav className="landing-nav-links" aria-label="Navegação da landing page">
              <a href="#o-mr-crazy" className="landing-nav-link">O Mr. Crazy</a>
              <a href="#como-funciona" className="landing-nav-link">Como Funciona</a>
              <a href="#diferenciais" className="landing-nav-link">Diferenciais</a>
              <a href="#demonstracao" className="landing-nav-link">Por Dentro</a>
              <a href="#faq" className="landing-nav-link">Dúvidas</a>
            </nav>

            <div className="landing-nav-cta">
              {user ? (
                <Link href="/practice" className="landing-btn-primary">
                  <span>Praticar Agora</span>
                  <Zap size={15} />
                </Link>
              ) : (
                <>
                  <Link href="/login" className="landing-btn-login">
                    Entrar
                  </Link>
                  <Link href="/login" className="landing-btn-primary">
                    <span>Começar Grátis</span>
                    <ArrowRight size={15} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. TOP LOGO BANNER DO MR. CRAZY (MEMORÁVEL NO TOPO)                */}
      {/* ================================================================= */}
      <div className="landing-top-logo-banner">
        <div className="landing-logo-emblem">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/assets/email/mrcrazy-fala-ai-email.png" 
            alt="Logo Oficial Mr. Crazy"
            className="landing-top-logo-img"
          />
        </div>
        <div className="landing-top-logo-text">
          <div className="landing-top-logo-brand">MR.CRAZY</div>
          <span className="landing-top-logo-slogan">INGLÊS SEM FRESCURA</span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. HERO / PRIMEIRA DOBRA (DIRETO AO PONTO)                        */}
      {/* ================================================================= */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-hero-grid">
            <div>
              <div className="landing-hero-badge">
                <span className="landing-hero-badge-pulse" />
                <span>Conversação Real com IA • Sem enrolação</span>
              </div>

              <h1 className="landing-hero-title">
                Pare de travar no inglês. <br />
                <span className="landing-title-highlight">Comece a falar de verdade.</span>
              </h1>

              <p className="landing-hero-desc">
                Converse com o <strong>Mr. Crazy</strong> — o tutor impaciente, divertido e 
                exigente que te ouve pelo microfone, corrige sua pronúncia na hora e destrava sua 
                fala desde a primeira aula.
              </p>

              <div className="landing-hero-actions">
                <Link href="/login" className="landing-btn-primary">
                  <span>Destravar Meu Inglês Agora</span>
                  <Sparkles size={18} />
                </Link>

                <a href="#o-mr-crazy" onClick={scrollToAudio} className="landing-btn-secondary">
                  <Headphones size={18} className="text-amber-400" />
                  <span>Ouvir o Mr. Crazy Falando</span>
                </a>
              </div>

              {/* Pílulas Visuais Desenhadas (Mobile-first) */}
              <div className="landing-mobile-feature-pills">
                <div className="landing-feature-pill">
                  <div className="landing-feature-pill-icon" style={{ background: "rgba(230, 183, 68, 0.15)", color: "#fbbf24" }}>
                    <Mic size={15} />
                  </div>
                  <span className="landing-feature-pill-title">Fala Ativa</span>
                  <span className="landing-feature-pill-sub">Você fala 80%</span>
                  <span className="landing-feature-pill-tag">🎙️ Voz Real</span>
                </div>

                <div className="landing-feature-pill">
                  <div className="landing-feature-pill-icon" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                    <Zap size={15} />
                  </div>
                  <span className="landing-feature-pill-title">Ajuste de Boca</span>
                  <span className="landing-feature-pill-sub">Língua & sons</span>
                  <span className="landing-feature-pill-tag">⚡ Na Hora</span>
                </div>

                <div className="landing-feature-pill">
                  <div className="landing-feature-pill-icon" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>
                    <Trophy size={15} />
                  </div>
                  <span className="landing-feature-pill-title">O Chefão</span>
                  <span className="landing-feature-pill-sub">Prova oral 0-10</span>
                  <span className="landing-feature-pill-tag">🏆 Desafio</span>
                </div>
              </div>
            </div>

            {/* Mockup Card no Desktop */}
            <div className="landing-hero-mockup desktop-only">
              <div className="landing-mockup-header">
                <div className="landing-mockup-stage-pill">
                  <Flame size={14} className="text-amber-400" />
                  <span>Fase 1: O Pedido no Café</span>
                </div>
                <div className="landing-mockup-status">
                  <span className="landing-mockup-status-dot" />
                  <span>Voz Conectada</span>
                </div>
              </div>

              <div className="landing-mockup-stage-preview">
                <div className="landing-mockup-bubble">
                  <div className="landing-mockup-bubble-author">
                    <Sparkles size={13} />
                    <span>Mr. Crazy:</span>
                  </div>
                  <p className="landing-mockup-bubble-text">
                    Pra pedir água educadamente, fala: <strong>&ldquo;Could I get a glass of water, please?&rdquo;</strong>. Manda bala!
                  </p>
                  <div className="landing-mockup-bubble-target">
                    <span className="landing-mockup-target-en">Could I get a glass of water, please?</span>
                    <span className="landing-mockup-target-phonetic">Cúd ái gét â glés óv uáter, pliz</span>
                  </div>
                </div>

                <div className="landing-mockup-avatar-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/character/mr_crazy_full_transparent.png"
                    alt="Mr. Crazy"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
              </div>

              <div className="landing-mockup-dock">
                <div className="landing-mockup-mic-btn">
                  <Mic size={22} />
                </div>
                <div className="landing-mockup-dock-text">
                  <div className="landing-mockup-dock-title">Toque para falar</div>
                  <div className="landing-mockup-dock-subtitle">Feedback imediato de pronúncia e ritmo</div>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 700, background: "rgba(245, 158, 11, 0.15)", padding: "0.25rem 0.5rem", borderRadius: "0.5rem" }}>
                  100dvh UI
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. SEÇÃO ESTRELA DO MR. CRAZY (ÁUDIO E AVATAR REALISTA)           */}
      {/* ================================================================= */}
      <section className="landing-showcase-section" id="o-mr-crazy">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">
              <Flame size={15} className="text-amber-400" />
              <span>Conheça Seu Novo Professor</span>
            </span>
            <h2 className="landing-section-title">
              O Recado do Mr. Crazy
            </h2>
            <p className="landing-section-desc">
              Ele não tem paciência com enrolação. Conheça o professor e acompanhe o recado direto dele:
            </p>
          </div>

          {/* Player com Web Audio API, Ondas e Avatar Reativo */}
          <MrCrazyAudioShowcase />

          {/* CTA Rápido pós-áudio */}
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href="/login" className="landing-btn-primary" style={{ padding: "0.85rem 1.75rem", fontSize: "0.95rem" }}>
              <span>Gostei! Quero Começar Grátis Agora</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. COMO FUNCIONA (DESENHADO EM PASSOS OBJETIVOS)                  */}
      {/* ================================================================= */}
      <section className="landing-section" id="como-funciona" style={{ background: "rgba(10, 13, 18, 0.5)" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Sem Enrolação</span>
            <h2 className="landing-section-title">
              Como o Mr. Crazy destrava sua fala em 4 passos
            </h2>
            <p className="landing-section-desc">
              Uma dinâmica viciante feita para você falar de 10 a 15 minutos por dia.
            </p>
          </div>

          <div className="landing-steps-grid">
            <div className="landing-step-card">
              <div className="landing-step-top">
                <span className="landing-step-num">01</span>
                <div className="landing-step-icon">
                  <Compass size={20} />
                </div>
              </div>
              <h3 className="landing-step-title">Situação Real</h3>
              <p className="landing-step-desc">
                Restaurante, viagens, reuniões de trabalho e café. Frases práticas.
              </p>
              <div className="landing-step-tag">
                <Compass size={11} />
                <span>Vida Real</span>
              </div>
            </div>

            <div className="landing-step-card">
              <div className="landing-step-top">
                <span className="landing-step-num">02</span>
                <div className="landing-step-icon">
                  <Volume2 size={20} />
                </div>
              </div>
              <h3 className="landing-step-title">O Mr. Crazy Te Desafia</h3>
              <p className="landing-step-desc">
                Explica a cena em português e dá o modelo em inglês com apoio fonético.
              </p>
              <div className="landing-step-tag">
                <Volume2 size={11} />
                <span>Apoio Fonético</span>
              </div>
            </div>

            <div className="landing-step-card">
              <div className="landing-step-top">
                <span className="landing-step-num">03</span>
                <div className="landing-step-icon">
                  <Mic size={20} />
                </div>
              </div>
              <h3 className="landing-step-title">Você Aperta e Fala</h3>
              <p className="landing-step-desc">
                Solte a voz pelo microfone. 100% individual, sem plateia e sem medo.
              </p>
              <div className="landing-step-tag">
                <Mic size={11} />
                <span>Sem Julgamento</span>
              </div>
            </div>

            <div className="landing-step-card">
              <div className="landing-step-top">
                <span className="landing-step-num">04</span>
                <div className="landing-step-icon">
                  <Zap size={20} />
                </div>
              </div>
              <h3 className="landing-step-title">Ajuste de Boca & XP</h3>
              <p className="landing-step-desc">
                Ajusta língua e dentes. Falou cerca de 70% certo? Ele valida e avança!
              </p>
              <div className="landing-step-tag">
                <Zap size={11} />
                <span>Regra dos 70%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. DIFERENCIAIS: COMPARATIVO DESENHADO                            */}
      {/* ================================================================= */}
      <section className="landing-section" id="diferenciais">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Por Que É Diferente</span>
            <h2 className="landing-section-title">
              Cursinho Tradicional vs. Mr. Crazy
            </h2>
            <p className="landing-section-desc">
              Menos teoria morta. Mais prática oral para ganhar confiança de verdade.
            </p>
          </div>

          <div className="landing-compare-box">
            <div className="landing-compare-header">
              <div className="landing-compare-col-title landing-compare-col-traditional">
                <XCircle size={17} className="text-red-400" />
                <span>Cursinho Tradicional</span>
              </div>
              <div className="landing-compare-col-title landing-compare-col-mrcrazy">
                <CheckCircle2 size={17} className="text-amber-400" />
                <span>Com o Mr. Crazy</span>
              </div>
            </div>

            <div className="landing-compare-row">
              <div className="landing-compare-cell-left">
                <span>❌ 80% lendo regra gramatical e preenchendo papel.</span>
              </div>
              <div className="landing-compare-cell-right">
                <span>⚡ 80% do tempo falando em voz alta com o microfone.</span>
              </div>
            </div>

            <div className="landing-compare-row">
              <div className="landing-compare-cell-left">
                <span>❌ Você fala 2 minutos por aula porque a turma é cheia.</span>
              </div>
              <div className="landing-compare-cell-right">
                <span>⚡ 100% de atenção em você. Você fala dezenas de vezes.</span>
              </div>
            </div>

            <div className="landing-compare-row">
              <div className="landing-compare-cell-left">
                <span>❌ Não ensina a musculatura de sons como TH e R americano.</span>
              </div>
              <div className="landing-compare-cell-right">
                <span>⚡ Dicas anatômicas de onde pôr a língua, dentes e lábios.</span>
              </div>
            </div>

            <div className="landing-compare-row">
              <div className="landing-compare-cell-left">
                <span>❌ Provas escritas que não testam se você fala de verdade.</span>
              </div>
              <div className="landing-compare-cell-right">
                <span>⚡ O Chefão: Prova oral com perguntas surpresa e nota de 0 a 10.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. BENEFÍCIO CENTRAL / AS DORES REAIS                             */}
      {/* ================================================================= */}
      <section className="landing-section" id="beneficio" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Você Não Precisa Mais Travar</span>
            <h2 className="landing-section-title">
              Você não precisa de mais 5 anos de gramática. <br />
              <span className="landing-title-highlight">Você precisa falar.</span>
            </h2>
            <p className="landing-section-desc">
              O Mr. Crazy foi desenhado para quem entende textos em inglês, mas trava na hora de abrir a boca.
            </p>
          </div>

          <div className="landing-pain-grid">
            <div className="landing-pain-card">
              <div className="landing-pain-icon">
                <BrainCircuit size={18} />
              </div>
              <h3 className="landing-pain-title">O Bloqueio do Silêncio</h3>
              <p className="landing-pain-problem">
                Sabe as palavras na cabeça, mas na hora de falar a voz trava.
              </p>
              <div className="landing-pain-solution">
                <CheckCircle2 size={13} />
                <span>Fala ativa na fase 1</span>
              </div>
            </div>

            <div className="landing-pain-card">
              <div className="landing-pain-icon">
                <Clock size={18} />
              </div>
              <h3 className="landing-pain-title">Anos de Cursinho Chato</h3>
              <p className="landing-pain-problem">
                Horas decorando regras sem praticar conversa de verdade.
              </p>
              <div className="landing-pain-solution">
                <CheckCircle2 size={13} />
                <span>10 a 15 min diários</span>
              </div>
            </div>

            <div className="landing-pain-card">
              <div className="landing-pain-icon">
                <HeartHandshake size={18} />
              </div>
              <h3 className="landing-pain-title">Medo de Errar em Público</h3>
              <p className="landing-pain-problem">
                Vergonha do sotaque ou de errar na frente de conhecidos.
              </p>
              <div className="landing-pain-solution">
                <CheckCircle2 size={13} />
                <span>100% seguro com IA</span>
              </div>
            </div>

            <div className="landing-pain-card">
              <div className="landing-pain-icon">
                <TrendingUp size={18} />
              </div>
              <h3 className="landing-pain-title">Sem Parceiro de Treino</h3>
              <p className="landing-pain-problem">
                Falta de alguém nativo com quem conversar todo dia.
              </p>
              <div className="landing-pain-solution">
                <CheckCircle2 size={13} />
                <span>24h no seu celular</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. DEMONSTRAÇÃO INTERATIVA DO PRODUTO (POR DENTRO)                */}
      {/* ================================================================= */}
      <section className="landing-section" id="demonstracao" style={{ background: "rgba(10, 13, 18, 0.4)" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Por Dentro do App</span>
            <h2 className="landing-section-title">
              Veja a Experiência Real
            </h2>
            <p className="landing-section-desc">
              Toque nas abas abaixo para ver como é simples e direto treinar.
            </p>
          </div>

          <LandingInteractiveDemo />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 9. QUEBRA DE OBJEÇÕES RÁPIDA                                      */}
      {/* ================================================================= */}
      <section className="landing-section" id="objecoes">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Dúvidas Comuns</span>
            <h2 className="landing-section-title">
              Será que o Mr. Crazy é para você?
            </h2>
          </div>

          <div className="landing-objections-grid">
            <div className="landing-objection-card">
              <h3 className="landing-objection-q">
                <CheckCircle2 size={17} className="text-amber-400" />
                <span>&ldquo;Eu sou iniciante do zero, vou conseguir?&rdquo;</span>
              </h3>
              <p className="landing-objection-a">
                Sim! Ele começa com frases curtas de 1 a 3 palavras, orienta tudo em português e dá o apoio fonético visual.
              </p>
            </div>

            <div className="landing-objection-card">
              <h3 className="landing-objection-q">
                <CheckCircle2 size={17} className="text-amber-400" />
                <span>&ldquo;E se o meu sotaque for forte?&rdquo;</span>
              </h3>
              <p className="landing-objection-a">
                Usamos a <strong>Regra dos 70%</strong>: se a mensagem foi compreensível, o Mr. Crazy valida e você segue em frente sem travar!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 10. CTA DE ALTA CONVERSÃO (MEIO/FINAL)                            */}
      {/* ================================================================= */}
      <section className="landing-section" style={{ padding: "3.5rem 0" }}>
        <div className="landing-container">
          <div className="landing-cta-banner">
            <span className="landing-hero-badge" style={{ marginBottom: "1rem" }}>
              <Zap size={14} className="text-amber-400" />
              <span>Acesso Imediato</span>
            </span>

            <h2 className="landing-cta-title">
              Seu inglês não vai destravar sozinho. <br />
              <span className="landing-title-highlight">Bora falar de verdade?</span>
            </h2>

            <p className="landing-cta-desc">
              Crie sua conta em 1 minuto. Sem cartão de crédito, sem burocracia e com a sua primeira aula pronta.
            </p>

            <Link href="/login" className="landing-btn-primary" style={{ padding: "0.95rem 2rem", fontSize: "1.05rem" }}>
              <span>Destravar Meu Inglês Agora</span>
              <ArrowRight size={18} />
            </Link>

            <div style={{ marginTop: "1rem", fontSize: "0.775rem", color: "#9ca3af" }}>
              ✨ 100% no navegador ou celular • Não precisa baixar app pesado
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 11. FAQ COMPACTO                                                  */}
      {/* ================================================================= */}
      <section className="landing-section" id="faq">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Perguntas Frequentes</span>
            <h2 className="landing-section-title">
              Tire Suas Dúvidas
            </h2>
          </div>

          <LandingFaq />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 12. FOOTER                                                        */}
      {/* ================================================================= */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                <span style={{ fontWeight: 900, color: "#ffffff", fontSize: "1.1rem" }}>MR.CRAZY</span>
                <span className="landing-brand-tag">Inglês sem frescura</span>
              </div>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.8rem", maxWidth: "24rem" }}>
                Conversação oral em inglês com IA em tempo real para brasileiros.
              </p>
            </div>

            <div className="landing-footer-links">
              <Link href="/convite" className="landing-footer-link">Convite</Link>
              <Link href="/login" className="landing-footer-link">Entrar</Link>
              <Link href="/practice" className="landing-footer-link">Treino</Link>
              <Link href="/history" className="landing-footer-link">Histórico</Link>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.25rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)", fontSize: "0.75rem", color: "#4b5563" }}>
            <span>&copy; {new Date().getFullYear()} Mr.Crazy. Todos os direitos reservados.</span>
            <span>mrcrazy.fun/convite</span>
          </div>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* 13. STICKY MOBILE BOTTOM BAR (ALTA CONVERSÃO)                      */}
      {/* ================================================================= */}
      <aside className="landing-sticky-bar" aria-label="Ação rápida de cadastro">
        <div className="landing-sticky-text">
          <span className="landing-sticky-title">Destrave seu inglês</span>
          <span className="landing-sticky-sub">Treine com o Mr. Crazy</span>
        </div>
        <Link href="/login" className="landing-btn-primary landing-sticky-btn">
          <span>Começar Grátis</span>
          <ArrowRight size={14} />
        </Link>
      </aside>
    </div>
  );
}
