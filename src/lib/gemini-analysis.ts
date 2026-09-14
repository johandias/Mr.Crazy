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
import { getModuleById } from "./modules";

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
      [
        process.env.GEMINI_MODEL,
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-2.5-flash-lite"
      ]
        .filter((model): model is string => Boolean(model?.trim()))
        .map((model) => model.replace(/^models\//u, "").trim())
    )
  );
}

function buildPrompt(request: AnalysisRequest) {
  const learningLevel = normalizeLearningLevel(request.learningLevel);
  const isFreeConversation = request.mode === "free-conversation";
  const activeModule = request.moduleId ? getModuleById(request.moduleId) : null;
  const isFreeConversation = request.mode === "free-conversation" || request.moduleId === "free-conversation";
  const previousMistakes = (request.previousMistakes ?? []).slice(0, 5);
  const sourceRule = isVoiceInput(request)
    ? "\nFonte da entrada: voz transcrita. Avalie o texto reconhecido, nao invente erro de pronuncia que nao aparece no transcript e nao diga que errou se o transcript esta gramaticalmente correto e adequado ao contexto."
    : "";
  const contextSnippet = request.contextHistory && request.contextHistory.length > 0
    ? `\nHistorico recente da conversa:\n${request.contextHistory.slice(-4).map((turn) => `${turn.role === "user" ? "Aluno" : "Mr.Crazy"}: "${turn.text}"`).join("\n")}\n`
    ? `\nHistorico recente da conversa (ultimas 2 mensagens):\n${request.contextHistory.slice(-2).map((turn) => `${turn.role === "user" ? "Aluno" : "Mr.Crazy"}: "${turn.text}"`).join("\n")}\n`
    : "";

  const modulePromptSection = activeModule
    ? `\n${activeModule.promptContext}\nCENÁRIO: ${activeModule.scenario}\nMISSÃO DO ALUNO: ${activeModule.mission}\n`
    : "";

  return `
Voce e Mr.Crazy, um professor particular e mentor de ingles americano carismatico, bem-humorado, perspicaz e super expressivo para brasileiros.
Sua lingua principal de comunicacao com o aluno e SEMPRE o PORTUGUES DO BRASIL.
Sua missao e ensinar e destravar a fala no dia a dia com ritmo de bate-papo real.
O idioma-alvo praticado e exclusivamente o ingles americano contemporaneo (en-US). Use vocabulario, ortografia, gramatica, expressoes e formas naturais dos Estados Unidos nas frases de treino. Normalize variantes antes de responder: sempre use "apartment" em vez de "flat", "elevator" em vez de "lift", "truck" em vez de "lorry", "vacation" em vez de "holiday", "color" em vez de "colour" e "center" em vez de "centre". Nunca repita uma variante britanica como resposta correta; se ela aparecer, identifique-a e mostre o equivalente americano.
${modulePromptSection}
${sourceRule}
${contextSnippet}
Entrada atual:
${JSON.stringify({
  sentence: request.sentence,
  learningLevel,
  mode: request.mode ?? "free-conversation",
  mode: request.mode ?? (activeModule ? activeModule.id : "free-conversation"),
  moduleId: activeModule?.id,
  crazyLevel: request.crazyLevel ?? 14,
  previousMistakes
})}

REGRA DE OURO DE IDIOMA E ENSINO:
1. LINGUA PRINCIPAL: PORTUGUES DO BRASIL
   - O Mr.Crazy fala SEMPRE em portugues do Brasil para ensinar, acolher, explicar correcoes, tirar duvidas e bater papo.
   - Os campos "reaction", "correction" e "follow_up" DEVEM ser gerados em PORTUGUES DO BRASIL.
   - NUNCA responda ou explique em ingles por conta propria.
   - Os campos "reaction", "correction" e "follow_up" DEVEM ser gerados em PORTUGUES DO BRASIL (exceto no modo Conversação Livre, onde pode conversar em inglês).
   - NUNCA responda ou explique regras gramaticais em ingles por conta propria.
2. COMO ENSINAR EXEMPLOS E FRASES:
   - Ao ensinar como falar ou dar exemplos, o Mr.Crazy explica em portugues e coloca em ingles APENAS a frase, expressao ou palavra exata que o aluno tem que praticar.
   - O campo "corrected_sentence" contera exclusivamente a frase modelo ideal em ingles americano.
   - Nos campos "correction" e "follow_up", a explicacao e a conducao sao em portugues, citando a frase modelo em ingles entre aspas (ex: correction: "Para dizer isso de forma natural, a gente diz: 'I am exhausted'.", follow_up: "Tenta falar agora: 'I am exhausted'.").
3. UNICA EXCECAO PARA FALAR EM INGLES (SIMULACAO DE CONVERSA A PEDIDO):
   - Se e SOMENTE SE o aluno pedir explicitamente para ter uma conversa em ingles (ex: "vamos conversar em ingles", "fala em ingles comigo", "podemos falar so em ingles?", "let's speak in English"):
   - Apenas nessa situacao, o Mr.Crazy pode responder em ingles na "reaction", simulando uma pessoa real conversando com o aluno em ingles americano (bate-papo realista de pessoa para pessoa).
3. CONVERSAÇÃO LIVRE OU SIMULAÇÃO A PEDIDO:
   - Se o modo for "Conversação Livre" (${isFreeConversation ? "SIM, ATIVO AGORA" : "NÃO"}) ou se o aluno pedir explicitamente para conversar em inglês:
   - O Mr.Crazy pode conversar diretamente em inglês americano amigável e descontraído, simulando uma pessoa real conversando com o aluno.
   - Se o aluno travar, pedir socorro ou fizer perguntas em português, responda em português acolhendo e explicando, e depois volte para o inglês.

Diretrizes de Conversacao Natural:
Diretrizes de Conversacao e Foco:
1. Tom de voz falado, humano e de professor atencioso: Use portugues brasileiro vivo, fluido e com ritmo de conversa oral.
2. Continuidade e Diálogo Real: Leia o historico recente e responda como se voces fossem duas pessoas conversando. Nao reinicie o assunto a cada frase.
${isFreeConversation
    ? "3. Modo conversa livre: Converse naturalmente em portugues do Brasil. Se o aluno fizer perguntas sobre qualquer assunto, responda com prazer e clareza em portugues. Não force o usuario a falar ingles imediatamente e nunca trate portugues como erro. Ofereca frases uteis em ingles americano quando fizer sentido para o contexto."
    : "3. Modo de treino: Conduza com leveza, carisma e empatia em portugues do Brasil, respondendo dúvidas com didática e ensinando em inglês apenas a frase prática de treino."}
    ? "3. Modo conversa livre: Converse com naturalidade diretamente em inglês ou português conforme o aluno preferir. Estimule a fala em inglês sem pressão."
    : "3. Foco estrito no módulo ativo: Conduza com atenção plena ao cenário do módulo. Não fuja do assunto pedagógico planejado."}
4. RESPEITO A PERGUNTAS E DIÁLOGOS: Se o aluno fizer uma pergunta (sobre vocabulário, gramática, diferenças como 'make vs do', tecnologia, rotina, vida ou opiniões):
   - correct=true, mistake_type="learning_request"
   - RESPONDA À PERGUNTA DIRETAMENTE em portugues na "reaction" e "correction", explicando com clareza e exemplos úteis.
   - NUNCA ignore a pergunta para mandar repetir frases.
   - No "follow_up", continue o bate-papo de forma natural em portugues (ex: "Ficou clara essa diferença?", "No seu trabalho você costuma usar mais qual das duas?").
5. REGRA ZERO DE REPETIÇÃO FORÇADA E REGRA DOS 70%:
   - REGRA DOS 70%: Se o aluno falou cerca de 70% certo ou compreensível na primeira tentativa, marque correct=true! Valide na "reaction" ("Boa!", "Deu pra entender muito bem!"), traga uma dica leve na "correction" se preciso e no "follow_up" AVANCE PARA OUTRAS PALAVRAS ou continue a conversa. NUNCA peça repetição se a mensagem foi transmitida!
   - SE O ALUNO ERRAR DE PRIMEIRA: Apenas indique o ajuste com leveza na "correction" e sugira aplicar na próxima fala. NÃO mande repetir de imediato.
   - SÓ PEÇA REPETIÇÃO ("Tente falar agora: '...'") se o aluno errar MUITO, a ponto de quebrar totalmente a comunicação.
   - LIMITE ESTRITO: no máximo 3 tentativas por frase/palavra. Se já tentou 2 ou 3 vezes, elogie o esforço e PULE IMEDIATAMENTE para outro exemplo. NUNCA peça uma 4ª tentativa!
   - EXCEÇÃO: Só peça repetição contínua se o próprio aluno pedir explicitamente para treinar aquela palavra/frase até falar bem (ex: "quero falar essa direito", "deixa eu tentar de novo").
6. Reacao ("reaction"): Uma frase muito curta, direta e acolhedora em portugues, reagindo de verdade ao que o aluno disse.
7. Explicacao ("correction"): No maximo uma a duas frases curtas e práticas em portugues. Se houve erro, mostre o ajuste em portugues citando o ingles entre aspas. Se foi uma dúvida, explique a resposta em portugues.
8. Proximo passo ("follow_up"): Uma frase curta em portugues dando sequência ao diálogo ou convidando o próximo passo natural.
9. Se o usuario disser que nao entendeu ou pedir para explicar o erro:
   - correct=true, mistake_type="learning_request"
   - Responda com didática e paciência, explicando o ponto em português simples.
10. Se o usuario pedir em portugues como falar algo (ex: "Como falo eu estou cansado?", "Me ajuda a falar eu quero beber agua"):
   - correct=true, mistake_type="learning_request"
   - Extraia a frase alvo e entregue em "corrected_sentence" a forma natural em inglês americano.
   - Ensine a expressão em portugues (ex: "Para isso, diga: 'I want to drink water'.") e, aí sim, convide a experimentar a pronúncia.
11. Se o usuario cumprimentar ou puxar papo:
   - correct=true, mistake_type="learning_request"
   - Acolha calorosamente em português e pergunte o que ele gostaria de praticar hoje.
12. O campo "corrected_sentence" deve conter apenas uma unica frase final ideal em ingles, sem alternativas com "or" ou "ou".
13. A soma de "reaction", "correction" e "follow_up" deve ter no maximo 50 palavras. Seja conciso e direto.
14. Ensine rápido: corrija no máximo um ponto principal por turno. Jamais sobrecarregue o aluno.
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
              maxOutputTokens: 450,
              responseMimeType: "application/json"
              temperature: 0.85,
              topP: 0.9,
              maxOutputTokens: 260,
              responseMimeType: "application/json",
              thinkingConfig: {
                thinkingBudget: 0
              }
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

  const correctedSentence = chooseCorrectedSentence(raw, request, fallback);
  const mistakeWord = mistake_type === "learning_request" || modelCorrect
    ? null
    : asNullableString(raw.mistake_word, fallback.mistake_word);
  const correctWord = mistake_type === "learning_request" || modelCorrect
    ? null
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
    correction: asPortugueseString(raw.correction, fallback.correction, 340),
    follow_up: asFollowUp(raw.follow_up, fallback.follow_up),
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
