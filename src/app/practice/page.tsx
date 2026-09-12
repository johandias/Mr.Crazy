import { PracticeExperience } from "@/components/PracticeExperience";
import { requireAuth } from "@/lib/server-auth";

export default async function PracticePage() {
  const session = await requireAuth("/practice");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return <PracticeExperience isAdmin={isAdmin} />;
}
