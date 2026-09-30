import { PracticeExperienceClient } from "@/components/PracticeExperienceClient";
import { requireAuth } from "@/lib/server-auth";

export default async function Home() {
  const session = await requireAuth("/");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return <PracticeExperienceClient isAdmin={isAdmin} />;
}
