import { PracticeExperience } from "@/components/PracticeExperience";
import { requireAuth } from "@/lib/server-auth";

export default async function Home() {
  await requireAuth("/");

  return <PracticeExperience />;
}
