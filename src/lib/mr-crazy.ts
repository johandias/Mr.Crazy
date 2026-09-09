export type Emotion = "calm" | "annoyed" | "irritated" | "crazy";

export type VoiceState =
  | "idle"
  | "listening"
  | "transcribing"
  | "analyzing"
  | "reacting"
  | "speaking"
  | "waiting_for_repeat";

export type MistakeCategory =
  | "past_tense"
  | "age_expression"
  | "pronunciation_epenthesis"
  | "false_cognate"
  | "missing_subject"
  | "question_auxiliary"
  | "preposition"
  | "none";

export interface AnalysisRequest {
  sentence: string;
  previousMistakes?: string[];
  crazyLevel?: number;
  mode?: string;
}

export interface AnalysisResponse {
  user_sentence: string;
  correct: boolean;
  mistake_type: MistakeCategory;
  mistake_word: string | null;
  correct_word: string | null;
  corrected_sentence: string;
  reaction: string;
  correction: string;
  follow_up: string;
  crazy_delta: number;
  emotion: Emotion;
  pronunciation_score: number;
  xp_delta: number;
  provider: "local-simulator" | "test-key-ready";
}

const emotionThresholds: Array<{ max: number; emotion: Emotion }> = [
  { max: 20, emotion: "calm" },
  { max: 45, emotion: "annoyed" },
  { max: 70, emotion: "irritated" },
  { max: 100, emotion: "crazy" }
];

