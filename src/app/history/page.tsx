import { AppShell } from "@/components/AppShell";
import { requireAuth } from "@/lib/server-auth";
import { SessionHistory } from "@/components/SessionHistory";

export default async function HistoryPage() {
  const session = await requireAuth("/history");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return (
    <AppShell isAdmin={isAdmin}>
      <main className="secondary-main history-main-wrapper">
        <section className="secondary-hero">
          <p className="eyebrow">Diário de treino</p>
          <h1>Cada erro vira uma próxima missão.</h1>
          <p className="hero-subtext">
            Veja o que você falou, quanto treinou e onde o Mr.Crazy quer apertar o parafuso na próxima sessão.
          </p>
        </section>

        <SessionHistory />
      </main>
    </AppShell>
  );
}
