"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Sparkles, 
  ArrowRight, 
  Mic, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Award, 
  MessageSquare, 
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
                  src="/assets/character/mr_crazy_avatar_transparent.png" 
                  alt="Mr.Crazy Avatar"
                  width={40}
                  height={40}
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
              <a href="#como-funciona" className="landing-nav-link">Como Funciona</a>
              <a href="#o-mr-crazy" className="landing-nav-link">O Mr. Crazy</a>
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
      {/* 2. HERO / PRIMEIRA DOBRA                                          */}
      {/* ================================================================= */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-hero-grid">
            <div>
              <div className="landing-hero-badge">
                <span className="landing-hero-badge-pulse" />
                <span>Conversação Gamificada com IA Realtime • Sem Enrolação</span>
              </div>

              <h1 className="landing-hero-title">
                Pare de travar no inglês. <br />
                <span className="landing-title-highlight">Comece a falar de verdade.</span>
              </h1>

              <p className="landing-hero-desc">
                Pratique sua fala com o <strong>Mr. Crazy</strong> — o tutor impaciente, 
                divertido e exigente que te ouve, corrige seus vícios de pronúncia na hora e te 
                coloca para falar desde o primeiro minuto.
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

              <div className="landing-hero-proof">
                <div className="landing-hero-proof-avatars" aria-hidden="true">
                  <div className="landing-hero-proof-avatar">BR</div>
                  <div className="landing-hero-proof-avatar">US</div>
                  <div className="landing-hero-proof-avatar">SP</div>
                  <div className="landing-hero-proof-avatar">RJ</div>
                </div>
                <div className="landing-hero-proof-text">
                  <strong>+100% focado em fala ativa.</strong><br />
                  Destrave sua musculatura oral no seu próprio ritmo.
                </div>
              </div>
            </div>

            {/* Mockup Card do App Real */}
            <div className="landing-hero-mockup">
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
                {/* Speech Bubble */}
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

                {/* Character preview */}
                <div className="landing-mockup-avatar-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/character/mr_crazy_full_transparent.png"
                    alt="Mr. Crazy"
                    style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }}
                  />
                </div>
              </div>

              {/* Voice dock */}
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
      {/* 3. BENEFÍCIO CENTRAL / AS 4 DORES DO BRASILEIRO                   */}
      {/* ================================================================= */}
      <section className="landing-section" id="beneficio" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">A Verdade Sobre o Aprendizado</span>
            <h2 className="landing-section-title">
              Você não precisa de mais 5 anos de gramática. <br />
              <span className="landing-title-highlight">Você precisa falar.</span>
            </h2>
            <p className="landing-section-desc">
              Mais de 90% dos brasileiros entendem textos em inglês, mas travam na hora de 
              abrir a boca. O Mr. Crazy foi desenhado exatamente para atacar essa barreira.
            </p>
          </div>

          <div className="landing-pain-grid">
            <div className="landing-pain-card">
              <div className="landing-pain-icon">
                <BrainCircuit size={22} />
              </div>
              <h3 className="landing-pain-title">O Bloqueio do Silêncio</h3>
              <p className="landing-pain-problem">
                Você sabe as palavras na cabeça, mas na hora de falar a voz emudece e você 
                fica caçando regras de gramática.
              </p>
              <div className="landing-pain-solution">
                <CheckCircle2 size={16} />
                <span>Aqui você fala em voz alta desde a fase 1.</span>
              </div>
            </div>

            <div className="landing-pain-card">
              <div className="landing-pain-icon">
                <Clock size={22} />
              </div>
              <h3 className="landing-pain-title">Anos de Cursinho Chato</h3>
              <p className="landing-pain-problem">
                Aulas de 1 hora com turmas de 15 pessoas onde você só fala durante 2 minutos. 
                Pura teoria passiva e enrolação.
              </p>
              <div className="landing-pain-solution">
                <CheckCircle2 size={16} />
                <span>Atenção 100% individual e treino focado.</span>
              </div>
            </div>

            <div className="landing-pain-card">
              <div className="landing-pain-icon">
                <HeartHandshake size={22} />
              </div>
              <h3 className="landing-pain-title">Medo de Passar Vergonha</h3>
              <p className="landing-pain-problem">
                Medo do julgamento alheio ao errar a pronúncia na frente de colegas ou nativos.
              </p>
              <div className="landing-pain-solution">
                <CheckCircle2 size={16} />
                <span>Ambiente seguro e privado para errar e acertar.</span>
              </div>
            </div>

            <div className="landing-pain-card">
              <div className="landing-pain-icon">
                <TrendingUp size={22} />
              </div>
              <h3 className="landing-pain-title">Sem Parceiro de Treino</h3>
              <p className="landing-pain-problem">
                Não tem com quem conversar no dia a dia para manter o ritmo e a memória muscular.
              </p>
              <div className="landing-pain-solution">
                <CheckCircle2 size={16} />
                <span>Disponível 24/7 no seu celular para treinar 15min.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. COMO FUNCIONA (4 PASSOS)                                       */}
      {/* ================================================================= */}
      <section className="landing-section" id="como-funciona" style={{ background: "rgba(10, 13, 18, 0.5)" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Método Direto e Eficaz</span>
            <h2 className="landing-section-title">
              Como o Mr. Crazy destrava sua fala em 4 passos
            </h2>
            <p className="landing-section-desc">
              Uma dinâmica rápida, viciante e sem rodeios. É entrar, ouvir, responder e evoluir.
            </p>
          </div>

          <div className="landing-steps-grid">
            <div className="landing-step-card">
              <span className="landing-step-num">01</span>
              <div className="landing-step-icon">
                <Compass size={22} />
              </div>
              <h3 className="landing-step-title">Escolha sua Trilha Real</h3>
              <p className="landing-step-desc">
                Viagens, reuniões de trabalho, entrevistas de emprego, restaurantes ou bate-papo casual. 
                Nada de frases inúteis como &ldquo;o livro está sobre a mesa&rdquo;.
              </p>
            </div>

            <div className="landing-step-card">
              <span className="landing-step-num">02</span>
              <div className="landing-step-icon">
                <Volume2 size={22} />
              </div>
              <h3 className="landing-step-title">O Mr. Crazy Apresenta o Desafio</h3>
              <p className="landing-step-desc">
                Em português direto (&lt; 25 palavras), ele contextualiza a situação e apresenta o 
                modelo exato em inglês com o apoio fonético visual.
              </p>
            </div>

            <div className="landing-step-card">
              <span className="landing-step-num">03</span>
              <div className="landing-step-icon">
                <Mic size={22} />
              </div>
              <h3 className="landing-step-title">Você Aperta e Fala</h3>
              <p className="landing-step-desc">
                Toque no microfone e solte a voz. Nosso motor WebRTC de baixíssima latência captura 
                sua fala em tempo real com redução de ruídos.
              </p>
            </div>

            <div className="landing-step-card">
              <span className="landing-step-num">04</span>
              <div className="landing-step-icon">
                <Zap size={22} />
              </div>
              <h3 className="landing-step-title">Feedback & Ajuste Anatômico</h3>
              <p className="landing-step-desc">
                Errou? Ele explica onde posicionar a língua e os dentes. Falou cerca de 70% certo? 
                Ele valida e avança para a próxima etapa da história!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. SEÇÃO ESTRELA: O MR. CRAZY FALANDO (ÁUDIO + AVATAR ANIMADO)    */}
      {/* ================================================================= */}
      <section className="landing-showcase-section" id="o-mr-crazy">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">
              <Flame size={15} className="text-amber-400" />
              <span>Conheça Seu Novo Professor</span>
            </span>
            <h2 className="landing-section-title">
              O Recado do Mr. Crazy Para Você
            </h2>
            <p className="landing-section-desc">
              Ele não tem paciência para enrolação, exige que você fale em voz alta e vibra 
              com o seu progresso. Dê o play abaixo e ouça a explicação direta dele:
            </p>
          </div>

          {/* Componente Interativo com Web Audio API, Ondas e Avatar */}
          <MrCrazyAudioShowcase />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. DIFERENCIAIS: COMPARATIVO LADO A LADO                          */}
      {/* ================================================================= */}
      <section className="landing-section" id="diferenciais">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Por Que Somos Diferentes</span>
            <h2 className="landing-section-title">
              Cursinho Tradicional vs. Mr. Crazy
            </h2>
            <p className="landing-section-desc">
              Veja por que o método do Mr. Crazy entrega mais resultados práticos em semanas do 
              que anos de apostilas engessadas.
            </p>
          </div>

          <div className="landing-compare-box">
            <div className="landing-compare-header">
              <div className="landing-compare-col-title landing-compare-col-traditional">
                <XCircle size={18} className="text-red-400" />
                <span>Método Tradicional</span>
              </div>
              <div className="landing-compare-col-title landing-compare-col-mrcrazy">
                <CheckCircle2 size={18} className="text-amber-400" />
                <span>Com o Mr. Crazy</span>
              </div>
            </div>

            <div className="landing-compare-row">
              <div className="landing-compare-cell-left">
                <span>❌ 80% do tempo preenchendo folhas de gramática e lendo textos passivos.</span>
              </div>
              <div className="landing-compare-cell-right">
                <span>⚡ 80% do tempo falando em voz alta e treinando a boca.</span>
              </div>
            </div>

            <div className="landing-compare-row">
              <div className="landing-compare-cell-left">
                <span>❌ Você fala 2 minutos por aula porque a turma tem 15 alunos.</span>
              </div>
              <div className="landing-compare-cell-right">
                <span>⚡ 100% de atenção em você. Você fala dezenas de vezes por sessão.</span>
              </div>
            </div>

            <div className="landing-compare-row">
              <div className="landing-compare-cell-left">
                <span>❌ Explicações longas, chatas e cheias de termos técnicos difíceis.</span>
              </div>
              <div className="landing-compare-cell-right">
                <span>⚡ Orientações em português com menos de 25 palavras. Direto ao ponto.</span>
              </div>
            </div>

            <div className="landing-compare-row">
              <div className="landing-compare-cell-left">
                <span>❌ Não ensina como colocar a língua nos sons como TH, R caipira e L final.</span>
              </div>
              <div className="landing-compare-cell-right">
                <span>⚡ Dicas anatômicas práticas de boca, dentes e respiração para destravar o som.</span>
              </div>
            </div>

            <div className="landing-compare-row">
              <div className="landing-compare-cell-left">
                <span>❌ Provas escritas artificiais que não testam se você realmente fala.</span>
              </div>
              <div className="landing-compare-cell-right">
                <span>⚡ O Chefão: Prova oral com perguntas surpresa e nota de 0 a 10 no microfone.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. DEMONSTRAÇÃO DA EXPERIÊNCIA (POR DENTRO DO APP)                */}
      {/* ================================================================= */}
      <section className="landing-section" id="demonstracao" style={{ background: "rgba(10, 13, 18, 0.4)" }}>
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Produto Real e Vivo</span>
            <h2 className="landing-section-title">
              Veja a Experiência Por Dentro
            </h2>
            <p className="landing-section-desc">
              Alterne entre as telas abaixo para ver como você vai treinar no dia a dia.
            </p>
          </div>

          <LandingInteractiveDemo />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. QUEBRA DE OBJEÇÕES                                             */}
      {/* ================================================================= */}
      <section className="landing-section" id="objecoes">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Feito Sob Medida</span>
            <h2 className="landing-section-title">
              Será que o Mr. Crazy é para você?
            </h2>
            <p className="landing-section-desc">
              Projetado especificamente para a realidade e as dificuldades do estudante brasileiro.
            </p>
          </div>

          <div className="landing-objections-grid">
            <div className="landing-objection-card">
              <h3 className="landing-objection-q">
                <CheckCircle2 size={18} className="text-amber-400" />
                <span>&ldquo;Eu sou iniciante do zero, vou conseguir acompanhar?&rdquo;</span>
              </h3>
              <p className="landing-objection-a">
                Com certeza! O Mr. Crazy começa com saudações e frases de 1 a 3 palavras. Toda a 
                orientação é 100% em português e você conta com a fonética aportuguesada para saber 
                exatamente o som de cada palavra antes de falar.
              </p>
            </div>

            <div className="landing-objection-card">
              <h3 className="landing-objection-q">
                <CheckCircle2 size={18} className="text-amber-400" />
                <span>&ldquo;E se o meu sotaque for muito forte?&rdquo;</span>
              </h3>
              <p className="landing-objection-a">
                Nossa IA adota a <strong>Regra dos 70%</strong>: ter sotaque brasileiro é normal e 
                bonito! O Mr. Crazy só corrige quando o som quebra o sentido da frase. Se a mensagem 
                chegou, ele valida e você segue em frente sem travar.
              </p>
            </div>

            <div className="landing-objection-card">
              <h3 className="landing-objection-q">
                <CheckCircle2 size={18} className="text-amber-400" />
                <span>&ldquo;Tenho vergonha de falar com outras pessoas&rdquo;</span>
              </h3>
              <p className="landing-objection-a">
                Esse é o maior diferencial: você treina a sós com o Mr. Crazy. Sem julgamento, sem 
                plateia e sem constrangimento. Você erra 20 vezes até acertar sem ninguém te olhando.
              </p>
            </div>

            <div className="landing-objection-card">
              <h3 className="landing-objection-q">
                <CheckCircle2 size={18} className="text-amber-400" />
                <span>&ldquo;Tenho pouco tempo livre no dia&rdquo;</span>
              </h3>
              <p className="landing-objection-a">
                O aplicativo foi desenhado para <strong>sessões rápidas de 10 a 15 minutos</strong>. 
                Abra no celular no intervalo do almoço, no transporte ou antes de dormir e treine 
                duas fases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 9. CTA FORTE (MEIO / FINAL)                                       */}
      {/* ================================================================= */}
      <section className="landing-section" style={{ padding: "4rem 0" }}>
        <div className="landing-container">
          <div className="landing-cta-banner">
            <span className="landing-hero-badge" style={{ marginBottom: "1rem" }}>
              <Zap size={14} className="text-amber-400" />
              <span>Destrave Sua Fala Agora</span>
            </span>

            <h2 className="landing-cta-title">
              Seu inglês não vai destravar sozinho. <br />
              <span className="landing-title-highlight">Bora falar de verdade?</span>
            </h2>

            <p className="landing-cta-desc">
              Crie sua conta em menos de 1 minuto, faça seu teste de microfone e sinta a 
              diferença de falar em inglês logo na sua primeira sessão com o Mr. Crazy.
            </p>

            <Link href="/login" className="landing-btn-primary" style={{ padding: "1rem 2.25rem", fontSize: "1.05rem" }}>
              <span>Quero Começar Agora (Grátis)</span>
              <ArrowRight size={18} />
            </Link>

            <div style={{ marginTop: "1.25rem", fontSize: "0.775rem", color: "#9ca3af" }}>
              ✨ Acesso instantâneo • Não pede cartão de crédito • Roda direto no celular
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 10. FAQ (PERGUNTAS FREQUENTES)                                    */}
      {/* ================================================================= */}
      <section className="landing-section" id="faq">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Tire Suas Dúvidas</span>
            <h2 className="landing-section-title">
              Perguntas Frequentes
            </h2>
            <p className="landing-section-desc">
              Tudo o que você precisa saber antes de iniciar sua jornada com o Mr. Crazy.
            </p>
          </div>

          <LandingFaq />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 11. CTA FINAL DE FECHAMENTO                                       */}
      {/* ================================================================= */}
      <section className="landing-section" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "center" }}>
        <div className="landing-container">
          <div style={{ maxWidth: "36rem", margin: "0 auto" }}>
            <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff", marginBottom: "1rem", letterSpacing: "-0.03em" }}>
              Pare de adiar seu inglês.
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2rem" }}>
              Entre no Mr. Crazy hoje mesmo e experimente o jeito mais direto, divertido e 
              gamificado de destravar a sua conversação.
            </p>
            <Link href="/login" className="landing-btn-primary" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>
              <span>Começar Minha Primeira Aula</span>
              <Sparkles size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 12. FOOTER                                                        */}
      {/* ================================================================= */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "1.1rem" }}>MR.CRAZY</span>
                <span className="landing-brand-tag">Inglês sem frescura</span>
              </div>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.8rem", maxWidth: "24rem" }}>
                Plataforma de conversação oral em inglês com IA em tempo real para brasileiros.
              </p>
            </div>

            <div className="landing-footer-links">
              <Link href="/practice" className="landing-footer-link">Treino</Link>
              <Link href="/login" className="landing-footer-link">Entrar</Link>
              <Link href="/history" className="landing-footer-link">Histórico</Link>
              <Link href="/progress" className="landing-footer-link">Evolução</Link>
              <Link href="/settings" className="landing-footer-link">Configurações</Link>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)", fontSize: "0.75rem", color: "#4b5563" }}>
            <span>&copy; {new Date().getFullYear()} Mr.Crazy. Todos os direitos reservados.</span>
            <span>mrcrazy.fun</span>
          </div>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* 13. STICKY MOBILE BOTTOM BAR (ALTA CONVERSÃO EM WHATSAPP)         */}
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
