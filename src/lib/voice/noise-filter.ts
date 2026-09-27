/**
 * Utilitário de filtragem de ruído e alucinações comuns do Whisper / OpenAI Realtime.
 * Impede que respiração, cliques e sussurros baixos sejam tratados como fala do usuário.
 */

const NOISE_PHRASES = new Set([
  "you",
  "thank you",
  "thank you.",
  "thank you very much",
  "thanks",
  "thanks.",
  "thanks for watching",
  "bye",
  "bye-bye",
  "goodbye",
  "ok",
  "okay",
  "yeah",
  "yes",
  "yep",
  "uh",
  "um",
  "ah",
  "oh",
  "huh",
  "hmm",
  "hum",
  "opa",
  "silence",
  "obrigado",
  "de nada",
  "valeu"
]);

const BRACKET_TAG_REGEX = /^[\[(].*[\])]$/;
const PUNCTUATION_ONLY_REGEX = /^[.\-_!?~:;,\s"'`]+$/;
const SUBTITLE_TAG_REGEX = /(subtitles|legendas|transcrição|transcription|amara\.org|translated by)/i;

export function isNoiseOrHallucination(text: string | null | undefined): boolean {
  if (!text) return true;
  const clean = text.trim();
  if (clean.length < 2) return true;

  if (PUNCTUATION_ONLY_REGEX.test(clean)) return true;
  if (BRACKET_TAG_REGEX.test(clean)) return true;
  if (SUBTITLE_TAG_REGEX.test(clean)) return true;

  const normalized = clean
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .trim();

  if (!normalized || normalized.length < 2) return true;
  if (NOISE_PHRASES.has(normalized)) return true;

  return false;
}
