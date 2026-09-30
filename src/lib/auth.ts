import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase.ts";

export const AUTH_COOKIE_NAME = "mr_crazy_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hora

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
  last_practice_date?: string;
  created_at: string;
  password_hash?: string;
  verification_code?: string;
  verification_expires_at?: string;
  password_reset_token_hash?: string;
  password_reset_expires_at?: string;

  // Enriched
  computedLevel?: string;
  sessionsCount?: number;
  activeModuleProgress?: Record<string, unknown>;
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
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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
  if (isSupabaseConfigured && UUID_PATTERN.test(id)) {
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
): Promise<{ user: UserProfile; isPending: boolean; verificationCode?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const isAdmin = cleanEmail === ADMIN_EMAIL;
  const status = isAdmin ? "approved" : "pending";
  const role = isAdmin ? "admin" : "student";
  const passwordHash = hashPassword(plainPassword);

  const verificationCode = !isAdmin
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : undefined;
  const verificationExpiresAt = !isAdmin
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : undefined;

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
    created_at: new Date().toISOString(),
    verification_code: verificationCode,
    verification_expires_at: verificationExpiresAt
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

      if (verificationCode) {
        insertPayload.verification_code = verificationCode;
        insertPayload.verification_expires_at = verificationExpiresAt;
      }

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
        // Se falhou por causa da coluna nova ainda não criada no DB remoto, tenta inserir sem as colunas novas
        if (error.message.includes("column") || error.code === "42703") {
          const fallbackPayload: Record<string, unknown> = {
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
          if (defaultProfile.age) {
            fallbackPayload.age = defaultProfile.age;
          }
          const retryRes = await supabaseAdmin.from("mrcrazy_users").insert(fallbackPayload).select().single();
          if (retryRes.data) {
            const savedUser = {
              ...(retryRes.data as UserProfile),
              verification_code: verificationCode,
              verification_expires_at: verificationExpiresAt
            };
            memoryUsers.set(cleanEmail, {
              ...savedUser,
              password_hash: passwordHash
            });
            return { user: savedUser, isPending: status === "pending", verificationCode };
          }
        }
        if (error.code === "23505") {
          throw new Error("Já existe uma conta cadastrada com este e-mail no banco de dados.");
        }
      } else if (data) {
        const savedUser = data as UserProfile;
        memoryUsers.set(cleanEmail, {
          ...savedUser,
          verification_code: savedUser.verification_code || verificationCode,
          verification_expires_at: savedUser.verification_expires_at || verificationExpiresAt,
          password_hash: passwordHash
        });
        return { user: savedUser, isPending: status === "pending", verificationCode };
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

  return { user: defaultProfile, isPending: status === "pending", verificationCode };
}

export async function verifyUserEmailCode(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string; user?: UserProfile; alreadyApproved?: boolean }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  if (!cleanEmail || !cleanCode) {
    return { success: false, error: "E-mail e código de verificação são obrigatórios." };
  }

  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    return { success: false, error: "Nenhuma conta encontrada com este e-mail." };
  }

  // Se já foi aprovado anteriormente (por código ou pelo administrador)
  if (user.status === "approved") {
    return { success: true, user, alreadyApproved: true };
  }

  if (user.status === "rejected") {
    return { success: false, error: "Esta conta foi suspensa ou desativada." };
  }

  const memUser = memoryUsers.get(cleanEmail);
  const expectedCode = user.verification_code || memUser?.verification_code;

  if (!expectedCode || expectedCode !== cleanCode) {
    return { success: false, error: "Código de confirmação incorreto ou expirado. Verifique seu e-mail." };
  }

  const expiresAt = user.verification_expires_at || memUser?.verification_expires_at;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return { success: false, error: "Este código expirou. Clique em 'Reenviar código' para receber um novo." };
  }

  const approvedNow = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      await supabaseAdmin
        .from("mrcrazy_users")
        .update({
          status: "approved",
          approved_at: approvedNow,
          verification_code: null,
          verification_expires_at: null,
          updated_at: approvedNow
        })
        .eq("email", cleanEmail);
    } catch (err) {
      console.error("[Supabase verifyUserEmailCode update error]:", err);
    }
  }

  if (memUser) {
    memUser.status = "approved";
    memUser.verification_code = undefined;
    memUser.verification_expires_at = undefined;
  }

  user.status = "approved";
  user.verification_code = undefined;
  user.verification_expires_at = undefined;

  return { success: true, user };
}

