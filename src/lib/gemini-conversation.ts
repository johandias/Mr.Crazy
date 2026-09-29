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

export type ConversationOption = {
  textEn: string;
  textPt?: string;
};

export type ConversationCoachReply = {
  reply: string;
  correction?: string;
  explanationPt?: string;
  followUp?: string;
  options?: ConversationOption[];
};

function getGeminiModels() {
  return Array.from(
    new Set(
      [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"]
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
  const rawLevel = (profile?.level || "básico").toLowerCase();
  const isBeginner = !profile?.level || rawLevel.includes("básico") || rawLevel.includes("basic") || rawLevel.includes("iniciante");
  const isAdvanced = rawLevel.includes("avançad") || rawLevel.includes("advance");

  const context = history
    .slice(-12)
    .map((turn) => `${turn.role === "user" ? studentName : "Mr.Crazy"}: ${JSON.stringify(turn.text)}`)
    .join("\n");

  const studentContext = `\nAluno: "${studentName}" (nível: ${isBeginner ? "básico/iniciante" : isAdvanced ? "avançado" : "intermediário"}${profile?.difficulties?.length ? `, foco: ${profile.difficulties.join(", ")}` : ""}).`;

  const pedagogicalGuidelines = isBeginner
    ? `DIRETRIZES CRUCIAIS PARA ALUNO INICIANTE:
- Explique o sentido da conversa e da pergunta em português (no campo 'explanationPt' ou contextualizando) para que o iniciante compreenda o que está sendo discutido e não fique desorientado.
- Seja amigável, encorajador e dê clareza sobre o cenário da conversa.
- OBRIGATÓRIO: Sempre forneça 2 a 4 alternativas práticas de resposta no array 'options'. Cada alternativa deve conter 'textEn' (frase em inglês pronta para o aluno falar) e 'textPt' (tradução em português da frase) para ele poder selecionar e responder na hora sem ter que digitar do zero!`
    : isAdvanced
    ? `DIRETRIZES PARA ALUNO AVANÇADO:
- Mantenha a conversa fluente em inglês com vocabulário rico, connected speech e expressões naturais.
- Foque em sutilezas, precisão e fluência; explique apenas nuances no 'explanationPt'.
- Forneça 2 a 3 alternativas de resposta avançadas/idiomáticas em 'options' para enriquecer o repertório.`
    : `DIRETRIZES PARA ALUNO INTERMEDIÁRIO:
- Responda em inglês natural, dê explicações pontuais em português quando corrigir ou contextualizar, e forneça 2 a 3 alternativas de resposta em 'options'.`;

  return `Você é Mr.Crazy, professor de inglês para brasileiros, conduzindo uma conversa interativa por mensagens.${studentContext}

Objetivo: transformar cada turno em prática real e envolvente. Seja direto, carismático, dinâmico e focado no aprendizado. Você recebe apenas texto digitado ou transcrito.

${pedagogicalGuidelines}

Decisão pedagógica:
- Inglês correto: responda naturalmente em inglês e faça uma pergunta curta relacionada.
- Erro importante: responda ao sentido, corrija apenas o maior erro em 'correction', explique brevemente em português em 'explanationPt' e peça reutilização.
- Mensagem em português ou início de conversa (ex: "vamos lá", "bora", "oi"): responda com energia em português, ensine uma frase-modelo natural em inglês e convide o aluno a usá-la.
- Não corrija estilo ou detalhes mínimos quando a mensagem estiver clara. Não repita a mesma pergunta do histórico.

REGRA ABSOLUTA DE COMPLETUDE:
- NUNCA termine uma frase pela metade.
- NUNCA encerre sua resposta com vírgula (,), dois-pontos (:) ou conectivo solto.
- Toda frase DEVE ser completa, coerente e finalizada com ponto (. ! ?).

Responda SOMENTE com JSON válido neste formato:
{"reply":"resposta principal completa","correction":null,"explanationPt":null,"followUp":"pergunta ou desafio curto","options":[{"textEn":"frase em inglês","textPt":"tradução em português"}]}

Regras dos campos:
- reply: frase completa e natural (12 a 35 palavras). NUNCA corte no meio.
- correction: frase inglesa corrigida ou frase-modelo para o aluno; null quando não houver correção.
- explanationPt: explicação curta em português (até 25 palavras); para iniciante, explique o que foi perguntado ou o sentido; null se avançado sem correção.
- followUp: uma pergunta ou desafio curto em inglês para manter a conversa fluindo.
- options: array com 2 a 4 alternativas de resposta úteis com 'textEn' e 'textPt' para o aluno responder com um toque sem precisar digitar.
- Nada de markdown fences, listas ou campos extras.

Histórico recente:
${context || "(início da conversa)"}

Mensagem atual do aluno:
${JSON.stringify(message)}`;
}

function cleanField(value: unknown, maxLength: number, maxWords?: number): string | undefined {
  if (typeof value !== "string") return undefined;
  let text = value.replace(/\s+/gu, " ").trim();
  if (!text) return undefined;

  // Remove qualquer pontuação suspensiva de corte abrupto no final
  text = text.replace(/[,;:\-\s]+$/u, "").trim();

  // Limite seguro de caracteres: tenta cortar apenas na última pontuação completa
  if (text.length > maxLength) {
    const lastBoundary = Math.max(
      text.lastIndexOf(". ", maxLength),
      text.lastIndexOf("! ", maxLength),
      text.lastIndexOf("? ", maxLength)
    );
    if (lastBoundary > maxLength * 0.4) {
      text = text.slice(0, lastBoundary + 1).trim();
    } else {
      text = text.slice(0, maxLength).replace(/[,;:\-\s]+$/u, "").trim();
    }
  }

  // Se exceder maxWords com folga, preserva orações completas
  if (maxWords) {
    const words = text.split(" ");
    if (words.length > maxWords + 6) {
      const candidate = words.slice(0, maxWords).join(" ");
      const lastSentence = Math.max(
        candidate.lastIndexOf("."),
        candidate.lastIndexOf("!"),
        candidate.lastIndexOf("?")
      );
      if (lastSentence > candidate.length * 0.5) {
        text = candidate.slice(0, lastSentence + 1).trim();
      } else {
        text = candidate.replace(/[,;:\-\s]+$/u, "").trim();
      }
    }
  }

  // Se a frase não tiver pontuação final após o corte seguro, adiciona ponto final
  if (text && !/[.!?…"']$/u.test(text)) {
    text = `${text}.`;
  }

  return text || undefined;
}

function isSuspiciouslyTruncated(text: string): boolean {
  if (!text) return true;
  const clean = text.trim();
  // Menos de 8 caracteres é muito curto para uma resposta de tutor (ex: "Boa,", "Ok.")
  if (clean.length < 8) return true;
  // Termina com vírgula ou conector solto
  if (/[,;:\-]$/u.test(clean)) return true;
  // Apenas saudação solta cortada
  if (/^(boa|olha|entendi|ok|sim|legal|opa|beleza)[,;:\s.]*$/iu.test(clean)) return true;
  // Contém resíduo de JSON não parseado
  if (clean.includes('{"') || clean.includes('"reply"')) return true;
  return false;
}

export function generateContextualOptions(followUp?: string, reply?: string, isBeginner = true): ConversationOption[] {
  const combined = `${reply || ""} ${followUp || ""}`.toLowerCase();

  if (combined.includes("game") || combined.includes("play") || combined.includes("jogo")) {
    return [
      { textEn: "I love playing RPG and action games on PC.", textPt: "Adoro jogar RPG e jogos de ação no PC." },
      { textEn: "I prefer casual and multiplayer games with friends.", textPt: "Prefiro jogos casuais e multiplayer com amigos." },
      { textEn: "Actually, I don't play much, I prefer movies.", textPt: "Na verdade não jogo muito, prefiro ver filmes." }
    ];
  }

  if (combined.includes("restaurant") || combined.includes("food") || combined.includes("eat") || combined.includes("comida") || combined.includes("order")) {
    return [
      { textEn: "Can I get a burger and a coke, please?", textPt: "Quero um hambúrguer e uma coca, por favor." },
      { textEn: "Could you give us a few more minutes, please?", textPt: "Poderia nos dar mais alguns minutos, por favor?" },
      { textEn: "What do you recommend as the house special?", textPt: "O que você recomenda como prato especial?" }
    ];
  }

  if (combined.includes("work") || combined.includes("job") || combined.includes("trabalho") || combined.includes("career") || combined.includes("interview")) {
    return [
      { textEn: "I work in technology and I want to improve my speaking.", textPt: "Trabalho com tecnologia e quero melhorar minha fala." },
      { textEn: "I'm currently preparing for international job interviews.", textPt: "Estou me preparando para entrevistas internacionais." },
      { textEn: "Can you help me talk about my daily tasks?", textPt: "Pode me ajudar a falar sobre meu dia a dia no trabalho?" }
    ];
  }

  if (combined.includes("travel") || combined.includes("trip") || combined.includes("flight") || combined.includes("hotel") || combined.includes("viagem") || combined.includes("airport")) {
    return [
      { textEn: "Excuse me, where is the gate for international flights?", textPt: "Com licença, onde fica o portão para voos internacionais?" },
      { textEn: "I have a hotel reservation under my name.", textPt: "Tenho uma reserva de hotel no meu nome." },
      { textEn: "How do I take a taxi or train to downtown?", textPt: "Como pego um táxi ou trem para o centro?" }
    ];
  }

  if (combined.includes("where are you from") || combined.includes("live") || combined.includes("de onde") || combined.includes("city")) {
    return [
      { textEn: "I'm from Brazil, living in a vibrant city.", textPt: "Sou do Brasil, moro numa cidade vibrante." },
      { textEn: "I live in Brazil, and I'd love to visit other countries.", textPt: "Moro no Brasil e adoraria visitar outros países." },
      { textEn: "I'm from São Paulo. Have you ever been to Brazil?", textPt: "Sou de São Paulo. Você já esteve no Brasil?" }
    ];
  }

  if (combined.includes("how are you") || combined.includes("doing today") || combined.includes("como vai") || combined.includes("tudo bem")) {
    return [
      { textEn: "I'm doing really great, thank you! How about you?", textPt: "Estou ótimo, obrigado! E com você?" },
      { textEn: "A bit tired today, but ready to practice English!", textPt: "Um pouco cansado hoje, mas pronto para treinar inglês!" },
      { textEn: "Everything is good! Let's practice a real conversation.", textPt: "Tudo bem! Vamos praticar uma conversa real." }
    ];
  }

  if (combined.includes("name") || combined.includes("introduce") || combined.includes("apresent")) {
    return [
      { textEn: "Hi! My name is Johan and I'm learning English.", textPt: "Oi! Meu nome é Johan e estou aprendendo inglês." },
      { textEn: "Nice to meet you, Mr. Crazy! Let's get started.", textPt: "Prazer em te conhecer, Mr. Crazy! Vamos começar." },
      { textEn: "Como digo minha profissão em inglês?", textPt: "Pedir ajuda em português sobre apresentação." }
    ];
  }

  if (isBeginner) {
    return [
      { textEn: "Yes, exactly! Let's practice that.", textPt: "Sim, exatamente! Vamos praticar isso." },
      { textEn: "I understand. Can you give me an example?", textPt: "Entendi. Pode me dar um exemplo prático?" },
      { textEn: "Como falo isso de forma simples em inglês?", textPt: "Pedir ajuda e explicação em português." }
    ];
  }

  return [
    { textEn: "That makes sense. Let's explore that deeper.", textPt: "Faz sentido. Vamos aprofundar nesse assunto." },
    { textEn: "I see your point. What do you think about it?", textPt: "Entendo seu ponto. O que você acha sobre isso?" },
    { textEn: "Could you challenge me with a harder question?", textPt: "Pode me desafiar com uma pergunta mais difícil?" }
  ];
}

function normalizeOptions(rawOptions: unknown): ConversationOption[] | undefined {
  if (!Array.isArray(rawOptions)) return undefined;
  const result: ConversationOption[] = [];
  for (const item of rawOptions) {
    if (typeof item === "string" && item.trim()) {
      const match = item.match(/^(.*?)(?:\s*\((.*?)\)|\s*[-–—]\s*(.*))?$/u);
      const textEn = cleanField(match?.[1] || item, 140, 20);
      const textPt = cleanField(match?.[2] || match?.[3], 140, 20);
      if (textEn) result.push({ textEn, textPt });
    } else if (item && typeof item === "object") {
      const opt = item as { textEn?: unknown; textPt?: unknown; text?: unknown; pt?: unknown };
      const textEn = cleanField(opt.textEn || opt.text, 140, 20);
      const textPt = cleanField(opt.textPt || opt.pt, 140, 20);
      if (textEn) result.push({ textEn, textPt });
    }
  }
  return result.length > 0 ? result.slice(0, 4) : undefined;
}

function extractJsonFields(raw: string): Partial<ConversationCoachReply> | null {
  const extract = (pattern: RegExp) => {
    const match = raw.match(pattern);
    return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, " ").trim() : undefined;
  };

  const reply = extract(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (!reply) return null;

  let options: ConversationOption[] | undefined;
  const optionsMatch = raw.match(/"options"\s*:\s*(\[[^\]]*\])/);
  if (optionsMatch) {
    try {
      options = normalizeOptions(JSON.parse(optionsMatch[1]));
    } catch {
      // ignore
    }
  }

  return {
    reply,
    correction: extract(/"correction"\s*:\s*"((?:[^"\\]|\\.)*)"/),
    explanationPt: extract(/"explanationPt"\s*:\s*"((?:[^"\\]|\\.)*)"/),
    followUp: extract(/"followUp"\s*:\s*"((?:[^"\\]|\\.)*)"/),
    options
  };
}

