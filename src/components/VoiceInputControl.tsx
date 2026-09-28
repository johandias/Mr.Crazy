"use client";

import type { RefObject, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff, Hand } from "lucide-react";
import type { RealtimeConnectionStatus, VoiceDiagnostic } from "@/lib/realtime-client";

export type LiveAudioVisualizer = {
  source: "user" | "crazy" | "none";
  level: number;
  bass: number;
  bands: number[];
};

type Props = {
  status: RealtimeConnectionStatus;
  enabled: boolean;
  speaking?: boolean;
  error?: string;
  diagnostics?: VoiceDiagnostic[];
  meterRef?: RefObject<HTMLMeterElement | null>;
  audioMetricsRef?: RefObject<LiveAudioVisualizer>;
  deviceId?: string;
  onDeviceChange?: (id: string) => void;
  onToggle: () => void;
  onReconnect?: () => void;
  isAwake?: boolean;
  talkMode?: "continuous" | "push-to-talk";
  onTalkModeChange?: (mode: "continuous" | "push-to-talk") => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  onHoldCancel?: () => void;
};

/** Barras de onda inline que respondem em tempo real ao som, voz e graves */
function InlineWaveBars({
  audioMetricsRef,
  active,
  speaking,
  isHolding,
  isMirrored = false,
}: {
  audioMetricsRef?: RefObject<LiveAudioVisualizer>;
  active: boolean;
  speaking: boolean;
  isHolding: boolean;
  isMirrored?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let rafId: number;
    // Pesos harmônicos: centro e graves com maior curso visual
    const weights = [0.45, 0.7, 0.95, 0.85, 1, 0.9, 1, 0.85, 0.95, 0.7, 0.5, 0.35];
    const prevHeights = new Array(12).fill(3);

    const tick = () => {
      const metrics = audioMetricsRef?.current;
      const isUser = (active || isHolding) && metrics?.source === "user";
      const isCrazy = speaking || metrics?.source === "crazy";
      const bands = metrics?.bands || [];
      const bass = metrics?.bass ?? 0;

      const container = containerRef.current;
      if (container) {
        if (isHolding) {
          container.className = "dock-wave-bars is-holding";
        } else if (isUser) {
          container.className = "dock-wave-bars is-active";
        } else if (isCrazy) {
          container.className = "dock-wave-bars is-speaking";
        } else {
          container.className = "dock-wave-bars";
        }
      }

      for (let i = 0; i < 12; i++) {
        // Se espelhado, inverte a ordem para que os graves fiquem voltados para o microfone central
        const bandIdx = isMirrored ? (11 - i) : i;
        const raw = bands[bandIdx] ?? 0;
        const weight = weights[i];

        let targetH = 3;
        if (isUser || isCrazy) {
          // Graves (bass) dão impacto dinâmico na região de graves da voz
          const isBassZone = isMirrored ? i >= 5 : i <= 6;
          const bassPunch = isBassZone ? bass * 9 * weight : bass * 3 * weight;
          targetH = Math.max(3, Math.min(22, 3 + raw * 16 * weight + bassPunch));
        }

        // Suavização física de subida ágil e descida gradual
        const prev = prevHeights[i];
        const smoothed = targetH > prev ? prev * 0.3 + targetH * 0.7 : prev * 0.72 + targetH * 0.28;
        prevHeights[i] = smoothed;

        const span = barsRef.current[i];
        if (span) {
          span.style.height = `${smoothed.toFixed(1)}px`;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, speaking, isHolding, isMirrored, audioMetricsRef]);

  return (
    <div ref={containerRef} className="dock-wave-bars">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
        />
      ))}
    </div>
  );
}

