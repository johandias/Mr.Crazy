"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Compass,
  Briefcase,
  Plane,
  Building2,
  GraduationCap,
  Volume2,
  Award
} from "lucide-react";
import type { UserProfile } from "@/lib/auth";
import type { LearningLevel } from "@/lib/mr-crazy";

interface DiagnosticQuestion {
  id: number;
  levelBadge: string;
  context: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

const diagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: 1,
    levelBadge: "A1 - Básico",
    context: "Você encontra um colega ou cliente pela manhã.",
    question: "Which sentence is the most natural way to greet someone and ask how they are?",
    options: [
      { id: "a", text: "Good morning! How are you doing today?", isCorrect: true },
      { id: "b", text: "Good morning! I have 25 years.", isCorrect: false },
      { id: "c", text: "Hello morning, what you do yesterday?", isCorrect: false },
      { id: "d", text: "Good day, I am with much tired today.", isCorrect: false }
    ],
    explanation: '"How are you doing today?" é a forma mais natural e comum no inglês americano.'
  },
  {
    id: 2,
    levelBadge: "A2 - Passado e Ações",
    context: "Você quer contar o que fez ontem no trabalho ou nos estudos.",
    question: "Which sentence correctly describes an action completed yesterday?",
    options: [
      { id: "a", text: "Yesterday I went to the office and solved the problem.", isCorrect: true },
      { id: "b", text: "Yesterday I go to the office and resolved-i the problem.", isCorrect: false },
      { id: "c", text: "Yesterday I goed to office and maked the report.", isCorrect: false },
      { id: "d", text: "Is solved yesterday when I go in the office.", isCorrect: false }
    ],
    explanation: 'O passado de GO é WENT (verbo irregular), e conectamos as ações com tempos verbais consistentes.'
  },
  {
    id: 3,
    levelBadge: "B1 - Entrevistas e Falsos Cognatos",
    context: "Em uma entrevista de emprego, você quer dizer que pretende liderar projetos.",
    question: 'How do you say that you PLAN or INTEND to lead projects (without using false cognates)?',
    options: [
      { id: "a", text: "I intend to lead new projects and support my team.", isCorrect: true },
      { id: "b", text: "I pretend to lead new projects and fake the results.", isCorrect: false },
      { id: "c", text: "I need decide lead project with my group.", isCorrect: false },
      { id: "d", text: "I am wanting for to make leadership in projects.", isCorrect: false }
    ],
    explanation: 'Cuidado: "pretend" significa fingir! Para pretender/planejar, usamos "intend" ou "plan".'
  },
  {
    id: 4,
    levelBadge: "B2 - Comunicação Profissional",
    context: "Você precisa pedir educadamente a um cliente estrangeiro uma previsão de entrega.",
    question: "How do you politely ask a foreign client for an update on the schedule?",
    options: [
      { id: "a", text: "Could you please provide an update on the current project timeline?", isCorrect: true },
      { id: "b", text: "You can talk the day that finish the thing?", isCorrect: false },
      { id: "c", text: "Give the date now because we need decide fast.", isCorrect: false },
      { id: "d", text: "Is possible you send to us the line of dead?", isCorrect: false }
    ],
    explanation: '"Could you please provide an update on..." é o padrão educado e profissional no ambiente de trabalho.'
  },
  {
    id: 5,
    levelBadge: "C1 - Expressões e Nuances Avançadas",
    context: "Em uma reunião de negócios, alguém menciona a expressão idiomática 'cut corners'.",
    question: "What does the English idiom 'to cut corners' mean in a work context?",
    options: [
      { id: "a", text: "To do something in the easiest, cheapest, or fastest way, often sacrificing quality.", isCorrect: true },
      { id: "b", text: "To physically cut the corners of a printed document.", isCorrect: false },
      { id: "c", text: "To arrive early at the office to prepare meetings.", isCorrect: false },
      { id: "d", text: "To take an alternative road when driving to work.", isCorrect: false }
    ],
    explanation: '"To cut corners" significa economizar tempo/dinheiro fazendo algo mal feito ou pulando etapas.'
  }
];

