import {
  analyzeEnglishSentence,
  clampCrazyLevel,
  getEmotion,
  normalizeLearningLevel,
  type AnalysisRequest,
  type AnalysisResponse,
  type MistakeCategory
} from "./mr-crazy";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type RawAnalysis = Partial<Omit<AnalysisResponse, "emotion" | "mistake_type" | "provider">> & {
  emotion?: string;
  mistake_type?: string;
};

const allowedMistakes = new Set<MistakeCategory>([
  "past_tense",
  "age_expression",
  "pronunciation_epenthesis",
  "false_cognate",
  "missing_subject",
  "question_auxiliary",
  "preposition",
  "sentence_fragment",
  "portuguese_input",
  "learning_request",
  "none"
]);

const mistakeAliases: Record<string, MistakeCategory> = {
  fragment: "sentence_fragment",
  incomplete_sentence: "sentence_fragment",
  sentence_incomplete: "sentence_fragment",
  missing_context: "sentence_fragment",
  verb_tense: "past_tense",
  tense: "past_tense",
  missing_auxiliary: "question_auxiliary",
  subject_missing: "missing_subject",
  portuguese: "portuguese_input",
  pt_br: "portuguese_input",
  translation_request: "learning_request",
  conversation_request: "learning_request",
  request: "learning_request",
  ok: "none",
  correct: "none"
};

function asString(value: unknown, fallback: string, maxLength = 320) {
  if (typeof value !== "string") return fallback;
  const clean = value.trim();
  return clean ? clean.slice(0, maxLength) : fallback;
}

