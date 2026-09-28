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
          <p className="eyebrow">Histórico de Aulas</p>
          <h1>Erros recorrentes viram roteiro de treino.</h1>
          <p className="hero-subtext">
            Cada sessão com o Mr.Crazy alimenta a IA com diagnósticos de som e gramática para você evoluir mais rápido.
          </p>
        </section>

        <SessionHistory />
      </main>
    </AppShell>
  );
}
