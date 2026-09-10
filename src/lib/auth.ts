export const AUTH_COOKIE_NAME = "mr_crazy_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  user: string;
  expiresAt: number;
};

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

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToText(value: string) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));

  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createAuthToken(username: string) {
  const { secret } = getAuthCredentials();
  const payload: SessionPayload = {
    user: username,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000
  };
  const encodedPayload = textToBase64Url(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifyAuthToken(token?: string) {
  if (!token) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const { username, secret } = getAuthCredentials();
  const expectedSignature = await sign(encodedPayload, secret);
  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(base64UrlToText(encodedPayload)) as Partial<SessionPayload>;
    return payload.user === username && typeof payload.expiresAt === "number" && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function isValidLogin(username: string, password: string) {
  const credentials = getAuthCredentials();
  return username === credentials.username && password === credentials.password;
}