export function clampCrazyLevel(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getEmotion(crazyLevel: number): Emotion {
  const bounded = clampCrazyLevel(crazyLevel);
  return emotionThresholds.find((item) => bounded <= item.max)?.emotion ?? "crazy";
}

export function getEmotionLabel(emotion: Emotion) {
  const labels: Record<Emotion, string> = {
    calm: "Calm",
    annoyed: "Annoyed",
    irritated: "Irritated",
    crazy: "Crazy"
  };

  return labels[emotion];
}

export function analyzeEnglishSentence(
  request: AnalysisRequest,
  provider: AnalysisResponse["provider"] = "local-simulator"
): AnalysisResponse {
  const sentence = request.sentence.trim();
  const lower = sentence.toLowerCase();
  const previousMistakes = request.previousMistakes ?? [];
  let mistake_type: MistakeCategory = "none";
  let mistake_word: string | null = null;
  let correct_word: string | null = null;
  let corrected_sentence = sentence;
  let reaction = "Clean. Annoyingly clean.";
  let correction = "No major correction. Keep the pace.";
  let follow_up = "Now add one more detail in English.";
  let crazy_delta = -8;
  let pronunciation_score = 91;
  let xp_delta = 18;

  if (/\byesterday\s+i\s+go\b/.test(lower) || /\blast\s+\w+\s+i\s+go\b/.test(lower)) {
    mistake_type = "past_tense";
    mistake_word = "go";
    correct_word = "went";
    corrected_sentence = sentence.replace(/\bgo\b/i, "went");
    reaction = "CARAAAAMBA... e WENT!";
    correction = "No passado, use WENT, nao GO.";
    follow_up = "Fala de novo com WENT e sem negociar com o caos.";
    crazy_delta = previousMistakes.includes("past_tense") ? 15 : 12;
    pronunciation_score = 82;
    xp_delta = 9;
  } else if (/\bgoed\b/.test(lower)) {
    mistake_type = "past_tense";
    mistake_word = "goed";
    correct_word = "went";
    corrected_sentence = sentence.replace(/\bgoed\b/i, "went");
    reaction = "GOED? Inventamos um verbo novo agora?";
    correction = "GO e irregular. O passado correto e WENT.";
    follow_up = "Repete a frase usando WENT.";
    crazy_delta = previousMistakes.includes("past_tense") ? 16 : 13;
    pronunciation_score = 84;
    xp_delta = 9;
  } else if (/\bi\s+have\s+\d+\s+years?\b/.test(lower)) {
    const age = lower.match(/\bi\s+have\s+(\d+)\s+years?\b/)?.[1] ?? "";
    mistake_type = "age_expression";
    mistake_word = "have";
    correct_word = "am";
    corrected_sentence = age ? `I am ${age} years old.` : sentence.replace(/\bi have\b/i, "I am");
    reaction = "Nao. NAO. Voce nao possui anos como se fossem cadeiras.";
    correction = "Para idade, diga I AM ... YEARS OLD.";
    follow_up = "Agora fala a frase certa, com dignidade gramatical.";
    crazy_delta = 12;
    pronunciation_score = 86;
    xp_delta = 10;
  } else if (/\b\w+-i\b/.test(lower) || /\b(play|work|talk|stop|drink|hot)ed-i\b/.test(lower)) {
    const match = lower.match(/\b[\w-]+-i\b/)?.[0] ?? "final i";
    mistake_type = "pronunciation_epenthesis";
    mistake_word = match;
    correct_word = match.replace(/-i$/, "");
    corrected_sentence = sentence.replace(/-i\b/gi, "");
    reaction = "Esse i fantasma tentou fugir do laboratorio.";
    correction = "Trave a palavra na consoante final. Nada de vogal extra.";
    follow_up = `Repete so ${correct_word}, depois a frase inteira.`;
    crazy_delta = previousMistakes.includes("pronunciation_epenthesis") ? 14 : 11;
    pronunciation_score = 73;
    xp_delta = 8;
  } else if (/\bpretend(ed|s|ing)?\b/.test(lower) && /\b(plan|migrate|do|make|start|finish|want|intend)/.test(lower)) {
    mistake_type = "false_cognate";
    mistake_word = "pretend";
    correct_word = "intend";
    corrected_sentence = sentence.replace(/\bpretend(ed|s|ing)?\b/i, "planned");
    reaction = "Pretend e fingir. Voce estava atuando ou trabalhando?";
    correction = "Use planned ou intended quando quiser dizer pretender.";
    follow_up = "Refaz a frase com PLANNED.";
    crazy_delta = 15;
    pronunciation_score = 88;
    xp_delta = 10;
  } else if (/^(is|was|will be|would be)\s+(raining|important|necessary|possible)\b/.test(lower)) {
    mistake_type = "missing_subject";
    mistake_word = lower.split(" ")[0] ?? "is";
    correct_word = "it";
    corrected_sentence = `It ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
    reaction = "O sujeito sumiu. Classico desaparecimento gramatical.";
    correction = "Em ingles, use IT em frases como It is raining.";
    follow_up = "Diz de novo com IT no comeco.";
    crazy_delta = 10;
    pronunciation_score = 89;
    xp_delta = 9;
  } else if (/\?$/.test(sentence) && /^(you|she|he|they|we)\s+\w+/.test(lower) && !/^(do|does|did|are|is|was|were|can|could|would|will|should|have|has|had)\b/.test(lower)) {
    mistake_type = "question_auxiliary";
    mistake_word = sentence.split(" ")[0] ?? null;
    correct_word = "do/did";
    corrected_sentence = `Do ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
    reaction = "A pergunta chegou sem auxiliar. Entrou pela janela.";
    correction = "Use DO, DOES ou DID para perguntas completas.";
    follow_up = "Repete com o auxiliar certo.";
    crazy_delta = 9;
    pronunciation_score = 90;
    xp_delta = 9;
  }

  const nextLevel = clampCrazyLevel((request.crazyLevel ?? 14) + crazy_delta);

  return {
    user_sentence: sentence,
    correct: mistake_type === "none",
    mistake_type,
    mistake_word,
    correct_word,
    corrected_sentence,
    reaction,
    correction,
    follow_up,
    crazy_delta,
    emotion: getEmotion(nextLevel),
    pronunciation_score,
    xp_delta,
    provider
  };
}
