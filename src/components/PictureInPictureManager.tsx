"use client";

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import type { VoiceState } from "@/lib/speech-service";
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

export const PictureInPictureManager = forwardRef<PictureInPictureManagerHandle, Props>(
  function PictureInPictureManager(
    { voiceState, realtimeStatus, currentText, microphoneEnabled },
    ref
  ) {
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
      const supported =
        ("pictureInPictureEnabled" in document && Boolean(document.pictureInPictureEnabled)) ||
        ("webkitSupportsPresentationMode" in HTMLVideoElement.prototype);
      setIsSupported(supported);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let animId: number;

      const render = () => {
        stateRef.current.phase += 0.05;
        const { voiceState: vs, realtimeStatus: rs, currentText: text, phase } = stateRef.current;

        const w = canvas.width;
        const h = canvas.height;

        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, "#080c16");
        bgGrad.addColorStop(0.5, "#0f172a");
        bgGrad.addColorStop(1, "#18142c");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.lineWidth = 1;
        for (let x = 20; x < w; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

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

        ctx.fillStyle = "#09090b";
        ctx.beginPath();
        ctx.roundRect(cx - 24, cy - 10, 20, 13, 3);
        ctx.roundRect(cx + 4, cy - 10, 20, 13, 3);
        ctx.roundRect(cx - 5, cy - 7, 10, 3, 1);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 7);
        ctx.lineTo(cx - 10, cy - 2);
        ctx.moveTo(cx + 8, cy - 7);
        ctx.lineTo(cx + 18, cy - 2);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        if (isSpeaking) {
          const mouthOpen = 4 + (Math.sin(phase * 6) + 1) * 3;
          ctx.ellipse(cx, cy + 14, 10, mouthOpen, 0, 0, Math.PI * 2);
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
        if (isSpeaking) ctx.fill();

        if (isSpeaking || isListening) {
          const barColor = isSpeaking ? "#e9d5ff" : "#bbf7d0";
          for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            const barX = cx + i * 18;
            const barH = 6 + Math.abs(Math.sin(phase * 4 + i)) * 18;
            ctx.fillStyle = barColor;
            ctx.beginPath();
            ctx.roundRect(barX - 2, cy + 28, 4, barH, 2);
            ctx.fill();
          }
        }

        const boxY = 175;
        const boxH = 78;
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(14, boxY, w - 28, boxH, 8);
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
    }, []);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const onEnter = () => setIsPiPActive(true);
      const onLeave = () => setIsPiPActive(false);

      video.addEventListener("enterpictureinpicture", onEnter);
      video.addEventListener("leavepictureinpicture", onLeave);

      return () => {
        video.removeEventListener("enterpictureinpicture", onEnter);
        video.removeEventListener("leavepictureinpicture", onLeave);
      };
    }, []);

    const togglePiP = useCallback(async (): Promise<boolean> => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return false;

      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPiPActive(false);
          return false;
        }

        if (!video.srcObject) {
          const stream = canvas.captureStream(24);
          video.srcObject = stream;
        }

        await video.play();

        if (video.requestPictureInPicture) {
          await video.requestPictureInPicture();
          setIsPiPActive(true);
          return true;
        }

        if ("webkitSetPresentationMode" in video) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (video as any).webkitSetPresentationMode("picture-in-picture");
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
      const url = new URL(window.location.href);
      url.searchParams.set("popup", "true");

      const width = 380;
      const height = 620;
      const left = window.screen.width - width - 24;
      const top = 80;

      window.open(
        url.toString(),
        "MrCrazyPopUp",
        width=,height=,left=,top=,menubar=no,toolbar=no,location=no,status=no,resizable=yes
      );
    }, []);

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
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
        <canvas ref={canvasRef} width={480} height={270} />
        <video ref={videoRef} playsInline muted autoPlay />
      </div>
    );
  }
);
