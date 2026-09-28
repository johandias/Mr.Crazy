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

export type ConversationUserProfile = {
  nickname?: string;
  level?: string;
  difficulties?: string[];
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

function buildConversationPrompt(
  message: string,
  history: BetaConversationTurn[],
  profile?: ConversationUserProfile
) {
  const studentName = profile?.nickname || "Aluno";
  const context = history
    .slice(-8)
    .map((turn) => `${turn.role === "user" ? studentName : "Mr.Crazy"}: ${JSON.stringify(turn.text)}`)
    .join("\n");

  const studentContext = profile?.nickname
    ? `\nAluno: "${profile.nickname}" (nível: ${profile.level || "básico"}, foco: ${profile.difficulties?.join(", ") || "pronúncia e fluência"}). Chame-o pelo nome quando for natural e incentive-o.`
    : "";

  return `Você é Mr.Crazy, professor brasileiro de inglês para brasileiros, em uma conversa beta por mensagens.${studentContext}

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
  apiKey?: string,
  profile?: ConversationUserProfile
) {
  if (!apiKey) {
    return { reply: fallbackReply(message), provider: "fallback" as const };
  }

  const prompt = buildConversationPrompt(message, history, profile);
  let lastError: unknown = null;

  for (const model of getGeminiModels()) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9_000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 96
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timer);

      if (!response.ok) {
        lastError = new Error(`Gemini status ${response.status}`);
        continue;
      }

      const payload = (await response.json()) as GeminiTextResponse;
      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

      if (!text) {
        lastError = new Error("Gemini empty response");
        continue;
      }

      return {
        reply: text.replace(/\s+/gu, " ").trim(),
        provider: "gemini" as const,
        model
      };
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
    }
  }

  console.warn("[gemini-conversation] All candidate models failed, returning fallback:", lastError);
  return { reply: fallbackReply(message), provider: "fallback" as const };
}
