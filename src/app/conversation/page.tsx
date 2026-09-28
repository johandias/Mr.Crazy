import { AppShell } from "@/components/AppShell";
import { BetaConversation } from "@/components/BetaConversation";
import { getCurrentUser, requireAuth } from "@/lib/server-auth";

export default async function ConversationPage() {
  const session = await requireAuth("/conversation");
  const user = await getCurrentUser();
  const isAdmin = session.role === "admin" && session.status === "approved";
  const userName = user?.nickname?.trim() || session.email.split("@")[0] || "Aluno";

  return (
    <AppShell isAdmin={isAdmin}>
      <BetaConversation userName={userName} learningLevel={user?.learning_level} />
    </AppShell>
  );
}
