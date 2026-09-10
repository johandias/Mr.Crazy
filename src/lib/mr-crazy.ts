export type Emotion = "calm" | "annoyed" | "irritated" | "crazy";

export type VoiceState =
  | "idle"
  | "listening"
  | "transcribing"
  | "analyzing"
  | "reacting"
  | "preparing_speech"
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

export type ConversationTurn = {
  role: "user" | "crazy";
  text: string;
};

export interface AnalysisRequest {
  sentence: string;
  previousMistakes?: string[];
  crazyLevel?: number;
  mode?: string;
  learningLevel?: LearningLevel;
  contextHistory?: ConversationTurn[];
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

function getNextConversationQuestion(level: LearningLevel, mode = "free-conversation", turnCount = 0) {
  const questionsByMode: Record<string, Record<LearningLevel, string[]>> = {
    "work-english": {
      basic: ["What do you do at work?", "Do you like your job?", "What time do you start work?"],
      intermediate: ["What was difficult at work this week?", "How did you solve that problem?", "What would you improve at work?"],
      advanced: ["Which trade-off did you handle recently?", "How would you explain that decision to your manager?", "What would you do differently next time?"]
    },
    "job-interview": {
      basic: ["What is one strength you have?", "What job do you want?", "Why do you want this role?"],
      intermediate: ["Tell me about a challenge you handled.", "What result did you get?", "How do you work under pressure?"],
      advanced: ["Tell me about a failure and what you changed.", "How do you influence people without authority?", "What would your previous manager say about you?"]
    },
    travel: {
      basic: ["Where do you want to go?", "What do you need at the hotel?", "Do you prefer the beach or the city?"],
      intermediate: ["What would you say if your flight was delayed?", "How would you ask for directions?", "What was your best trip and why?"],
      advanced: ["How would you negotiate a refund politely?", "Describe a travel problem and your plan to solve it.", "What makes a trip stressful for you?"]
    }
  };

  const fallback: Record<LearningLevel, string[]> = {
    basic: ["What did you do today?", "What do you like to do after work?", "Who did you talk to yesterday?"],
    intermediate: ["What happened next?", "Why was that important?", "How did you feel about it?"],
    advanced: ["What is your opinion about that?", "What would you change if you could?", "Can you give me one concrete example?"]
  };

  const questions = questionsByMode[mode]?.[level] ?? fallback[level];
  return questions[turnCount % questions.length] ?? questions[0];
}

function getLevelFollowUp(level: LearningLevel, sentence: string, mode?: string, turnCount = 0) {
  const nextQuestion = getNextConversationQuestion(level, mode, turnCount);
  const repeatSentence = removeFinalPunctuation(sentence);
  const prompts: Record<LearningLevel, string> = {
    basic: `Repita comigo em voz alta: "${repeatSentence}". Agora continua a conversa: "${nextQuestion}"`,
    intermediate: `Solta a voz e repete: "${repeatSentence}". Depois responde com um motivo: "${nextQuestion}"`,
    advanced: `Repita comigo para fixar o ritmo: "${repeatSentence}". Em seguida, responde com uma ideia bem clara: "${nextQuestion}"`
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
  "Mandou bem demais! Falou com propriedade, agora sim senti firmeza.",
  "Boa! Nem eu consegui achar defeito nessa. Tá afiado hoje, hein!",
  "Aí sim! Saiu límpido, natural e sem tropeço. Gostei de ver.",
  "Perfeito! Um nativo entenderia de primeira sem piscar.",
  "Olha só, o milagre da gramática aconteceu! Frase redondinha.",
  "Mandou benzão! Estrutura e ritmo no ponto certo. Continua assim!"
];

const positiveCorrections = [
  "Estrutura impecável para essa situação.",
  "Gramática no lugar e vocabulário natural.",
  "Frase fluida e correta do jeito que se fala no dia a dia.",
  "Pode soltar essa frase em qualquer conversa que vai soar super natural.",
  "Zero ressalvas. Essa passou com louvor."
];

const wrongIntros = [
  "Opa, quase lá!",
  "Peraí, peraí!",
  "Calma lá!",
  "Mandou bem na coragem, mas",
  "Peguei você no pulo!",
  "Não foi dessa vez, mas a gente ajusta rápido:",
  "Quase passou batido, só que"
];

function getPositiveReaction() {
  return pickVariant(positiveReactions);
}

function getPositiveCorrection() {
  return pickVariant(positiveCorrections);
}

function getWrongReaction(detail: string) {
  const intro = pickVariant(wrongIntros);
  return `${intro} ${detail}`;
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
          'Em inglês você precisa amarrar quem fez a ação! O jeito natural e completo é: "I searched on Google yesterday".'
      }
    },
    {
      pattern: /^work yesterday$/u,
      fix: {
        correct_word: "I worked yesterday",
        corrected_sentence: "I worked yesterday.",
        correction: 'Faltou o sujeito e colocar o verbo no passado: "I worked yesterday".'
      }
    },
    {
      pattern: /^go (to )?(school|work) yesterday$/u,
      fix: {
        correct_word: "I went there yesterday",
        corrected_sentence: "I went there yesterday.",
        correction: 'Lembra que para o passado a gente troca GO por WENT: "I went there yesterday".'
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
      correction: "Essa frase ficou pela metade! Em inglês precisa ter quem faz a ação e o verbo completo para fazer sentido."
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
  const turnCount = request.contextHistory?.filter((turn) => turn.role === "user").length ?? 0;
  const translationPhrase = extractTranslationRequest(sentence);
  const conversationRequested = isConversationRequest(sentence);
  const fragmentFix = getSentenceFragmentFix(sentence);
  let mistake_type: MistakeCategory = "none";
  let mistake_word: string | null = null;
  let correct_word: string | null = null;
  let corrected_sentence = sentence;
  let reaction = getPositiveReaction();
  let correction = `${getPositiveCorrection()} Eu entendi sua ideia e vou puxar o próximo pedaço da conversa.`;
  let follow_up = getLevelFollowUp(learningLevel, sentence, request.mode, turnCount);
  let crazy_delta = -8;
  let pronunciation_score = 91;
  let xp_delta = 18;

  if (fragmentFix) {
    mistake_type = "sentence_fragment";
    mistake_word = fragmentFix.mistake_word;
    correct_word = fragmentFix.correct_word;
    corrected_sentence = fragmentFix.corrected_sentence;
    reaction = getWrongReaction("Essa fala ficou incompleta, solta no ar.");
    correction = fragmentFix.correction;
    follow_up = getLevelFollowUp(learningLevel, corrected_sentence, request.mode, turnCount);
    crazy_delta = previousMistakes.includes("sentence_fragment") ? 16 : 13;
    pronunciation_score = 72;
    xp_delta = 7;
  } else if (translationPhrase) {
    mistake_type = "learning_request";
    corrected_sentence = translatePortuguesePhrase(translationPhrase, learningLevel);
    reaction = pickVariant([
      "Excelente pergunta! Anota essa antes que você esqueça:",
      "Perfeito! Perguntar como se diz é o melhor atalho para destravar:",
      "Boa pedida! Essa expressão é muito útil no dia a dia:"
    ]);
    correction = `Em inglês, a gente fala: "${corrected_sentence}"`;
    follow_up = `Agora repete comigo: "${corrected_sentence}"`;
    crazy_delta = -4;
    pronunciation_score = 92;
    xp_delta = 12;
  } else if (conversationRequested) {
    mistake_type = "learning_request";
    if (request.mode === "free-conversation") {
      corrected_sentence = "Can you help me say this in English?";
      reaction = "Agora sim, conversa livre de verdade.";
      correction = learningLevel === "basic"
        ? "Pode começar em português; eu monto uma frase simples em inglês para a situação."
        : "Puxe o assunto em português ou inglês e eu encaixo o treino naturalmente.";
      follow_up = "O que você quer conversar ou aprender a dizer?";
    } else {
      corrected_sentence = getConversationPrompt(learningLevel, request.mode, sentence);
      reaction = pickVariant([
        "Demorou! Bora bater um papo em inglês.",
        "Agora sim! Solta a voz e vamos praticar.",
        "Fechado! Quero ver esse vocabulário fluindo."
      ]);
      correction = `Para começar, responde pra mim em inglês: "${corrected_sentence}"`;
      follow_up = `Pode responder direto em inglês pelo microfone: "${corrected_sentence}"`;
    }
    crazy_delta = -3;
    pronunciation_score = 93;
    xp_delta = 12;
  } else if (looksPortuguese(sentence) && request.mode === "free-conversation") {
    mistake_type = "learning_request";
    corrected_sentence = "Can you help me say this in English?";
    reaction = "Entendi, pode falar em português sem drama.";
    correction = learningLevel === "basic"
      ? "Eu uso o que você contou para montar uma expressão curta e útil em inglês."
      : "Eu continuo o assunto e puxo o inglês quando ele fizer sentido.";
    follow_up = "Quer continuar a conversa ou aprender uma frase para essa situação?";
    crazy_delta = -3;
    pronunciation_score = 93;
    xp_delta = 8;
  } else if (looksPortuguese(sentence)) {
    mistake_type = "portuguese_input";
    corrected_sentence = getConversationPrompt(learningLevel, request.mode, sentence);
    reaction = getWrongReaction("Você me respondeu em português!");
    correction = `Aqui o desafio é treinar a língua. Tenta responder em inglês: "${corrected_sentence}"`;
    follow_up = `Responde em inglês essa pergunta e a gente segue: "${corrected_sentence}"`;
    crazy_delta = 6;
    pronunciation_score = 78;
    xp_delta = 4;
  } else if (/\byesterday\s+i\s+go\b/.test(lower) || /\blast\s+\w+\s+i\s+go\b/.test(lower)) {
    mistake_type = "past_tense";
    mistake_word = "go";
    correct_word = "went";
    corrected_sentence = sentence.replace(/\bgo\b/i, "went");
    reaction = getWrongReaction("Você usou o verbo no presente para falar do passado!");
    correction = 'No inglês, quando a ação já aconteceu ontem ou antes, o GO vira WENT: "went".';
    follow_up = getLevelFollowUp(learningLevel, corrected_sentence, request.mode, turnCount);
    crazy_delta = previousMistakes.includes("past_tense") ? 15 : 12;
    pronunciation_score = 82;
    xp_delta = 9;
  } else if (/\bgoed\b/.test(lower)) {
    mistake_type = "past_tense";
    mistake_word = "goed";
    correct_word = "went";
    corrected_sentence = sentence.replace(/\bgoed\b/i, "went");
    reaction = getWrongReaction("O verbo GO é irregular, ele não aceita 'ed'!");
    correction = 'O passado correto de GO é WENT, e não "goed".';
    follow_up = getLevelFollowUp(learningLevel, corrected_sentence, request.mode, turnCount);
    crazy_delta = previousMistakes.includes("past_tense") ? 16 : 13;
    pronunciation_score = 84;
    xp_delta = 9;
  } else if (/\bi\s+have\s+\d+\s+years?\b/.test(lower)) {
    const age = lower.match(/\bi\s+have\s+(\d+)\s+years?\b/)?.[1] ?? "";
    mistake_type = "age_expression";
    mistake_word = "have";
    correct_word = "am";
    corrected_sentence = age ? `I am ${age} years old.` : sentence.replace(/\bi have\b/i, "I am");
    reaction = getWrongReaction("Em inglês você não possui anos como se fossem objetos!");
    correction = 'No inglês a gente sempre usa o verbo TO BE para idade: use "I am ... years old".';
    follow_up = getLevelFollowUp(learningLevel, corrected_sentence, request.mode, turnCount);
    crazy_delta = 12;
    pronunciation_score = 86;
    xp_delta = 10;
  } else if (/\b\w+-i\b/.test(lower) || /\b(play|work|talk|stop|drink|hot)ed-i\b/.test(lower)) {
    const match = lower.match(/\b[\w-]+-i\b/)?.[0] ?? "final i";
    mistake_type = "pronunciation_epenthesis";
    mistake_word = match;
    correct_word = match.replace(/-i$/, "");
    corrected_sentence = sentence.replace(/-i\b/gi, "");
    reaction = getWrongReaction("Atenção à pronúncia: cuidado com a mania de colocar um 'i' no final!");
    correction = `Em vez de ${match}, trave o som direto na consoante final: "${correct_word}".`;
    follow_up = getLevelFollowUp(learningLevel, corrected_sentence, request.mode, turnCount);
    crazy_delta = previousMistakes.includes("pronunciation_epenthesis") ? 14 : 11;
    pronunciation_score = 73;
    xp_delta = 8;
  } else if (/\bpretend(ed|s|ing)?\b/.test(lower) && /\b(plan|migrate|do|make|start|finish|want|intend)/.test(lower)) {
    mistake_type = "false_cognate";
    mistake_word = "pretend";
    correct_word = "intend";
    corrected_sentence = sentence.replace(/\bpretend(ed|s|ing)?\b/i, "planned");
    reaction = getWrongReaction("Cuidado com a pegadinha clássica do falso cognato!");
    correction = 'PRETEND significa fingir! Se a sua ideia era dizer que pretendia fazer algo, use INTEND ou PLAN: "planned".';
    follow_up = getLevelFollowUp(learningLevel, corrected_sentence, request.mode, turnCount);
    crazy_delta = 15;
    pronunciation_score = 88;
    xp_delta = 10;
  } else if (/^(is|was|will be|would be)\s+(raining|important|necessary|possible)\b/.test(lower)) {
    mistake_type = "missing_subject";
    mistake_word = lower.split(" ")[0] ?? "is";
    correct_word = "it";
    corrected_sentence = `It ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
    reaction = getWrongReaction("A frase começou sem sujeito!");
    correction = 'No inglês a frase quase nunca pode ficar sem sujeito. Coloque o "It" na frente: "It is...".';
    follow_up = getLevelFollowUp(learningLevel, corrected_sentence, request.mode, turnCount);
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
    reaction = getWrongReaction("Faltou o verbo auxiliar da pergunta!");
    correction = `Em inglês a pergunta não é só entonação. A gente precisa colocar o auxiliar no começo: "${auxiliary} ${subject}".`;
    follow_up = getLevelFollowUp(learningLevel, corrected_sentence, request.mode, turnCount);
    crazy_delta = 9;
    pronunciation_score = 90;
    xp_delta = 9;
  } else if (/\bneed\s+(decide|go|make|finish|start|learn|practice)\b/.test(lower)) {
    const verb = lower.match(/\bneed\s+(decide|go|make|finish|start|learn|practice)\b/)?.[1] ?? "decide";
    mistake_type = "preposition";
    mistake_word = verb;
    correct_word = `to ${verb}`;
    corrected_sentence = sentence.replace(new RegExp(`\\bneed\\s+${verb}\\b`, "i"), `need to ${verb}`);
    reaction = getWrongReaction("Faltou conectar os dois verbos!");
    correction = `Depois de NEED, junte com o próximo verbo usando TO: "need to ${verb}".`;
    follow_up = getLevelFollowUp(learningLevel, corrected_sentence, request.mode, turnCount);
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
