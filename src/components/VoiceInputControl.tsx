"use client";

import { useEffect, useState, type RefObject } from "react";
import { Check, Copy, LoaderCircle, Mic, MicOff, RotateCcw } from "lucide-react";
import type { RealtimeConnectionStatus, VoiceDiagnostic } from "@/lib/realtime-client";

type Props = {
  status: RealtimeConnectionStatus;
  enabled: boolean;
  error: string;
  diagnostics: VoiceDiagnostic[];
  meterRef: RefObject<HTMLMeterElement | null>;
  deviceId: string;
  onDeviceChange: (id: string) => void;
  onToggle: () => void;
  onReconnect: () => void;
};

export function VoiceInputControl({ status, enabled, error, diagnostics, meterRef, deviceId, onDeviceChange, onToggle, onReconnect }: Props) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [copyStatus, setCopyStatus] = useState("");
  const last = diagnostics.at(-1);
  const connecting = status === "connecting";
  const active = enabled && status === "connected";
  useEffect(() => {
    let disposed = false;
    const refresh = () => navigator.mediaDevices?.enumerateDevices().then(items => {
      if (!disposed) setDevices(items.filter(item => item.kind === "audioinput" && item.deviceId));
    }).catch(() => {});
    refresh();
    navigator.mediaDevices?.addEventListener("devicechange", refresh);
    return () => { disposed = true; navigator.mediaDevices?.removeEventListener("devicechange", refresh); };
  }, [status]);

  async function copyDiagnostics() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ module: "voice-v2", events: diagnostics }, null, 2));
      setCopyStatus("Copiado");
    } catch { setCopyStatus("Não foi possível copiar. Selecione o diagnóstico abaixo."); }
  }

  return (
    <section className="voice-input-control" aria-label="Conversa por voz">
      <div className="avatar-mic-dock">
        <button type="button" className={`avatar-mic-circle-btn ${active ? "is-active" : "is-inactive"} ${connecting ? "is-connecting" : ""}`}
          disabled={connecting} aria-busy={connecting} aria-pressed={active}
          aria-label={connecting ? "Conectando à conversa de voz" : active ? "Silenciar microfone" : "Ativar microfone"}
          title={connecting ? "Conectando" : active ? "Silenciar microfone" : "Ativar microfone"} onClick={onToggle}>
          {connecting ? <LoaderCircle size={24} className="connection-spinner" /> : active ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
      </div>
      <p className="voice-status" role="status">{connecting ? last?.message ?? "Conectando..." : active ? "Microfone ligado" : status === "failed" ? "Conexão de voz indisponível" : "Microfone desligado"}</p>
      <meter ref={meterRef} className="voice-input-meter" min={0} max={1} defaultValue={0} aria-label="Nível de áudio do microfone" />
      <select aria-label="Microfone de entrada" value={deviceId} disabled={connecting} onChange={event => onDeviceChange(event.target.value)}>
        <option value="">Microfone padrão</option>
        {devices.filter(device => device.deviceId !== "default").map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microfone ${index + 1}`}</option>)}
      </select>
      {error && <div className="avatar-mic-error-box">
        <p className="avatar-mic-error" role="alert">{error}</p>
        <button type="button" className="retry-connection-btn" disabled={connecting} onClick={onReconnect}><RotateCcw size={15} /> Reconectar voz</button>
      </div>}
      {diagnostics.length > 0 && <details className="voice-diagnostics">
        <summary>Diagnóstico da conexão</summary>
        <button type="button" onClick={copyDiagnostics} title="Copiar diagnóstico"><Copy size={14} /> Copiar diagnóstico {copyStatus === "Copiado" && <Check size={14} />}</button>
        {copyStatus && <span role="status">{copyStatus}</span>}
        <pre>{diagnostics.map(event => `${event.elapsedMs} ms | ${event.stage} | ${event.code}\n${event.message}${event.httpStatus ? `\nHTTP: ${event.httpStatus}` : ""}${event.providerStatus ? ` | OpenAI: ${event.providerStatus}` : ""}${event.providerCode ? ` | ${event.providerCode}` : ""}${event.providerMessage ? `\n${event.providerMessage}` : ""}${event.providerParam ? `\nCampo: ${event.providerParam}` : ""}${event.model ? `\nModelo: ${event.model}` : ""}\nID: ${event.serverId ?? event.id}`).join("\n\n")}</pre>
      </details>}
    </section>
  );
}
