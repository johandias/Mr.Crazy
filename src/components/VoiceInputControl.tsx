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

/** Barras de onda inline para o dock PTT */
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
     MODO SEGURA-SOLTA: dock horizontal em 3 zonas
     [Hold btn LEFT]  [Wave bars CENTER]  [Toggle RIGHT]
  ═══════════════════════════════════════════════════════════════ */
  if (isPtt) {
    return (
      <section className="voice-input-control clean-voice-dock" aria-label="Controle de voz">
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
          {/* ESQUERDA: botão de segurar */}
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
              {connecting ? "Conectando" :
               isHolding ? (isCancelling ? "Cancelar" : "Gravando") :
               "Segurar"}
            </span>
          </button>

          {/* CENTRO: barras de onda + status */}
          <div className="ptt-dock-center">
            <InlineWaveBars
              meterRef={meterRef}
              active={isHolding || speaking}
              speaking={speaking}
              isHolding={isHolding}
            />
            <span className="ptt-dock-status">
              {speaking ? "Mr. Crazy falando" :
               isHolding ? "Ouvindo você..." :
               "Pronto para gravar"}
            </span>
          </div>

          {/* DIREITA: toggle para desativar modo PTT */}
          <button
            type="button"
            className="ptt-mode-toggle-btn is-ptt"
            onClick={() => onTalkModeChange?.("continuous")}
            title="Modo Segura-Solta ativo — toque para voltar ao contínuo"
            aria-label="Desativar modo segura-solta"
          >
            <Hand size={14} />
          </button>
        </div>
      </section>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     MODO CONTÍNUO: botão circular + toggle à direita
  ═══════════════════════════════════════════════════════════════ */
  return (
    <section className="voice-input-control clean-voice-dock" aria-label="Controle de voz">
      <div className="mic-btn-row">
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
            title={
              connecting ? "Conectando..." :
              active ? "Toque para pausar" :
              isConnected ? "Toque para falar" :
              "Toque para conectar"
            }
          >
            {connecting ? (
              <LoaderCircle size={28} className="connection-spinner" />
            ) : active ? (
              <Mic size={28} className="mic-icon-active" />
            ) : (
              <MicOff size={26} className="mic-icon-inactive" />
            )}
          </button>
        </div>

        {/* Toggle: ativa modo segura-solta */}
        <button
          type="button"
          className="ptt-mode-toggle-btn"
          onClick={() => onTalkModeChange?.("push-to-talk")}
          title="Ativar Modo Segura-Solta"
          aria-label="Ativar modo segura-solta"
        >
          <Hand size={14} />
        </button>
      </div>

      <p
        className={`voice-status ${active ? "is-active" : ""} ${speaking ? "is-speaking" : ""}`}
        role="status"
      >
        {connecting ? "Conectando..." :
         speaking ? "Mr. Crazy falando" :
         active && !isAwake ? "Fale para acordar o Mr. Crazy" :
         active ? "Pode falar" :
         isConnected ? "Toque para falar" :
         "Toque no microfone"}
      </p>
    </section>
  );
}
