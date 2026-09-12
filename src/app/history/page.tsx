import { AppShell } from "@/components/AppShell";
import { requireAuth } from "@/lib/server-auth";

const sessions = [
  { date: "Hoje", mode: "Conversa livre", minutes: 15, focus: "Passado simples" },
  { date: "Ontem", mode: "Inglês de trabalho", minutes: 12, focus: "Preposições" },
  { date: "2 dias atrás", mode: "Entrevista", minutes: 18, focus: "Respostas STAR" }
];

export default async function HistoryPage() {
  const session = await requireAuth("/history");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return (
    <AppShell isAdmin={isAdmin}>
      <main className="secondary-main">
        <section className="secondary-hero">
          <p className="eyebrow">Histórico</p>
          <h1>Erros recorrentes viram roteiro de treino.</h1>
        </section>
        <section className="history-list" aria-label="Histórico de sessões">
          {sessions.map((session) => (
            <article className="history-row" key={`${session.date}-${session.mode}`}>
              <span>{session.date}</span>
              <strong>{session.mode}</strong>
              <small>{session.minutes} min</small>
              <em>{session.focus}</em>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
