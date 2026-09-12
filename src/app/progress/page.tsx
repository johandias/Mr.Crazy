import { AppShell } from "@/components/AppShell";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { requireAuth } from "@/lib/server-auth";

export default async function ProgressPage() {
  const session = await requireAuth("/progress");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return (
    <AppShell isAdmin={isAdmin}>
      <main className="secondary-main">
        <section className="secondary-hero">
          <p className="eyebrow">Progresso</p>
          <h1>Fluência real, sem placar infantil.</h1>
          <p>O progresso acompanha fala ativa, latência, correção de erros e retenção de estruturas.</p>
        </section>
        <section className="metrics-grid">
          <ProgressIndicator label="Confiança na fala" value={64} />
          <ProgressIndicator label="Precisão gramatical" value={71} />
          <ProgressIndicator label="Pronúncia" value={68} />
          <ProgressIndicator label="Ativação de vocabulário" value={76} />
        </section>
      </main>
    </AppShell>
  );
}
