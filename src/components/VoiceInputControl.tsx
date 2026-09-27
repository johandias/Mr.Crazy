"use client";

import type { RefObject, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, MicOff } from "lucide-react";
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
  onHoldCancel
}: Props) {
  const connecting = status === "connecting";
  const isConnected = status === "connected";
  const isPtt = talkMode === "push-to-talk";

  const [isHolding, setIsHolding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const startXRef = useRef<number | null>(null);

  // Timer de gravação no modo Segura-Solta (estilo WhatsApp)
  useEffect(() => {
    if (!isHolding) {
      setHoldSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setHoldSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isHolding]);

  const active = (isPtt ? isHolding : enabled) && isConnected;

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isPtt || connecting || !isConnected) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    startXRef.current = e.clientX;
    setIsHolding(true);
    setIsCancelling(false);
    onHoldStart?.();
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isPtt || !isHolding || startXRef.current === null) return;
    const diffX = e.clientX - startXRef.current;
    if (diffX < -48) {
      setIsCancelling(true);
    } else if (diffX > -24) {
      setIsCancelling(false);
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isPtt || !isHolding) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    const cancelling = isCancelling;
    setIsHolding(false);
    setIsCancelling(false);
    startXRef.current = null;
    if (cancelling) {
      onHoldCancel?.();
    } else {
      onHoldEnd?.();
    }
  };

  const handlePointerCancel = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isPtt || !isHolding) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsHolding(false);
    setIsCancelling(false);
    startXRef.current = null;
    onHoldCancel?.();
  };

  const handleClick = () => {
    if (isPtt) return;
    onToggle();
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <section className="voice-input-control clean-voice-dock" aria-label="Conversa por voz">

      {/* Indicador de Gravação estilo WhatsApp ao segurar o botão */}
      {isPtt && isHolding && (
        <div className={`ptt-recording-pill ${isCancelling ? "is-cancelling" : ""}`}>
          <span className="ptt-rec-dot" />
          <span className="ptt-rec-timer">{formatTimer(holdSeconds)}</span>
          <span className="ptt-slide-hint">
            {isCancelling ? "Solte para cancelar 🗑️" : "‹ Deslize para cancelar"}
          </span>
        </div>
      )}

      {/* Wrapper do botão com toggle de modo à direita */}
      <div className="mic-btn-row">
        {isPtt ? (
          /* ——— MODO SEGURA-SOLTA: Botão retangular estilo "pressionar e segurar" ——— */
          <button
            type="button"
            className={`ptt-hold-btn ${isHolding ? "is-holding" : ""} ${isCancelling ? "is-cancelling" : ""} ${connecting ? "is-connecting" : ""}`}
            disabled={connecting}
            aria-busy={connecting}
            aria-pressed={isHolding}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={
              connecting
                ? "Conectando à conversa de voz"
                : isHolding
                ? "Gravando áudio... Solte para enviar"
                : "Segure para falar"
            }
            title={
              connecting
                ? "Conectando..."
                : isHolding
                ? "Solte para enviar para a IA interpretar"
                : "Segure para falar com o Mr. Crazy"
            }
          >
            {connecting ? (
              <LoaderCircle size={24} className="connection-spinner" />
            ) : (
              <>
                <span className="ptt-hold-icon">{isHolding ? "🔴" : "🎙️"}</span>
                <span className="ptt-hold-label">
                  {isHolding
                    ? isCancelling
                      ? "Soltar para cancelar"
                      : "Soltando • Envia"
                    : "Segure para falar"}
                </span>
              </>
            )}
          </button>
        ) : (
          /* ——— MODO CONTÍNUO: Botão circular normal ——— */
          <div
            className={`avatar-mic-halo-wrapper ${active ? "is-active" : "is-inactive"} ${
              speaking ? "is-speaking" : ""
            } ${connecting ? "is-connecting" : ""}`}
          >
            {/* Anéis de pulso radiantes animados */}
            {active && (
              <>
                <span className="mic-halo-pulse-ring ring-1" aria-hidden="true" />
                <span className="mic-halo-pulse-ring ring-2" aria-hidden="true" />
              </>
            )}
            {speaking && (
              <span className="mic-halo-pulse-ring speaking-ring" aria-hidden="true" />
            )}
            <button
              type="button"
              className={`avatar-mic-circle-btn ${active ? "is-active" : "is-inactive"} ${
                connecting ? "is-connecting" : ""
              } ${speaking ? "is-speaking" : ""}`}
              disabled={connecting}
              aria-busy={connecting}
              aria-pressed={active}
              onContextMenu={(e) => e.preventDefault()}
              onClick={handleClick}
              aria-label={
                connecting
                  ? "Conectando à conversa de voz"
                  : active
                  ? "Mutar microfone"
                  : "Desmutar microfone"
              }
              title={
                connecting
                  ? "Conectando..."
                  : active
                  ? "Microfone ligado. Toque para pausar"
                  : isConnected
                  ? "Microfone pausado. Toque para falar"
                  : "Toque para falar com o Mr. Crazy"
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
        )}

        {/* Toggle de modo: ícone à direita do botão de mic */}
        <button
          type="button"
          className={`ptt-mode-toggle-btn ${isPtt ? "is-ptt" : ""}`}
          onClick={() => onTalkModeChange?.(isPtt ? "continuous" : "push-to-talk")}
          title={isPtt ? "Modo Segura-Solta ativo. Toque para voltar ao modo contínuo" : "Ativar Modo Segura-Solta (Segure para falar, estilo WhatsApp)"}
          aria-label={isPtt ? "Desativar modo segura-solta" : "Ativar modo segura-solta"}
        >
          <span className="ptt-toggle-icon">{isPtt ? "👐" : "🤏"}</span>
        </button>
      </div>

      <p className={`voice-status ${active ? "is-active" : ""} ${speaking ? "is-speaking" : ""}`} role="status">
        {connecting
          ? "Conectando voz ao vivo..."
          : speaking
          ? "Mr. Crazy falando..."
          : isPtt
          ? isCancelling
            ? "Solte para cancelar o áudio"
            : isHolding
            ? "Gravando... Solte para enviar"
            : "Segure o botão para falar"
          : active && !isAwake
          ? "Microfone ativo • Fale para acordar o Mr. Crazy"
          : active
          ? "Microfone ligado • Pode falar"
          : isConnected
          ? "Microfone pausado • Toque para falar"
          : "Toque no microfone para começar"}
      </p>
    </section>
  );
}
