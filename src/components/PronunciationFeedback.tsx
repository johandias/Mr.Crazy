import { Gauge } from "lucide-react";

export function PronunciationFeedback({ score }: Readonly<{ score: number | null }>) {
  const label = score === null
    ? "Sem nota nesta ajuda."
    : score >= 90
      ? "Excelente."
      : score >= 82
        ? "Boa comunicação, ajuste pequeno."
        : score >= 72
          ? "Entendeu, mas precisa ajustar."
          : "Vamos reconstruir essa frase.";

  return (
    <div className="pronunciation-feedback" aria-label="Pontuação da resposta">
      <Gauge size={18} />
      <span>{label}</span>
      {score !== null ? <strong>{score}%</strong> : null}
    </div>
  );
}