export function VoiceInputControl({
  status,
  enabled,
  speaking = false,
  onToggle,
  isAwake = true,
  talkMode = "continuous",
  onTalkModeChange,
  onHoldStart,
  onHoldEnd,
  onHoldCancel,
  meterRef,
  audioMetricsRef,
}: Props) {
  const connecting = status === "connecting";
  const isConnected = status === "connected";
  const isPtt = talkMode === "push-to-talk";

  const [isHolding, setIsHolding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const startXRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isHolding) { setHoldSeconds(0); return; }
    const t = setInterval(() => setHoldSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [isHolding]);

  const active = (isPtt ? isHolding : enabled) && isConnected;

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isPtt || connecting || !isConnected) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    startXRef.current = e.clientX;
    setIsHolding(true);
    setIsCancelling(false);
    onHoldStart?.();
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isPtt || !isHolding || startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    if (dx < -48) setIsCancelling(true);
    else if (dx > -24) setIsCancelling(false);
  };

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isPtt || !isHolding) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    const cancel = isCancelling;
    setIsHolding(false);
    setIsCancelling(false);
    startXRef.current = null;
    cancel ? onHoldCancel?.() : onHoldEnd?.();
  };

  const handlePointerCancel = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isPtt || !isHolding) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    setIsHolding(false);
    setIsCancelling(false);
    startXRef.current = null;
    onHoldCancel?.();
  };

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* ═══════════════════════════════════════════════════════════════
     MODO SEGURA-SOLTA (Push-to-Talk)
     [Botão Segurar ESQUERDA] [Ondas CENTRO] [Alternar DIREITA]
  ═══════════════════════════════════════════════════════════════ */
  if (isPtt) {
    return (
      <section className="voice-input-control clean-voice-dock" aria-label="Controle de voz">
        {/* Seletor de Modo Compacto */}
        <div className="voice-mode-selector-pill">
          <button
            type="button"
            className="voice-mode-tab-btn"
            onClick={() => onTalkModeChange?.("continuous")}
          >
            <Mic size={12} />
            <span>Toque p/ Falar</span>
          </button>
          <button
            type="button"
            className="voice-mode-tab-btn is-active"
          >
            <Hand size={12} />
            <span>Segurar (WhatsApp)</span>
          </button>
        </div>

        {isHolding && (
          <div className={`ptt-recording-pill ${isCancelling ? "is-cancelling" : ""}`}>
            <span className="ptt-rec-dot" />
            <span className="ptt-rec-timer">{fmt(holdSeconds)}</span>
            <span className="ptt-slide-hint">
              {isCancelling ? "Solte para cancelar" : "← Deslize para cancelar"}
            </span>
          </div>
        )}

        <div className="ptt-dock-row">
          {/* ESQUERDA: botão de segurar com feedback visual imediato */}
          <button
            type="button"
            className={`ptt-dock-hold-btn ${
              connecting ? "is-connecting" :
              isHolding ? (isCancelling ? "is-cancelling" : "is-recording") : "is-idle"
            }`}
            disabled={connecting}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onContextMenu={e => e.preventDefault()}
            aria-label={isHolding ? "Gravando — solte para enviar" : "Segure para falar"}
          >
            {connecting ? (
              <LoaderCircle size={18} className="connection-spinner" />
            ) : isHolding ? (
              <Radio size={18} />
            ) : (
              <Hand size={18} />
            )}
            <span className="ptt-dock-label">
              {connecting ? "Conectando..." :
               isHolding ? (isCancelling ? "Cancelar" : "Gravando...") :
               "Segure p/ Falar"}
            </span>
          </button>

          {/* CENTRO: barras de som responsivas + instrução */}
          <div className="ptt-dock-center">
            <InlineWaveBars
              audioMetricsRef={audioMetricsRef}
              active={isHolding || speaking}
              speaking={speaking}
              isHolding={isHolding}
            />
            <span className="ptt-dock-status">
              {speaking ? "Mr. Crazy falando..." :
               isHolding ? "Ouvindo você..." :
               "Segure e fale a frase"}
            </span>
          </div>
        </div>
      </section>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     MODO CONTÍNUO (Toque para Ligar / Desligar)
  ═══════════════════════════════════════════════════════════════ */
  return (
    <section className="voice-input-control clean-voice-dock" aria-label="Controle de voz">
      {/* Seletor de Modo Compacto */}
      <div className="voice-mode-selector-pill">
        <button
          type="button"
          className="voice-mode-tab-btn is-active"
        >
          <Mic size={12} />
          <span>Toque p/ Falar</span>
        </button>
        <button
          type="button"
          className="voice-mode-tab-btn"
          onClick={() => onTalkModeChange?.("push-to-talk")}
          title="Mudar para modo Segura-Solta (estilo WhatsApp)"
        >
          <Hand size={12} />
          <span>Segurar (WhatsApp)</span>
        </button>
      </div>

      <div className="mic-btn-row">
        {/* Barrinhas de som da esquerda quando ouvindo ou falando */}
        <div className="dock-wave-side-container">
          <InlineWaveBars
            audioMetricsRef={audioMetricsRef}
            active={active}
            speaking={speaking}
            isHolding={false}
            isMirrored={false}
          />
        </div>

        {/* Botão de microfone central pulsante */}
        <div
          className={`avatar-mic-halo-wrapper ${active ? "is-active" : "is-inactive"} ${
            speaking ? "is-speaking" : ""
          } ${connecting ? "is-connecting" : ""}`}
        >
          {active && (
            <>
              <span className="mic-halo-pulse-ring ring-1" aria-hidden="true" />
              <span className="mic-halo-pulse-ring ring-2" aria-hidden="true" />
            </>
          )}
          {speaking && <span className="mic-halo-pulse-ring speaking-ring" aria-hidden="true" />}
          <button
            type="button"
            className={`avatar-mic-circle-btn ${active ? "is-active" : "is-inactive"} ${
              connecting ? "is-connecting" : ""
            } ${speaking ? "is-speaking" : ""}`}
            disabled={connecting}
            aria-busy={connecting}
            aria-pressed={active}
            onContextMenu={e => e.preventDefault()}
            onClick={() => { if (!connecting) onToggle(); }}
            aria-label={connecting ? "Conectando" : active ? "Mutar microfone" : "Ativar microfone"}
          >
            {connecting ? (
              <LoaderCircle size={26} className="connection-spinner" />
            ) : active ? (
              <Mic size={26} className="mic-icon-active" />
            ) : (
              <MicOff size={24} className="mic-icon-inactive" />
            )}
          </button>
        </div>

        {/* Barrinhas de som da direita espelhadas para harmonia visual */}
        <div className="dock-wave-side-container">
          <InlineWaveBars
            audioMetricsRef={audioMetricsRef}
            active={active}
            speaking={speaking}
            isHolding={false}
            isMirrored={true}
          />
        </div>
      </div>

      {/* Instrução em destaque alto contraste para o usuário não ficar confuso */}
      <div
        className={`voice-action-badge ${active ? "is-active" : ""} ${speaking ? "is-speaking" : ""} ${connecting ? "is-connecting" : ""}`}
        role="status"
        onClick={() => { if (!connecting && !active) onToggle(); }}
      >
        <span className="voice-action-indicator-dot" />
        <span className="voice-action-text">
          {connecting ? "Conectando à IA..." :
           speaking ? "Mr. Crazy falando... aguarde" :
           active && !isAwake ? "Microfone aberto • Pode falar!" :
           active ? "Microfone aberto • Pode falar!" :
           "Toque no microfone para falar"}
        </span>
      </div>
    </section>
  );
}