const learningGoalOptions = [
  {
    id: "daily_life",
    icon: Plane,
    title: "Dia a Dia e Viagens",
    description: "Quero falar em viagens, aeroportos, hotéis, restaurantes e conversar sem travar."
  },
  {
    id: "job_interview",
    icon: Briefcase,
    title: "Entrevistas de Emprego",
    description: "Quero passar em processos seletivos internacionais e responder com confiança."
  },
  {
    id: "business_work",
    icon: Building2,
    title: "Trabalho e Negócios",
    description: "Reuniões com estrangeiros, apresentações de projetos e comunicação no trabalho."
  },
  {
    id: "studies",
    icon: GraduationCap,
    title: "Estudos e Intercâmbio",
    description: "Preparação para cursos fora do país, certificações ou faculdade."
  },
  {
    id: "free_speaking",
    icon: Compass,
    title: "Destravar a Fala",
    description: "Perder o medo de errar, soltar a voz e falar inglês com naturalidade."
  }
];

export function OnboardingFlow({ user }: Readonly<{ user: UserProfile }>) {
  const router = useRouter();

  // Etapas: "goal" -> "test" -> "result"
  const [step, setStep] = useState<"goal" | "test" | "result">("goal");
  const [selectedGoal, setSelectedGoal] = useState<string>("daily_life");

  // Estados do teste de nivelamento
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: number; selected: string; isCorrect: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [calculatedLevel, setCalculatedLevel] = useState<LearningLevel>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentQuestion = diagnosticQuestions[currentQuestionIndex];

  function handleSelectGoal(goalId: string) {
    setSelectedGoal(goalId);
  }

  function handleConfirmGoal() {
    setStep("test");
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);
  }

  function handleSelectOption(optionId: string) {
    setSelectedOptionId(optionId);
  }

  function handleNextQuestion() {
    if (!selectedOptionId || !currentQuestion) return;

    const chosen = currentQuestion.options.find((opt) => opt.id === selectedOptionId);
    const isCorrect = Boolean(chosen?.isCorrect);

    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selected: selectedOptionId,
        isCorrect
      }
    ];
    setAnswers(newAnswers);

    const newScore = score + (isCorrect ? 1 : 0);
    setScore(newScore);

    if (currentQuestionIndex < diagnosticQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionId(null);
    } else {
      // Fim do teste: calcula o nível
      let level: LearningLevel = "basic";
      if (newScore >= 4) {
        level = "advanced";
      } else if (newScore >= 2) {
        level = "intermediate";
      } else {
        level = "basic";
      }
      setCalculatedLevel(level);
      setStep("result");
    }
  }

  async function handleFinishOnboarding() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const selectedGoalObj = learningGoalOptions.find((g) => g.id === selectedGoal);
      const goalTitle = selectedGoalObj ? selectedGoalObj.title : "Conversação prática";

      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learningGoal: goalTitle,
          level: calculatedLevel,
          score,
          answers
        })
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Erro ao salvar nivelamento.");
      }

      // Redireciona para a prática e atualiza a rota
      router.replace("/practice");
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao concluir nivelamento.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="onboarding-container">
      {/* HEADER DE BOAS-VINDAS */}
      <div className="onboarding-header">
        <div className="onboarding-badge">
          <Sparkles size={16} />
          <span>Primeiro Acesso • Diagnóstico Mr.Crazy</span>
        </div>
        <h1>Olá, {user.nickname || "Aluno"}! Vamos calibrar seu treino.</h1>
        <p>
          Para o Mr.Crazy não perder a paciência e te ensinar no ritmo certo, precisamos saber o seu foco e avaliar seu nível de inglês.
        </p>
      </div>

      {/* =================================================================== */}
      {/* ETAPA 1: ESCOLHA DO OBJETIVO */}
      {/* =================================================================== */}
      {step === "goal" && (
        <section className="onboarding-panel">
          <div className="panel-step-indicator">
            <span className="step-count">Passo 1 de 2</span>
            <h2>Para que você quer aprender ou praticar inglês?</h2>
          </div>

          <div className="goals-grid">
            {learningGoalOptions.map((goal) => {
              const IconComponent = goal.icon;
              const isSelected = selectedGoal === goal.id;
              return (
                <button
                  key={goal.id}
                  type="button"
                  className={`goal-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectGoal(goal.id)}
                >
                  <div className="goal-card-header">
                    <div className="goal-icon-circle">
                      <IconComponent size={22} />
                    </div>
                    {isSelected ? <CheckCircle2 className="goal-check" size={20} /> : null}
                  </div>
                  <h3>{goal.title}</h3>
                  <p>{goal.description}</p>
                </button>
              );
            })}
          </div>

          <div className="onboarding-action-row">
            <button
              type="button"
              className="primary-link large-btn"
              onClick={handleConfirmGoal}
            >
              Continuar para o Teste de Nivelamento
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* ETAPA 2: TESTE INTERATIVO DE NIVELAMENTO */}
      {/* =================================================================== */}
      {step === "test" && currentQuestion && (
        <section className="onboarding-panel">
          <div className="panel-step-indicator">
            <span className="step-count">
              Passo 2 de 2 • Questão {currentQuestionIndex + 1} de {diagnosticQuestions.length}
            </span>
            <span className="question-level-tag">{currentQuestion.levelBadge}</span>
          </div>

          {/* Barra de Progresso */}
          <div className="onboarding-progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentQuestionIndex + 1) / diagnosticQuestions.length) * 100}%`
              }}
            />
          </div>

          <div className="question-box">
            <div className="question-context-pill">
              <Compass size={14} />
              <span>{currentQuestion.context}</span>
            </div>
            <h2 className="question-title">{currentQuestion.question}</h2>
          </div>

          <div className="options-list">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`option-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectOption(opt.id)}
                >
                  <span className="option-letter">{opt.id.toUpperCase()}</span>
                  <span className="option-text">{opt.text}</span>
                  {isSelected ? <CheckCircle2 className="option-check" size={18} /> : null}
                </button>
              );
            })}
          </div>

          <div className="onboarding-action-row">
            <button
              type="button"
              className="primary-link large-btn"
              disabled={!selectedOptionId}
              onClick={handleNextQuestion}
            >
              {currentQuestionIndex === diagnosticQuestions.length - 1
                ? "Concluir Diagnóstico"
                : "Próxima Pergunta"}
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* ETAPA 3: RESULTADO E ATRIBUIÇÃO DE NÍVEL */}
      {/* =================================================================== */}
      {step === "result" && (
        <section className="onboarding-panel result-panel">
          <div className="result-badge-container">
            <Award size={48} className="result-award-icon" />
            <span className="result-eyebrow">Diagnóstico Concluído com Sucesso!</span>
            <h2>
              Seu nível inicial foi definido como:{" "}
              <span className={`level-highlight ${calculatedLevel}`}>
                {calculatedLevel === "basic"
                  ? "Básico (A1-A2)"
                  : calculatedLevel === "intermediate"
                    ? "Intermediário (B1-B2)"
                    : "Avançado (C1)"}
              </span>
            </h2>
          </div>

          <div className="result-feedback-card">
            <div className="teacher-quote">
              <Volume2 size={24} className="teacher-icon" />
              <div>
                <strong>Mensagem do Mr.Crazy:</strong>
                {calculatedLevel === "basic" ? (
                  <p>
                    &ldquo;Acertou {score} de {diagnosticQuestions.length}. Sem pânico! Vamos começar pelo básico com foco em destravar a língua, montar frases úteis do dia a dia e perder o medo de falar.&rdquo;
                  </p>
                ) : calculatedLevel === "intermediate" ? (
                  <p>
                    &ldquo;Muito bom, acertou {score} de {diagnosticQuestions.length}! Você já tem vocabulário e boa compreensão. Agora vamos lapidar a pronúncia, conectar ideias naturalmente e tirar as vícios de tradução mental.&rdquo;
                  </p>
                ) : (
                  <p>
                    &ldquo;Sensacional! Acertou {score} de {diagnosticQuestions.length}. Seu nível é avançado! Vamos direto para debates desafiadores, expressões idiomáticas americanas e precisão cirúrgica de fluência.&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>

          {errorMessage ? <p className="auth-notice error-notice">{errorMessage}</p> : null}

          <div className="onboarding-action-row">
            <button
              type="button"
              className="primary-link large-btn start-practice-btn"
              disabled={isSubmitting}
              onClick={handleFinishOnboarding}
            >
              {isSubmitting ? "Gravando seu perfil..." : "Começar Meu Treino no Mr.Crazy"}
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
