export type ModuleDifficulty = "basic" | "intermediate" | "advanced" | "all";

export interface LearningModule {
  id: string;
  title: string;
  subtitle: string;
  levelBadge: string;
  difficulty: ModuleDifficulty;
  iconName: "Handshake" | "Utensils" | "ShoppingBag" | "Plane" | "Briefcase" | "Award" | "Sparkles";
  description: string;
  scenario: string;
  mission: string;
  samplePhrases: string[];
  initialGreeting: {
    pt: string;
    en?: string;
  };
  promptContext: string;
}

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: "greetings",
    title: "1. Saudações & Apresentações",
    subtitle: "Primeiros passos no inglês",
    levelBadge: "A1 Básico",
    difficulty: "basic",
    iconName: "Handshake",
    description: "Aprenda a cumprimentar pessoas, se apresentar, dizer seu nome, de onde você é e usar cumprimentos comuns do dia a dia.",
    scenario: "Você acabou de conhecer alguém em um evento ou rua nos EUA e quer iniciar um contato amigável.",
    mission: "Cumprimentar, dizer seu nome, dizer de onde é ('I am from Brazil') e falar 'Nice to meet you'.",
    samplePhrases: [
      "Hi, my name is...",
      "Nice to meet you!",
      "I'm from Brazil.",
      "How are you doing today?"
    ],
    initialGreeting: {
      pt: "Opa! Bora começar do começo: Saudações e Apresentações! Como você se apresenta quando conhece alguém nos EUA? Tenta falar: 'Hi, my name is [seu nome]'."
    },
    promptContext: "MÓDULO ATIVO: 1. Saudações & Apresentações (A1 Básico). FOCO ESTRITO: O aluno deve treinar saudações, apresentações, nome, origem e como responder cumprimentos. NUNCA fuja desse tema. Ensine a frase em português e forneça o modelo em inglês para o aluno praticar."
  },
  {
    id: "restaurant",
    title: "2. No Restaurante & Café",
    subtitle: "Pedindo comida e bebidas",
    levelBadge: "A2 Básico",
    difficulty: "basic",
    iconName: "Utensils",
    description: "Domine como pedir mesa, escolher bebidas e pratos, pedir recomendações e solicitar a conta sem hesitar.",
    scenario: "Você está em um restaurante ou cafeteria em Nova York e o garçom vem atender você.",
    mission: "Pedir uma mesa para duas pessoas, pedir uma bebida ('Could I get a coffee, please?') e pedir a conta ('Check, please').",
    samplePhrases: [
      "A table for two, please.",
      "Could I get a coffee, please?",
      "What do you recommend?",
      "Can we have the check, please?"
    ],
    initialGreeting: {
      pt: "Bem-vindo ao restaurante! Vamos simular que você acabou de entrar. Como você pede uma mesa para dois? Tenta dizer: 'A table for two, please'."
    },
    promptContext: "MÓDULO ATIVO: 2. No Restaurante & Café (A2 Básico). FOCO ESTRITO: O aluno deve treinar pedidos de comida, mesa, bebidas e a conta. Simule o atendimento do garçom americano de forma didática. Mantenha o aluno 100% focado em pedidos de restaurante."
  },
  {
    id: "shopping",
    title: "3. Compras & Dia a Dia",
    subtitle: "Lojas, preços e direções",
    levelBadge: "A2-B1 Básico/Interm.",
    difficulty: "basic",
    iconName: "ShoppingBag",
    description: "Aprenda a perguntar preços, pedir tamanhos e cores em lojas, pagar no caixa e pedir orientações na rua.",
    scenario: "Você está passeando em um shopping ou mercado americano e precisa de ajuda do atendente.",
    mission: "Perguntar quanto custa ('How much is this?'), pedir outro tamanho e perguntar onde fica a saída ou banheiro.",
    samplePhrases: [
      "How much is this, please?",
      "Do you have this in a larger size?",
      "Where is the fitting room?",
      "I'll take this one, thank you."
    ],
    initialGreeting: {
      pt: "Hora das compras! Imagina que você viu uma jaqueta maneira numa loja. Como você pergunta o preço? Fala pra mim: 'How much is this, please?'."
    },
    promptContext: "MÓDULO ATIVO: 3. Compras & Dia a Dia (A2-B1). FOCO ESTRITO: Treinar situações reais de compras, perguntas de preço, tamanhos e interação com atendentes de loja. Não desvie para assuntos fora de compras e dia a dia."
  },
  {
    id: "travel",
    title: "4. Viagens & Aeroporto",
    subtitle: "Imigração, voos e hotel",
    levelBadge: "B1 Intermediário",
    difficulty: "intermediate",
    iconName: "Plane",
    description: "Prepare-se para passar pela imigração, fazer check-in de voo, pegar táxi/transporte e resolver situações em hotéis.",
    scenario: "Você pousou no aeroporto nos EUA e está na fila da imigração e do balcão de informações.",
    mission: "Responder o motivo da viagem ('I'm here for vacation'), confirmar reserva de hotel e pedir orientações de transporte.",
    samplePhrases: [
      "I'm here for vacation for ten days.",
      "Where can I find a taxi or Uber?",
      "I have a reservation under the name...",
      "Could you help me with my luggage?"
    ],
    initialGreeting: {
      pt: "Aterrissamos nos Estados Unidos! Vamos passar pela imigração: o agente pergunta o motivo da viagem. Responde pra ele: 'I am here for vacation'."
    },
    promptContext: "MÓDULO ATIVO: 4. Viagens & Aeroporto (B1 Intermediário). FOCO ESTRITO: O aluno deve treinar frases de imigração, aeroporto, hotel e deslocamento no exterior. Conduza o cenário de viagem passo a passo sem sair do contexto."
  },
  {
    id: "work",
    title: "5. Trabalho & Reuniões",
    subtitle: "Comunicação profissional corporativa",
    levelBadge: "B2 Interm./Avançado",
    difficulty: "intermediate",
    iconName: "Briefcase",
    description: "Aprenda a relatar o status de tarefas, expor ideias em reuniões rápidas (stand-ups), alinhar prazos e discordar com elegância.",
    scenario: "Você está participando de uma reunião com seu time internacional de trabalho em inglês.",
    mission: "Explicar o que você fez hoje, relatar um bloqueio ('I'm waiting on approval') e propor um próximo passo.",
    samplePhrases: [
      "Today I worked on the database migration.",
      "I'm currently blocked by an API issue.",
      "Let's schedule a quick follow-up meeting.",
      "In my opinion, we should prioritize this feature."
    ],
    initialGreeting: {
      pt: "Bora para o ambiente de trabalho! Na daily meeting, o gestor te pergunta no que você está trabalhando. Diga: 'Today I worked on our main project'."
    },
    promptContext: "MÓDULO ATIVO: 5. Trabalho & Reuniões (B2 Interm./Avançado). FOCO ESTRITO: Treinar comunicação profissional, vocabulário corporativo, relatórios de tarefas e alinhamentos de trabalho. Mantenha o tom profissional e direto."
  },
  {
    id: "interview",
    title: "6. Entrevistas de Emprego",
    subtitle: "Carreira e perguntas comportamentais",
    levelBadge: "C1 Avançado",
    difficulty: "advanced",
    iconName: "Award",
    description: "Treine respostas estruturadas para entrevistas internacionais: apresentação pessoal, superação de desafios e pontos fortes.",
    scenario: "Você está diante do recrutador de uma empresa internacional para a vaga dos seus sonhos.",
    mission: "Responder com segurança 'Tell me about yourself', explicar uma conquista e destacar um diferencial profissional.",
    samplePhrases: [
      "I have over five years of experience in...",
      "One of my greatest strengths is problem-solving.",
      "A challenge I handled was optimizing our system.",
      "What are the main goals for this role?"
    ],
    initialGreeting: {
      pt: "Chegamos ao nível profissional! O recrutador começa a entrevista com a pergunta clássica: 'Tell me about yourself'. Responda resumindo sua área: 'I have experience in my field'."
    },
    promptContext: "MÓDULO ATIVO: 6. Entrevistas de Emprego (C1 Avançado). FOCO ESTRITO: Conduzir simulações de entrevista de emprego em inglês com perguntas estruturadas e feedback de refinamento em português."
  },
  {
    id: "free-conversation",
    title: "7. Conversação Livre",
    subtitle: "Bate-papo 100% natural em inglês",
    levelBadge: "Todos os Níveis",
    difficulty: "all",
    iconName: "Sparkles",
    description: "Converse sobre qualquer assunto diretamente em inglês com o Mr. Crazy. Ele começa o diálogo em inglês e te apoia em português sempre que precisar.",
    scenario: "Um bate-papo descontraído com o Mr. Crazy em inglês americano autêntico sobre vida, hobbies, tecnologia ou qualquer assunto.",
    mission: "Bater papo em inglês solto, exercitar a fluência e pedir socorro em português caso trave.",
    samplePhrases: [
      "Let's talk about travel and movies.",
      "How was your day, Mr. Crazy?",
      "Can you teach me a natural slang?",
      "What do you think about AI?"
    ],
    initialGreeting: {
      pt: "Hey there! Good to see you! We're in free conversation mode now, so we can talk in English about whatever you like. What's on your mind today?",
      en: "Hey there! Good to see you! Let's talk in English today. How are you doing? Tell me what's on your mind!"
    },
    promptContext: "MÓDULO ATIVO: Conversação Livre. FOCO ESTRITO: O objetivo aqui é CONVERSAR EM INGLÊS. Comece falando diretamente em inglês americano amigável e descontraído. Você é um professor brasileiro ensinando inglês: se o aluno travar, tiver dúvida ou pedir socorro em português, responda acolhendo em português imediatamente, ensine a frase ideal em inglês e volte a manter o bate-papo fluindo em inglês."
  }
];

export const DEFAULT_MODULE_ID = "greetings";

export function getModuleById(id?: string | null): LearningModule {
  if (!id) return LEARNING_MODULES[0];
  return LEARNING_MODULES.find((mod) => mod.id === id) ?? LEARNING_MODULES[0];
}

const STORAGE_KEY = "mr-crazy-selected-module";

export function getStoredModuleId(): string {
  if (typeof window === "undefined") return DEFAULT_MODULE_ID;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_MODULE_ID;
  } catch {
    return DEFAULT_MODULE_ID;
  }
}

export function setStoredModuleId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

