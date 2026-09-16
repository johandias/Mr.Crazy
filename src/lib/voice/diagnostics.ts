export type VoiceStage = "microphone" | "offer" | "api" | "transport" | "listening" | "response" | "playback";
export type VoiceDiagnostic = {
  id: string;
  stage: VoiceStage;
  code: string;
  message: string;
  elapsedMs: number;
  httpStatus?: number;
  providerStatus?: number;
  providerCode?: string;
  providerMessage?: string;
  providerParam?: string;
  model?: string;
  serverId?: string;
};

export class VoiceError extends Error {
  readonly code: string;
  readonly details: Partial<VoiceDiagnostic>;
  constructor(code: string, message: string, details: Partial<VoiceDiagnostic> = {}) {
    super(message);
    this.name = "VoiceError";
    this.code = code;
    this.details = details;
  }
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function getConnectionError(error: unknown): string {
  if (error instanceof VoiceError) return error.message;
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Permita o microfone nos ajustes deste site e tente novamente.";
  if (name === "NotFoundError") return "Nenhum microfone encontrado. Conecte um dispositivo de entrada.";
  if (name === "OverconstrainedError") return "O microfone selecionado não está disponível. Escolha outra entrada.";
  if (name === "NotReadableError") return "O navegador não conseguiu abrir o microfone. Verifique se outro aplicativo está usando o dispositivo.";
  if (name === "AbortError") return "Conexão cancelada.";
  return "A conexão de voz falhou. Consulte o diagnóstico e tente reconectar.";
}

export function waitFor<T>(operation: Promise<T>, signal: AbortSignal, ms: number, code: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => finish(signal.reason ?? new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(() => finish(new VoiceError(code, "Esta etapa da conexão demorou demais. Tente novamente.")), ms);
    const finish = (error?: unknown, value?: T) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve(value as T);
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    operation.then(value => finish(undefined, value), finish);
  });
}
