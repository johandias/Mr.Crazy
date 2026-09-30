import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { LandingPage } from "@/components/landing/LandingPage";

export const dynamic = "force-dynamic";

export default async function Home() {
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
