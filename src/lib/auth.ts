export const AUTH_COOKIE_NAME = "mr_crazy_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export function getSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}

export function getAuthCredentials() {
  return {
    username: process.env.MRCRAZY_AUTH_USER ?? "admin_09",
    password: process.env.MRCRAZY_AUTH_PASSWORD ?? "",
    secret:
      process.env.MRCRAZY_AUTH_SECRET ??
      process.env.AUTH_SECRET ??
      "mr-crazy-local-session-secret-change-on-vercel"
  };
}

export function createAuthToken(username: string) {
  const { secret } = getAuthCredentials();

  return `${encodeURIComponent(username)}.${encodeURIComponent(secret)}`;
}

export function verifyAuthToken(token?: string) {
  if (!token) return false;

  const { username } = getAuthCredentials();
  return token === createAuthToken(username);
}

export function isValidLogin(username: string, password: string) {
  const credentials = getAuthCredentials();
  return username === credentials.username && password === credentials.password;
}
