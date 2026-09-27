"use client";

import type { RefObject } from "react";
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
};

export function VoiceInputControl({
  status,
  enabled,
  speaking = false,
  onToggle
}: Props) {
  const connecting = status === "connecting";
  const isConnected = status === "connected";
  const active = enabled && isConnected;

  return (
    <section className="voice-input-control clean-voice-dock" aria-label="Conversa por voz">
      <div className={`avatar-mic-halo-wrapper ${active ? "is-active" : "is-inactive"} ${speaking ? "is-speaking" : ""} ${connecting ? "is-connecting" : ""}`}>
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
          className={`avatar-mic-circle-btn ${active ? "is-active" : "is-inactive"} ${connecting ? "is-connecting" : ""} ${speaking ? "is-speaking" : ""}`}
          disabled={connecting}
          aria-busy={connecting}
          aria-pressed={active}
          aria-label={
            connecting
              ? "Conectando à conversa de voz"
              : active
              ? "Mutar microfone (voz continua conectada)"
              : isConnected
              ? "Desmutar microfone"
              : "Iniciar conversa por voz"
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
          onClick={onToggle}
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

      <p className={`voice-status ${active ? "is-active" : ""} ${speaking ? "is-speaking" : ""}`} role="status">
        {connecting
          ? "Conectando voz ao vivo..."
          : speaking
          ? "Mr. Crazy falando..."
          : active
          ? "Microfone ligado • Pode falar"
          : isConnected
          ? "Microfone pausado • Toque para falar"
          : "Toque no microfone para começar"}
      </p>
    </section>
  );
}
