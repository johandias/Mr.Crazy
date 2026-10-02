import { getModuleById, type ExamNpcConfig, type LearningModule } from "@/lib/modules";

export type ExamQuestion = {
  id: string;
  focus: string;
  question: string;
  responseGoal?: string;
  correctionFocus?: string;
  modelAnswer?: string;
};

export type ExamQuestionFeedback = {
  question_id: string;
  focus: string;
  question: string;
  answer: string;
  score: number;
  what_went_well: string;
  correction: string;
  model_answer: string;
  pronunciation_tip: string;
};

const QUESTION_CONTEXT_BY_FOCUS: Record<string, Pick<ExamQuestion, "responseGoal" | "correctionFocus" | "modelAnswer">> = {
  "name and origin": {
    responseGoal: "Diga seu nome e de onde você é.",
    correctionFocus: "ordem da apresentação, verbo to be e origem",
    modelAnswer: "My name is Ana, and I am from Brazil."
  },
  "friendly small talk": {
    responseGoal: "Responda à situação e acrescente um detalhe pessoal.",
    correctionFocus: "resposta completa e pergunta de continuidade",
    modelAnswer: "I am visiting for a few days, but I really like this neighborhood."
  },
  "greeting response": {
    responseGoal: "Diga como você está e dê um motivo curto.",
    correctionFocus: "estado no presente e naturalidade",
    modelAnswer: "I am doing well today because I had a good morning."
  },
  "asking back": {
    responseGoal: "Faça uma pergunta relacionada para manter o diálogo.",
    correctionFocus: "formação da pergunta e continuidade",
    modelAnswer: "What do you like to do around here?"
  },
  "polite closing": {
    responseGoal: "Encerre a conversa com educação e deixe uma despedida natural.",
    correctionFocus: "fórmula de encerramento e tom cordial",
    modelAnswer: "It was nice meeting you. Have a great evening!"
  },
  "table request": {
    responseGoal: "Informe quantas pessoas estão no grupo e confirme a mesa.",
    correctionFocus: "quantidade, pedido direto e polidez",
    modelAnswer: "There are two of us. A table by the window would be great."
  },
  "drink order": {
    responseGoal: "Peça uma bebida usando um pedido educado.",
    correctionFocus: "Would like, artigo e pedido completo",
    modelAnswer: "Could I have a glass of water, please?"
  },
  "main order": {
    responseGoal: "Faça o pedido principal e inclua um acompanhamento ou preferência.",
    correctionFocus: "verbo do pedido, item e detalhe",
    modelAnswer: "I will have the chicken with rice, please."
  },
  "recommendation request": {
    responseGoal: "Diga se quer recomendação e explique sua preferência.",
    correctionFocus: "preferência, motivo e pergunta educada",
    modelAnswer: "Yes, what do you recommend for someone who likes spicy food?"
  },
  "bill and payment": {
    responseGoal: "Peça a conta e informe como pretende pagar.",
    correctionFocus: "pedido da conta e meio de pagamento",
    modelAnswer: "Could we have the check, please? I will pay by card."
  },
  "shopping need": {
    responseGoal: "Diga o que procura e para qual ocasião precisa do item.",
    correctionFocus: "objeto, intenção e clareza",
    modelAnswer: "I am looking for a jacket for a business trip."
  },
  "price question": {
    responseGoal: "Pergunte o preço do item de forma natural.",
    correctionFocus: "pergunta com how much e referência ao item",
    modelAnswer: "How much is this jacket?"
  },
  "size and fitting room": {
    responseGoal: "Informe seu tamanho e peça para experimentar.",
    correctionFocus: "tamanho, try it on e pedido direto",
    modelAnswer: "I need a medium. Could I try it on?"
  },
  "payment method": {
    responseGoal: "Escolha uma forma de pagamento e responda diretamente.",
    correctionFocus: "will pay e meio de pagamento",
    modelAnswer: "I will pay with a credit card."
  },
  "receipt and closing": {
    responseGoal: "Escolha onde receber o recibo e encerre a compra.",
    correctionFocus: "preferência, future choice e despedida",
    modelAnswer: "By email, please. Thank you for your help."
  },
  "purpose of visit": {
    responseGoal: "Explique o motivo da viagem em uma frase completa.",
    correctionFocus: "purpose of e motivo objetivo",
    modelAnswer: "I am visiting for tourism and to see some friends."
  },
  "duration": {
    responseGoal: "Informe por quantos dias ficará no país.",
    correctionFocus: "will stay e duração",
    modelAnswer: "I will be staying for ten days."
  },
  "hotel address": {
    responseGoal: "Diga onde ficará e forneça um detalhe do local.",
    correctionFocus: "where I am staying e localização",
    modelAnswer: "I will be staying at the Grand Hotel downtown."
  },
  "documents": {
    responseGoal: "Confirme seus documentos e mencione a reserva ou passagem.",
    correctionFocus: "confirmação, possessivos e informação específica",
    modelAnswer: "Yes, I have my return ticket and hotel reservation."
  },
  "transport": {
    responseGoal: "Explique como irá do aeroporto até o hotel.",
    correctionFocus: "plano futuro, transporte e sequência",
    modelAnswer: "I will take a taxi from the airport to my hotel."
  },
  "past narrative": {
    responseGoal: "Conte duas coisas que você fez no fim de semana.",
    correctionFocus: "passado simples e sequência de ideias",
    modelAnswer: "I visited my family and watched a movie with friends."
  },
  "work routine": {
    responseGoal: "Descreva seu projeto atual e sua responsabilidade nele.",
    correctionFocus: "presente contínuo, vocabulário de trabalho e detalhe",
    modelAnswer: "I am working on a new app, and I lead the design team."
  },
  "challenge explanation": {
    responseGoal: "Explique um problema, sua ação e o resultado.",
    correctionFocus: "passado, causa, ação e resultado",
    modelAnswer: "We had a deadline problem, so I reorganized the work and we delivered on time."
  },
  "opinion": {
    responseGoal: "Dê sua opinião e sustente-a com um motivo.",
    correctionFocus: "opinião, conectivo e justificativa",
    modelAnswer: "I think remote work is effective because it gives people more flexibility."
  },
  "casual invitation": {
    responseGoal: "Aceite ou recuse o convite e explique por quê.",
    correctionFocus: "resposta ao convite e justificativa",
    modelAnswer: "Yes, I am joining because I have time before my next meeting."
  },
  "value proposition": {
    responseGoal: "Apresente o benefício central da sua proposta com precisão.",
    correctionFocus: "tese, benefício e vocabulário profissional",
    modelAnswer: "Our approach reduces delivery time while keeping quality consistent."
  },
  "risk handling": {
    responseGoal: "Nomeie o maior risco e explique como reduzi-lo.",
    correctionFocus: "risco, mitigação e linguagem condicional",
    modelAnswer: "The biggest risk is adoption, so we would run a pilot first."
  },
  "trade-off": {
    responseGoal: "Explique a escolha feita e o motivo do equilíbrio.",
    correctionFocus: "comparação, causa e decisão",
    modelAnswer: "We chose speed over extra features because the market window was short."
  },
  "business metric": {
    responseGoal: "Escolha uma métrica e explique o que ela provaria.",
    correctionFocus: "métrica, evidência e clareza executiva",
    modelAnswer: "The retention rate would prove whether the proposal is working."
  },
  "timeline": {
    responseGoal: "Proponha um prazo e descreva o primeiro marco.",
    correctionFocus: "prazo, sequência e recomendação",
    modelAnswer: "I recommend four weeks for the first milestone and a review at the end."
  },
  "spontaneous introduction": {
    responseGoal: "Apresente quem você é e seu objetivo atual em inglês.",
    correctionFocus: "clareza, confiança e organização da fala",
    modelAnswer: "I am a product designer, and my goal is to communicate confidently in English."
  },
  "abstract opinion": {
    responseGoal: "Defenda uma opinião abstrata com um exemplo concreto.",
    correctionFocus: "argumento, exemplo e conectivos",
    modelAnswer: "Yes, AI can improve learning when it adapts practice to each student."
  },
  "communication under pressure": {
    responseGoal: "Conte uma situação de pressão e a lição aprendida.",
    correctionFocus: "narrativa, causa e aprendizado",
    modelAnswer: "I had to explain a delay to a client, and I learned to communicate early."
  },
  "advanced hypothetical": {
    responseGoal: "Use uma hipótese no passado e explique a consequência.",
    correctionFocus: "third conditional e consequência",
    modelAnswer: "If I had started earlier, I would have practiced speaking every day."
  },
  "ethical reasoning": {
    responseGoal: "Escolha um desafio ético e justifique sua preocupação.",
    correctionFocus: "argumentação, consequência e precisão",
    modelAnswer: "Privacy concerns me most because technology can affect people without consent."
  },
  "figurative language": {
    responseGoal: "Use uma metáfora compreensível para explicar sua ideia.",
    correctionFocus: "metáfora, comparação e sentido",
    modelAnswer: "Language is a bridge because it connects people to new opportunities."
  }
};

