"use client";

import type { RefObject } from "react";
import { LoaderCircle, Mic, MicOff } from "lucide-react";
import type { RealtimeConnectionStatus, VoiceDiagnostic } from "@/lib/realtime-client";

type Props = {
  status: RealtimeConnectionStatus;
  enabled: boolean;
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
  onToggle
}: Props) {
  const connecting = status === "connecting";
  const isConnected = status === "connected";
  const active = enabled && isConnected;

  return (
    <section className="voice-input-control clean-voice-dock" aria-label="Conversa por voz">
      <div className="avatar-mic-dock">
        <button
          type="button"
          className={`avatar-mic-circle-btn ${active ? "is-active" : "is-inactive"} ${connecting ? "is-connecting" : ""}`}
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
              ? "Microfone ligado. Toque para mutar (mantém conectado)"
              : isConnected
              ? "Microfone mutado. Toque para falar"
              : "Toque para falar com o Mr. Crazy"
          }
          onClick={onToggle}
        >
          {connecting ? (
            <LoaderCircle size={24} className="connection-spinner" />
          ) : active ? (
            <Mic size={24} />
          ) : (
            <MicOff size={24} />
          )}
        </button>
      </div>
    </section>
  );
}
