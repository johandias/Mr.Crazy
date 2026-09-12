import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { requireAuth } from "@/lib/server-auth";
import { EvolutionDashboard } from "@/components/EvolutionDashboard";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const session = await requireAuth("/progress");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return (
    <AppShell isAdmin={isAdmin}>
      <main className="secondary-main evolution-main-wrapper">
        <Suspense fallback={<div className="settings-loading">Carregando painel de evolução...</div>}>
          <EvolutionDashboard />
        </Suspense>
      </main>
    </AppShell>
  );
}