const EXAM_QUESTION_BANKS: Record<string, ExamQuestion[]> = {
  greetings: [
    { id: "greetings-name-origin", focus: "name and origin", question: "Please introduce yourself with your name and where you are from." },
    { id: "greetings-neighborhood", focus: "friendly small talk", question: "Are you new around this neighborhood, or are you just visiting today?" },
    { id: "greetings-how-are-you", focus: "greeting response", question: "How are you doing today?" },
    { id: "greetings-return-question", focus: "asking back", question: "What would you like to ask me to keep this conversation friendly?" },
    { id: "greetings-politeness", focus: "polite closing", question: "How would you politely end this first conversation with a neighbor?" }
  ],
  restaurant: [
    { id: "restaurant-table", focus: "table request", question: "Good evening. How many people are in your party tonight?" },
    { id: "restaurant-drink", focus: "drink order", question: "What would you like to drink while you look at the menu?" },
    { id: "restaurant-main", focus: "main order", question: "What main dish would you like to order?" },
    { id: "restaurant-recommendation", focus: "recommendation request", question: "Would you like a recommendation, or have you already chosen your meal?" },
    { id: "restaurant-check", focus: "bill and payment", question: "Are you ready for the check, and how would you like to pay?" }
  ],
  shopping: [
    { id: "shopping-item", focus: "shopping need", question: "What item are you looking for today?" },
    { id: "shopping-price", focus: "price question", question: "Would you like to ask me the price of this jacket?" },
    { id: "shopping-size", focus: "size and fitting room", question: "What size do you need, and would you like to try it on?" },
    { id: "shopping-payment", focus: "payment method", question: "How would you like to pay for it?" },
    { id: "shopping-receipt", focus: "receipt and closing", question: "Would you like a receipt in the bag or by email?" }
  ],
  travel: [
    { id: "travel-purpose", focus: "purpose of visit", question: "What is the purpose of your trip to the United States?" },
    { id: "travel-duration", focus: "duration", question: "How long will you be staying in the country?" },
    { id: "travel-hotel", focus: "hotel address", question: "Where will you be staying during your visit?" },
    { id: "travel-documents", focus: "documents", question: "Do you have your return ticket and hotel reservation with you?" },
    { id: "travel-transport", focus: "transport", question: "How will you get from the airport to your hotel?" }
  ],
  "intermediate-conversations": [
    { id: "inter-weekend", focus: "past narrative", question: "How was your weekend? Tell me two things you did." },
    { id: "inter-project", focus: "work routine", question: "What project are you working on right now?" },
    { id: "inter-challenge", focus: "challenge explanation", question: "What challenge did you handle recently, and how did you solve it?" },
    { id: "inter-opinion", focus: "opinion", question: "What is your opinion about remote work?" },
    { id: "inter-lunch", focus: "casual invitation", question: "Are you joining the team for lunch today? Why or why not?" }
  ],
  "advanced-communication": [
    { id: "adv-value", focus: "value proposition", question: "What is the core value proposition of your approach?" },
    { id: "adv-risk", focus: "risk handling", question: "What is the biggest risk, and how would you mitigate it?" },
    { id: "adv-tradeoff", focus: "trade-off", question: "What trade-off did you choose, and why was it acceptable?" },
    { id: "adv-metric", focus: "business metric", question: "Which metric would prove that your proposal is working?" },
    { id: "adv-timeline", focus: "timeline", question: "What timeline would you recommend for the first milestone?" }
  ],
  "final-challenge": [
    { id: "final-intro", focus: "spontaneous introduction", question: "Start by presenting yourself and your current English goal in a clear, confident way." },
    { id: "final-ai", focus: "abstract opinion", question: "Do you think artificial intelligence will improve human learning? Defend your opinion." },
    { id: "final-pressure", focus: "communication under pressure", question: "Describe a moment when you had to communicate under pressure and what you learned." },
    { id: "final-hypothetical", focus: "advanced hypothetical", question: "If you had started learning English earlier, what would you have done differently?" },
    { id: "final-ethics", focus: "ethical reasoning", question: "What ethical challenge worries you most about technology, and why?" },
    { id: "final-metaphor", focus: "figurative language", question: "Use a metaphor to explain how language changes someone's opportunities." }
  ]
};

