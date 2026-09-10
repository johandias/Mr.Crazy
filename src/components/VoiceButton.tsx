import { Loader2, Mic, Radio, Volume2 } from "lucide-react";
import type { VoiceState } from "@/lib/mr-crazy";

const labels: Record<VoiceState, string> = {
  idle: "Toque para falar",
  listening: "Estou ouvindo...",
  transcribing: "Transcrevendo...",
  analyzing: "Pensando...",
  reacting: "Reagindo...",
  preparing_speech: "Preparando voz...",
  speaking: "Falando...",
  waiting_for_repeat: "Repetir frase"
};

export function VoiceButton({
  state,
  onClick,
  disabled
}: Readonly<{ state: VoiceState; onClick: () => void; disabled?: boolean }>) {
  const isLoading = state === "analyzing" || state === "preparing_speech";
  const Icon = state === "listening" ? Radio : state === "speaking" ? Volume2 : isLoading ? Loader2 : Mic;

  return (
    <button className={`voice-button ${state}`} type="button" onClick={onClick} disabled={disabled}>
      <Icon size={24} className={isLoading ? "spin" : ""} />
      <span>{labels[state]}</span>
    </button>
  );
}