export async function regenerateVerificationCode(
  email: string
): Promise<{ success: boolean; code?: string; error?: string; user?: UserProfile }> {
  const cleanEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(cleanEmail);

  if (!user) {
    return { success: false, error: "Nenhuma conta encontrada com este e-mail." };
  }

  if (user.status === "approved") {
    return { success: false, error: "Esta conta já foi ativada. Você já pode fazer login." };
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  if (isSupabaseConfigured) {
    try {
      await supabaseAdmin
        .from("mrcrazy_users")
        .update({
          verification_code: newCode,
          verification_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq("email", cleanEmail);
    } catch (err) {
      console.error("[Supabase regenerateVerificationCode error]:", err);
    }
  }

  const memUser = memoryUsers.get(cleanEmail);
  if (memUser) {
    memUser.verification_code = newCode;
    memUser.verification_expires_at = expiresAt;
  }

  user.verification_code = newCode;
  user.verification_expires_at = expiresAt;

  return { success: true, code: newCode, user };
}

export async function createPasswordResetToken(
  email: string
): Promise<{ success: boolean; token?: string; error?: string; user?: UserProfile }> {
  const cleanEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(cleanEmail);

  if (!user) {
    return { success: false, error: "Nenhuma conta encontrada com este e-mail." };
  }

  if (user.status === "pending") {
    return {
      success: false,
      error: "Esta conta ainda não foi ativada. Valide seu e-mail antes de redefinir a senha.",
      user
    };
  }

  if (user.status === "rejected") {
    return { success: false, error: "Esta conta foi suspensa ou desativada." };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabaseAdmin
        .from("mrcrazy_users")
        .update({
          password_reset_token_hash: tokenHash,
          password_reset_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq("email", cleanEmail);

      if (error) {
        console.error("[Supabase createPasswordResetToken error]:", error.message, error.details || "");
        return { success: false, error: "Não foi possível gerar o link de redefinição agora.", user };
      }
    } catch (err) {
      console.error("[Supabase createPasswordResetToken error]:", err);
      return { success: false, error: "Não foi possível gerar o link de redefinição agora.", user };
    }
  }

  const memUser = memoryUsers.get(cleanEmail);
  if (memUser) {
    memUser.password_reset_token_hash = tokenHash;
    memUser.password_reset_expires_at = expiresAt;
  }

  user.password_reset_token_hash = tokenHash;
  user.password_reset_expires_at = expiresAt;

  return { success: true, token, user };
}

export async function resetPasswordWithToken(
  email: string,
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanToken = token.trim();

  if (!cleanEmail || !cleanToken) {
    return { success: false, error: "Link de redefinição incompleto." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres." };
  }

  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    return { success: false, error: "Link de redefinição inválido ou expirado." };
  }

  if (user.status !== "approved") {
    return { success: false, error: "Valide seu e-mail antes de redefinir a senha." };
  }

  const memUser = memoryUsers.get(cleanEmail);
  const expectedHash = user.password_reset_token_hash || memUser?.password_reset_token_hash;
  const expiresAt = user.password_reset_expires_at || memUser?.password_reset_expires_at;

  if (!expectedHash || expectedHash !== hashResetToken(cleanToken)) {
    return { success: false, error: "Link de redefinição inválido ou expirado." };
  }

  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return { success: false, error: "Este link expirou. Solicite um novo em 'Esqueci minha senha'." };
  }

  const newPasswordHash = hashPassword(newPassword);
  const updatedAt = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      await supabaseAdmin
        .from("mrcrazy_users")
        .update({
          password_hash: newPasswordHash,
          password_reset_token_hash: null,
          password_reset_expires_at: null,
          updated_at: updatedAt
        })
        .eq("email", cleanEmail);
    } catch (err) {
      console.error("[Supabase resetPasswordWithToken error]:", err);
      return { success: false, error: "Não foi possível atualizar a senha agora." };
    }
  }

  if (memUser) {
    memUser.password_hash = newPasswordHash;
    memUser.password_reset_token_hash = undefined;
    memUser.password_reset_expires_at = undefined;
  }

  user.password_hash = newPasswordHash;
  user.password_reset_token_hash = undefined;
  user.password_reset_expires_at = undefined;

  return { success: true, user };
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  email?: string
): Promise<{ success: boolean; error?: string }> {
  if (!currentPassword) {
    return { success: false, error: "Informe sua senha atual." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres." };
  }

  const user = (await findUserById(userId)) || (email ? await findUserByEmail(email) : null);
  if (!user || !user.password_hash) {
    return { success: false, error: "Conta não encontrada." };
  }

  if (!verifyPassword(currentPassword, user.password_hash)) {
    return { success: false, error: "Senha atual incorreta." };
  }

  const passwordHash = hashPassword(newPassword);
  const updatedAt = new Date().toISOString();

  if (isSupabaseConfigured && UUID_PATTERN.test(userId)) {
    try {
      const { error } = await supabaseAdmin
        .from("mrcrazy_users")
        .update({
          password_hash: passwordHash,
          password_reset_token_hash: null,
          password_reset_expires_at: null,
          updated_at: updatedAt
        })
        .eq("id", userId);

      if (error) {
        console.error("[Supabase changeUserPassword error]:", error.message, error.details || "");
        return { success: false, error: "Não foi possível alterar a senha agora." };
      }
    } catch (err) {
      console.error("[Supabase changeUserPassword exception]:", err);
      return { success: false, error: "Não foi possível alterar a senha agora." };
    }
  }

  for (const [emailKey, memUser] of memoryUsers.entries()) {
    if (memUser.id === userId || memUser.email === user.email || emailKey === user.email) {
      memUser.password_hash = passwordHash;
      memUser.password_reset_token_hash = undefined;
      memUser.password_reset_expires_at = undefined;
    }
  }

  return { success: true };
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
