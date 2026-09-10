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
  | "sentence_fragment"
  | "portuguese_input"
  | "learning_request"
  | "none";

export type LearningLevel = "basic" | "intermediate" | "advanced";
export type AnalysisProvider = "local-simulator" | "test-key-ready" | "gemini-live" | "gemini-fallback";

export interface AnalysisRequest {
  sentence: string;
  previousMistakes?: string[];
  crazyLevel?: number;
  mode?: string;
  learningLevel?: LearningLevel;
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
  provider: AnalysisProvider;
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
    calm: "Calmo",
    annoyed: "Irritado",
    irritated: "Muito irritado",
    crazy: "Furioso"
  };

  return labels[emotion];
}

export function getMistakeLabel(mistake: MistakeCategory) {
  const labels: Record<MistakeCategory, string> = {
    past_tense: "Passado simples",
    age_expression: "Expressão de idade",
    pronunciation_epenthesis: "Pronúncia",
    false_cognate: "Falso cognato",
    missing_subject: "Sujeito ausente",
    question_auxiliary: "Auxiliar da pergunta",
    preposition: "Preposição",
    sentence_fragment: "Frase incompleta",
    portuguese_input: "Entrada em português",
    learning_request: "Pedido atendido",
    none: "Frase correta"
  };

  return labels[mistake];
}

export function normalizeLearningLevel(value?: string): LearningLevel {
  if (value === "basic" || value === "intermediate" || value === "advanced") {
    return value;
  }

  return "basic";
}

function getLevelFollowUp(level: LearningLevel, sentence: string) {
  const prompts: Record<LearningLevel, string> = {
    basic: `Repita comigo: "${sentence}". Depois fala uma frase curta sobre seu dia.`,
    intermediate: `Repita comigo: "${sentence}". Depois adiciona um motivo em inglês.`,
    advanced: `Repita comigo: "${sentence}". Depois explica sua ideia em duas frases.`
  };

  return prompts[level];
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”]/g, '"')
    .trim();
}

function removeFinalPunctuation(value: string) {
  return value.replace(/[.?!]+$/u, "").trim();
}

function pickVariant(values: readonly string[]) {
  return values[Math.floor(Math.random() * values.length)] ?? values[0];
}

const positiveReactions = [
  "Droga, essa passou limpa. Até eu queria achar um erro, preguiçoso.",
  "Ok, você acertou. Não se empolga, foi uma frase só.",
  "Infelizmente para o meu entretenimento, isso está correto.",
  "Acertou, cabeça dura. Minha irritação vai ter que esperar.",
  "Tá bom, tá bom, essa ficou decente. Milagre gramatical registrado."
];

const positiveCorrections = [
  "Não achei erro importante nessa frase.",
  "A estrutura está boa para esse nível.",
  "Essa frase funciona bem do jeito que está.",
  "Pode usar essa frase sem assustar nenhum professor.",
  "Gramática aceitável. O drama foi adiado."
];

const wrongIntros = [
  "Não, preguiçoso.",
  "Errou, cabeça dura.",
  "Aí você me complica, campeão da bagunça.",
  "Nada disso, gênio do improviso.",
  "Calma aí, terror dos verbos."
];

function getPositiveReaction() {
  return pickVariant(positiveReactions);
}

function getPositiveCorrection() {
  return pickVariant(positiveCorrections);
}

function getWrongReaction(detail: string) {
  return `${pickVariant(wrongIntros)} ${detail}`;
}

type FragmentFix = {
  mistake_word: string;
  correct_word: string;
  corrected_sentence: string;
  correction: string;
};

