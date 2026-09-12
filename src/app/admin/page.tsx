import { AppShell } from "@/components/AppShell";
import { requireAdminAuth } from "@/lib/server-auth";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminAuth("/admin");

  return (
    <AppShell isAdmin={true}>
      <main className="secondary-main admin-main-wrapper">
        <AdminDashboard />
      </main>
    </AppShell>
  );
}

