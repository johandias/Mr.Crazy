import { ArrowRight } from "lucide-react";
import { getMistakeLabel, type AnalysisResponse } from "@/lib/mr-crazy";

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
    return null;
  }

  const tone = analysis.correct ? "correct" : analysis.pronunciation_score >= 82 ? "coached" : "wrong";

  return (
    <section className={`correction-display ${tone}`} aria-label="Correção">
      <span>{getMistakeLabel(analysis.mistake_type)}</span>
      {!analysis.correct && analysis.mistake_word && analysis.correct_word ? (
        <div className="correction-contrast" aria-label={`Você falou ${analysis.mistake_word}. O correto é ${analysis.correct_word}.`}>
          <span>
            <small>Você falou</small>
            <del>{analysis.mistake_word}</del>
          </span>
          <ArrowRight size={18} aria-hidden="true" />
          <span>
            <small>O correto é</small>
            <strong>{analysis.correct_word}</strong>
          </span>
        </div>
      ) : null}
      <p>{analysis.correction}</p>
      <strong>{highlightCorrection(analysis.corrected_sentence, analysis.correct_word)}</strong>
      <small>{analysis.follow_up}</small>
    </section>
  );
}
