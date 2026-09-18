const REALTIME_MODEL_ALIASES: Record<string, string> = {
  "gpt-realtime-2.1-min": "gpt-realtime-2.1-mini",
  "gpt-realtime-21-mini": "gpt-realtime-2.1-mini",
  "gpt-realtime-2-mini": "gpt-realtime-2.1-mini"
};

const DEFAULT_REALTIME_MODEL = "gpt-realtime-2.1-mini";
const SECONDARY_REALTIME_MODEL = "gpt-realtime-2.1";

export function normalizeRealtimeModel(value: string | null | undefined) {
  const clean = value?.trim();
  if (!clean) return null;
  return REALTIME_MODEL_ALIASES[clean] ?? clean;
}

export function getConfiguredRealtimeModel() {
  return normalizeRealtimeModel(process.env.OPENAI_REALTIME_MODEL) ?? DEFAULT_REALTIME_MODEL;
}

export function getRealtimeModelCandidates(userRequestedModel?: string | null, cachedWorkingModel?: string | null) {
  const configuredModel = getConfiguredRealtimeModel();
  const preferred = normalizeRealtimeModel(userRequestedModel) ?? normalizeRealtimeModel(cachedWorkingModel) ?? configuredModel;
  const candidates = [preferred];
  if (preferred !== configuredModel) candidates.push(configuredModel);
  if (preferred === DEFAULT_REALTIME_MODEL || configuredModel === DEFAULT_REALTIME_MODEL) candidates.push(SECONDARY_REALTIME_MODEL);
  return Array.from(new Set(candidates.filter(Boolean)));
}

export function logRealtimeModelNormalization(diagnosticId: string) {
  const raw = process.env.OPENAI_REALTIME_MODEL?.trim();
  const normalized = normalizeRealtimeModel(raw);
  if (raw && normalized && raw !== normalized) {
    console.warn("[Realtime] Modelo normalizado na configuracao", { diagnosticId, from: raw, to: normalized });
  }
}
