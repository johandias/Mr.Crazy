type GeminiTextResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export type BetaConversationTurn = {
  role: "user" | "crazy";
  text: string;
};

function getGeminiModels() {
  return Array.from(
    new Set(
      [process.env.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash"]
        .filter((model): model is string => Boolean(model?.trim()))
        .map((model) => model.replace(/^models\//u, "").trim())
    )
  );
}

function buildConversationPrompt(message: string, history: BetaConversationTurn[]) {
  const context = history
    .slice(-8)
    .map((turn) => `${turn.role === "user" ? "Aluno" : "Mr.Crazy"}: ${JSON.stringify(turn.text)}`)
    .join("\n");

  return `Você é Mr.Crazy, professor brasileiro de inglês para brasileiros, em uma conversa beta por mensagens.

Mantenha continuidade com o histórico e responda como um professor direto, carismático e exigente. Corrija somente o ponto mais importante quando houver erro. Incentive o aluno a falar inglês, sem humilhar, xingar ou prolongar a explicação.

Idioma: se o aluno escreve em inglês, responda em inglês simples e natural. Se ele pedir ajuda, explicar algo ou escrever em português, responda em português do Brasil e coloque a frase-modelo em inglês entre aspas.

Limites: no máximo 42 palavras; uma ou duas frases; nada de markdown, listas, JSON ou prefácios. Não invente que ouviu detalhes de áudio: a mensagem recebida é a transcrição disponível.

Histórico recente:
${context || "(início da conversa)"}

Mensagem atual do aluno:
${JSON.stringify(message)}`;
}

function fallbackReply(message: string) {
  const isLikelyEnglish = /\b(i|you|we|they|he|she|what|where|when|how|hello|hi|thanks|because|today)\b/iu.test(message);
  return isLikelyEnglish
    ? "Good. Keep it simple and tell me one more detail in English."
    : "Boa. Agora transforma essa ideia em uma frase curta em inglês e me manda. Sem enrolar.";
}

export async function getGeminiConversationReply(
  message: string,
  history: BetaConversationTurn[],
  apiKey?: string
) {
  if (!apiKey) {
    return { reply: fallbackReply(message), provider: "fallback" as const };
  }

  const prompt = buildConversationPrompt(message, history);
  let lastError: unknown = null;

  for (const model of getGeminiModels()) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.72, topP: 0.9, maxOutputTokens: 150 }
          }),
          signal: controller.signal
        }
      );

      if (!response.ok) throw new Error(`Gemini request failed with ${response.status}`);

      const data = (await response.json()) as GeminiTextResponse;
      const reply = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .replace(/\s+/gu, " ")
        .trim()
        .slice(0, 500);

      if (!reply) throw new Error("Gemini response was empty");
      return { reply, provider: "gemini" as const };
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  console.warn("[conversation] Gemini unavailable", lastError instanceof Error ? lastError.message : "unknown error");
  return { reply: fallbackReply(message), provider: "fallback" as const };
}
