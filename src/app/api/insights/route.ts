import { NextResponse } from "next/server";
import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { checkRateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface LearningInsightData {
  diagnostic: string;
  focusAreas: Array<{
    title: string;
    description: string;
    action: string;
  }>;
  techniques: Array<{
    category: "movies" | "music" | "reading" | "daily";
    title: string;
    icon: string;
    difficulty: string;
    description: string;
    stepByStep: string[];
    example: string;
  }>;
  dailyChallenge: string;
}

function getFallbackInsights(level: string, difficulties: string[]): LearningInsightData {
  const diffs = difficulties.length > 0 ? difficulties.join(", ") : "pronúncia do som TH e conexão de palavras (connected speech)";
  const isBasic = level === "basic";

  return {
    diagnostic: isBasic
      ? "Você está no momento mais decisivo: destravando a musculatura da boca e perdendo o medo de falar. O foco agora é falar sem vergonha de errar!"
      : "Sua base já está se formando. Agora o segredo é ganhar ritmo e naturalidade americana sem traduzir mentalmente palavra por palavra.",
    focusAreas: [
      {
        title: "Atenção nas suas dificuldades",
        description: `Seus pontos focais cadastrados: ${diffs}.`,
        action: "Isole essas palavras em frases de 3 palavras antes de tentar discursos longos."
      },
      {
        title: "Evite o 'i' no fim das palavras",
        description: "Brasileiros tendem a falar 'like-i', 'facebook-i', 'hot-i'.",
        action: "Trave o ar no céu da boca ou nos dentes e corte o som imediatamente."
      }
    ],
    techniques: [
      {
        category: "movies",
        title: "Técnica de Shadowing com Filmes e Séries",
        icon: "Film",
        difficulty: "Para todos os níveis",
        description: "A técnica mais poderosa dos poliglotas para ganhar sotaque natural e ritmo americano.",
        stepByStep: [
          "Escolha uma cena curta de 1 a 2 minutos em uma série ou filme que você goste (áudio em inglês com legendas em inglês).",
          "Ouça a fala do personagem uma vez prestando atenção na entonação e na velocidade.",
          "Pause e repita em voz alta IMITANDO exatamente o mesmo tom, respiração e emoção do ator.",
          "Faça isso 3 vezes seguidas na mesma cena antes de passar para a próxima."
        ],
        example: "Em Friends ou The Office, pegue uma saudação e imite a melodia exata da voz."
      },
      {
        category: "music",
        title: "Decodificação de Connected Speech com Músicas",
        icon: "Music",
        difficulty: "Prática diária",
        description: "Gringo não fala pausado, ele emenda tudo. Músicas treinam seu ouvido para entender o inglês falado rápido.",
        stepByStep: [
          "Abra a letra de uma música americana que você curta no Spotify ou YouTube.",
          "Identifique onde as palavras se juntam: 'going to' vira 'gonna', 'want to' vira 'wanna', 'what are you' vira 'whatcha'.",
          "Cante junto no mesmo ritmo. Seus lábios vão aprender a conectar os sons naturalmente."
        ],
        example: "'Turn it off' soa como 'Tur-ni-toff'. Treine essa conexão sonora."
      },
      {
        category: "reading",
        title: "Leitura Ativa em Voz Alta (5 Linhas por Dia)",
        icon: "BookOpen",
        difficulty: "5 minutos por dia",
        description: "Ler mentalmente não treina a fala. Ler em voz alta exercita os músculos que produzem sons que não existem no português.",
        stepByStep: [
          "Pegue um texto curto de notícia, post de rede social ou diálogo em inglês.",
          "Leia apenas 5 linhas, mas em VOZ ALTA, projetando a voz como se estivesse apresentando para alguém.",
          "Grave seu áudio no gravador do celular e escute uma vez para perceber sua própria dicção."
        ],
        example: "Use notícias curtas de sites como BBC Learning English ou tweets em inglês."
      },
      {
        category: "daily",
        title: "Monólogo do Dia a Dia (Self-Talk)",
        icon: "MessageSquare",
        difficulty: "A qualquer momento",
        description: "Destrave o fluxo de pensamento em inglês sem a pressão de estar sendo julgado por ninguém.",
        stepByStep: [
          "Ao fazer café, escovar os dentes ou dirigir, narre suas ações mentais em inglês.",
          "Comece simples: 'Now I am making coffee', 'The weather is hot today', 'I have a meeting at 2 PM'.",
          "Quando faltar uma palavra, pergunte ao Mr.Crazy: 'Como falo tal coisa em inglês?'."
        ],
        example: "Narrar mentalmente sua rotina em frases de 3 a 5 palavras."
      }
    ],
    dailyChallenge: "Assista a um vídeo de 3 minutos no YouTube em inglês hoje e anote 2 expressões para testar com o Mr.Crazy na sua próxima conversa!"
  };
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.status !== "approved") {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(session, "analyze");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error, code: rateLimit.code },
      { status: rateLimit.status }
    );
  }

  const user = await getCurrentUser();
  const level = user?.learning_level || "basic";
  const difficulties = Array.isArray(user?.main_difficulties) ? user.main_difficulties : [];
  const practiceMins = Math.round((user?.practice_time_seconds || 0) / 60);
  const xp = user?.xp || 0;
  const streak = user?.streak_days || 1;
  const nickname = user?.nickname || "aluno";

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.MRCRAZY_TEST_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true, data: getFallbackInsights(level, difficulties) });
  }

  const prompt = `
Você é Mr.Crazy, um mentor de inglês carismático, provocador e muito prático para brasileiros.
Gere um conjunto personalizado de insights de evolução e técnicas reais de aprendizado para o aluno:
- Nome/Apelido: "${nickname}"
- Nível: ${level} (${user?.self_assessed_level || "Iniciante"})
- Tempo de prática acumulado: ${practiceMins} minutos
- Sequência de dias ativos: ${streak} dias
- XP acumulado: ${xp} XP
- Principais dificuldades cadastradas: ${difficulties.join(", ") || "pronúncia geral e destravar fala"}

Forneça técnicas comprovadas que funcionam no dia a dia (especialmente como usar filmes/séries com shadowing, músicas com connected speech, leitura ativa em voz alta e hábitos diários).
Todas as explicações devem ser em português do Brasil, calorosas, práticas e diretas.

Retorne ESTRITAMENTE um JSON com esta estrutura:
{
  "diagnostic": "Uma ou duas frases de diagnóstico encorajador e realista sobre o momento atual do aluno.",
  "focusAreas": [
    {
      "title": "Título da área de foco",
      "description": "Explicação curta do porquê focar nisso agora",
      "action": "Ação prática imediata de 1 frase"
    }
  ],
  "techniques": [
    {
      "category": "movies",
      "title": "Técnica de Shadowing com Filmes e Séries",
      "icon": "Film",
      "difficulty": "Nível recomendado",
      "description": "Por que funciona",
      "stepByStep": ["Passo 1", "Passo 2", "Passo 3"],
      "example": "Exemplo concreto"
    },
    {
      "category": "music",
      "title": "Decodificação de Connected Speech com Músicas",
      "icon": "Music",
      "difficulty": "Nível recomendado",
      "description": "Por que funciona",
      "stepByStep": ["Passo 1", "Passo 2", "Passo 3"],
      "example": "Exemplo concreto"
    },
    {
      "category": "reading",
      "title": "Leitura em Voz Alta e Vocabulário",
      "icon": "BookOpen",
      "difficulty": "Nível recomendado",
      "description": "Por que funciona",
      "stepByStep": ["Passo 1", "Passo 2", "Passo 3"],
      "example": "Exemplo concreto"
    },
    {
      "category": "daily",
      "title": "Técnica do Diálogo Interno no Dia a Dia",
      "icon": "MessageSquare",
      "difficulty": "Nível recomendado",
      "description": "Por que funciona",
      "stepByStep": ["Passo 1", "Passo 2", "Passo 3"],
      "example": "Exemplo concreto"
    }
  ],
  "dailyChallenge": "Um desafio prático curto e divertido para hoje"
}
`.trim();

  try {
    const models = [process.env.GEMINI_MODEL, "gemini-2.5-flash-lite", "gemini-2.0-flash"]
      .filter((m): m is string => Boolean(m?.trim()))
      .map((m) => m.replace(/^models\//u, "").trim());

    for (const model of Array.from(new Set(models))) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 1200,
                responseMimeType: "application/json"
              }
            }),
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const resData = await response.json();
        const text = resData.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim();
        if (!text) continue;

        const cleanJson = text.replace(/^```(?:json)?/iu, "").replace(/```$/u, "").trim();
        const parsed = JSON.parse(cleanJson) as LearningInsightData;

        if (parsed?.diagnostic && Array.isArray(parsed?.techniques)) {
          return NextResponse.json({ ok: true, data: parsed });
        }
      } catch {
        // tenta proximo modelo
      }
    }

    return NextResponse.json({ ok: true, data: getFallbackInsights(level, difficulties) });
  } catch {
    return NextResponse.json({ ok: true, data: getFallbackInsights(level, difficulties) });
  }
}
