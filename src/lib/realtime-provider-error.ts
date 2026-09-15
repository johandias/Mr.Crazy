type ProviderError = { code?: string; param?: string; message?: string };

function safeText(value: unknown, secret?: string): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  let text = value;
  if (secret) text = text.replaceAll(secret, "[redacted]");
  return text
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\bsk-[\w*-]+/g, "[redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, 400);
}

export function parseRealtimeProviderError(body: string, secret?: string): ProviderError {
  try {
    const parsed = JSON.parse(body);
    const error = parsed?.error ?? parsed?.detail ?? parsed;
    if (typeof error === "string") return { message: safeText(error, secret) };
    return {
      code: safeText(error?.code ?? error?.type, secret),
      param: safeText(error?.param, secret),
      message: safeText(error?.message, secret)
    };
  } catch {
    // HTML gateway pages may contain unrelated or sensitive request information.
    return body.trimStart().startsWith("<") ? {} : { message: safeText(body, secret) };
  }
}

export function describeRealtimeProviderError(status: number, error: ProviderError) {
  const details = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  if (details.includes("insufficient_quota") || details.includes("billing") || status === 402) {
    return "A conta da API OpenAI está sem cota ou crédito disponível. O administrador precisa verificar o faturamento da API.";
  }
  if (status === 401 || details.includes("invalid_api_key")) {
    return "A OpenAI recusou a chave da API. O administrador precisa conferir OPENAI_API_KEY na Vercel.";
  }
  if (status === 429) return "O limite de chamadas da OpenAI foi atingido. Aguarde um pouco antes de reconectar.";
  if (status === 403) return "A chave da OpenAI não tem permissão para abrir esta sessão de voz.";
  if (details.includes("model_not_found") || (status === 404 && details.includes("model"))) {
    return "O modelo de voz configurado não está disponível para esta conta OpenAI.";
  }
  if (status === 400 || status === 422) return "A OpenAI recusou a configuração da sessão de voz.";
  if (status >= 500) return "O serviço de voz da OpenAI está indisponível no momento. Tente reconectar em instantes.";
  return "Não foi possível abrir a conversa em tempo real.";
}
