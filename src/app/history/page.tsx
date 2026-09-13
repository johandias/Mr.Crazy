import { AppShell } from "@/components/AppShell";
import { requireAuth } from "@/lib/server-auth";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Target } from "lucide-react";

const sessions = [
  { date: "Hoje", mode: "Conversa livre", minutes: 15, focus: "Passado simples e som do TH", xp: 120 },
  { date: "Ontem", mode: "Inglês de trabalho", minutes: 12, focus: "Preposições e verbos auxiliares", xp: 95 },
  { date: "2 dias atrás", mode: "Entrevista de emprego", minutes: 18, focus: "Respostas diretas e corte do 'i' final", xp: 140 },
  { date: "3 dias atrás", mode: "Viagens & Hotel", minutes: 14, focus: "Connected speech e frases curtas", xp: 110 }
];

export default async function HistoryPage() {
  const session = await requireAuth("/history");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return (
    <AppShell isAdmin={isAdmin}>
      <main className="secondary-main history-main-wrapper">
        <section className="secondary-hero">
          <p className="eyebrow">Histórico de Aulas</p>
          <h1>Erros recorrentes viram roteiro de treino.</h1>
          <p className="hero-subtext">
            Cada sessão com o Mr.Crazy alimenta a IA com diagnósticos de som e gramática para você evoluir mais rápido.
          </p>
        </section>

        <div className="mobile-swipe-hint">
          <span>👉 Arraste para o lado para ver o histórico</span>
        </div>

        <section className="history-list horizontal-swipe-track" aria-label="Histórico de sessões">
          {sessions.map((item) => (
            <article className="history-row swipe-card-wide" key={`${item.date}-${item.mode}`}>
              <div className="history-header">
                <span className="history-date">
                  <Calendar size={13} /> {item.date}
                </span>
                <span className="history-xp">+{item.xp} XP</span>
              </div>
              <strong className="history-mode">{item.mode}</strong>
              <div className="history-meta">
                <span className="history-time">
                  <Clock size={13} /> {item.minutes} min
                </span>
                <span className="history-focus">
                  <Target size={13} /> {item.focus}
                </span>
              </div>
            </article>
          ))}
        </section>

        <div className="history-cta-wrap">
          <Link href="/practice" className="primary-link quick-practice-btn">
            <span>Iniciar Nova Sessão</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