function normalizeCoachReply(value: unknown, isBeginner = true): ConversationCoachReply | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ConversationCoachReply>;
  const reply = cleanField(candidate.reply, 320, 35);
  if (!reply || isSuspiciouslyTruncated(reply)) return null;

  const followUp = cleanField(candidate.followUp, 240, 25);
  const options = normalizeOptions(candidate.options) ?? generateContextualOptions(followUp, reply, isBeginner);

  return {
    reply,
    correction: cleanField(candidate.correction, 240, 25),
    explanationPt: cleanField(candidate.explanationPt, 220, 25),
    followUp,
    options
  };
}

function parseCoachReply(text: string, isBeginner = true): ConversationCoachReply | null {
  const normalizedText = text.replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, "").trim();

  // 1. Tentar parse padrão de JSON
  try {
    const parsed = JSON.parse(normalizedText);
    const normalized = normalizeCoachReply(parsed, isBeginner);
    if (normalized) return normalized;
  } catch {
    // 2. Se JSON.parse falhar, tentar extrair campos via regex
    const extracted = extractJsonFields(normalizedText);
    if (extracted) {
      const normalized = normalizeCoachReply(extracted, isBeginner);
      if (normalized) return normalized;
    }
  }

  // 3. Se for texto puro sem JSON, mas for uma resposta completa e válida
  const cleaned = cleanField(normalizedText, 320, 35);
  if (cleaned && !isSuspiciouslyTruncated(cleaned)) {
    return {
      reply: cleaned,
      options: generateContextualOptions(undefined, cleaned, isBeginner)
    };
  }

  return null;
}

