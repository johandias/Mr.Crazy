import { AppShell } from "@/components/AppShell";
import { requireAuth } from "@/lib/server-auth";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth("/settings");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return (
    <AppShell isAdmin={isAdmin}>
      <main className="secondary-main settings-main">
        <section className="secondary-hero">
          <p className="eyebrow">Painel do aluno</p>
          <h1>Deixe o treino com a sua cara.</h1>
          <p className="hero-subtext">
            Ajuste voz, ritmo e personalidade. O Mr.Crazy usa essas escolhas para cobrar o que realmente importa para você.
          </p>
        </section>

        <ProfileSettingsForm />
      </main>
    </AppShell>
  );
}
