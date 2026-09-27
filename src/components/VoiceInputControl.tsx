"use client";

import type { RefObject, PointerEvent, CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff, Hand, Radio } from "lucide-react";
import type { RealtimeConnectionStatus, VoiceDiagnostic } from "@/lib/realtime-client";

type Props = {
  status: RealtimeConnectionStatus;
  enabled: boolean;
  speaking?: boolean;
  error?: string;
  diagnostics?: VoiceDiagnostic[];
  meterRef?: RefObject<HTMLMeterElement | null>;
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

/** Barras de onda inline que respondem ao som */
function InlineWaveBars({
  meterRef,
  active,
  speaking,
  isHolding,
}: {
  meterRef?: RefObject<HTMLMeterElement | null>;
  active: boolean;
  speaking: boolean;
  isHolding: boolean;
}) {
  const levelRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active && !speaking) {
      levelRef.current = 0;
      containerRef.current?.style.setProperty("--user-level", "0");
      return;
    }
    let rafId: number;
    const tick = () => {
      const raw = meterRef?.current?.value ?? 0;
      const prev = levelRef.current;
      levelRef.current = raw > prev ? prev * 0.35 + raw * 0.65 : prev * 0.82 + raw * 0.18;
      containerRef.current?.style.setProperty("--user-level", levelRef.current.toFixed(3));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, speaking, meterRef]);

  const weights = [0.35, 0.65, 0.9, 0.75, 1, 0.85, 1, 0.75, 0.9, 0.65, 0.4, 0.28];

  return (
    <div
      ref={containerRef}
      className={`dock-wave-bars ${active ? "is-active" : ""} ${speaking ? "is-speaking" : ""} ${isHolding ? "is-holding" : ""}`}
    >
      {weights.map((w, i) => (
        <span
          key={i}
          style={{
            animationDelay: `${i * 55}ms`,
            "--height-mult": `${w}`,
            "--center-weight": `${w.toFixed(2)}`
          } as CSSProperties}
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
              meterRef={meterRef}
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
            meterRef={meterRef}
            active={active}
            speaking={speaking}
            isHolding={false}
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
            meterRef={meterRef}
            active={active}
            speaking={speaking}
            isHolding={false}
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