const GENERIC_QUESTIONS: ExamQuestion[] = [
  { id: "generic-goal", focus: "scenario goal", question: "Please explain what you need in this situation." },
  { id: "generic-detail", focus: "specific detail", question: "Give me one important detail so I can understand your request." },
  { id: "generic-choice", focus: "choice", question: "What option would you choose, and why?" },
  { id: "generic-closing", focus: "closing", question: "How would you finish this conversation politely?" }
];

function rotateQuestions(questions: ExamQuestion[], attempt: number): ExamQuestion[] {
  if (questions.length === 0) return questions;
  const offset = Math.max(0, attempt - 1) % questions.length;
  return [...questions.slice(offset), ...questions.slice(0, offset)];
}

function enrichQuestion(question: ExamQuestion): ExamQuestion {
  const context = QUESTION_CONTEXT_BY_FOCUS[question.focus] ?? {
    responseGoal: "Responda diretamente e acrescente um detalhe ligado à situação.",
    correctionFocus: "clareza, resposta completa e naturalidade",
    modelAnswer: "Give a complete answer with one clear detail."
  };

  return {
    ...question,
    responseGoal: question.responseGoal ?? context.responseGoal,
    correctionFocus: question.correctionFocus ?? context.correctionFocus,
    modelAnswer: question.modelAnswer ?? context.modelAnswer
  };
}

