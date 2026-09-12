import { redirect } from "next/navigation";
import { requireAuth, getCurrentUser } from "@/lib/server-auth";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import type { UserProfile } from "@/lib/auth";

export default async function OnboardingPage() {
  const session = await requireAuth("/onboarding");
  const user = await getCurrentUser();

  // Se o usuário já concluiu o onboarding anteriormente, manda direto para a prática
  if (user?.onboarding_completed) {
    redirect("/practice");
  }

  const fallbackUser: UserProfile = user ?? {
    id: session.userId,
    email: session.email,
    role: session.role,
    status: session.status,
    nickname: session.email.split("@")[0],
    gender: "masculino",
    learning_level: "basic",
    self_assessed_level: "Iniciante",
    learning_style: "Conversação prática",
    main_difficulties: [],
    practice_time_seconds: 0,
    evolution_score: 0,
    xp: 0,
    streak_days: 1,
    created_at: new Date().toISOString()
  };

  return (
    <main className="simple-page onboarding-page-layout">
      <OnboardingFlow user={fallbackUser} />
    </main>
  );
}
