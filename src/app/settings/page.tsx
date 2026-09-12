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
          <p className="eyebrow">Personalização do Aluno</p>
          <h1>Calibre o Mr.Crazy para o seu jeito e ritmo.</h1>
          <p className="hero-subtext">
            O professor usa seu apelido, ajusta os verbos para o seu sexo e foca exatamente nas suas dificuldades de pronúncia.
          </p>
        </section>

        <ProfileSettingsForm />
      </main>
    </AppShell>
  );
}