function cleanPortugueseText(value: string) {
  return value
    .replace(/\bcabaça\b/giu, "cabeça")
    .replace(/\bcabeca\b/giu, "cabeça")
    .replace(/\bpreguicoso\b/giu, "preguiçoso")
    .replace(/\bvoce\b/giu, "você")
    .replace(/\busei\s+(['"])/giu, "use: $1");
}

function asPortugueseString(value: unknown, fallback: string, maxLength = 320) {
  return cleanPortugueseText(asString(value, fallback, maxLength));
}

function asNullableString(value: unknown, fallback: string | null, maxLength = 120) {
  if (value === null) return null;
  if (typeof value !== "string") return fallback;
  const clean = value.trim();
  return clean ? clean.slice(0, maxLength) : fallback;
}

function asCorrectedSentence(value: unknown, fallback: string) {
  const sentence = asString(value, fallback, 220);
  return /[.!?]\s+(or|ou)\s+/iu.test(sentence) ? fallback : sentence;
}

function asNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function normalizeMistake(value: unknown, fallback: MistakeCategory) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase().replace(/[-\s]/gu, "_");
  if (allowedMistakes.has(normalized as MistakeCategory)) {
    return normalized as MistakeCategory;
  }

  return mistakeAliases[normalized] ?? fallback;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .trim();
}

function isTranslationRequest(sentence: string) {
  const normalized = normalizeText(sentence);
  return /(como|qual).*(falo|falar|fala|digo|dizer|se fala)/u.test(normalized);
}

function chooseCorrectedSentence(raw: RawAnalysis, request: AnalysisRequest, fallback: AnalysisResponse) {
  const corrected = asCorrectedSentence(raw.corrected_sentence, fallback.corrected_sentence);
  const normalized = normalizeText(corrected);

  if (fallback.mistake_type === "learning_request" && isTranslationRequest(request.sentence) && /^how do i say\b/u.test(normalized)) {
    return fallback.corrected_sentence;
  }

  return corrected;
}

function stripJsonFences(text: string) {
  const clean = text.replace(/^```(?:json)?/iu, "").replace(/```$/u, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini response did not include JSON");
  }

  return clean.slice(start, end + 1);
}

function getGeminiModels() {
  return Array.from(
    new Set(
      [process.env.GEMINI_MODEL, "gemini-2.5-flash-lite", "gemini-2.0-flash"]
        .filter((model): model is string => Boolean(model?.trim()))
        .map((model) => model.replace(/^models\//u, "").trim())
    )
  );
}

function buildPrompt(request: AnalysisRequest) {
  const learningLevel = normalizeLearningLevel(request.learningLevel);
  const previousMistakes = (request.previousMistakes ?? []).slice(0, 8);
  const contextSnippet = request.contextHistory && request.contextHistory.length > 0
    ? `\nHistorico recente da conversa:\n${request.contextHistory.slice(-4).map((turn) => `${turn.role === "user" ? "Aluno" : "Mr.Crazy"}: "${turn.text}"`).join("\n")}\n`
    : "";

  return `
Voce e Mr.Crazy, um mentor de ingles carismatico, provocador, bem-humorado e super expressivo para brasileiros.
Sua missao e fazer o aluno destravar a fala no dia a dia com ritmo de bate-papo real.
${contextSnippet}
Entrada atual:
${JSON.stringify({
  sentence: request.sentence,
  learningLevel,
  mode: request.mode ?? "free-conversation",
  crazyLevel: request.crazyLevel ?? 14,
  previousMistakes
})}

Diretrizes de Conversacao Natural:
1. Tom de voz falado e humano: Use portugues brasileiro vivo, fluido e com ritmo de conversa oral (evite tom engessado de manual escolar).
2. Continuidade: Conecte seu comentário com o que foi falado antes, tornando a conversa um bate-papo real.
3. Reacao ("reaction"): Curta, direta, cheia de personalidade e espontaneidade. Se acertou, celebre com humor e entusiasmo (ex: "Mandou bem demais!", "Sensacional, falou com propriedade!", "Aí sim, sem gaguejar!"). Se errou, reaja de forma leve, divertida e variada (ex: "Opa, quase lá!", "Calma aí, peguei você no pulo!", "Mandou bem na coragem, mas faltou um detalhe!").
4. Explicacao ("correction"): Explique de forma prática e coloquial o ajuste em portugues, destacando o modelo correto em ingles entre aspas (ex: 'Em vez de "I have 20 years", em ingles a gente sempre usa o verbo to be: "I am 20 years old".').
5. Proximo passo ("follow_up"): Uma instrucao animada convidando o aluno a falar em voz alta e continuar a conversa (ex: 'Repete comigo em voz alta: "I am 20 years old". Vai!').
5. Se o usuario pedir em portugues como falar algo (ex: "Como falo eu estou cansado?"):
   - correct=true, mistake_type="learning_request"
   - corrected_sentence: entregue a frase natural em ingles (ex: "I am tired today."). Nunca comece com "How do I say...".
6. Se o usuario pedir para conversar:
   - correct=true, mistake_type="learning_request"
   - Crie uma pergunta estimulante em ingles no campo corrected_sentence adequada ao nivel (${learningLevel}).
7. Nunca marque como correto fragmentos de fala sem sujeito/verbo (ex: "Google yesterday" -> "I searched on Google yesterday.").
8. O campo "corrected_sentence" deve conter apenas uma unica frase final ideal em ingles, sem alternativas com "or" ou "ou".

Retorne somente JSON valido neste formato:
{
  "user_sentence": "frase original",
  "correct": false,
  "mistake_type": "past_tense | age_expression | pronunciation_epenthesis | false_cognate | missing_subject | question_auxiliary | preposition | sentence_fragment | portuguese_input | learning_request | none",
  "mistake_word": "palavra/frase errada ou null",
  "correct_word": "palavra/frase correta ou null",
  "corrected_sentence": "frase corrigida ou frase alvo em ingles",
  "reaction": "reacao falada em portugues com personalidade",
  "correction": "explicacao amigavel e direta em portugues",
  "follow_up": "chamada falada para o aluno repetir e continuar",
  "crazy_delta": 10,
  "pronunciation_score": 78,
  "xp_delta": 8
}
`.trim();
}

async function requestGemini(apiKey: string, prompt: string) {
  let lastError: unknown = null;

  for (const model of getGeminiModels()) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.95,
              topP: 0.95,
              maxOutputTokens: 900,
              responseMimeType: "application/json"
            }
          }),
          signal: controller.signal
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini request failed with ${response.status}`);
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
      if (!text) {
        throw new Error("Gemini response was empty");
      }

      return JSON.parse(stripJsonFences(text)) as RawAnalysis;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new Error("Gemini request failed");
}

function normalizeGeminiAnalysis(raw: RawAnalysis, request: AnalysisRequest, fallback: AnalysisResponse): AnalysisResponse {
  const modelCorrect = typeof raw.correct === "boolean" ? raw.correct : fallback.correct;
  let mistake_type = normalizeMistake(raw.mistake_type, modelCorrect ? "none" : fallback.mistake_type);

  if (!modelCorrect && mistake_type === "none") {
    mistake_type = fallback.mistake_type !== "none" ? fallback.mistake_type : "sentence_fragment";
  }

  if (fallback.mistake_type === "learning_request") {
    mistake_type = "learning_request";
  } else if (fallback.mistake_type === "sentence_fragment") {
    mistake_type = "sentence_fragment";
  }

  const correct = (modelCorrect && mistake_type === "none") || mistake_type === "learning_request";
  let crazy_delta = asNumber(raw.crazy_delta, fallback.crazy_delta, -14, 20);
  if (!correct && crazy_delta <= 0) {
    crazy_delta = fallback.crazy_delta > 0 ? fallback.crazy_delta : 10;
  }
  if (correct && crazy_delta > 0) {
    crazy_delta = -4;
  }

  const nextCrazyLevel = clampCrazyLevel((request.crazyLevel ?? 14) + crazy_delta);

  return {
    user_sentence: asString(raw.user_sentence, request.sentence, 180),
    correct,
    mistake_type,
    mistake_word: mistake_type === "learning_request" ? null : asNullableString(raw.mistake_word, fallback.mistake_word),
    correct_word: mistake_type === "learning_request" ? null : asNullableString(raw.correct_word, fallback.correct_word),
    corrected_sentence: chooseCorrectedSentence(raw, request, fallback),
    reaction: asPortugueseString(raw.reaction, fallback.reaction, 220),
    correction: asPortugueseString(raw.correction, fallback.correction, 340),
    follow_up: asPortugueseString(raw.follow_up, fallback.follow_up, 260),
    crazy_delta,
    emotion: getEmotion(nextCrazyLevel),
    pronunciation_score: asNumber(raw.pronunciation_score, fallback.pronunciation_score, 45, 98),
    xp_delta: asNumber(raw.xp_delta, fallback.xp_delta, 0, 24),
    provider: "gemini-live"
  };
}

export async function analyzeEnglishSentenceLive(request: AnalysisRequest, apiKey: string): Promise<AnalysisResponse> {
  const fallback = analyzeEnglishSentence(request, "gemini-fallback");

  try {
    const raw = await requestGemini(apiKey, buildPrompt(request));
    const online = normalizeGeminiAnalysis(raw, request, fallback);

    if (!fallback.correct && online.correct) {
      return fallback;
    }

    return online;
  } catch {
    return fallback;
  }
}
