import { PracticeExperienceClient } from "@/components/PracticeExperienceClient";
import { requireAuth } from "@/lib/server-auth";

export default async function PracticePage() {
  const session = await requireAuth("/practice");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return <PracticeExperienceClient isAdmin={isAdmin} />;
}
