"use client";

import type React from "react";
import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import type { VoiceState } from "@/lib/mr-crazy";
import type { RealtimeConnectionStatus } from "@/lib/realtime-client";

export type PictureInPictureManagerHandle = {
  togglePiP: () => Promise<boolean>;
  openStandalonePopup: () => void;
  isPiPActive: boolean;
  isSupported: boolean;
};

type Props = {
  voiceState: VoiceState;
  realtimeStatus: RealtimeConnectionStatus;
  currentText: string;
  microphoneEnabled: boolean;
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export const PictureInPictureManager = forwardRef<PictureInPictureManagerHandle, Props>(
  function PictureInPictureManager(
    props: Props,
    ref: React.Ref<PictureInPictureManagerHandle>
  ) {
    const { voiceState, realtimeStatus, currentText, microphoneEnabled } = props;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPiPActive, setIsPiPActive] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    const stateRef = useRef({
      voiceState,
      realtimeStatus,
      currentText,
      microphoneEnabled,
      phase: 0
    });

    stateRef.current.voiceState = voiceState;
    stateRef.current.realtimeStatus = realtimeStatus;
    stateRef.current.currentText = currentText;
    stateRef.current.microphoneEnabled = microphoneEnabled;

    useEffect(() => {
      if (typeof document === "undefined") return;
      const anyDoc = document as unknown as { pictureInPictureEnabled?: boolean };
      const anyProto = (typeof HTMLVideoElement !== "undefined" ? HTMLVideoElement.prototype : {}) as Record<string, unknown>;
      const supported =
        Boolean(anyDoc.pictureInPictureEnabled) ||
        Boolean(anyProto.webkitSupportsPresentationMode);
      setIsSupported(supported);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !isPiPActive) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let animId: number;

      const render = () => {
        stateRef.current.phase += 0.05;
        const { voiceState: vs, realtimeStatus: rs, currentText: text, phase } = stateRef.current;

        const w = canvas.width;
        const h = canvas.height;

        // Fundo Gradiente Futurista
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, "#080c16");
        bgGrad.addColorStop(0.5, "#0f172a");
        bgGrad.addColorStop(1, "#18142c");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Grid sutil
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.lineWidth = 1;
        for (let x = 20; x < w; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        // Barra de Topo
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.fillRect(0, 0, w, 36);

        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("MR. CRAZY", 14, 23);

        const isSpeaking = vs === "speaking";
        const isListening = vs === "listening" || vs === "transcribing";
        const isConnected = rs === "connected";

        let statusColor = "#94a3b8";
        let statusLabel = "STANDBY";

        if (!isConnected) {
          statusColor = "#38bdf8";
          statusLabel = rs === "connecting" ? "CONECTANDO..." : "MICROFONE PRONTO";
        } else if (isSpeaking) {
          statusColor = "#c084fc";
          statusLabel = "MR. CRAZY FALANDO";
        } else if (isListening) {
          statusColor = "#4ade80";
          statusLabel = "OUVINDO VOCÊ";
        }

        ctx.beginPath();
        const pulse = Math.sin(phase * 2) * 2;
        ctx.arc(w - 20, 18, 5 + (isSpeaking || isListening ? Math.max(0, pulse) : 0), 0, Math.PI * 2);
        ctx.fillStyle = statusColor;
        ctx.fill();

        ctx.fillStyle = statusColor;
        ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(statusLabel, w - 32, 22);

        // Avatar Central
        const cx = w / 2;
        const cy = 110;
        const avatarRadius = 38;

        if (isSpeaking || isListening) {
          const haloPulse = (Math.sin(phase * 3) + 1) / 2;
          const haloRadius = avatarRadius + 8 + haloPulse * 14;
          ctx.beginPath();
          ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
          ctx.fillStyle = isSpeaking ? "rgba(168, 85, 247, 0.22)" : "rgba(34, 197, 94, 0.22)";
          ctx.fill();
        }

        const avatarGrad = ctx.createRadialGradient(cx - 8, cy - 10, 8, cx, cy, avatarRadius);
        if (isSpeaking) {
          avatarGrad.addColorStop(0, "#c084fc");
          avatarGrad.addColorStop(1, "#6b21a8");
        } else if (isListening) {
          avatarGrad.addColorStop(0, "#86efac");
          avatarGrad.addColorStop(1, "#15803d");
        } else {
          avatarGrad.addColorStop(0, "#38bdf8");
          avatarGrad.addColorStop(1, "#0369a1");
        }

        ctx.beginPath();
        ctx.arc(cx, cy, avatarRadius, 0, Math.PI * 2);
        ctx.fillStyle = avatarGrad;
        ctx.shadowColor = isSpeaking ? "#a855f7" : isListening ? "#22c55e" : "#0284c7";
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Óculos escuros
        ctx.fillStyle = "#09090b";
        drawRoundedRect(ctx, cx - 24, cy - 10, 20, 13, 3);
        ctx.fill();
        drawRoundedRect(ctx, cx + 4, cy - 10, 20, 13, 3);
        ctx.fill();
        drawRoundedRect(ctx, cx - 5, cy - 7, 10, 3, 1);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 7);
        ctx.lineTo(cx - 10, cy - 2);
        ctx.moveTo(cx + 8, cy - 7);
        ctx.lineTo(cx + 18, cy - 2);
        ctx.stroke();

        // Boca
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        if (isSpeaking) {
          const mouthOpen = 4 + (Math.sin(phase * 6) + 1) * 3;
          ctx.ellipse(cx, cy + 14, 10, mouthOpen, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (isListening) {
          ctx.arc(cx, cy + 10, 8, 0.2, Math.PI - 0.2);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
        } else {
          ctx.arc(cx, cy + 10, 9, 0.1, Math.PI - 0.1);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
        }

        // Equalizador
        if (isSpeaking || isListening) {
          const barColor = isSpeaking ? "#e9d5ff" : "#bbf7d0";
          for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            const barX = cx + i * 18;
            const barH = 6 + Math.abs(Math.sin(phase * 4 + i)) * 18;
            ctx.fillStyle = barColor;
            drawRoundedRect(ctx, barX - 2, cy + 28, 4, barH, 2);
            ctx.fill();
          }
        }

        // Caixa de Legenda
        const boxY = 175;
        const boxH = 78;
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, 14, boxY, w - 28, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 13px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";

        const cleanText = (text || (isSpeaking ? "Ouvindo atentamente..." : "Pode falar! Estou te ouvindo.")).trim();
        const words = cleanText.split(" ");
        let line1 = "";
        let line2 = "";

        for (const word of words) {
          if ((line1 + " " + word).length <= 42) {
            line1 = (line1 + " " + word).trim();
          } else if ((line2 + " " + word).length <= 44) {
            line2 = (line2 + " " + word).trim();
          } else {
            if (!line2.endsWith("...")) line2 += "...";
          }
        }

        ctx.fillText(line1 || "Pronto para conversar em inglês!", cx, boxY + 32);
        if (line2) {
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "500 12px system-ui, -apple-system, sans-serif";
          ctx.fillText(line2, cx, boxY + 54);
        }

        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animId);
      };
    }, [isPiPActive]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const anyVideo = video as unknown as {
        addEventListener: (event: string, handler: () => void) => void;
        removeEventListener: (event: string, handler: () => void) => void;
      };

      const onEnter = () => setIsPiPActive(true);
      const onLeave = () => setIsPiPActive(false);

      anyVideo.addEventListener("enterpictureinpicture", onEnter);
      anyVideo.addEventListener("leavepictureinpicture", onLeave);

      return () => {
        anyVideo.removeEventListener("enterpictureinpicture", onEnter);
        anyVideo.removeEventListener("leavepictureinpicture", onLeave);
      };
    }, []);

    const togglePiP = useCallback(async (): Promise<boolean> => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video) return false;

      try {
        const anyDoc = document as unknown as {
          pictureInPictureElement?: Element | null;
          exitPictureInPicture?: () => Promise<unknown>;
        };

        if (anyDoc.pictureInPictureElement && anyDoc.exitPictureInPicture) {
          await anyDoc.exitPictureInPicture();
          setIsPiPActive(false);
          return false;
        }

        const anyVideo = video as unknown as {
          requestPictureInPicture?: () => Promise<unknown>;
          webkitSetPresentationMode?: (mode: string) => void;
          webkitPresentationMode?: string;
        };

        if (anyVideo.webkitPresentationMode === "picture-in-picture" && anyVideo.webkitSetPresentationMode) {
          anyVideo.webkitSetPresentationMode("inline");
          setIsPiPActive(false);
          return false;
        }

        // Se o navegador suporta captureStream do canvas (Desktop / Android), tenta associar
        if (!video.srcObject && canvas) {
          const anyCanvas = canvas as unknown as { captureStream?: (fps?: number) => MediaStream };
          try {
            if (typeof anyCanvas.captureStream === "function") {
              const stream = anyCanvas.captureStream(20);
              if (stream && stream.getVideoTracks().length > 0) {
                video.srcObject = stream;
              }
            }
          } catch {
            // Usa o fallback em video.src = "/mr-crazy-pip.mp4"
          }
        }

        // Inicia reprodução síncrona
        const playPromise = video.play();

        // 1. Safari no iPhone / iPad (WebKit): DEVE ser disparado sincronamente no gesto de toque
        if (typeof anyVideo.webkitSetPresentationMode === "function") {
          try {
            anyVideo.webkitSetPresentationMode("picture-in-picture");
            setIsPiPActive(true);
            return true;
          } catch (err) {
            console.warn("[PiP] Falha no webkitSetPresentationMode:", err);
          }
        }

        // 2. API padrão W3C (Chrome, Edge, Firefox, Android)
        if (typeof anyVideo.requestPictureInPicture === "function") {
          if (playPromise) {
            await playPromise.catch(() => {});
          }
          await anyVideo.requestPictureInPicture();
          setIsPiPActive(true);
          return true;
        }

        return false;
      } catch (err) {
        console.error("Falha ao abrir Picture-in-Picture:", err);
        return false;
      }
    }, []);

    const openStandalonePopup = useCallback(() => {
      if (typeof window === "undefined") return;

      const isMobile =
        window.innerWidth <= 768 ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");

      if (isMobile) {
        // No celular, não existem janelas flutuantes do SO via window.open; o pop-up nativo é o Picture-in-Picture!
        void togglePiP();
        return;
      }

      const url = new URL(window.location.href);
      url.searchParams.set("popup", "true");

      const width = 380;
      const height = 620;
      const left = typeof window.screen !== "undefined" ? window.screen.width - width - 24 : 100;
      const top = 80;

      const windowFeatures = [
        "width=" + width,
        "height=" + height,
        "left=" + left,
        "top=" + top,
        "menubar=no",
        "toolbar=no",
        "location=no",
        "status=no",
        "resizable=yes"
      ].join(",");

      window.open(url.toString(), "MrCrazyPopUp", windowFeatures);
    }, [togglePiP]);

    useImperativeHandle(
      ref,
      () => ({
        togglePiP,
        openStandalonePopup,
        isPiPActive,
        isSupported
      }),
      [togglePiP, openStandalonePopup, isPiPActive, isSupported]
    );

    return (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: 160,
          height: 90,
          overflow: "hidden",
          opacity: 0.01,
          pointerEvents: "none",
          zIndex: -9999
        }}
      >
        <canvas ref={canvasRef} width={480} height={270} />
        <video
          ref={videoRef}
          src="/mr-crazy-pip.mp4"
          playsInline
          muted
          loop
          preload="auto"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }
);
