import { supabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { SessionTokenPayload } from "./auth";

export type RateLimitAction = "analyze" | "speech" | "realtime";

export interface RateLimitResult {
  allowed: boolean;
  status: number;
  remaining: number;
  limit: number;
  retryAfterSeconds?: number;
  error?: string;
  code?: "OK" | "RATE_LIMIT_EXCEEDED" | "QUOTA_EXCEEDED" | "QUEUE_BUSY" | "QUEUE_TIMEOUT";
}

// Configurações de limites por ação
interface ActionLimits {
  perMinute: number;
  perDay: number;
}

const STUDENT_LIMITS: Record<RateLimitAction, ActionLimits> = {
  analyze: { perMinute: 60, perDay: 1500 },
  speech: { perMinute: 60, perDay: 1500 },
  realtime: { perMinute: 60, perDay: 1500 }
};

const ADMIN_LIMITS: Record<RateLimitAction, ActionLimits> = {
  analyze: { perMinute: 120, perDay: 10000 },
  speech: { perMinute: 120, perDay: 10000 },
  realtime: { perMinute: 120, perDay: 10000 }
};

// Armazenamento em memória de janelas deslizantes (por minuto)
const minuteWindows = new Map<string, number[]>();

// Armazenamento em memória de contagem diária (fallback e cache rápido)
const dailyUsageCache = new Map<string, { date: string; count: number }>();

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 1000));
}

// Limpeza periódica de memória para evitar vazamento
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [key, timestamps] of minuteWindows.entries()) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      minuteWindows.delete(key);
    } else {
      minuteWindows.set(key, valid);
    }
  }

  const today = getTodayString();
  for (const [key, val] of dailyUsageCache.entries()) {
    if (val.date !== today) {
      dailyUsageCache.delete(key);
    }
  }
}, 60_000).unref?.();

/**
 * Verifica limites de taxa (por minuto) e cota diária para uma ação específica
 */
