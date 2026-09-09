import type { AnalysisResponse } from "@/lib/mr-crazy";

function highlightCorrection(sentence: string, word: string | null) {
  if (!word) {
    return sentence;
  }

  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = sentence.split(new RegExp(`(${escaped})`, "i"));

  return parts.map((part, index) =>
    part.toLowerCase() === word.toLowerCase() ? <mark key={`${part}-${index}`}>{part}</mark> : part
  );
}

export function CorrectionDisplay({ analysis }: Readonly<{ analysis: AnalysisResponse | null }>) {
  if (!analysis) {
    return (
      <section className="correction-display empty" aria-label="Correcao">
        <span>Ready</span>
        <p>Tell me about yourself.</p>
      </section>
    );
  }

  return (
    <section className={`correction-display ${analysis.correct ? "correct" : "wrong"}`} aria-label="Correcao">
      <span>{analysis.correct ? "Clean sentence" : analysis.mistake_type.replaceAll("_", " ")}</span>
      <p>{analysis.correction}</p>
      <strong>{highlightCorrection(analysis.corrected_sentence, analysis.correct_word)}</strong>
      <small>{analysis.follow_up}</small>
    </section>
  );
}
