import { AppShell } from "@/components/AppShell";

const sessions = [
  { date: "Hoje", mode: "Free conversation", minutes: 15, focus: "Past tense" },
  { date: "Ontem", mode: "Work English", minutes: 12, focus: "Prepositions" },
  { date: "2 dias atras", mode: "Job Interview", minutes: 18, focus: "STAR answers" }
];

export default function HistoryPage() {
  return (
    <AppShell>
      <main className="secondary-main">
        <section className="secondary-hero">
          <p className="eyebrow">History</p>
          <h1>Erros recorrentes viram roteiro de treino.</h1>
        </section>
        <section className="history-list" aria-label="Historico de sessoes">
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
