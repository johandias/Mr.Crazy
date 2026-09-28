import { getModuleById, type ExamNpcConfig, type LearningModule } from "@/lib/modules";

export type ExamQuestion = {
  id: string;
  focus: string;
  question: string;
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

export function getExamQuestionPlan(moduleId: string, attempt: number, minQuestions?: number): ExamQuestion[] {
  const module = getModuleById(moduleId);
  const source = EXAM_QUESTION_BANKS[module.id] ?? GENERIC_QUESTIONS;
  const required = Math.max(3, minQuestions ?? module.examNpc.minTurns);
  const rotated = rotateQuestions(source, attempt);
  return rotated.slice(0, Math.min(required, rotated.length));
}

export function getExamBriefing(module: LearningModule, attempt: number, questionCount: number): string {
  if (attempt > 1) {
    return `Segunda tentativa de ${module.cleanTitle}: ${questionCount} perguntas novas, só inglês. Eu avalio no final. Começa agora.`;
  }

  return `Agora é prova oral real de ${module.cleanTitle}: ${questionCount} perguntas, só inglês. Eu avalio no final. Começa agora.`;
}

export function getExamCompletionReply(examNpc: ExamNpcConfig): string {
  return `Thank you. I have enough answers for this assessment with ${examNpc.name}. Click Finalizar Prova so Mr. Crazy can evaluate you.`;
}

export function getNextExamReply(moduleId: string, attempt: number, answeredQuestions: number): string {
  const module = getModuleById(moduleId);
  const plan = getExamQuestionPlan(moduleId, attempt, module.examNpc.minTurns);
  return plan[answeredQuestions]?.question ?? getExamCompletionReply(module.examNpc);
}
