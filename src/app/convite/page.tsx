import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { LandingPage } from "@/components/landing/LandingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Convite Exclusivo | Mr.Crazy — Inglês Sem Frescura",
  description: "Você foi convidado para treinar conversação em inglês com o Mr. Crazy. Pare de travar e comece a falar de verdade."
};

export default async function ConvitePage() {
  const session = await getCurrentSession();
  const user = session && session.status === "approved" ? await getCurrentUser() : null;

  return (
    <LandingPage
      user={
        user
          ? {
              email: user.email,
              nickname: user.nickname,
              role: user.role
            }
          : null
      }
    />
  );
}
