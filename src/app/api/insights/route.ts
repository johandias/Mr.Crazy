import { NextResponse } from "next/server";
import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface SoundSyllableInsight {
  sound: string;
  anatomy: string;
  observation?: string;
  agentHelp?: string;
  drillWords: string[];
}

export interface AgentCorrectionInsight {
  area: string;
  avoid?: string;
  say?: string;
  pattern: string;
  solution: string;
  impact: string;
}

export interface LearningInsightData {
  diagnostic: string;
  sessionSummary: {
    totalSessions: number;
    practiceMinutes: number;
    primaryFocus: string;
    pronunciationScore: number;
  };
  soundSyllables: SoundSyllableInsight[];
  agentCorrections: AgentCorrectionInsight[];
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

function getFallbackInsights(
  level: string,
  difficulties: string[],
  practiceMins: number,
  sessionCount: number
): LearningInsightData {
  const isBasic = level === "basic";

  return {
    diagnostic: isBasic
      ? "Evolução sólida! O foco atual é destravar fala espontânea e dominar a finalização seca das consoantes."
      : "Excelente consistência! O foco atual é ritmo americano, ligação de sílabas e redução de vícios fonéticos.",
    sessionSummary: {
      totalSessions: Math.max(sessionCount, 1),
      practiceMinutes: practiceMins,
      primaryFocus: isBasic ? "Destravar fala espontânea e fonética muscular" : "Conexão de sílabas e ritmo natural",
      pronunciationScore: isBasic ? 80 : 88
    },
    soundSyllables: [
      {
        sound: "Som do TH (/θ/ e /ð/)",
        anatomy: "Ponta da língua levemente entre os dentes, soprando o ar com suavidade.",
        observation: "Tendência de substituir pelo som de 'F' ou 'D'.",
        agentHelp: "O Mr.Crazy cobra projetar a língua antes do som.",
        drillWords: ["Think", "Thanks", "Three", "Breathe"]
      },
      {
        sound: "Final Seco (Sem 'I' extra)",
        anatomy: "Trave o ar na consoante final sem emitir vogal de apoio no final.",
        observation: "Vício comum de adicionar 'i' no fim de palavras como 'like-i'.",
        agentHelp: "Corte seco: 'like' termina no 'k', 'work' no 'k'.",
        drillWords: ["Like", "Work", "Good", "Night"]
      },
      {
        sound: "O 'R' Retroflexo Americano",
        anatomy: "Língua em concha curvada para trás, sem raspar na garganta.",
        observation: "Diferença entre o 'R' arranhado e o 'R' limpo americano.",
        agentHelp: "Puxar o 'R' bem aberto e limpo nos treinos.",
        drillWords: ["Right", "Car", "Water", "World"]
      }
    ],
    agentCorrections: [
      {
        area: "Passado Simples",
        avoid: "Yesterday I go to work",
        say: "Yesterday I went to work",
        pattern: "Uso do presente para relatar acontecimentos passados.",
        solution: "Use a forma irregular correta no passado ('went', 'had', 'saw').",
        impact: "Clareza temporal imediata ao narrar histórias ou rotinas."
      },
      {
        area: "Perguntas com Auxiliares",
        avoid: "You have time?",
        say: "Do you have time?",
        pattern: "Fazer perguntas com a estrutura apenas entonativa do português.",
        solution: "Inicie sempre perguntas no presente com 'Do' ou 'Does'.",
        impact: "Comunicação polida, profissional e natural."
      },
      {
        area: "Connected Speech",
        avoid: "Turn... it... off...",
        say: "Tur-ni-toff",
        pattern: "Falar palavra por palavra travando o fluxo de fala.",
        solution: "Ligue a consoante final na vogal da palavra seguinte.",
        impact: "Ritmo e velocidade de nativo com fluência espontânea."
      }
    ],
    focusAreas: [
      {
        title: "Automatização do Passado",
        description: "Mais de 60% das conversas contam fatos já ocorridos.",
        action: "Conte sua rotina matinal usando 'I had', 'I went', 'I saw'."
      },
      {
        title: "Finalização Seca",
        description: "Elimine o som de 'i' extra após consoantes mudas.",
        action: "Treine falar 'good', 'job' e 'work' travando a língua no fim."
      }
    ],
    techniques: [
      {
        category: "movies",
        title: "Shadowing com Séries",
        icon: "Film",
        difficulty: "Prático",
        description: "Repita a fala dos personagens 1 segundo depois de ouvir.",
        stepByStep: ["Escolha uma cena curta", "Imite a entonação do ator", "Grave e compare"],
        example: "Cenas curtas de diálogo cotidiano em sitcoms ou comédias"
      },
      {
        category: "daily",
        title: "Monólogo Diário",
        icon: "MessageSquare",
        difficulty: "A qualquer hora",
        description: "Narre suas ações mentais da rotina em inglês simples.",
        stepByStep: ["Ao preparar o café, narre cada passo", "Use frases de 3 a 5 palavras", "Tire dúvidas direto com o Mr.Crazy"],
        example: "'Now I am making coffee. It is hot outside.'"
      }
    ],
    dailyChallenge: "Fale 3 frases hoje com o Mr.Crazy usando o passado 'went' e final seco em 'work'!"
  };
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
  const nickname = user?.nickname || "Aluno";

  // Busca histórico de aulas / sessões reais
  let sessionCount = 1;
  if (isSupabaseConfigured && session.userId && session.userId !== "legacy-admin") {
    try {
      const { data: usageData } = await supabaseAdmin
        .from("mrcrazy_user_usage")
        .select("analyze_count, speech_count, realtime_count")
        .eq("user_id", session.userId);

      if (usageData && usageData.length > 0) {
        sessionCount = usageData.reduce((acc, row) => acc + (row.analyze_count || 0) + (row.realtime_count || 0), 0);
        sessionCount = Math.max(sessionCount, usageData.length);
      }
    } catch {
      // continua com contagem aproximada
    }
  }

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.MRCRAZY_TEST_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true, data: getFallbackInsights(level, difficulties, practiceMins, sessionCount) });
  }

  const prompt = `
Você é a inteligência pedagógica do Mr.Crazy.
Com base nos dados reais de treino do aluno, gere um relatório de insights ULTRA-CONCISO, DIRETO E CLEAN (sem textos prolixos ou blocos longos):

DADOS DAS AULAS:
- Aluno: "${nickname}"
- Nível: ${level} (${user?.self_assessed_level || "Iniciante"})
- Aulas: ${sessionCount} sessões | ${practiceMins} min de fala | ${streak} dias de sequência | ${xp} XP
- Dificuldades: ${difficulties.join(", ") || "pronúncia, destravar fala, passado"}

DIRETRIZES DE VISÃO CLEAN:
1. Seja extremamente conciso. Cada explicação deve ter NO MÁXIMO 1 FRASE CURTA (até 12 palavras).
2. Forneça no máximo 3 fonemas em "soundSyllables" e no máximo 3 correções em "agentCorrections".
3. Em "agentCorrections", forneça SEMPRE "avoid" (exemplo do erro) e "say" (modelo correto).
4. Todas as explicações em português do Brasil coloquial e encorajador.
5. Não mencione "Gemini" ou marcas técnicas. Identifique-se apenas como "IA do Mr.Crazy".

Retorne ESTRITAMENTE JSON neste formato:
{
  "diagnostic": "Uma única frase de impacto resumindo a evolução e o foco atual.",
  "sessionSummary": {
    "totalSessions": ${Math.max(sessionCount, 1)},
    "practiceMinutes": ${practiceMins},
    "primaryFocus": "Foco principal em 3 a 5 palavras",
    "pronunciationScore": 84
  },
  "soundSyllables": [
    {
      "sound": "Nome do som (ex: Som do TH /θ/)",
      "anatomy": "Instrução física de 1 frase (onde pôr língua/dentes)",
      "observation": "1 frase curta sobre o padrão do aluno",
      "agentHelp": "1 frase curta de intervenção",
      "drillWords": ["Palavra1", "Palavra2", "Palavra3", "Palavra4"]
    }
  ],
  "agentCorrections": [
    {
      "area": "Nome da área (ex: Passado Simples)",
      "avoid": "Exemplo do erro (ex: Yesterday I go)",
      "say": "Modelo correto (ex: Yesterday I went)",
      "pattern": "O deslize em 1 frase curta",
      "solution": "A regra prática em 1 frase curta",
      "impact": "O ganho em 1 frase curta"
    }
  ],
  "focusAreas": [
    {
      "title": "Foco 1",
      "description": "1 frase concisa",
      "action": "Ação prática de 1 frase"
    }
  ],
  "techniques": [
    {
      "category": "movies",
      "title": "Shadowing com Séries",
      "icon": "Film",
      "difficulty": "Prático",
      "description": "Repita falas de 1 minuto imitando o ator.",
      "stepByStep": ["Escolha cena curta", "Imite a entonação", "Grave e compare"],
      "example": "Diálogos de Friends ou The Office"
    }
  ],
  "dailyChallenge": "1 frase prática desafiando o aluno a falar hoje com o Mr.Crazy."
}
`;
      "action": "Ação prática de 1 frase"
    },
    {
      "title": "Área de Foco 2",
      "description": "Explicação baseada nos dados do aluno",
      "action": "Ação prática de 1 frase"
    }
  ],
  "techniques": [
    {
      "category": "movies",
      "title": "Técnica de Shadowing com Filmes e Séries",
      "icon": "Film",
      "difficulty": "Para todos os níveis",
      "description": "Por que funciona",
      "stepByStep": ["Passo 1", "Passo 2", "Passo 3"],
      "example": "Exemplo concreto"
    },
    {
      "category": "music",
      "title": "Decodificação de Connected Speech com Músicas",
      "icon": "Music",
      "difficulty": "Prática diária",
      "description": "Por que funciona",
      "stepByStep": ["Passo 1", "Passo 2", "Passo 3"],
      "example": "Exemplo concreto"
    },
    {
      "category": "reading",
      "title": "Leitura em Voz Alta e Vocabulário",
      "icon": "BookOpen",
      "difficulty": "5 min por dia",
      "description": "Por que funciona",
      "stepByStep": ["Passo 1", "Passo 2", "Passo 3"],
      "example": "Exemplo concreto"
    },
    {
      "category": "daily",
      "title": "Técnica do Monólogo no Dia a Dia",
      "icon": "MessageSquare",
      "difficulty": "A qualquer momento",
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
        const timeoutId = setTimeout(() => controller.abort(), 9000);

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
                maxOutputTokens: 1800,
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

        if (parsed?.diagnostic && Array.isArray(parsed?.techniques) && Array.isArray(parsed?.soundSyllables)) {
          return NextResponse.json({ ok: true, data: parsed });
        }
      } catch {
        // tenta proximo modelo
      }
    }

    return NextResponse.json({ ok: true, data: getFallbackInsights(level, difficulties, practiceMins, sessionCount) });
  } catch {
    return NextResponse.json({ ok: true, data: getFallbackInsights(level, difficulties, practiceMins, sessionCount) });
  }
}