function fallbackReply(message: string, profile?: ConversationUserProfile): ConversationCoachReply {
  const cleanMsg = message.trim();
  const rawLevel = (profile?.level || "básico").toLowerCase();
  const isBeginner = !profile?.level || rawLevel.includes("básico") || rawLevel.includes("basic") || rawLevel.includes("iniciante");
  const isLikelyEnglish = /\b(i|you|we|they|he|she|my|am|is|are|have|like|want|can|do|did|work|live|what|where|when|how|hello|hi|good|thanks|because|today)\b/iu.test(cleanMsg);

  // Erros clássicos de brasileiros
  const ageMatch = cleanMsg.match(/\bi have (\d{1,3}) years(?: old)?\b/iu);
  if (ageMatch) {
    return {
      reply: "I understood you. Use the verb 'to be' for age in English.",
      correction: `I am ${ageMatch[1]} years old.`,
      explanationPt: "Idade em inglês usa o verbo to be.",
      followUp: "Now tell me where you are from.",
      options: [
        { textEn: `I am ${ageMatch[1]} years old and I live in Brazil.`, textPt: `Tenho ${ageMatch[1]} anos e moro no Brasil.` },
        { textEn: `I'm ${ageMatch[1]}. How about you, Mr. Crazy?`, textPt: `Tenho ${ageMatch[1]}. E você, Mr. Crazy?` },
        { textEn: "I'm from São Paulo, Brazil.", textPt: "Sou de São Paulo, Brasil." }
      ]
    };
  }

  if (/\bi am agree\b/iu.test(cleanMsg)) {
    return {
      reply: "Your idea is clear. 'Agree' is already a verb.",
      correction: cleanMsg.replace(/\bi am agree\b/iu, "I agree"),
      explanationPt: "Não use am antes de agree.",
      followUp: "What exactly do you agree with?",
      options: [
        { textEn: "I agree with you completely!", textPt: "Concordo com você totalmente!" },
        { textEn: "I agree that practicing speaking is key.", textPt: "Concordo que praticar a fala é fundamental." },
        { textEn: "Actually, I have another point of view.", textPt: "Na verdade, tenho outro ponto de vista." }
      ]
    };
  }

  // Início ou incentivo à conversa em português (ex: "Vamos lá", "Bora", "Começar")
  if (/^(vamos\s*l[aá]|bora|come[cç]ar|iniciar|pronto|ready|let's go|lets go|ok|beleza|sim)\b/iu.test(cleanMsg)) {
    return {
      reply: "Bora! Vamos começar nossa prática agora mesmo.",
      correction: "Hi Mr. Crazy, I'm ready to practice!",
      explanationPt: "Diga essa frase para abrir uma conversa com energia.",
      followUp: "Now tell me: what is your name and what do you do?",
      options: [
        { textEn: "Hi Mr. Crazy, I'm ready to practice!", textPt: "Oi Mr. Crazy, estou pronto para praticar!" },
        { textEn: "I'd like to practice ordering food at a restaurant.", textPt: "Quero treinar pedir comida num restaurante." },
        { textEn: "Can we practice a real job interview?", textPt: "Podemos treinar uma entrevista de emprego real?" }
      ]
    };
  }

  // Cumprimento em português
  if (/^(oi|ol[aá]|e a[ií]|fala|hey|hello|hi)\b/iu.test(cleanMsg)) {
    return {
      reply: "Fala! Bom ver você por aqui.",
      correction: "Hello Mr. Crazy! Nice to meet you.",
      explanationPt: "Cumprimento natural para abrir a conversa.",
      followUp: "How are you doing today?",
      options: [
        { textEn: "I'm doing great, thank you! How about you?", textPt: "Estou ótimo, obrigado! E com você?" },
        { textEn: "A bit tired today, but ready to practice English.", textPt: "Um pouco cansado hoje, mas pronto para treinar inglês." },
        { textEn: "Good! Let's talk about my favorite games and series.", textPt: "Bem! Vamos falar sobre meus jogos e séries favoritos." }
      ]
    };
  }

  if (isLikelyEnglish) {
    return {
      reply: "Good. Your message is clear and natural.",
      followUp: "Tell me one more detail about that.",
      options: generateContextualOptions("Tell me one more detail about that.", "Good.", isBeginner)
    };
  }

  if (/apresent|conhecer|nome/iu.test(cleanMsg)) {
    return {
      reply: "Vamos praticar uma apresentação simples e direta.",
      correction: "Hi, I'm [your name]. Nice to meet you.",
      explanationPt: "Use uma frase curta e natural para se apresentar.",
      followUp: "Agora personalize com o seu nome e envie em inglês.",
      options: [
        { textEn: "Hi, I'm Johan. Nice to meet you!", textPt: "Oi, sou o Johan. Prazer em te conhecer!" },
        { textEn: "Hello Mr. Crazy, I live in Brazil and work in tech.", textPt: "Olá Mr. Crazy, moro no Brasil e trabalho com tecnologia." },
        { textEn: "Como digo minha profissão em inglês?", textPt: "Pedir ajuda em português sobre apresentação." }
      ]
    };
  }

  return {
    reply: "Entendi perfeitamente. Vamos transformar essa ideia em inglês útil.",
    correction: "I want to talk about this.",
    explanationPt: "Use esta estrutura para começar.",
    followUp: "Complete a frase em inglês com o assunto que você quer treinar.",
    options: [
      { textEn: "I want to practice ordering food at a restaurant.", textPt: "Quero treinar pedir comida num restaurante." },
      { textEn: "Can we talk about my daily routine and hobbies?", textPt: "Podemos falar sobre minha rotina diária e hobbies?" },
      { textEn: "I'd like to practice travel situations at the airport.", textPt: "Quero treinar situações de viagem no aeroporto." }
    ]
  };
}

export async function getGeminiConversationReply(
  message: string,
  history: BetaConversationTurn[],
  apiKey?: string,
  profile?: ConversationUserProfile
) {
  const rawLevel = (profile?.level || "básico").toLowerCase();
  const isBeginner = !profile?.level || rawLevel.includes("básico") || rawLevel.includes("basic") || rawLevel.includes("iniciante");

  if (!apiKey) {
    return { ...fallbackReply(message, profile), provider: "fallback" as const };
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
              maxOutputTokens: 800,
              responseMimeType: "application/json"
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

      const coachReply = parseCoachReply(text, isBeginner);
      if (!coachReply) {
        lastError = new Error("Gemini invalid or truncated conversation response");
        continue;
      }

      return {
        ...coachReply,
        provider: "gemini" as const,
        model
      };
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
    }
  }

  console.warn("[gemini-conversation] All candidate models failed or returned truncated responses, returning robust fallback:", lastError);
  return { ...fallbackReply(message, profile), provider: "fallback" as const };
}
