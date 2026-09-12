import {
  analyzeEnglishSentence,
  calibrateAttemptMetrics,
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

function asFollowUp(value: unknown, fallback: string) {
  const followUp = asPortugueseString(value, fallback, 280);
  if (/["'“][^"'“”]+\?["'”]/u.test(followUp)) {
    return followUp;
  }

  const englishQuestion = followUp.match(
    /\b((?:what|where|when|why|how|who|which|do|does|did|can|could|would|will|are|is|tell me)[^?]+\?)/iu
  )?.[1];

  return englishQuestion ? followUp.replace(englishQuestion, `"${englishQuestion}"`) : followUp;
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
  return (
    /(como|qual).*(falo|falar|fala|digo|dizer|se fala)/u.test(normalized) ||
    /\b(me\s+)?(ajuda|ajude|ensina|ensine)\b.*\b(falo|falar|fala|digo|dizer)\b/u.test(normalized) ||
    /\b(quero|preciso)\b.*\b(falar|dizer)\b.*\bingles\b/u.test(normalized)
  );
}

function isUnderstandingOrPronunciationHelp(sentence: string) {
  const normalized = normalizeText(sentence);
  return (
    /\b(nao|n)\s+(entendi|entendo|compreendi|peguei)\b/u.test(normalized) ||
    /\b(me\s+)?explica(r)?\b/u.test(normalized) ||
    /\b(o\s+que\s+quer\s+dizer|o\s+que\s+significa|qual\s+foi\s+o\s+erro)\b/u.test(normalized) ||
    /\b(pronuncia|pronunciar|som|sotaque|fala(r)?\s+essa)\b/u.test(normalized)
  );
}

function isVoiceInput(request: AnalysisRequest) {
  return request.inputSource === "voice_realtime" || request.inputSource === "voice_fallback";
}

function isSameNormalizedSentence(a: string, b: string) {
  const normalizeSentence = (value: string) => normalizeText(value).replace(/[^\p{L}\p{N}\s']/gu, "").replace(/\s+/gu, " ");
  return normalizeSentence(a) === normalizeSentence(b);
}

function chooseCorrectedSentence(raw: RawAnalysis, request: AnalysisRequest, fallback: AnalysisResponse) {
  const corrected = asCorrectedSentence(raw.corrected_sentence, fallback.corrected_sentence);
  const normalized = normalizeText(corrected);

  if (
    fallback.mistake_type === "learning_request" &&
    isTranslationRequest(request.sentence) &&
    (/^how do i say\b/u.test(normalized) || /\b(help me|can you help me|say this in english)\b/u.test(normalized))
  ) {
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
  const isFreeConversation = request.mode === "free-conversation";
  const previousMistakes = (request.previousMistakes ?? []).slice(0, 8);
  const sourceRule = isVoiceInput(request)
    ? "\nFonte da entrada: voz transcrita. Avalie o texto reconhecido, nao invente erro de pronuncia que nao aparece no transcript e nao diga que errou se o transcript esta gramaticalmente correto e adequado ao contexto."
    : "";
  const contextSnippet = request.contextHistory && request.contextHistory.length > 0
    ? `\nHistorico recente da conversa:\n${request.contextHistory.slice(-4).map((turn) => `${turn.role === "user" ? "Aluno" : "Mr.Crazy"}: "${turn.text}"`).join("\n")}\n`
    : "";

  return `
Voce e Mr.Crazy, um mentor de ingles carismatico, provocador, bem-humorado e super expressivo para brasileiros.
Sua missao e fazer o aluno destravar a fala no dia a dia com ritmo de bate-papo real.
O idioma-alvo e exclusivamente o ingles americano contemporaneo (en-US). Use vocabulario, ortografia, gramatica, expressoes e formas naturais dos Estados Unidos em todas as frases, correcoes e exemplos. Normalize variantes antes de responder: sempre use "apartment" em vez de "flat", "elevator" em vez de "lift", "truck" em vez de "lorry", "vacation" em vez de "holiday", "color" em vez de "colour" e "center" em vez de "centre". Nunca repita uma variante britanica como resposta correta; se ela aparecer, identifique-a e mostre o equivalente americano.
${sourceRule}
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
2. Continuidade: Leia o historico recente e responda como se voces fossem duas pessoas conversando. Nao reinicie o assunto a cada frase.
${isFreeConversation
    ? "3. Modo conversa livre: Converse naturalmente em portugues do Brasil. Nao force o usuario a falar ingles imediatamente e nunca trate portugues como erro. Entenda a situacao e ofereca frases uteis em ingles como apoio quando fizer sentido."
    : "3. Modo de treino: Conduza e converse em portugues do Brasil com apoio e exemplos praticos em ingles americano, sem forcar o usuario a falar apenas ingles se ele quiser conversar ou perguntar algo em portugues."}
4. Conteudo primeiro: Na "reaction", reconheca a ideia do aluno em uma frase curta antes de corrigir. Ex: se ele falou do trabalho, reaja ao trabalho; se falou de viagem, reaja a viagem.
5. Reacao ("reaction"): Uma frase muito curta, direta e variada. Mantenha a personalidade descontraida, divertida e humana, como um bom amigo e mentor. Nunca seja agressivo ou use ofensas pesadas.
6. Explicacao ("correction"): No maximo uma frase curta e pratica em portugues. Mostre o erro e a forma certa, sem aula longa.
   - A correcao e mais importante que a piada. Cite o trecho exato realmente dito, mostre "errado -> correto", explique o motivo e inclua a frase americana completa corrigida. Nunca entregue apenas uma reacao generica.
7. Proximo passo ("follow_up"): No maximo uma frase curta em portugues do Brasil apoiando com a frase em ingles. Se houve erro, convide a repetir a frase certa.
8. Evite respostas padrao como "Nao achei erro importante nessa frase" quando houver contexto. Seja especifico.
   - Evite repetir "Passou!" como abertura. Varie elogios curtos quando estiver correto.
9. Se o usuario disser que nao entendeu, pedir para explicar o erro, pedir ajuda de pronuncia ou contestar seu feedback:
   - correct=true, mistake_type="learning_request"
   - Responda ao feedback primeiro, em portugues, como professor paciente e direto.
   - Explique a pergunta ou a correcao anterior em palavras simples, de uma possivel resposta americana curta e convide uma repeticao pequena.
   - Nao empurre uma nova pergunta em ingles antes de resolver a duvida.
10. Se o usuario pedir em portugues como falar algo (ex: "Como falo eu estou cansado?", "Me ajuda a falar eu quero beber agua"):
   - correct=true, mistake_type="learning_request"
   - Extraia somente a frase alvo depois de "como falo", "me ajuda a falar", "me ensina a dizer", "quero falar" etc. No exemplo "me ajuda a falar eu quero beber agua", a frase alvo e "eu quero beber agua".
   - corrected_sentence: entregue a frase natural em ingles da frase alvo (ex: "I am tired today.", "I want to drink water."). Nunca traduza o pedido inteiro e nunca comece com "How do I say..." ou "Can you help me say...".
   - Um pedido de ajuda em portugues nao e erro: nunca ridicularize e nao diga que o usuario falou errado.
11. Se o usuario cumprimentar ou pedir para conversar:
   - correct=true, mistake_type="learning_request"
   - Acolha com simpatia e naturalidade em portugues do Brasil, sem cobrar ingles imediatamente.
12. Nunca marque como correto fragmentos de fala sem sujeito/verbo (ex: "Google yesterday" -> "I searched on Google yesterday.").
13. O campo "corrected_sentence" deve conter apenas uma unica frase final ideal em ingles, sem alternativas com "or" ou "ou".
14. O campo "follow_up" deve apoiar em portugues do Brasil e, quando oportuno para o treino, convidar a repetir ou falar uma frase em ingles americano.
15. A soma de "reaction", "correction" e "follow_up" deve ter no maximo 45 palavras. Nunca escreva paragrafos.
16. No nivel basico, ajude com blocos prontos: "Para pedir as horas, diga: 'What time is it?'" ou "Para dar bom dia, diga: 'Good morning.'" Adapte esse formato livremente ao contexto real, sem se limitar aos exemplos.
17. Ensine rapido: corrija apenas o ponto de maior impacto por turno, transforme-o em uma regra reutilizavel e avance para uma nova frase curta. Nao acumule uma lista de erros na mesma resposta.
18. Se o mesmo erro aparecer duas vezes seguidas no historico recente, ensine uma alternativa de mesmo sentido ou mais facil de falar antes de pedir a repeticao corrigida.
19. Pontuacao honesta por nivel: "pronunciation_score" representa a qualidade geral da tentativa (clareza, gramatica e adequacao), nao apenas pronuncia. Nunca dê nota alta como se estivesse perfeito quando houver erro real.
   - Tolerancia no basico significa explicar com leveza e dar nota menos dura, nao marcar tudo como correto.
   - Se houver erro pequeno mas real, use correct=false, cite o ajuste e de uma nota razoavel para o nivel.
   - Se o audio/texto estiver incompleto, confuso ou nao responder ao que foi pedido, peca repeticao ou guie a frase correta; nao acate como certo.
   - Basico: erros pequenos que nao mudam o sentido podem receber 84-89 e devem ser tratados como boa comunicacao com um ajuste rapido.
   - Intermediario: erros pequenos podem receber 80-86; erros de estrutura ou que mudam o sentido recebem menos.
   - Avancado: cobre mais precisao e naturalidade; o mesmo erro deve reduzir mais a nota.
   - Pedido de ajuda nao e tentativa avaliada. Responda ensinando, sem fingir que mediu pronuncia.

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
  const hasDeterministicDiagnosis = fallback.mistake_type !== "none" && fallback.mistake_type !== "learning_request";
  const shouldKeepFallbackHelp = fallback.mistake_type === "learning_request" && isUnderstandingOrPronunciationHelp(request.sentence);

  if (!modelCorrect && mistake_type === "none") {
    mistake_type = fallback.mistake_type !== "none" ? fallback.mistake_type : "sentence_fragment";
  }

  if (fallback.mistake_type === "learning_request") {
    mistake_type = "learning_request";
  } else if (hasDeterministicDiagnosis) {
    mistake_type = fallback.mistake_type;
  }

  const correctedSentence = hasDeterministicDiagnosis || shouldKeepFallbackHelp
    ? fallback.corrected_sentence
    : chooseCorrectedSentence(raw, request, fallback);
  const mistakeWord = mistake_type === "learning_request"
    ? null
    : hasDeterministicDiagnosis
      ? fallback.mistake_word
      : asNullableString(raw.mistake_word, fallback.mistake_word);
  const correctWord = mistake_type === "learning_request"
    ? null
    : hasDeterministicDiagnosis
      ? fallback.correct_word
      : asNullableString(raw.correct_word, fallback.correct_word);
  const weakVoiceDisagreement =
    isVoiceInput(request) &&
    fallback.correct &&
    fallback.mistake_type === "none" &&
    mistake_type !== "learning_request" &&
    (!mistakeWord || !correctWord || isSameNormalizedSentence(correctedSentence, request.sentence));

  if (weakVoiceDisagreement) {
    return {
      ...fallback,
      provider: "gemini-live",
      reaction: "Pelo que foi reconhecido, a frase ficou válida.",
      correction: "O transcritor captou uma frase válida; não vou inventar erro onde não tem prova.",
      follow_up: fallback.follow_up
    };
  }

  const correct = (modelCorrect && mistake_type === "none") || mistake_type === "learning_request";
  const learningLevel = normalizeLearningLevel(request.learningLevel);
  const metrics = calibrateAttemptMetrics({
    correct,
    mistakeType: mistake_type,
    learningLevel,
    rawScore: asNumber(raw.pronunciation_score, fallback.pronunciation_score, 45, 98),
    rawXpDelta: asNumber(raw.xp_delta, fallback.xp_delta, 0, 24),
    rawCrazyDelta: asNumber(raw.crazy_delta, fallback.crazy_delta, -14, 20),
    repeated: (request.previousMistakes ?? []).includes(mistake_type)
  });
  const nextCrazyLevel = clampCrazyLevel((request.crazyLevel ?? 14) + metrics.crazyDelta);

  return {
    user_sentence: asString(raw.user_sentence, request.sentence, 180),
    correct,
    mistake_type,
    mistake_word: mistakeWord,
    correct_word: correctWord,
    corrected_sentence: correctedSentence,
    reaction: asPortugueseString(raw.reaction, fallback.reaction, 220),
    correction: hasDeterministicDiagnosis || shouldKeepFallbackHelp ? fallback.correction : asPortugueseString(raw.correction, fallback.correction, 340),
    follow_up: hasDeterministicDiagnosis || shouldKeepFallbackHelp ? fallback.follow_up : asFollowUp(raw.follow_up, fallback.follow_up),
    crazy_delta: metrics.crazyDelta,
    emotion: getEmotion(nextCrazyLevel),
    pronunciation_score: metrics.score,
    xp_delta: metrics.xpDelta,
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
