export type ModuleDifficulty = "basic" | "intermediate" | "advanced" | "all";

export type NpcAvatarType =
  | "neighbor"
  | "waiter"
  | "cashier"
  | "receptionist"
  | "coworker"
  | "executive"
  | "examiner";

export interface ExamNpcConfig {
  id: string;
  name: string;
  rolePt: string;
  roleEn: string;
  avatarType: NpcAvatarType;
  scenarioGoal: string;
  initialGreetingEn: string;
  systemPrompt: string;
  confusionPhrases: string[];
  successThresholdScore: number; // minimum score out of 10 (e.g. 6.0)
  minTurns: number;
}

export interface ModuleConcept {
  id: string;
  order: number;
  title: string;
  description: string;
  objective: string;
  samplePhrases: string[];
  isExam?: boolean;
}

export interface LearningModule {
  id: string;
  stageNumber: number;
  title: string;
  cleanTitle: string;
  subtitle: string;
  levelBadge: string;
  difficulty: ModuleDifficulty;
  iconName: "Handshake" | "Utensils" | "ShoppingBag" | "Plane" | "Briefcase" | "Award" | "Sparkles";
  description: string;
  scenario: string;
  mission: string;
  xpReward: number;
  samplePhrases: string[];
  concepts: ModuleConcept[];
  examNpc: ExamNpcConfig;
  initialGreeting: {
    pt: string;
    en?: string;
  };
  promptContext: string;
  mapCoords: {
    xPct: number;
    yPct: number;
  };
}

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: "greetings",
    stageNumber: 1,
    title: "1. Greetings & Introductions",
    cleanTitle: "Greetings & Introductions",
    subtitle: "Primeiros passos no inglês",
    levelBadge: "A1",
    difficulty: "basic",
    iconName: "Handshake",
    description: "Aprenda a cumprimentar pessoas, se apresentar, dizer seu nome, de onde você é e usar cumprimentos comuns do dia a dia.",
    scenario: "Você acabou de conhecer alguém em um bairro residencial nos EUA e quer iniciar um contato amigável.",
    mission: "Cumprimentar, dizer seu nome, dizer de onde é ('I am from Brazil') e falar 'Nice to meet you'.",
    xpReward: 100,
    samplePhrases: [
      "Hi, my name is...",
      "Nice to meet you!",
      "I'm from Brazil.",
      "How are you doing today?"
    ],
    concepts: [
      {
        id: "greetings-1",
        order: 1,
        title: "Dizendo Olá e Quebrando o Gelo",
        description: "Descubra as diferenças práticas entre 'Hi', 'Hello', 'Good morning' e 'Hey there'.",
        objective: "Cumprimentar com naturalidade e tom amigável.",
        samplePhrases: ["Hello! Good morning.", "Hey there, how are you?"]
      },
      {
        id: "greetings-2",
        order: 2,
        title: "Apresentando Seu Nome",
        description: "Como dizer quem você é sem soar robótico usando contrações nativas.",
        objective: "Falar seu nome usando 'I'm [nome]' ou 'My name is [nome]'.",
        samplePhrases: ["I'm Carlos, nice to meet you.", "My name is Ana."]
      },
      {
        id: "greetings-3",
        order: 3,
        title: "De Onde Você É? (Origem e Cidade)",
        description: "Explique de onde você veio e onde mora atualmente no Brasil.",
        objective: "Informar país e cidade natal com preposições corretas.",
        samplePhrases: ["I'm from Brazil, from São Paulo.", "I live in Rio de Janeiro."]
      },
      {
        id: "greetings-4",
        order: 4,
        title: "Perguntando Sobre a Outra Pessoa",
        description: "Inicie uma conversa rápida perguntando sobre o dia da outra pessoa.",
        objective: "Fazer uma pergunta de engajamento amigável.",
        samplePhrases: ["How's it going?", "How are you doing today?"]
      },
      {
        id: "greetings-exam",
        order: 5,
        title: "🏆 Prova do Módulo 1: Diálogo com a Moradora Local",
        description: "Teste prático 100% em inglês com a moradora Sarah Jenkins. Ela não fala português!",
        objective: "Apresente-se, diga sua origem e converse com Sarah. Nota mínima para aprovação: 6.0.",
        samplePhrases: ["Hi! My name is..., I'm from Brazil, nice to meet you!"],
        isExam: true
      }
    ],
    examNpc: {
      id: "sarah-neighbor",
      name: "Sarah Jenkins",
      rolePt: "Moradora do Bairro / Vizinha",
      roleEn: "Local Resident",
      avatarType: "neighbor",
      scenarioGoal: "Apresente-se com seu nome, diga que é do Brasil, seja educado e pergunte como ela está.",
      initialGreetingEn: "Hello there! Good morning! Nice weather today, isn't it? Are you new around the neighborhood?",
      systemPrompt: "You are Sarah Jenkins, a friendly local American resident. You speak ONLY in English. You DO NOT understand Portuguese. You do NOT give English lessons or tips. If the user speaks Portuguese or says something incomprehensible, look confused and state clearly in English that you did not understand. If they introduce themselves properly (name, from Brazil, polite greeting), respond warmly and ask them a natural question.",
      confusionPhrases: [
        "I'm sorry, I didn't quite catch that. Could you say that again?",
        "Pardon me? What did you just say?",
        "Sorry, I don't speak Portuguese. Could you repeat that in English, please?",
        "Excuse me? I'm not sure I follow. Who are you again?"
      ],
      successThresholdScore: 6.0,
      minTurns: 4
    },
    initialGreeting: {
      pt: "Opa! Bora começar do começo na vila inicial: Greetings & Introductions! Como você se apresenta quando conhece alguém nos EUA? Fala pra mim: 'Hi, my name is [seu nome]'."
    },
    promptContext: "MÓDULO ATIVO: Etapa 1. Greetings & Introductions (A1). FOCO ESTRITO: O aluno deve treinar saudações, apresentações, nome, origem e como responder cumprimentos. NUNCA fuja desse tema. Ensine a frase em português e forneça o modelo em inglês para o aluno praticar.",
    mapCoords: { xPct: 12.5, yPct: 58 }
  },
  {
    id: "restaurant",
    stageNumber: 2,
    title: "2. Restaurant & Café",
    cleanTitle: "Restaurant & Café",
    subtitle: "Pedindo comida e bebidas",
    levelBadge: "A2",
    difficulty: "basic",
    iconName: "Utensils",
    description: "Domine como pedir mesa, escolher bebidas e pratos, pedir recomendações e solicitar a conta sem hesitar.",
    scenario: "Você está em um restaurante ou cafeteria em Nova York e o garçom vem atender você.",
    mission: "Pedir uma mesa para duas pessoas, pedir uma bebida ('Could I get a coffee, please?') e pedir a conta ('Check, please').",
    xpReward: 120,
    samplePhrases: [
      "A table for two, please.",
      "Could I get a coffee, please?",
      "What do you recommend?",
      "Can we have the check, please?"
    ],
    concepts: [
      {
        id: "restaurant-1",
        order: 1,
        title: "Chegando e Pedindo Mesa",
        description: "Comunique quantas pessoas estão com você e peça um lugar.",
        objective: "Solicitar uma mesa usando 'A table for two, please'.",
        samplePhrases: ["A table for two, please.", "Can we sit by the window?"]
      },
      {
        id: "restaurant-2",
        order: 2,
        title: "Bebidas & Cafeteria",
        description: "Como pedir cafés, águas, sucos e refrigerantes com polidez americana.",
        objective: "Pedir uma bebida usando 'Could I get...?'",
        samplePhrases: ["Could I get an iced coffee, please?", "Just water for now, thanks."]
      },
      {
        id: "restaurant-3",
        order: 3,
        title: "O Pedido Principal",
        description: "Escolhendo pratos, guarnições e pontos da carne.",
        objective: "Fazer o pedido com 'I'll have the...'",
        samplePhrases: ["I'll have the burger with fries.", "What do you recommend?"]
      },
      {
        id: "restaurant-4",
        order: 4,
        title: "A Conta e Gorjeta (Tip)",
        description: "Pedindo a conta sem passar vergonha e entendendo a gorjeta.",
        objective: "Pedir a conta usando 'Could we get the check, please?'",
        samplePhrases: ["Check, please!", "Can we split the bill?"]
      },
      {
        id: "restaurant-exam",
        order: 5,
        title: "🏆 Prova do Módulo 2: O Desafio do Garçom",
        description: "Atendimento completo com o garçom Oliver: peça mesa, escolha prato/bebida e solicite a conta.",
        objective: "Completar a refeição inteira em inglês com o garçom. Nota mínima: 6.0.",
        samplePhrases: ["Hi, table for two. I'll have the burger and the check, please."],
        isExam: true
      }
    ],
    examNpc: {
      id: "oliver-waiter",
      name: "Oliver Miller",
      rolePt: "Garçom do Restaurante",
      roleEn: "Restaurant Waiter",
      avatarType: "waiter",
      scenarioGoal: "Peça uma mesa para duas pessoas, escolha uma bebida e um prato, e peça a conta.",
      initialGreetingEn: "Good evening! Welcome to the Bistro. Do you have a reservation, or are you looking for a table for tonight?",
      systemPrompt: "You are Oliver Miller, a professional waiter at a busy New York restaurant. You speak ONLY in English. You DO NOT understand Portuguese. You do not explain grammar or help with translations. If the customer speaks Portuguese or makes an unintelligible sound, look puzzled and say you did not understand in polite English. Take their order: table, drinks, meal, and finally bring the bill when requested.",
      confusionPhrases: [
        "Excuse me, sir/ma'am? I didn't understand your order.",
        "I'm sorry, what would you like to have? Could you repeat that clearly?",
        "Pardon me? We don't speak Portuguese here. What can I get for you?",
        "Sorry, I didn't catch that dish name. Could you say that again, please?"
      ],
      successThresholdScore: 6.0,
      minTurns: 4
    },
    initialGreeting: {
      pt: "Bem-vindo à cafeteria e restaurante do mapa! Como você pede uma mesa para dois ao garçom? Diga: 'A table for two, please'."
    },
    promptContext: "MÓDULO ATIVO: Etapa 2. Restaurant & Café (A2). FOCO ESTRITO: O aluno deve treinar pedidos de comida, mesa, bebidas e a conta. Simule o atendimento do garçom americano de forma didática.",
    mapCoords: { xPct: 26.5, yPct: 43 }
  },
  {
    id: "shopping",
    stageNumber: 3,
    title: "3. Shopping & Daily Life",
    cleanTitle: "Shopping & Daily Life",
    subtitle: "Lojas, preços e direções",
    levelBadge: "A2-B1",
    difficulty: "basic",
    iconName: "ShoppingBag",
    description: "Saiba pedir ajuda em lojas, experimentar roupas, conferir preços, pechinchar e pedir direções na cidade.",
    scenario: "Você está em uma loja de roupas e no shopping center comprando presentes e precisando de informações.",
    mission: "Perguntar o preço de uma peça, pedir outro tamanho e pagar ('Do you take credit card?').",
    xpReward: 130,
    samplePhrases: [
      "How much is this?",
      "Do you have this in medium?",
      "Can I try this on?",
      "Where is the fitting room?"
    ],
    concepts: [
      {
        id: "shopping-1",
        order: 1,
        title: "Perguntando o Preço",
        description: "Como perguntar quanto custa algo sem confundir 'how much' e 'how many'.",
        objective: "Dominar 'How much is this?' e 'How much are these?'.",
        samplePhrases: ["How much does this jacket cost?", "Is this item on sale?"]
      },
      {
        id: "shopping-2",
        order: 2,
        title: "Tamanhos & Provador",
        description: "S, M, L, XL e como pedir para experimentar no provador.",
        objective: "Solicitar provador usando 'Can I try this on?'.",
        samplePhrases: ["Do you have this in a larger size?", "Where are the fitting rooms?"]
      },
      {
        id: "shopping-3",
        order: 3,
        title: "Formas de Pagamento",
        description: "Dinheiro, cartão por aproximação e recibo da compra.",
        objective: "Perguntar sobre cartões e pedir o recibo ('Can I get a receipt?').",
        samplePhrases: ["Do you take credit card or Apple Pay?", "Could I get a gift receipt, please?"]
      },
      {
        id: "shopping-4",
        order: 4,
        title: "Pedindo Direções no Shopping",
        description: "Encontrando a saída, banheiros e outras lojas.",
        objective: "Perguntar onde fica um local usando 'Excuse me, where is the...?'.",
        samplePhrases: ["Excuse me, where is the restroom?", "Is there an elevator on this floor?"]
      },
      {
        id: "shopping-exam",
        order: 5,
        title: "🏆 Prova do Módulo 3: O Desafio da Loja",
        description: "Compre um item completo com a atendente Emma: preço, tamanho e forma de pagamento.",
        objective: "Concluir a compra em inglês com a atendente. Nota mínima: 6.0.",
        samplePhrases: ["How much is this jacket? Can I try it on in size Medium?"],
        isExam: true
      }
    ],
    examNpc: {
      id: "emma-cashier",
      name: "Emma Brooks",
      rolePt: "Atendente de Loja",
      roleEn: "Store Associate",
      avatarType: "cashier",
      scenarioGoal: "Pergunte o preço de uma peça, peça para provar ou outro tamanho, e informe como deseja pagar.",
      initialGreetingEn: "Hi there! Welcome to Midtown Apparel! Let me know if you're looking for any particular style or size today.",
      systemPrompt: "You are Emma Brooks, a retail associate in a clothing store. You speak ONLY in English. You DO NOT understand Portuguese. You do not help with vocabulary or explain grammar. If the customer speaks Portuguese or mumbles, give a confused look and ask in English what item or size they are looking for.",
      confusionPhrases: [
        "Sorry? What item were you asking about?",
        "I'm sorry, I didn't get that. Are you looking for a particular size?",
        "Pardon? Could you repeat that in English, please?",
        "Excuse me, did you ask about the price or the fitting room?"
      ],
      successThresholdScore: 6.0,
      minTurns: 4
    },
    initialGreeting: {
      pt: "Chegamos ao centro comercial do mapa! Como você pergunta o preço de uma camiseta para a atendente? Diga: 'How much is this t-shirt?'."
    },
    promptContext: "MÓDULO ATIVO: Etapa 3. Shopping & Daily Life (A2-B1). FOCO ESTRITO: Treinar compras, preços, tamanhos, provador e pagamento em inglês.",
    mapCoords: { xPct: 40.5, yPct: 37 }
  },
  {
    id: "travel",
    stageNumber: 4,
    title: "4. Travel & Airport",
    cleanTitle: "Travel & Airport",
    subtitle: "Check-in, imigração e hotel",
    levelBadge: "B1",
    difficulty: "intermediate",
    iconName: "Plane",
    description: "Sobreviva ao aeroporto sem pânico: imigração, bagagens, conferência de voo, táxi e check-in no hotel.",
    scenario: "Você desembarcou no JFK Airport e precisa passar pela imigração e chegar até seu hotel em segurança.",
    mission: "Responder ao oficial da imigração o motivo da viagem ('I'm here on vacation') e fazer check-in no hotel.",
    xpReward: 150,
    samplePhrases: [
      "Where is baggage claim?",
      "I am here for vacation.",
      "I have a reservation under my name.",
      "What time is check-out?"
    ],
    concepts: [
      {
        id: "travel-1",
        order: 1,
        title: "Imigração e Alfândega Sem Medo",
        description: "As 4 perguntas obrigatórias do oficial de imigração e como responder com segurança.",
        objective: "Responder motivo da viagem, duração e hospedagem com respostas curtas e precisas.",
        samplePhrases: ["I'm here on vacation for ten days.", "I'm staying at the Hilton Hotel."]
      },
      {
        id: "travel-2",
        order: 2,
        title: "Bagagem e Conexões",
        description: "Achando a esteira de malas e lidando com malas atrasadas.",
        objective: "Perguntar onde retirar as malas e relatar extravio se necessário.",
        samplePhrases: ["Where is the carousel for flight 204?", "My luggage didn't arrive."]
      },
      {
        id: "travel-3",
        order: 3,
        title: "Táxi, Uber e Transporte",
        description: "Como dar o endereço do hotel ao motorista e perguntar sobre o valor.",
        objective: "Informar destino com clareza usando 'Could you take me to...?'.",
        samplePhrases: ["Could you take me to this address, please?", "How much will the fare be?"]
      },
      {
        id: "travel-4",
        order: 4,
        title: "Check-in e Conforto no Hotel",
        description: "Pegando as chaves do quarto, senha do Wi-Fi e café da manhã.",
        objective: "Fazer o check-in no hotel usando 'I have a reservation under the name...'.",
        samplePhrases: ["I have a reservation under John Silva.", "What is the Wi-Fi password?"]
      },
      {
        id: "travel-exam",
        order: 5,
        title: "🏆 Prova do Módulo 4: A Entrevista de Imigração",
        description: "Enfrente o oficial Lucas Vance no controle de passaporte. Sem ajuda e 100% em inglês.",
        objective: "Apresente seus dados, objetivo da viagem e estadia ao oficial. Nota mínima: 6.0.",
        samplePhrases: ["Good day officer. I am visiting for ten days on holiday."],
        isExam: true
      }
    ],
    examNpc: {
      id: "lucas-airport",
      name: "Officer Lucas Vance",
      rolePt: "Agente de Imigração & Aeroporto",
      roleEn: "Airport Border Officer",
      avatarType: "receptionist",
      scenarioGoal: "Apresente seu passaporte, declare o motivo da viagem (turismo/férias), quanto tempo vai ficar e onde vai se hospedar.",
      initialGreetingEn: "Next traveler, step forward, please. Passport and declaration form. What is the purpose of your trip to the United States today?",
      systemPrompt: "You are Officer Lucas Vance, a formal airport border control officer. You speak strictly in standard American English. You DO NOT tolerate or understand Portuguese. If the traveler speaks Portuguese or stammers unintelligibly, frown and state authoritatively in English that you did not understand and require a clear English response regarding their purpose of visit.",
      confusionPhrases: [
        "Excuse me? I need you to state your destination clearly in English.",
        "I'm sorry, I didn't understand that response. What is the purpose of your visit?",
        "Pardon me? Please speak English at this counter.",
        "Could you repeat that? Did you say vacation or business?"
      ],
      successThresholdScore: 6.0,
      minTurns: 4
    },
    initialGreeting: {
      pt: "Você acabou de aterrissar no aeroporto internacional! O oficial de imigração te pergunta: 'What is the purpose of your visit?'. Responda: 'I'm here on vacation'."
    },
    promptContext: "MÓDULO ATIVO: Etapa 4. Travel & Airport (B1). FOCO ESTRITO: Treinar imigração, aeroporto, táxi e check-in no hotel em inglês.",
    mapCoords: { xPct: 53.5, yPct: 49 }
  },
  {
    id: "intermediate-conversations",
    stageNumber: 5,
    title: "5. Intermediate Conversations",
    cleanTitle: "Intermediate Conversations",
    subtitle: "Rotina, opiniões e trabalho",
    levelBadge: "B1-B2",
    difficulty: "intermediate",
    iconName: "Briefcase",
    description: "Saia do inglês robotizado: fale sobre seu fim de semana, dê opiniões sobre séries e livros, discuta tarefas de trabalho e planos futuros.",
    scenario: "Você está conversando com colegas internacionais durante o almoço ou em um encontro social descontraído.",
    mission: "Contar o que você fez no último fim de semana usando o passado simples ('I went to...') e dar uma opinião sincera.",
    xpReward: 180,
    samplePhrases: [
      "Last weekend I went hiking with friends.",
      "In my opinion, remote work is great.",
      "We should focus on solving this first.",
      "What do you think about this idea?"
    ],
    concepts: [
      {
        id: "inter-1",
        order: 1,
        title: "Narrando o Fim de Semana no Passado",
        description: "Uso fluído de verbos no passado simples ('went', 'saw', 'cooked', 'stayed') sem travar.",
        objective: "Contar pelo menos 2 coisas que você fez recentemente usando verbos regulares e irregulares.",
        samplePhrases: ["I watched a great documentary and relaxed at home.", "We visited some relatives."]
      },
      {
        id: "inter-2",
        order: 2,
        title: "Dando Opiniões Fortes e Educadas",
        description: "Expressões nativas como 'From my perspective', 'I feel that' e 'To be honest'.",
        objective: "Defender seu ponto de vista sem usar apenas 'I think'.",
        samplePhrases: ["In my honest opinion, that's the best option.", "I totally agree with that perspective."]
      },
      {
        id: "inter-3",
        order: 3,
        title: "Rotina Profissional e Projetos",
        description: "Descrevendo o que você faz no dia a dia do trabalho ou estudos.",
        objective: "Explicar sua função e principais desafios com clareza.",
        samplePhrases: ["I manage technical projects and coordinate the team.", "Right now we are migrating our database."]
      },
      {
        id: "inter-4",
        order: 4,
        title: "Concordando, Discordando e Conectivos",
        description: "Como discordar com elegância usando 'That makes sense, however...' e 'On the other hand'.",
        objective: "Manter o ritmo da conversa usando conectivos de transição naturais.",
        samplePhrases: ["I see your point, but on the other hand...", "That makes total sense."]
      },
      {
        id: "inter-5",
        order: 5,
        title: "🏆 Prova do Módulo 5: O Bate-Papo Corporativo",
        description: "Converse com o colega David Chen sobre projetos, fim de semana e opiniões de trabalho.",
        objective: "Sustentar conversa intermediária fluida com David em inglês. Nota mínima: 6.0.",
        samplePhrases: ["Hey David, last week we tackled the database redesign, which improved speed significantly."],
        isExam: true
      }
    ],
    examNpc: {
      id: "david-coworker",
      name: "David Chen",
      rolePt: "Colega de Trabalho",
      roleEn: "Senior Coworker",
      avatarType: "coworker",
      scenarioGoal: "Converse com David sobre como foi seu fim de semana ou seu projeto de trabalho atual e troque opiniões.",
      initialGreetingEn: "Hey! Good to see you at the coffee corner. How was your weekend? Did you get any downtime or did you have to work on projects?",
      systemPrompt: "You are David Chen, a friendly coworker in a tech company. You speak natural, conversational English. You DO NOT speak Portuguese. You do not tutor or offer corrections. If the speaker uses Portuguese or speaks incomprehensibly, look confused and ask what they meant in casual English.",
      confusionPhrases: [
        "Wait, what did you just say? I didn't quite get that.",
        "Sorry man, I don't speak Portuguese. What was that about?",
        "Huh? Could you repeat that? My coffee hasn't kicked in yet!",
        "I'm not following. What project did you mention?"
      ],
      successThresholdScore: 6.0,
      minTurns: 4
    },
    initialGreeting: {
      pt: "Estamos no escritório moderno do mapa! Me conta em inglês o que você fez no último fim de semana. Comece dizendo: 'Last weekend I went to...'."
    },
    promptContext: "MÓDULO ATIVO: Etapa 5. Intermediate Conversations (B1-B2). FOCO ESTRITO: Treinar narração no passado, dar opiniões, falar de trabalho e rotina.",
    mapCoords: { xPct: 65, yPct: 38 }
  },
  {
    id: "advanced-communication",
    stageNumber: 6,
    title: "6. Advanced Communication",
    cleanTitle: "Advanced Communication",
    subtitle: "Debates e entrevistas de alto nível",
    levelBadge: "B2-C1",
    difficulty: "advanced",
    iconName: "Sparkles",
    description: "Expresse ideias complexas com precisão: defenda pontos de vista, responda perguntas difíceis de entrevista e fale sobre trade-offs profissionais.",
    scenario: "Você está em uma reunião estratégica ou entrevista de emprego para uma empresa global do Vale do Silício.",
    mission: "Responder 'Tell me about yourself' com uma narrativa profissional concisa e defender uma decisão técnica sob pressão.",
    xpReward: 220,
    samplePhrases: [
      "Over the past few years, I've specialized in...",
      "The primary trade-off was between speed and accuracy.",
      "Let me elaborate on how we mitigated that risk.",
      "Had we chosen the alternative, costs would have escalated."
    ],
    concepts: [
      {
        id: "adv-1",
        order: 1,
        title: "O Pitch Pessoal de Alto Impacto ('Elevator Pitch')",
        description: "Como se posicionar como especialista em 60 segundos em inglês.",
        objective: "Apresentar sua trajetória profissional com precisão vocabular e sem hesitações.",
        samplePhrases: ["I specialize in scaling operations with a track record of driving efficiency.", "My expertise lies in..."]
      },
      {
        id: "adv-2",
        order: 2,
        title: "Respondendo Sobre Falhas e Lições Aprendidas",
        description: "Metodologia STAR (Situação, Tarefa, Ação, Resultado) em inglês.",
        objective: "Descrever um obstáculo superado com humildade e liderança.",
        samplePhrases: ["When faced with an unexpected outage, we pivoted our strategy immediately.", "The key takeaway was..."]
      },
      {
        id: "adv-3",
        order: 3,
        title: "Argumentação e Negociação Sob Pressão",
        description: "Como defender recursos, prazos e decisões contrárias à liderança com tato.",
        objective: "Usar linguagem condicional avançada e orações subordinadas.",
        samplePhrases: ["Given the current constraints, investing in this infrastructure is paramount.", "If we prioritize this now..."]
      },
      {
        id: "adv-4",
        order: 4,
        title: "Nuances Culturais e Humor Corporativo",
        description: "Entendendo ironia sutil, metáforas de negócios e ritmo de reunião executiva.",
        objective: "Reconhecer expressões idiomáticas de negócios e responder no tom certo.",
        samplePhrases: ["Let's touch base on that tomorrow.", "We need to align our stakeholders before rollout."]
      },
      {
        id: "adv-exam",
        order: 5,
        title: "🏆 Prova do Módulo 6: A Reunião com a Diretora Executiva",
        description: "Apresente sua proposta e responda aos questionamentos difíceis da diretora Victoria Sterling.",
        objective: "Demonstrar autoridade e clareza corporativa em inglês com Victoria. Nota mínima: 6.0.",
        samplePhrases: ["Good afternoon Victoria. I'd like to outline the key trade-offs in our proposed strategy."],
        isExam: true
      }
    ],
    examNpc: {
      id: "victoria-executive",
      name: "Victoria Sterling",
      rolePt: "Diretora de Parcerias Estratégicas",
      roleEn: "Executive Partner",
      avatarType: "executive",
      scenarioGoal: "Defenda sua proposta profissional, explique o principal benefício e responda com clareza aos questionamentos da diretora.",
      initialGreetingEn: "Good afternoon. Thank you for making time for this sync. I've reviewed your overview, but I'd like to hear directly from you: what is the core value proposition of your approach?",
      systemPrompt: "You are Victoria Sterling, a high-level corporate director. You communicate with executive polish in English. You expect articulate, professional English. You do not explain grammar or speak Portuguese. If the candidate is vague, incoherent, or speaks Portuguese, politely state your inability to understand and request clarification in English.",
      confusionPhrases: [
        "Pardon me, that was unclear. Could you articulate your point more directly in English?",
        "I'm sorry, I didn't follow that rationale. What specific metric are you referring to?",
        "Excuse me? We require this discussion to be in English. Could you restate that?",
        "I didn't catch that argument. Could you summarize it concisely?"
      ],
      successThresholdScore: 6.0,
      minTurns: 4
    },
    initialGreeting: {
      pt: "Você entrou na sala executiva do topo da torre! Imagine que o entrevistador perguntou: 'Tell me about yourself'. Faça um pitch profissional em inglês começando com 'I specialize in...'."
    },
    promptContext: "MÓDULO ATIVO: Etapa 6. Advanced Communication (B2-C1). FOCO ESTRITO: Treinar entrevistas avançadas, argumentação executiva, debates e precisão em inglês.",
    mapCoords: { xPct: 77, yPct: 44 }
  },
  {
    id: "final-challenge",
    stageNumber: 7,
    title: "7. Final Challenge: Boss Stage",
    cleanTitle: "Final Challenge: Boss Stage",
    subtitle: "Domínio total e conversa livre",
    levelBadge: "C1",
    difficulty: "advanced",
    iconName: "Award",
    description: "O desafio definitivo do Mr. Crazy! Conversação espontânea sem filtros: ritmo nativo, gírias, humor, reflexões filosóficas e desafios surpresa.",
    scenario: "O teste supremo: você está no topo do castelo do Mr. Crazy e deve manter um diálogo de alto nível sem vacilar.",
    mission: "Concluir o diálogo livre sem recorrer ao português e atingir aprovação na banca internacional.",
    xpReward: 300,
    samplePhrases: [
      "Let's talk about the future of artificial intelligence.",
      "If you ask me, the real bottleneck is human adaptation.",
      "I love exploring philosophical debates in English.",
      "Hit me with your toughest question!"
    ],
    concepts: [
      {
        id: "boss-1",
        order: 1,
        title: "Improviso e Respostas Espontâneas",
        description: "Responder a qualquer tema aleatório sem ensaio prévio e sem recorrer a muletas em português.",
        objective: "Manter fala contínua de 40 segundos sobre tema surpresa.",
        samplePhrases: ["That's an intriguing question. Let me reflect on how that relates to..."]
      },
      {
        id: "boss-2",
        order: 2,
        title: "Ironia, Metáforas e Conexões Culturais",
        description: "Compreensão de figuras de linguagem em conversas nativas velozes.",
        objective: "Utilizar pelo menos uma metáfora ou analogia de forma adequada.",
        samplePhrases: ["It's like comparing apples to oranges.", "We shouldn't put all our eggs in one basket."]
      },
      {
        id: "boss-3",
        order: 3,
        title: "Discurso Hipotético Avançado (Third Conditional)",
        description: "Estruturas como 'If I had known, I would have acted differently'.",
        objective: "Formular frases no condicional perfeito com fluidez acústica.",
        samplePhrases: ["Had circumstances been different, the outcome would have shifted."]
      },
      {
        id: "boss-4",
        order: 4,
        title: "Debates Filosóficos e Ética Moderna",
        description: "Discussão de temas complexos: IA, futuro do trabalho, sustentabilidade e sociedade.",
        objective: "Articular raciocínios abstratos com vocabulário rico e preciso.",
        samplePhrases: ["The ethical ramifications extend far beyond what we currently anticipate."]
      },
      {
        id: "boss-exam",
        order: 5,
        title: "👑 GRANDE PROVA FINAL: Banca Internacional",
        description: "Avaliação final com o Professor Arthur Pendelton. O teste supremo de fluência sem ajuda.",
        objective: "Superar a banca internacional em inglês fluente. Nota mínima para aprovação: 6.0.",
        samplePhrases: ["Professor Arthur, I am honored to present my spontaneous answers to your examination."],
        isExam: true
      }
    ],
    examNpc: {
      id: "arthur-examiner",
      name: "Professor Arthur Pendelton",
      rolePt: "Avaliador Internacional Chefe",
      roleEn: "Chief International Examiner",
      avatarType: "examiner",
      scenarioGoal: "Responda às questões espontâneas do Professor Arthur com profundidade, coerência vocabular e segurança total em inglês.",
      initialGreetingEn: "Welcome to your Final International Assessment. I am Professor Arthur Pendelton. Today we evaluate your spontaneous English communication. Are you prepared to begin your examination?",
      systemPrompt: "You are Professor Arthur Pendelton, the senior examiner for the Grand Challenge. You speak impeccable standard American English. You are rigorous, fair, and NEVER provide hints or speak Portuguese. If the candidate speaks Portuguese or pauses incoherently, furrow your brow and state clearly in English that you did not understand and require an articulate response in English.",
      confusionPhrases: [
        "I beg your pardon? That answer was unintelligible. Please respond in English.",
        "Candidate, I did not understand that phrasing. Could you provide a coherent response in English?",
        "Excuse me? This examination is strictly in English. Please formulate your argument clearly.",
        "I'm afraid I cannot evaluate that statement. Please speak clearly in English."
      ],
      successThresholdScore: 6.0,
      minTurns: 4
    },
    initialGreeting: {
      pt: "Você alcançou a Fortaleza Dourada do Mr. Crazy! Chegamos ao Final Challenge! Aqui é sem filtro e direto em inglês americano: 'Welcome to the Citadel! Are you ready to prove your fluency once and for all?'",
      en: "Welcome to the Citadel! You've traversed the entire map. Are you ready to prove your fluency once and for all?"
    },
    promptContext: "MÓDULO ATIVO: Etapa 7. Final Challenge (C1 Boss Challenge). FOCO ESTRITO: O teste supremo de fluência. Fale em inglês americano autêntico, desafiador, espirituoso e veloz. Teste o aluno em vocabulário, ritmo e respostas rápidas. Acolha com orgulho quando ele demonstrar domínio!",
    mapCoords: { xPct: 88, yPct: 54 }
  }
];

export const DEFAULT_MODULE_ID = "greetings";

const ID_ALIASES: Record<string, string> = {
  "work": "intermediate-conversations",
  "work-english": "intermediate-conversations",
  "interview": "advanced-communication",
  "job-interview": "advanced-communication",
  "free-conversation": "final-challenge"
};

export function getModuleById(id?: string | null): LearningModule {
  if (!id) return LEARNING_MODULES[0];
  const targetId = ID_ALIASES[id] || id;
  return LEARNING_MODULES.find((mod) => mod.id === targetId) ?? LEARNING_MODULES[0];
}

const STORAGE_KEY = "mr-crazy-selected-module";

export function getStoredModuleId(): string {
  if (typeof window === "undefined") return DEFAULT_MODULE_ID;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || DEFAULT_MODULE_ID;
    return ID_ALIASES[raw] || raw;
  } catch {
    return DEFAULT_MODULE_ID;
  }
}

export function setStoredModuleId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const targetId = ID_ALIASES[id] || id;
    window.localStorage.setItem(STORAGE_KEY, targetId);
  } catch {}
}
