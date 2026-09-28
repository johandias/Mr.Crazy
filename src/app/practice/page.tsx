import dynamic from "next/dynamic";
import { requireAuth } from "@/lib/server-auth";

const PracticeExperience = dynamic(
  () => import("@/components/PracticeExperience").then((module) => module.PracticeExperience),
  {
    ssr: false,
    loading: () => <main className="practice-loading-screen" aria-label="Carregando prática" />
  }
);

export default async function PracticePage() {
  const session = await requireAuth("/practice");
  const isAdmin = session.role === "admin" && session.status === "approved";

  return <PracticeExperience isAdmin={isAdmin} />;
}
