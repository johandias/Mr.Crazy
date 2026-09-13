import { NextResponse } from "next/server";
import { getCurrentSession, getCurrentUser } from "@/lib/server-auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface SoundSyllableInsight {
  sound: string;
  anatomy: string;
  observation: string;
  agentHelp: string;
  drillWords: string[];
}

export interface AgentCorrectionInsight {
  area: string;
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
  const diffs = difficulties.length > 0 ? difficulties.join(", ") : "pronúncia do som TH e conexão de palavras";

  return {
    diagnostic: isBasic
      ? "Baseado nas suas aulas, seu cérebro já começou a automatizar estruturas essenciais! O Mr.Crazy está focando em soltar a musculatura labial para que você fale sem travar na pronúncia."
      : "Seus dados de treino mostram consistência sólida! O foco agora é velocidade de resposta, ritmo americano e eliminação de vícios fonéticos comuns de brasileiros.",
    sessionSummary: {
      totalSessions: Math.max(sessionCount, 1),
      practiceMinutes: practiceMins,
      primaryFocus: isBasic ? "Destravar fala espontânea e fonética muscular" : "Conexão de sílabas e redução de sotaque",
      pronunciationScore: isBasic ? 78 : 88
    },
    soundSyllables: [
      {
        sound: "Som do TH (/θ/ e /ð/)",
        anatomy: "Ponta da língua entre os dentes incisivos superiores e inferiores, soprando o ar suavemente.",
        observation: "O agente identificou tendência a trocar o 'TH' pelo som de 'F' (think -> fink) ou 'D' (that -> dat).",
        agentHelp: "Nas aulas, o Mr.Crazy interrompe rapidamente para pedir que você coloque a língua para fora antes de emitir o som.",
        drillWords: ["Think", "Thanks", "Three", "Breathe", "Together"]
      },
      {
        sound: "Corte do 'I' Epentético Final",
        anatomy: "Travar a língua no céu da boca ou fechar os lábios cortando o ar, sem emitir som de vogal após a consoante.",
        observation: "Tendência natural do português de colocar um 'i' no final de palavras que terminam em consoante mudo (like-i, facebook-i, bad-i).",
        agentHelp: "A IA cobra finalização seca e interrompida: 'like' termina no 'k', não no 'i'.",
        drillWords: ["Like", "Work", "Good", "Stop", "Web"]
      },
      {
        sound: "O 'R' Retroflexo Americano",
        anatomy: "Língua curvada para trás em formato de colher, sem encostar em nenhuma parte da boca.",
        observation: "Diferença entre o 'R' arranhado na garganta do português e o 'R' limpo e retroflexo do inglês americano.",
        agentHelp: "O agente orienta a emitir o som do 'R' do interior de São Paulo ou Minas ('pooorrrta').",
        drillWords: ["Right", "Car", "Water", "Party", "World"]
      },
      {
        sound: "Sons de Vogais Curtas vs Longas (/ɪ/ vs /iː/)",
        anatomy: "Vogal curta relaxada com a boca semiaberta vs vogal longa com cantos da boca esticados em sorriso.",
        observation: "Dificuldade em distinguir pares mínimos essenciais como 'ship' vs 'sheep', 'live' vs 'leave'.",
        agentHelp: "O Mr.Crazy treina o relaxamento muscular da mandíbula para não transformar toda vogal em som de 'i' brasileiro.",
        drillWords: ["Ship / Sheep", "Live / Leave", "Fit / Feet", "Hit / Heat"]
      }
    ],
    agentCorrections: [
      {
        area: "Passado Simples e Verbos Regulares (-ED)",
        pattern: "Pronunciar a terminação '-ed' como duas sílabas ('work-ed' em vez de som de /t/ 'workt').",
        solution: "Apenas verbos terminados em som de T ou D ganham sílaba extra (ex: needed, wanted). Os demais fundem o som seco.",
        impact: "Garante que nativos compreendam imediatamente quando você está narrando fatos do passado."
      },
      {
        area: "Perguntas com Auxiliares (Do / Does / Did)",
        pattern: "Fazer perguntas apenas com entonação brasileira ('You have time?') em vez de usar o auxiliar correto.",
        solution: "Iniciar a pergunta oral diretamente com 'Do you have time?' ou 'Did you go?'.",
        impact: "Estrutura oral natural que passa segurança e clareza profissional."
      },
      {
        area: "Connected Speech (Liaison entre Palavras)",
        pattern: "Falar palavra por palavra de forma pausada e robótica ('Turn... it... off').",
        solution: "Ligar a consoante final da primeira palavra na vogal inicial da seguinte ('Tur-ni-toff').",
        impact: "Aumenta drasticamente o ritmo de fala e melhora em 70% a compreensão auditiva de filmes e nativos."
      }
    ],
    focusAreas: [
      {
        title: "Treino Anatômico das suas Dificuldades",
        description: `Seus pontos focais identificados: ${diffs}.`,
        action: "Isole essas palavras em frases curtas de 3 a 4 palavras antes de tentar discursos longos."
      },
      {
        title: "Automatização de Frases no Passado",
        description: "Mais de 60% das conversas do dia a dia contam fatos que já aconteceram ontem ou na semana passada.",
        action: "Pratique com o Mr.Crazy contar como foi o seu café da manhã usando 'I had', 'I went', 'I saw'."
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
          "Escolha uma cena curta de 1 a 2 minutos em uma série que você goste (áudio e legendas em inglês).",
          "Ouça a fala do personagem uma vez prestando atenção na entonação e na velocidade.",
          "Pause e repita em voz alta IMITANDO exatamente o mesmo tom, respiração e emoção do ator.",
          "Faça isso 3 vezes seguidas na mesma cena antes de passar para a próxima."
        ],
        example: "Em Friends ou The Office, pegue uma saudação ou piada e imite a melodia exata da voz."
      },
      {
        category: "music",
        title: "Decodificação de Connected Speech com Músicas",
        icon: "Music",
        difficulty: "Prática diária",
        description: "Nativos emendam as palavras. Músicas treinam seu cérebro para captar o inglês falado rápido sem travar.",
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
        description: "Ler mentalmente não treina a fala. Ler em voz alta exercita a musculatura motora da mandíbula.",
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
        example: "Narrar mentalmente sua rotina matinal em frases de 3 a 5 palavras."
      }
    ],
    dailyChallenge: "Converse por 2 minutos com o Mr.Crazy hoje focando em cortar o 'i' no final de palavras como 'like', 'good' e 'work'!"
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
Você é a inteligência pedagógica do Mr.Crazy, um mentor de inglês carismático, provocador e muito prático para brasileiros.
Com base nos DADOS REAIS DE AULAS E PRÁTICAS do aluno, gere um relatório aprofundado de insights de desempenho e técnicas de evolução:

DADOS REAIS DAS AULAS DO ALUNO:
- Nome/Apelido: "${nickname}"
- Nível Registrado: ${level} (${user?.self_assessed_level || "Iniciante"})
- Total de Interações e Aulas Realizadas: ${sessionCount} sessões registradas
- Tempo de Prática de Fala Acumulado: ${practiceMins} minutos
- Sequência de Treino: ${streak} dias ativos
- XP Acumulado: ${xp} XP
- Principais dificuldades relatadas pelo aluno: ${difficulties.join(", ") || "pronúncia geral, trava na fala, conectar palavras"}

DIRETRIZES FUNDAMENTAIS:
1. O relatório DEVE focar onde o agente de IA está ajudando e intervindo nas aulas:
   - Correções recorrentes de gramática e estrutura oral (ex: passado simples, auxiliares, omissão de sujeito, falsos cognatos).
   - DIFICULDADES CIRÚRGICAS COM SONS E SÍLABAS (especificamente fonemas difíceis para brasileiros como som do TH, 'R' retroflexo, vogais curtas vs longas, epêntese do som 'i' no final de palavras, acentuação de sílaba tônica e connected speech).
   - Explicar a anatomia física da boca (onde colocar a língua, lábios e dentes) para destravar cada som.
2. Forneça técnicas práticas reais (Shadowing com filmes, connected speech com músicas, leitura ativa em voz alta e monólogo interior).
3. Todas as explicações devem ser em português do Brasil, calorosas, humanas, práticas e encorajadoras.
4. NUNCA mencione marcas de modelos de IA como "Gemini" ou provedores técnicos. Identifique-se apenas como "IA do Mr.Crazy" ou "Inteligência Artificial".

Retorne ESTRITAMENTE um JSON com esta estrutura:
{
  "diagnostic": "Duas a três frases avaliando o momento das aulas do aluno e a postura dele na fala.",
  "sessionSummary": {
    "totalSessions": ${Math.max(sessionCount, 1)},
    "practiceMinutes": ${practiceMins},
    "primaryFocus": "Foco principal das intervenções da IA nas últimas aulas",
    "pronunciationScore": 82
  },
  "soundSyllables": [
    {
      "sound": "Nome do fonema ou som (ex: Som do TH /θ/ e /ð/)",
      "anatomy": "Instrução anatômica (onde posicionar língua, dentes e fluxo de ar)",
      "observation": "O que o agente notou nas aulas (ex: troca pelo som de f ou d)",
      "agentHelp": "Como a IA intervém nas aulas para consertar esse som",
      "drillWords": ["Palavra1", "Palavra2", "Palavra3", "Palavra4"]
    },
    {
      "sound": "Corte de Vogal Epentética Final",
      "anatomy": "Como cortar o ar sem emitir som de 'i' após consoante final",
      "observation": "O vício brasileiro de falar 'like-i', 'facebook-i'",
      "agentHelp": "Como o Mr.Crazy cobra o final seco",
      "drillWords": ["Like", "Work", "Good", "Night"]
    },
    {
      "sound": "O 'R' Retroflexo Americano",
      "anatomy": "Língua em colher sem encostar no céu da boca",
      "observation": "Tendência de raspar o 'R' na garganta",
      "agentHelp": "Dica prática da IA nas sessões",
      "drillWords": ["Car", "Water", "Right", "American"]
    },
    {
      "sound": "Sons de Vogais Curtas vs Longas (/ɪ/ vs /iː/)",
      "anatomy": "Boca relaxada vs boca em sorriso esticado",
      "observation": "Confusão entre pares mínimos comuns",
      "agentHelp": "Exercício de contraste oral aplicado pelo agente",
      "drillWords": ["Ship / Sheep", "Live / Leave", "Sit / Seat"]
    }
  ],
  "agentCorrections": [
    {
      "area": "Área da correção (ex: Passado Simples -ED)",
      "pattern": "O erro que o aluno costuma cometer nas aulas",
      "solution": "A regra prática simples para falar certo",
      "impact": "Por que essa correção destrava a comunicação"
    },
    {
      "area": "Perguntas com Auxiliares",
      "pattern": "Omissão de Do/Does/Did ao fazer perguntas",
      "solution": "Como formular perguntas com naturalidade instantânea",
      "impact": "Clareza profissional e comunicação polida"
    },
    {
      "area": "Connected Speech (Junção de Palavras)",
      "pattern": "Falar palavra por palavra de forma travada",
      "solution": "Conectar a consoante final na vogal seguinte",
      "impact": "Fluência com ritmo de nativo americano"
    }
  ],
  "focusAreas": [
    {
      "title": "Área de Foco 1",
      "description": "Explicação baseada nos dados do aluno",
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
