import { PracticeExperience } from "@/components/PracticeExperience";
import { requireAuth } from "@/lib/server-auth";

export default async function PracticePage() {
  await requireAuth("/practice");

  return <PracticeExperience />;
}
