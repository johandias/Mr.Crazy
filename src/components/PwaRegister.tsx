"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    // Quando o novo Service Worker assumir o controle, recarrega a página automaticamente
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;

      // Proteção: não reinicia se o usuário estiver ativamente falando no microfone
      const isVoiceActive =
        document.querySelector(".avatar-mic-btn.listening") !== null ||
        document.querySelector(".avatar-mic-btn.active") !== null;

      if (!isVoiceActive) {
        refreshing = true;
        window.location.reload();
      } else {
        // Se estiver em chamada, agenda o reload assim que a chamada parar
        const checkCallEnd = setInterval(() => {
          const stillActive =
            document.querySelector(".avatar-mic-btn.listening") !== null ||
            document.querySelector(".avatar-mic-btn.active") !== null;
          if (!stillActive) {
            clearInterval(checkCallEnd);
            refreshing = true;
            window.location.reload();
          }
        }, 3000);
      }
    });

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        // Checagem imediata por nova versão
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Nova versão baixada! Avisa o worker para ativar agora
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // Checa novas versões a cada 5 minutos automaticamente em segundo plano
        const updateInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 5 * 60 * 1000);

        // Checa nova versão toda vez que o usuário reabre ou foca no app
        const handleVisibility = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
          clearInterval(updateInterval);
          document.removeEventListener("visibilitychange", handleVisibility);
        };
      } catch {
        // Falha silenciosa em ambientes não PWA
      }
    };

    if (document.readyState === "complete") {
      registerWorker();
    } else {
      window.addEventListener("load", registerWorker, { once: true });
    }
  }, []);

  return null;
}
