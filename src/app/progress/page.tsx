import { AppShell } from "@/components/AppShell";
import { ProgressIndicator } from "@/components/ProgressIndicator";

export default function ProgressPage() {
  return (
    <AppShell>
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
