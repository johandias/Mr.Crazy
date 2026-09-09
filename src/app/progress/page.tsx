import { AppShell } from "@/components/AppShell";
import { ProgressIndicator } from "@/components/ProgressIndicator";

export default function ProgressPage() {
  return (
    <AppShell>
      <main className="secondary-main">
        <section className="secondary-hero">
          <p className="eyebrow">Progress</p>
          <h1>Fluencia real, sem placar infantil.</h1>
          <p>O progresso acompanha fala ativa, latencia, correcao de erros e retencao de estruturas.</p>
        </section>
        <section className="metrics-grid">
          <ProgressIndicator label="Speaking confidence" value={64} />
          <ProgressIndicator label="Grammar accuracy" value={71} />
          <ProgressIndicator label="Pronunciation" value={68} />
          <ProgressIndicator label="Vocabulary activation" value={76} />
        </section>
      </main>
    </AppShell>
  );
}