function getSentenceFragmentFix(sentence: string): FragmentFix | null {
  const clean = removeFinalPunctuation(sentence);
  const normalized = normalizeText(clean);
  const words = normalized.split(/\s+/u).filter(Boolean);

  if (!words.length || looksPortuguese(sentence)) {
    return null;
  }

  const directFragments: Array<{ pattern: RegExp; fix: Omit<FragmentFix, "mistake_word"> }> = [
    {
      pattern: /^google yesterday$/u,
      fix: {
        correct_word: "I searched on Google yesterday",
        corrected_sentence: "I searched on Google yesterday.",
        correction:
          'Isso é fragmento, não frase. Era para falar: "I searched on Google yesterday." Você falou: "Google yesterday."'
      }
    },
    {
      pattern: /^work yesterday$/u,
      fix: {
        correct_word: "I worked yesterday",
        corrected_sentence: "I worked yesterday.",
        correction: 'Faltou sujeito e verbo no passado. Use: "I worked yesterday."'
      }
    },
    {
      pattern: /^go (to )?(school|work) yesterday$/u,
      fix: {
        correct_word: "I went there yesterday",
        corrected_sentence: "I went there yesterday.",
        correction: 'Faltou sujeito e o verbo está no tempo errado. Use WENT para passado.'
      }
    }
  ];

  const direct = directFragments.find((item) => item.pattern.test(normalized));
  if (direct) {
    return {
      mistake_word: clean,
      ...direct.fix
    };
  }

  const timeMarker = /\b(yesterday|today|tomorrow|last night|last week|this morning|tonight|ago)\b/u.test(normalized);
  const hasSubject = /\b(i|you|he|she|we|they|it)\b/u.test(normalized);
  const hasFiniteVerb =
    /\b(am|are|is|was|were|have|has|had|do|does|did|will|can|could|would|should|went|worked|played|studied|searched|googled|need|want|like)\b/u.test(
      normalized
    );

  if (words.length <= 4 && timeMarker && (!hasSubject || !hasFiniteVerb)) {
    return {
      mistake_word: clean,
      correct_word: "I need a complete sentence",
      corrected_sentence: "I need a complete sentence.",
      correction: "Isso parece um pedaço solto de frase. Coloque sujeito, verbo e ideia completa em inglês."
    };
  }

  return null;
}

function extractTranslationRequest(sentence: string) {
  const quoted = sentence.match(/["']([^"']+)["']/u)?.[1]?.trim();
  if (quoted) return quoted;

  const normalized = normalizeText(sentence);
  if (!/(como|qual).*(falo|falar|fala|digo|dizer|se fala)/u.test(normalized)) {
    return null;
  }

  const withoutQuestion = removeFinalPunctuation(sentence)
    .replace(/^\s*como\s+(eu\s+)?(falo|falar|digo|dizer)\s+/iu, "")
    .replace(/^\s*como\s+se\s+fala\s+/iu, "")
    .replace(/^\s*qual\s+é\s+a\s+forma\s+de\s+dizer\s+/iu, "")
    .replace(/\s+em\s+ingl[eê]s$/iu, "")
    .trim();

  return withoutQuestion || null;
}

function translateTopic(topic: string | null) {
  if (!topic) return null;

  const normalized = normalizeText(removeFinalPunctuation(topic));
  const topics: Record<string, string> = {
    trabalho: "work",
    "trabalho remoto": "remote work",
    viagem: "travel",
    viagens: "travel",
    entrevista: "job interviews",
    estudos: "studying",
    "meu dia": "your day",
    rotina: "daily routine"
  };

  return topics[normalized] ?? null;
}

function translatePortuguesePhrase(phrase: string, level: LearningLevel) {
  const cleanPhrase = removeFinalPunctuation(phrase);
  const normalized = normalizeText(cleanPhrase);

  const directTranslations: Array<{ pattern: RegExp; translation: string }> = [
    { pattern: /^(eu\s+)?estou cansado hoje$/u, translation: "I am tired today." },
    { pattern: /^(eu\s+)?preciso trabalhar amanha$/u, translation: "I need to work tomorrow." },
    { pattern: /^(eu\s+)?quero praticar ingles$/u, translation: "I want to practice English." },
    { pattern: /^vamos conversar$/u, translation: "Let's talk." },
    { pattern: /^bom dia$/u, translation: "Good morning." },
    { pattern: /^boa noite$/u, translation: "Good evening." },
    { pattern: /^(eu\s+)?trabalho com atendimento$/u, translation: "I work in customer service." },
    { pattern: /^(eu\s+)?estou aprendendo ingles$/u, translation: "I am learning English." }
  ];

  const direct = directTranslations.find((item) => item.pattern.test(normalized));
  if (direct) return direct.translation;

  const likeMatch = normalized.match(/^(eu\s+)?gosto de (.+)$/u);
  if (likeMatch?.[2]) {
    return `I like ${likeMatch[2]}.`;
  }

  const fallback: Record<LearningLevel, string> = {
    basic: "I want to say this in English.",
    intermediate: "I want to explain this in English.",
    advanced: "I want to express this idea clearly in English."
  };

  return fallback[level];
}