export function getExamQuestionPlan(moduleId: string, attempt: number, minQuestions?: number): ExamQuestion[] {
  const learningModule = getModuleById(moduleId);
  const source = EXAM_QUESTION_BANKS[learningModule.id] ?? GENERIC_QUESTIONS;
  const required = Math.max(3, minQuestions ?? learningModule.examNpc.minTurns);
  const rotated = rotateQuestions(source, attempt);
  return rotated.slice(0, Math.min(required, rotated.length)).map(enrichQuestion);
}

const EXAM_CONTEXTS: Record<string, string> = {
  greetings: "Contexto: primeira conversa com um vizinho. Apresente-se, responda com naturalidade e mantenha o diálogo.",
  restaurant: "Contexto: você está no restaurante. Faça pedidos, escolha opções e resolva a conta com educação.",
  shopping: "Contexto: você está comprando uma roupa. Explique o que procura, experimente e finalize o pagamento.",
  travel: "Contexto: você chegou aos Estados Unidos. Explique sua viagem, hospedagem, documentos e transporte.",
  "intermediate-conversations": "Contexto: conversa com um colega. Conte fatos, explique desafios e dê opiniões sobre trabalho.",
  "advanced-communication": "Contexto: reunião executiva. Defenda sua proposta, trate riscos e indique métricas e prazos.",
  "final-challenge": "Contexto: banca internacional. Responda temas surpresa com clareza, argumento e autonomia."
};

export function getExamContext(module: LearningModule): string {
  return EXAM_CONTEXTS[module.id] ?? `Contexto: aplique o inglês na situação de ${module.cleanTitle}.`;
}

export function getExamBriefing(module: LearningModule, attempt: number, questionCount: number): string {
  if (attempt > 1) {
    return `Segunda tentativa: ${questionCount} perguntas novas, só inglês. Eu corrijo clareza, gramática e fluência no final. Começa agora.`;
  }

  return `Agora é prova oral real: ${questionCount} perguntas, só inglês. Eu corrijo clareza, gramática e fluência no final. Começa agora.`;
}

export function getExamCompletionReply(examNpc: ExamNpcConfig): string {
  return `Thank you. I have enough answers for this assessment with ${examNpc.name}. Click Finalizar Prova so Mr. Crazy can evaluate you.`;
}

export function getNextExamReply(moduleId: string, attempt: number, answeredQuestions: number): string {
  const learningModule = getModuleById(moduleId);
  const plan = getExamQuestionPlan(moduleId, attempt, learningModule.examNpc.minTurns);
  return plan[answeredQuestions]?.question ?? getExamCompletionReply(learningModule.examNpc);
}

export function buildExamQuestionFeedback(question: ExamQuestion, answer: string): ExamQuestionFeedback {
  const cleanAnswer = answer.trim();
  const wordCount = cleanAnswer ? cleanAnswer.split(/\s+/).length : 0;
  const score = Math.min(96, Math.max(20, wordCount >= 12 ? 88 : wordCount >= 7 ? 78 : wordCount >= 4 ? 66 : 38));
  const answerWasUseful = wordCount >= 4;

  return {
    question_id: question.id,
    focus: question.focus,
    question: question.question,
    answer: cleanAnswer || "(sem resposta identificada)",
    score,
    what_went_well: answerWasUseful
      ? `Você respondeu ao foco de ${question.focus} com uma ideia compreensível.`
      : "A tentativa foi registrada, mas faltou informação para cumprir o objetivo da pergunta.",
    correction: answerWasUseful
      ? `Ajuste para soar mais natural: organize a resposta em uma frase completa e inclua ${question.correctionFocus ?? "um detalhe do contexto"}.`
      : `Refaça com uma frase completa. O foco era ${question.correctionFocus ?? question.focus}.`,
    model_answer: question.modelAnswer ?? "Give a complete answer with one clear detail.",
    pronunciation_tip: `Treine o ritmo das palavras-chave de ${question.focus}; fale em blocos curtos e não traduza palavra por palavra.`
  };
}
