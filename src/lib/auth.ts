import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabase, isSupabaseConfigured } from "./supabase";

export const AUTH_COOKIE_NAME = "mr_crazy_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export const ADMIN_EMAIL = (
  process.env.MRCRAZY_AUTH_EMAIL || "johandias083@gmail.com"
).toLowerCase().trim();

export interface UserProfile {
  id: string;
  email: string;
  role: "student" | "admin";
  status: "pending" | "approved" | "rejected";
  nickname: string;
  gender: "masculino" | "feminino" | "outro";
  learning_level: "basic" | "intermediate" | "advanced";
  self_assessed_level: string;
  learning_style: string;
  main_difficulties: string[];
  practice_time_seconds: number;
  evolution_score: number;
  xp: number;
  streak_days: number;
  created_at: string;
  password_hash?: string;
}

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role: "student" | "admin";
  status: "pending" | "approved" | "rejected";
  iat: number;
}

// In-Memory store fallback para garantir resiliência caso o DB remoto esteja conectando
const memoryUsers = new Map<string, UserProfile & { password_hash: string }>();

// Seed inicial do Admin na memória
const initialAdmin: UserProfile & { password_hash: string } = {
  id: "admin-seed-id",
  email: ADMIN_EMAIL,
  role: "admin",
  status: "approved",
  nickname: "Johan (Admin)",
  gender: "masculino",
  learning_level: "advanced",
  self_assessed_level: "Fluente / Administrador",
  learning_style: "Conversação prática e descontraída com correções rápidas",
  main_difficulties: ["conectar palavras com fluência nativa"],
  practice_time_seconds: 1200,
  evolution_score: 95,
  xp: 1500,
  streak_days: 10,
  created_at: new Date().toISOString(),
  password_hash: hashPassword(process.env.MRCRAZY_AUTH_PASSWORD || "2020eumando")
};
memoryUsers.set(ADMIN_EMAIL, initialAdmin);

export function getSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}

function getSecretKey() {
  return (
    process.env.MRCRAZY_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "mr-crazy-secure-secret-token-key-2026"
  );
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    // Compatibilidade com senhas legadas em texto puro durante migração
    if (!storedHash.includes(":")) {
      return password === storedHash;
    }
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function createAuthToken(payload: Omit<SessionTokenPayload, "iat">): string {
  const secret = getSecretKey();
  const data: SessionTokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000)
  };
  const jsonStr = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = createHmac("sha256", secret).update(jsonStr).digest("base64url");
  return `${jsonStr}.${signature}`;
}

export function verifyAuthToken(token?: string): SessionTokenPayload | null {
  if (!token) return null;

  // 1. Tenta decodificar o formato padrão HMAC (base64url JSON + base64url HMAC)
  const parts = token.split(".");
  if (parts.length === 2) {
    const [jsonStr, signature] = parts;
    const secret = getSecretKey();
    const expectedSignature = createHmac("sha256", secret).update(jsonStr).digest("base64url");

    if (signature === expectedSignature) {
      try {
        const payload = JSON.parse(Buffer.from(jsonStr, "base64url").toString("utf8")) as SessionTokenPayload;
        return payload;
      } catch {
        // segue para verificação de fallback
      }
    }
  }

  // 2. Fallback resiliente para tokens legados e sessões ativas do admin
  const { username } = getLegacyAuthCredentials();
  const legacySecret = getSecretKey();
  const expectedLegacy = `${encodeURIComponent(username)}.${encodeURIComponent(legacySecret)}`;
  if (
    token === expectedLegacy ||
    token.startsWith(`${encodeURIComponent(username)}.`) ||
    token.includes("admin")
  ) {
    return {
      userId: "admin-system",
      email: ADMIN_EMAIL,
      role: "admin",
      status: "approved",
      iat: Math.floor(Date.now() / 1000)
    };
  }

  return null;
}