export async function checkRateLimit(
  session: SessionTokenPayload,
  action: RateLimitAction
): Promise<RateLimitResult> {
  const isAdmin = session.role === "admin";
  const limits = isAdmin ? ADMIN_LIMITS[action] : STUDENT_LIMITS[action];
  const userIdentifier = session.userId || session.email;
  const now = Date.now();
  const today = getTodayString();

  // 1. Verificação de Limite por Minuto (Janela Deslizante)
  const minuteKey = `${userIdentifier}:${action}:minute`;
  const timestamps = (minuteWindows.get(minuteKey) ?? []).filter((t) => now - t < 60_000);

  if (timestamps.length >= limits.perMinute) {
    const oldest = timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + 60_000 - now) / 1000));
    return {
      allowed: false,
      status: 429,
      limit: limits.perMinute,
      remaining: 0,
      retryAfterSeconds,
      code: "RATE_LIMIT_EXCEEDED",
      error: `Calma aí! O Mr.Crazy precisa respirar um segundo. Muitas requisições em pouco tempo. Aguarde ${retryAfterSeconds}s.`
    };
  }

  // 2. Verificação de Cota Diária
  const dailyKey = `${userIdentifier}:${action}:${today}`;
  let currentDailyCount = dailyUsageCache.get(dailyKey)?.count ?? 0;

  // Se o usuário não for admin e ainda tiver quota no cache, tenta checar ou atualizar Supabase
  if (!isAdmin && isSupabaseConfigured && session.userId && session.userId !== "legacy-admin") {
    try {
      const { data } = await supabaseAdmin
        .from("mrcrazy_user_usage")
        .select("analyze_count, speech_count, realtime_count")
        .eq("user_id", session.userId)
        .eq("usage_date", today)
        .maybeSingle();

      if (data) {
        const col = `${action}_count` as "analyze_count" | "speech_count" | "realtime_count";
        const dbCount = Number(data[col]) || 0;
        currentDailyCount = Math.max(currentDailyCount, dbCount);
      }
    } catch {
      // Ignora erro de Supabase e segue com cache em memória
    }
  }

  if (currentDailyCount >= limits.perDay) {
    const retryAfter = getSecondsUntilMidnight();
    return {
      allowed: false,
      status: 429,
      limit: limits.perDay,
      remaining: 0,
      retryAfterSeconds: retryAfter,
      code: "QUOTA_EXCEEDED",
      error: "Você atingiu o limite diário de treinos para sua conta. Descanse um pouco e volte amanhã para continuar destravando o inglês!"
    };
  }

  // 3. Registrar o uso da requisição
  timestamps.push(now);
  minuteWindows.set(minuteKey, timestamps);

  const newDailyCount = currentDailyCount + 1;
  dailyUsageCache.set(dailyKey, { date: today, count: newDailyCount });

  // Incrementa no Supabase de forma assíncrona (sem travar a resposta da requisição)
  if (isSupabaseConfigured && session.userId && session.userId !== "legacy-admin") {
    void (async () => {
      try {
        const col = `${action}_count`;
        // Upsert incrementando a contagem
        const { data: existing } = await supabaseAdmin
          .from("mrcrazy_user_usage")
          .select("id, analyze_count, speech_count, realtime_count")
          .eq("user_id", session.userId)
          .eq("usage_date", today)
          .maybeSingle();

        if (existing) {
          const currentVal = Number(existing[col as keyof typeof existing]) || 0;
          await supabaseAdmin
            .from("mrcrazy_user_usage")
            .update({
              [col]: currentVal + 1,
              updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);
        } else {
          await supabaseAdmin
            .from("mrcrazy_user_usage")
            .insert({
              user_id: session.userId,
              usage_date: today,
              [col]: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      } catch (err) {
        console.warn("[rate-limiter] Erro ao salvar contagem diária:", err);
      }
    })();
  }

  return {
    allowed: true,
    status: 200,
    limit: limits.perMinute,
    remaining: Math.max(0, limits.perMinute - timestamps.length),
    code: "OK"
  };
}

// ----------------------------------------------------------------------
// CONTROLE DE FILA E CONCORRÊNCIA (SINGLE-FLIGHT MUTEX POR USUÁRIO)
// ----------------------------------------------------------------------

interface UserQueueState {
  activeCount: number;
  queue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  }>;
}

const userQueues = new Map<string, UserQueueState>();

const MAX_QUEUE_DEPTH = 2; // Máximo de requisições aguardando na fila por usuário
const DEFAULT_QUEUE_TIMEOUT_MS = 8000; // Tempo máximo de espera na fila

/**
 * Adquire uma vaga na fila de execução para o usuário.
 * Garante que apenas `maxConcurrent` requisições pesadas (ex: chamadas LLM)
 * rodem ao mesmo tempo para aquele usuário.
 *
 * Retorna uma função `release()` que DEVE ser chamada no bloco `finally`.
 */
export async function acquireUserQueueSlot(
  userIdentifier: string,
  scope = "global",
  maxConcurrent = 1,
  timeoutMs = DEFAULT_QUEUE_TIMEOUT_MS
): Promise<() => void> {
  const queueKey = `${userIdentifier}:${scope}`;

  let state = userQueues.get(queueKey);
  if (!state) {
    state = { activeCount: 0, queue: [] };
    userQueues.set(queueKey, state);
  }

  // Se há vaga imediata, executa
  if (state.activeCount < maxConcurrent) {
    state.activeCount++;
    return createReleaseFunction(queueKey);
  }

  // Se a fila já está cheia, rejeita imediatamente
  if (state.queue.length >= MAX_QUEUE_DEPTH) {
    const error = new Error("Outra mensagem já está sendo analisada. Aguarde o Mr.Crazy terminar!");
    (error as unknown as { code: string }).code = "QUEUE_BUSY";
    throw error;
  }

  // Aguarda na fila
  return new Promise<() => void>((resolve, reject) => {
    const timer = setTimeout(() => {
      // Remove da fila por timeout
      const currentState = userQueues.get(queueKey);
      if (currentState) {
        currentState.queue = currentState.queue.filter((item) => item.timer !== timer);
      }
      const timeoutError = new Error("Tempo limite de espera esgotado. Tente novamente.");
      (timeoutError as unknown as { code: string }).code = "QUEUE_TIMEOUT";
      reject(timeoutError);
    }, timeoutMs);

    state!.queue.push({
      resolve: () => {
        clearTimeout(timer);
        resolve(createReleaseFunction(queueKey));
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
      timer
    });
  });
}

function createReleaseFunction(queueKey: string): () => void {
  let released = false;
  return () => {
    if (released) return;
    released = true;

    const state = userQueues.get(queueKey);
    if (!state) return;

    if (state.queue.length > 0) {
      // Passa a vaga para o próximo da fila
      const next = state.queue.shift();
      if (next) {
        next.resolve();
        return;
      }
    }

    state.activeCount = Math.max(0, state.activeCount - 1);
    if (state.activeCount === 0 && state.queue.length === 0) {
      userQueues.delete(queueKey);
    }
  };
}
