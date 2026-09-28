import { AppShell } from "@/components/AppShell";
import { BetaConversation } from "@/components/BetaConversation";
import { requireAuth } from "@/lib/server-auth";

export default async function ConversationPage() {
  const session = await requireAuth("/conversation");
  const isAdmin = session.role === "admin" && session.status === "approved";
  const userName = session.email.split("@")[0] || "Aluno";

  return (
    <AppShell isAdmin={isAdmin}>
      <BetaConversation userName={userName} />
    </AppShell>
  );
}
