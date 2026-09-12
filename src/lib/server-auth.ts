import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  verifyAuthToken,
  findUserById,
  findUserByEmail,
  type UserProfile,
  type SessionTokenPayload
} from "./auth";

export async function getCurrentSession(): Promise<SessionTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return verifyAuthToken(token);
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  if (session.userId && session.userId !== "legacy-admin") {
    const user = await findUserById(session.userId);
    if (user) return user;
  }

  return findUserByEmail(session.email);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return Boolean(session && session.status === "approved");
}

export async function isAdmin(): Promise<boolean> {
  const session = await getCurrentSession();
  return Boolean(session && session.role === "admin" && session.status === "approved");
}

export async function requireAuth(nextPath = "/practice"): Promise<SessionTokenPayload> {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (session.status === "pending") {
    redirect("/login?pending=1");
  }

  if (session.status === "rejected") {
    redirect("/login?rejected=1");
  }

  // Se o aluno aprovado ainda não completou o onboarding de nivelamento, direciona para /onboarding
  if (
    nextPath !== "/onboarding" &&
    session.role !== "admin" &&
    !session.onboardingCompleted
  ) {
    const user = await getCurrentUser();
    if (user && !user.onboarding_completed) {
      redirect("/onboarding");
    }
  }

  return session;
}

export async function requireAdminAuth(nextPath = "/admin"): Promise<SessionTokenPayload> {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (session.role !== "admin" || session.status !== "approved") {
    redirect("/practice");
  }

  return session;
}

export async function redirectAuthenticated(to = "/practice") {
  const session = await getCurrentSession();
  if (session && session.status === "approved") {
    if (session.role === "admin") {
      redirect("/admin");
    }
    if (!session.onboardingCompleted) {
      const user = await getCurrentUser();
      if (user && !user.onboarding_completed) {
        redirect("/onboarding");
      }
    }
    redirect(to);
  }
}
