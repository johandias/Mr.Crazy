import { PracticeExperience } from "@/components/PracticeExperience";
import { requireAuth } from "@/lib/server-auth";

export default async function Home() {
  await requireAuth("/");
  const session = await requireAuth("/");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return <PracticeExperience isAdmin={isAdmin} />;
}
