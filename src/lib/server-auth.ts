import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "./auth";

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return verifyAuthToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export async function requireAuth(nextPath = "/practice") {
  if (await isAuthenticated()) return;

  const loginUrl = `/login?next=${encodeURIComponent(nextPath)}`;
  redirect(loginUrl);
}

export async function redirectAuthenticated(to = "/practice") {
  if (await isAuthenticated()) {
    redirect(to);
  }
}