function isConversationRequest(sentence: string) {
  const normalized = normalizeText(sentence);
  return /\b(vamos|bora|quero|podemos|pode)\b.*\b(conversar|praticar|treinar|bate papo)\b/u.test(normalized);
}

function looksPortuguese(sentence: string) {
  const normalized = normalizeText(sentence);
  return /\b(eu|voce|você|quero|preciso|como|falar|dizer|conversar|sobre|trabalho|hoje|amanha|amanhã|estou|sou|tenho|gosto)\b/u.test(
    normalized
  );
}

function getConversationPrompt(level: LearningLevel, mode?: string, sentence = "") {
  const topicMatch = sentence.match(/\bsobre\s+(.+?)\s*[.?!]*$/iu);
  const topic = translateTopic(topicMatch?.[1] ?? null);

  if (topic) {
    const topicPrompts: Record<LearningLevel, string> = {
      basic: `Tell me one simple sentence about ${topic}.`,
      intermediate: `Tell me what you think about ${topic} and give one reason.`,
      advanced: `Give me a clear opinion about ${topic} and defend it with one example.`
    };

    return topicPrompts[level];
  }

  if (mode === "work-english") {
    return level === "basic"
      ? "Tell me what you did at work today."
      : level === "intermediate"
        ? "Tell me about a problem you solved at work this week."
        : "Explain a difficult decision at work and the trade-off behind it.";
  }

  if (mode === "job-interview") {
    return level === "basic"
      ? "Tell me one strength you have."
      : level === "intermediate"
        ? "Tell me about a challenge you handled at work."
        : "Tell me about a failure, what you changed, and what you learned.";
  }

  if (mode === "travel") {
    return level === "basic"
      ? "Ask me where the hotel is."
      : level === "intermediate"
        ? "Ask me how to get to the nearest subway station."
        : "Explain a travel problem and ask for a practical solution.";
  }

  const prompts: Record<LearningLevel, string> = {
    basic: "Tell me about your day.",
    intermediate: "Tell me about something you did yesterday and why it mattered.",
    advanced: "Give me your opinion about remote work and defend it with one reason."
  };

  return prompts[level];
}

