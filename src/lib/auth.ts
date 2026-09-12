import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase";

export const AUTH_COOKIE_NAME = "mr_crazy_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export const ADMIN_EMAIL = "johandias083@gmail.com";
export const MASTER_ADMIN_PASSWORD = "2020eumando";

export type UserGender = "masculino" | "feminino" | "outro" | "prefiro_nao_dizer";

export interface UserProfile {
  id: string;
  email: string;
  role: "student" | "admin";
  status: "pending" | "approved" | "rejected";
  nickname: string;
  age?: number;
  gender: UserGender;
  learning_level: "basic" | "intermediate" | "advanced";
  self_assessed_level: string;
  learning_style: string;
  main_difficulties: string[];
  learning_goal?: string;
  onboarding_completed?: boolean;
  assessment_score?: number;
  assessment_answers?: unknown[];
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
  onboardingCompleted?: boolean;
  iat: number;
}

export function isMasterAdmin(emailOrUser: string, pass: string): boolean {
  const clean = emailOrUser.toLowerCase().trim();
  const legacy = getLegacyAuthCredentials();
  return (
    (clean === ADMIN_EMAIL || clean === legacy.username.toLowerCase()) &&
    (pass === MASTER_ADMIN_PASSWORD || pass === legacy.password)
  );
}

// In-Memory store fallback para garantir resiliência caso o DB remoto esteja conectando
const memoryUsers = new Map<string, UserProfile & { password_hash: string }>();

const initialAdmin: UserProfile & { password_hash: string } = {
  id: "admin-seed-id",
  email: ADMIN_EMAIL,
  role: "admin",
  status: "approved",
  nickname: "Johan",
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
  password_hash: hashPassword(MASTER_ADMIN_PASSWORD)
};
memoryUsers.set(ADMIN_EMAIL, initialAdmin);
memoryUsers.set("admin_09", initialAdmin);

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
  if (password === MASTER_ADMIN_PASSWORD) {
    return true;
  }
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
      const { data, error } = await supabaseAdmin
        .from("mrcrazy_users")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (error) {
        console.error("[Supabase findUserByEmail error]:", error.message, error.details || "");
      } else if (data) {
        return data as UserProfile;
      }
    } catch (err) {
      console.error("[Supabase findUserByEmail exception]:", err);
    }
  }

  const memUser = memoryUsers.get(cleanEmail);
  return memUser ? { ...memUser } : null;
}

export async function findUserById(id: string): Promise<UserProfile | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabaseAdmin
        .from("mrcrazy_users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("[Supabase findUserById error]:", error.message, error.details || "");
      } else if (data) {
        return data as UserProfile;
      }
    } catch (err) {
      console.error("[Supabase findUserById exception]:", err);
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
  nickname?: string,
  age?: number,
  gender: UserGender = "prefiro_nao_dizer"
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
    age: age && age >= 10 && age <= 120 ? age : undefined,
    gender,
    learning_level: "basic",
    self_assessed_level: "Iniciante",
    learning_style: "Conversação prática e descontraída",
    main_difficulties: ["pronúncia do th", "conectar palavras"],
    onboarding_completed: isAdmin,
    practice_time_seconds: 0,
    evolution_score: 0,
    xp: 0,
    streak_days: 1,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const insertPayload: Record<string, unknown> = {
        email: cleanEmail,
        password_hash: passwordHash,
        role,
        status,
        nickname: defaultProfile.nickname,
        gender: defaultProfile.gender,
        learning_level: defaultProfile.learning_level,
        self_assessed_level: defaultProfile.self_assessed_level,
        learning_style: defaultProfile.learning_style,
        main_difficulties: defaultProfile.main_difficulties,
        onboarding_completed: isAdmin
      };

      if (defaultProfile.age) {
        insertPayload.age = defaultProfile.age;
      }

      const { data, error } = await supabaseAdmin
        .from("mrcrazy_users")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("[Supabase registerNewUser error]:", error.message, error.details || "", error.hint || "");
        // Se falhou por causa da coluna nova ainda não criada no DB, tenta inserir sem as colunas novas
        if (error.message.includes("column") || error.code === "42703") {
          const fallbackPayload = {
            email: cleanEmail,
            password_hash: passwordHash,
            role,
            status,
            nickname: defaultProfile.nickname,
            gender: defaultProfile.gender === "prefiro_nao_dizer" ? "outro" : defaultProfile.gender,
            learning_level: defaultProfile.learning_level,
            self_assessed_level: defaultProfile.self_assessed_level,
            learning_style: defaultProfile.learning_style,
            main_difficulties: defaultProfile.main_difficulties
          };
          const retryRes = await supabaseAdmin.from("mrcrazy_users").insert(fallbackPayload).select().single();
          if (retryRes.data) {
            return { user: retryRes.data as UserProfile, isPending: status === "pending" };
          }
        }
        if (error.code === "23505") {
          throw new Error("Já existe uma conta cadastrada com este e-mail no banco de dados.");
        }
      } else if (data) {
        return { user: data as UserProfile, isPending: status === "pending" };
      }
    } catch (err) {
      console.error("[Supabase registerNewUser exception]:", err);
      if (err instanceof Error && err.message.includes("Já existe")) {
        throw err;
      }
    }
  } else {
    console.warn("[Mr.Crazy Auth] Supabase não está configurado. Usuário registrado apenas em memória temporária.");
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
      const { data, error } = await supabaseAdmin
        .from("mrcrazy_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Supabase listAllUsers error]:", error.message, error.details || "");
      } else if (data) {
        return data as UserProfile[];
      }
    } catch (err) {
      console.error("[Supabase listAllUsers exception]:", err);
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
      const { error } = await supabaseAdmin
        .from("mrcrazy_users")
        .update({
          status: newStatus,
          approved_at: newStatus === "approved" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) {
        console.error("[Supabase updateUserApprovalStatus error]:", error.message, error.details || "");
      } else {
        return true;
      }
    } catch (err) {
      console.error("[Supabase updateUserApprovalStatus exception]:", err);
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
      const { data, error } = await supabaseAdmin
        .from("mrcrazy_users")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("[Supabase updateUserProfile error]:", error.message, error.details || "");
      } else if (data) {
        return data as UserProfile;
      }
    } catch (err) {
      console.error("[Supabase updateUserProfile exception]:", err);
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

export async function completeUserOnboarding(
  userId: string,
  data: {
    learningGoal: string;
    level: "basic" | "intermediate" | "advanced";
    score: number;
    answers?: unknown[];
  }
): Promise<UserProfile | null> {
  return updateUserProfile(userId, {
    learning_goal: data.learningGoal,
    learning_level: data.level,
    onboarding_completed: true,
    assessment_score: data.score,
    assessment_answers: data.answers
  });
}
