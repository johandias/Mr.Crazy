import { AudioLines } from "lucide-react";

export function PronunciationFeedback({ score }: Readonly<{ score: number | null }>) {
  const label = score === null ? "Aguardando voz" : score >= 88 ? "Agora sim." : score >= 78 ? "Melhor." : "O som ainda esta sofrendo.";

  return (
    <div className="pronunciation-feedback">
      <AudioLines size={18} />
      <span>{label}</span>
      {score !== null ? <strong>{score}%</strong> : null}
    </div>
  );
}
