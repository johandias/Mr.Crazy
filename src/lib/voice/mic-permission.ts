/**
 * Utilitário de persistência de permissão de microfone.
 *
 * A Permissions API permite verificar se o usuário já concedeu acesso ao microfone
 * sem disparar uma nova janela de permissão do navegador. Isso funciona em:
 *   - Chrome/Edge (desktop e Android)
 *   - Safari iOS 16.4+ (com suporte parcial)
 *   - Firefox (desktop)
 *
 * Para Safari iOS < 16.4, onde a Permissions API pode não existir ou retornar
 * "prompt" mesmo depois de concedida, usamos um fallback via localStorage que é
 * gravado assim que o usuário concede manualmente.
 *
 * Invariante preservada: o microfone NUNCA captura áudio sem o usuário tocar
 * no botão. A verificação aqui apenas elimina o pop-up nativo do navegador
 * (que já foi respondido antes), sem ativar automaticamente a captura.
 */

const STORAGE_KEY = "mr-crazy-mic-granted";

/**
 * Tenta verificar via Permissions API se o microfone já foi permitido.
 * Retorna "granted" | "denied" | "prompt" | "unknown".
 */
async function queryPermissionState(): Promise<PermissionState | "unknown"> {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return result.state;
  } catch {
    // Firefox e alguns browsers lançam erro para "microphone"
    return "unknown";
  }
}

/**
 * Retorna true se o microfone já foi permitido pelo usuário em sessões anteriores,
 * seja via Permissions API ou via flag salvo no localStorage.
 *
 * NÃO abre a janela de permissão — apenas consulta o estado existente.
 */
export async function isMicrophoneAlreadyGranted(): Promise<boolean> {
  // 1. Verifica flag salva localmente (mais rápido, funciona em iOS antigo)
  try {
    if (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1") {
      // Valida ainda via Permissions API para não confiar em dados stale
      const state = await queryPermissionState();
      if (state === "denied") {
        // Permissão foi revogada pelo usuário no sistema — limpa o cache
        window.localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      // "granted", "prompt" (iOS retorna prompt mesmo após grant) ou "unknown"
      return true;
    }
  } catch {
    // localStorage indisponível
  }

  // 2. Verifica diretamente via Permissions API
  const state = await queryPermissionState();
  if (state === "granted") {
    markMicrophoneGranted();
    return true;
  }

  return false;
}

/**
 * Marca no localStorage que o microfone foi concedido pelo usuário.
 * Deve ser chamado imediatamente após getUserMedia() resolver com sucesso.
 */
export function markMicrophoneGranted(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
  } catch {
    // localStorage bloqueado (modo privado iOS)
  }
}

/**
 * Limpa o cache de permissão (usar quando o usuário revoga manualmente).
 */
export function clearMicrophoneGranted(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}