export function analyzeEnglishSentence(
  request: AnalysisRequest,
  provider: AnalysisResponse["provider"] = "local-simulator"
): AnalysisResponse {
  const sentence = request.sentence.trim();
  const lower = sentence.toLowerCase();
  const previousMistakes = request.previousMistakes ?? [];
  const learningLevel = normalizeLearningLevel(request.learningLevel);
  const translationPhrase = extractTranslationRequest(sentence);
  const conversationRequested = isConversationRequest(sentence);
  const fragmentFix = getSentenceFragmentFix(sentence);
  let mistake_type: MistakeCategory = "none";
  let mistake_word: string | null = null;
  let correct_word: string | null = null;
  let corrected_sentence = sentence;
  let reaction = getPositiveReaction();
  let correction = getPositiveCorrection();
  let follow_up = getLevelFollowUp(learningLevel, sentence);
  let crazy_delta = -8;
  let pronunciation_score = 91;
  let xp_delta = 18;

  if (fragmentFix) {
    mistake_type = "sentence_fragment";
    mistake_word = fragmentFix.mistake_word;
    correct_word = fragmentFix.correct_word;
    corrected_sentence = fragmentFix.corrected_sentence;
    reaction = getWrongReaction("Isso não é frase inteira, é um pedaço jogado na mesa.");
    correction = fragmentFix.correction;
    follow_up = `Repita comigo: "${corrected_sentence}". Depois cria uma frase completa parecida.`;
    crazy_delta = previousMistakes.includes("sentence_fragment") ? 16 : 13;
    pronunciation_score = 72;
    xp_delta = 7;
  } else if (translationPhrase) {
    mistake_type = "learning_request";
    corrected_sentence = translatePortuguesePhrase(translationPhrase, learningLevel);
    reaction = pickVariant([
      "Finalmente uma pergunta útil, preguiçoso. Anota antes que você esqueça.",
      "Boa, cabeça dura. Perguntar como fala é melhor que inventar moda.",
      "Agora sim. Tradução pedida, caos temporariamente controlado.",
      "Até que enfim você usou o cérebro para pedir ajuda."
    ]);
    correction = `Para dizer isso em inglês, use: "${corrected_sentence}"`;
    follow_up = `Repita comigo: "${corrected_sentence}". Depois cria outra frase parecida.`;
    crazy_delta = -4;
    pronunciation_score = 92;
    xp_delta = 12;
  } else if (conversationRequested) {
    mistake_type = "learning_request";
    corrected_sentence = getConversationPrompt(learningLevel, request.mode, sentence);
    reaction = pickVariant([
      "Até que enfim, preguiçoso. Vamos conversar em inglês.",
      "Boa, vamos conversar. Tenta não atropelar metade dos verbos.",
      "Fechado. Conversa em inglês, sem fuga para o português.",
      "Agora gostei. Bora conversar e ver onde a gramática tropeça."
    ]);
    correction = `Responda em inglês: "${corrected_sentence}"`;
    follow_up = "Manda sua resposta. Eu corrijo sem dó.";
    crazy_delta = -3;
    pronunciation_score = 93;
    xp_delta = 12;
  } else if (looksPortuguese(sentence)) {
    mistake_type = "portuguese_input";
    corrected_sentence = getConversationPrompt(learningLevel, request.mode, sentence);
    reaction = getWrongReaction("Português eu já sei. O treino aqui é em inglês.");
    correction = `Responda em inglês: "${corrected_sentence}"`;
    follow_up = "Se quiser tradução, pergunta: como falo isso em inglês?";
    crazy_delta = 6;
    pronunciation_score = 78;
    xp_delta = 4;
  } else if (/\byesterday\s+i\s+go\b/.test(lower) || /\blast\s+\w+\s+i\s+go\b/.test(lower)) {
    mistake_type = "past_tense";
    mistake_word = "go";
    correct_word = "went";
    corrected_sentence = sentence.replace(/\bgo\b/i, "went");
    reaction = getWrongReaction("Era para falar WENT e você falou GO.");
    correction = "No passado, use WENT, não GO.";
    follow_up = `Repita comigo: "${corrected_sentence}". Vamos tentar novamente.`;
    crazy_delta = previousMistakes.includes("past_tense") ? 15 : 12;
    pronunciation_score = 82;
    xp_delta = 9;
  } else if (/\bgoed\b/.test(lower)) {
    mistake_type = "past_tense";
    mistake_word = "goed";
    correct_word = "went";
    corrected_sentence = sentence.replace(/\bgoed\b/i, "went");
    reaction = getWrongReaction("GOED não existe aqui. O passado de GO é WENT.");
    correction = "Era para falar WENT e você falou GOED. GO é irregular.";
    follow_up = `Repita comigo: "${corrected_sentence}". Vamos tentar novamente.`;
    crazy_delta = previousMistakes.includes("past_tense") ? 16 : 13;
    pronunciation_score = 84;
    xp_delta = 9;
  } else if (/\bi\s+have\s+\d+\s+years?\b/.test(lower)) {
    const age = lower.match(/\bi\s+have\s+(\d+)\s+years?\b/)?.[1] ?? "";
    mistake_type = "age_expression";
    mistake_word = "have";
    correct_word = "am";
    corrected_sentence = age ? `I am ${age} years old.` : sentence.replace(/\bi have\b/i, "I am");
    reaction = getWrongReaction("Você não possui anos como se fossem cadeiras.");
    correction = "Era para falar I AM e você falou I HAVE. Para idade, diga I AM ... YEARS OLD.";
    follow_up = `Repita comigo: "${corrected_sentence}". Vamos tentar novamente.`;
    crazy_delta = 12;
    pronunciation_score = 86;
    xp_delta = 10;
  } else if (/\b\w+-i\b/.test(lower) || /\b(play|work|talk|stop|drink|hot)ed-i\b/.test(lower)) {
    const match = lower.match(/\b[\w-]+-i\b/)?.[0] ?? "final i";
    mistake_type = "pronunciation_epenthesis";
    mistake_word = match;
    correct_word = match.replace(/-i$/, "");
    corrected_sentence = sentence.replace(/-i\b/gi, "");
    reaction = getWrongReaction("Esse I no final não existe. Para de inventar vogal.");
    correction = `Era para falar ${correct_word?.toUpperCase()} e você falou ${match.toUpperCase()}. Trave a palavra na consoante final.`;
    follow_up = `Repita comigo: "${corrected_sentence}". Vamos tentar novamente.`;
    crazy_delta = previousMistakes.includes("pronunciation_epenthesis") ? 14 : 11;
    pronunciation_score = 73;
    xp_delta = 8;
  } else if (/\bpretend(ed|s|ing)?\b/.test(lower) && /\b(plan|migrate|do|make|start|finish|want|intend)/.test(lower)) {
    mistake_type = "false_cognate";
    mistake_word = "pretend";
    correct_word = "intend";
    corrected_sentence = sentence.replace(/\bpretend(ed|s|ing)?\b/i, "planned");
    reaction = getWrongReaction("PRETEND é fingir. Você estava atuando ou trabalhando?");
    correction = "Era para falar PLANNED ou INTENDED e você falou PRETEND. Use pretend só para fingir.";
    follow_up = `Repita comigo: "${corrected_sentence}". Vamos tentar novamente.`;
    crazy_delta = 15;
    pronunciation_score = 88;
    xp_delta = 10;
  } else if (/^(is|was|will be|would be)\s+(raining|important|necessary|possible)\b/.test(lower)) {
    mistake_type = "missing_subject";
    mistake_word = lower.split(" ")[0] ?? "is";
    correct_word = "it";
    corrected_sentence = `It ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
    reaction = getWrongReaction("O sujeito sumiu. Clássico desaparecimento gramatical.");
    correction = "Era para começar com IT. Em inglês, use IT em frases como It is raining.";
    follow_up = `Repita comigo: "${corrected_sentence}". Vamos tentar novamente.`;
    crazy_delta = 10;
    pronunciation_score = 89;
    xp_delta = 9;
  } else if (/\?$/.test(sentence) && /^(you|she|he|they|we)\s+\w+/.test(lower) && !/^(do|does|did|are|is|was|were|can|could|would|will|should|have|has|had)\b/.test(lower)) {
    const questionMatch = lower.match(/^(you|she|he|they|we)\s+([a-z']+)/);
    const subject = questionMatch?.[1] ?? "you";
    const verb = questionMatch?.[2] ?? "like";
    const rest = sentence.replace(/^\S+\s+\S+\s*/u, "").replace(/\?$/u, "").trim();
    const pastVerbMap: Record<string, string> = {
      went: "go",
      had: "have",
      made: "make",
      did: "do",
      saw: "see"
    };
    const isPast = Boolean(pastVerbMap[verb]) || verb.endsWith("ed");
    const auxiliary = isPast ? "Did" : subject === "she" || subject === "he" ? "Does" : "Do";
    const baseVerb = pastVerbMap[verb] ?? (isPast && verb.endsWith("ed") ? verb.replace(/ed$/u, "") : verb);

    mistake_type = "question_auxiliary";
    mistake_word = sentence.split(" ")[0] ?? null;
    correct_word = `${auxiliary} ${subject} ${baseVerb}`;
    corrected_sentence = `${auxiliary} ${subject} ${baseVerb}${rest ? ` ${rest}` : ""}?`;
    reaction = getWrongReaction("A pergunta chegou sem auxiliar. Entrou pela janela.");
    correction = "Era para usar DO, DOES ou DID. Você fez a pergunta só na entonação.";
    follow_up = `Repita comigo: "${corrected_sentence}". Vamos tentar novamente.`;
    crazy_delta = 9;
    pronunciation_score = 90;
    xp_delta = 9;
  } else if (/\bneed\s+(decide|go|make|finish|start|learn|practice)\b/.test(lower)) {
    const verb = lower.match(/\bneed\s+(decide|go|make|finish|start|learn|practice)\b/)?.[1] ?? "decide";
    mistake_type = "preposition";
    mistake_word = verb;
    correct_word = `to ${verb}`;
    corrected_sentence = sentence.replace(new RegExp(`\\bneed\\s+${verb}\\b`, "i"), `need to ${verb}`);
    reaction = getWrongReaction("Quase elegante, mas o TO caiu do trem.");
    correction = `Era para falar NEED TO ${verb.toUpperCase()} e você falou NEED ${verb.toUpperCase()}.`;
    follow_up = `Repita comigo: "${corrected_sentence}". Vamos tentar novamente.`;
    crazy_delta = 10;
    pronunciation_score = 88;
    xp_delta = 10;
  }

  const nextLevel = clampCrazyLevel((request.crazyLevel ?? 14) + crazy_delta);

  return {
    user_sentence: sentence,
    correct: mistake_type === "none" || mistake_type === "learning_request",
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