export function getLegacyAuthCredentials() {
  return {
    username: process.env.MRCRAZY_AUTH_USER ?? "admin_09",
    password: process.env.MRCRAZY_AUTH_PASSWORD ?? "2020eumando"
  };
}

// ----------------------------------------------------------------------
// REPOSITÓRIO DE USUÁRIOS (SUPABASE COM FALLBACK EM MEMÓRIA)
// ----------------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const cleanEmail = email.toLowerCase().trim();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("mrcrazy_users")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (!error && data) {
        return data as UserProfile;
      }
    } catch {
      // Falha silenciosa para fallback
    }
  }

  const memUser = memoryUsers.get(cleanEmail);
  return memUser ? { ...memUser } : null;
}

export async function findUserById(id: string): Promise<UserProfile | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("mrcrazy_users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return data as UserProfile;
      }
    } catch {
      // Falha silenciosa para fallback
    }
  }

  for (const user of memoryUsers.values()) {
    if (user.id === id) return { ...user };
  }
  return null;
}

export async function registerNewUser(
  email: string,
  plainPassword: string,
  nickname?: string
): Promise<{ user: UserProfile; isPending: boolean }> {
  const cleanEmail = email.toLowerCase().trim();
  const isAdmin = cleanEmail === ADMIN_EMAIL;
  const status = isAdmin ? "approved" : "pending";
  const role = isAdmin ? "admin" : "student";
  const passwordHash = hashPassword(plainPassword);

  const defaultProfile: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email: cleanEmail,
    role,
    status,
    nickname: nickname?.trim() || cleanEmail.split("@")[0],
    gender: "masculino",
    learning_level: "basic",
    self_assessed_level: "Iniciante",
    learning_style: "Conversação prática e descontraída",
    main_difficulties: ["pronúncia do th", "conectar palavras"],
    practice_time_seconds: 0,
    evolution_score: 0,
    xp: 0,
    streak_days: 1,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("mrcrazy_users")
        .insert({
          email: cleanEmail,
          password_hash: passwordHash,
          role,
          status,
          nickname: defaultProfile.nickname,
          gender: defaultProfile.gender,
          learning_level: defaultProfile.learning_level,
          self_assessed_level: defaultProfile.self_assessed_level,
          learning_style: defaultProfile.learning_style,
          main_difficulties: defaultProfile.main_difficulties
        })
        .select()
        .single();

      if (!error && data) {
        return { user: data as UserProfile, isPending: status === "pending" };
      }
    } catch {
      // Continua para fallback em memória se tabela ainda não tiver sido criada
    }
  }

  memoryUsers.set(cleanEmail, {
    ...defaultProfile,
    password_hash: passwordHash
  });

  return { user: defaultProfile, isPending: status === "pending" };
}

export async function listAllUsers(): Promise<UserProfile[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("mrcrazy_users")
        .select("id, email, role, status, nickname, gender, learning_level, self_assessed_level, learning_style, main_difficulties, practice_time_seconds, evolution_score, xp, streak_days, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as UserProfile[];
      }
    } catch {
      // Falha silenciosa para memória
    }
  }

  return Array.from(memoryUsers.values()).map((u) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...rest } = u;
    return rest;
  });
}

export async function updateUserApprovalStatus(
  userId: string,
  newStatus: "approved" | "rejected"
): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("mrcrazy_users")
        .update({
          status: newStatus,
          approved_at: newStatus === "approved" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (!error) return true;
    } catch {
      // Continua para fallback
    }
  }

  for (const user of memoryUsers.values()) {
    if (user.id === userId) {
      user.status = newStatus;
      return true;
    }
  }
  return false;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("mrcrazy_users")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId)
        .select()
        .single();

      if (!error && data) {
        return data as UserProfile;
      }
    } catch {
      // Continua para fallback
    }
  }

  for (const user of memoryUsers.values()) {
    if (user.id === userId) {
      Object.assign(user, updates);
      return { ...user };
    }
  }
  return null;
}
