"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Mic,
  MicOff,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  Award,
  ArrowRight
} from "lucide-react";
import { getModuleById, MODULES, type ExamNpcConfig } from "@/lib/modules";
import {
  buildExamQuestionFeedback,
  getExamContext,
  getExamBriefing,
  getExamCompletionReply,
  getExamQuestionPlan,
  getNextExamReply,
  type ExamQuestion,
  type ExamQuestionFeedback
} from "@/lib/exam";
import { PixelNpcCharacter, type NpcExpression } from "@/components/map/PixelNpcCharacter";
import type { ModuleEvaluationItem } from "@/components/ModuleSelector";

interface ExamTurn {
  role: "npc" | "user";
  text: string;
  isConfusion?: boolean;
  speaker?: "mrcrazy" | "examiner" | "student";
  questionId?: string;
}

interface ExamModalProps {
  isOpen: boolean;
  moduleId: string;
  onClose: () => void;
  onSuccessApproved?: (evaluation: ModuleEvaluationItem) => void;
  onNextModule?: (nextModuleId: string) => void;
  onRedoModule?: () => void;
}

// Detecção heurística instantânea de português ou fala confusa
const PORTUGUESE_MARKERS = [
  /\b(como\s+fala|como\s+se\s+diz|n[aã]o\s+sei|n[aã]o\s+consigo|o\s+que\s+[eé]|me\s+ajuda|socorro)\b/i,
  /\b(oi|ol[aá]|bom\s+dia|boa\s+tarde|boa\s+noite|tudo\s+bem|como\s+vai)\b/i,
  /\b(eu\s+quero|eu\s+gostaria|quero\s+pedir|quanto\s+custa|onde\s+fica|por\s+favor|obrigad[oa])\b/i,
  /\b(sim|n[aã]o|mas|porque|pra|para\s+mim|meu\s+nome\s+[eé])\b/i
];

function containsPortuguese(text: string): boolean {
  return PORTUGUESE_MARKERS.some((regex) => regex.test(text));
}

export function ExamModal({
  isOpen,
  moduleId,
  onClose,
  onSuccessApproved,
  onNextModule,
  onRedoModule
}: ExamModalProps) {
  const currentModule = getModuleById(moduleId);
  const examNpc: ExamNpcConfig = currentModule.examNpc;
  const currentIdx = MODULES.findIndex((m) => m.id === moduleId);
  const nextModule = currentIdx >= 0 && currentIdx < MODULES.length - 1 ? MODULES[currentIdx + 1] : null;

  const [dialogue, setDialogue] = useState<ExamTurn[]>([]);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [npcExpression, setNpcExpression] = useState<NpcExpression>("neutral");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const [confusionCount, setConfusionCount] = useState(0);
  const [turnCount, setTurnCount] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    overall_score: number;
    score_10: number;
    approved: boolean;
    feedback: string;
    strengths: string[];
    improvement_areas: string[];
    questionFeedback: ExamQuestionFeedback[];
    nextStep: string;
    rawEvaluation: ModuleEvaluationItem;
  } | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dialogueEndRef = useRef<HTMLDivElement>(null);
  const isSpeechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const requiredQuestionCount = Math.max(1, examQuestions.length || examNpc.minTurns);

  // Fala o texto do examinador com Web Speech API em voz americana/inglesa
  const speakNpc = useCallback((text: string, expressionAfter: NpcExpression = "neutral") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find((v) => v.lang.startsWith("en") && /(google|natural|samantha|david|zira)/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (enVoice) utterance.voice = enVoice;

      utterance.onstart = () => {
        setNpcExpression("speaking");
      };
      utterance.onend = () => {
        setNpcExpression(expressionAfter);
      };
      utterance.onerror = () => {
        setNpcExpression(expressionAfter);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setNpcExpression(expressionAfter);
    }
  }, []);

  const startPracticalAttempt = useCallback((attempt: number) => {
    const questionPlan = getExamQuestionPlan(moduleId, attempt, examNpc.minTurns);
    const contextBriefing = getExamContext(currentModule);
    const introduction = getExamBriefing(currentModule, attempt, questionPlan.length);
    const firstQuestion = questionPlan[0]?.question ?? examNpc.initialGreetingEn;
    const mrCrazyOpening = `${contextBriefing} ${introduction}`;
    const startNpcConversation = () => speakNpc(firstQuestion, "neutral");

    setExamQuestions(questionPlan);
    setDialogue([
      { role: "npc", text: contextBriefing, speaker: "mrcrazy" },
      { role: "npc", text: introduction, speaker: "mrcrazy" },
      { role: "npc", text: firstQuestion, speaker: "examiner", questionId: questionPlan[0]?.id }
    ]);
    setNpcExpression("speaking");
    setConfusionCount(0);
    setTurnCount(0);
    setEvaluationResult(null);
    setIsEvaluating(false);
    setTranscript("");
    setManualText("");
    setAttemptNumber(attempt);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      startNpcConversation();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(mrCrazyOpening);
    utterance.lang = "pt-BR";
    utterance.rate = 1;
    utterance.onend = startNpcConversation;
    utterance.onerror = startNpcConversation;
    window.speechSynthesis.speak(utterance);
  }, [currentModule, examNpc.initialGreetingEn, examNpc.minTurns, moduleId, speakNpc]);

  // Reinicia o exame ao abrir ou trocar de módulo
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const timer = setTimeout(() => startPracticalAttempt(1), 250);
    return () => clearTimeout(timer);
  }, [isOpen, moduleId, startPracticalAttempt]);

  // Scroll automático no diálogo
  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogue]);

  // Processa a fala do aluno
  const handleProcessUserResponse = useCallback(
    async (userInput: string) => {
      const cleanInput = userInput.trim();
      if (!cleanInput || isEvaluating || isProcessingResponse) return;
      setIsProcessingResponse(true);

      try {
        // 1. Adiciona a fala do aluno ao diálogo
        setDialogue((prev) => [
          ...prev,
          { role: "user", text: cleanInput, questionId: examQuestions[turnCount]?.id }
        ]);
        setTurnCount((prev) => prev + 1);
        const answeredQuestions = turnCount + 1;
        setTranscript("");
        setManualText("");

        // 2. Análise de Incompreensão / Português
        const isPortugueseOrUnclear = containsPortuguese(cleanInput) || cleanInput.length < 3;

        if (isPortugueseOrUnclear) {
          // NPC FICA COM CARA DE QUEM NÃO ENTENDEU!
          setNpcExpression("confused");
          setConfusionCount((prev) => prev + 1);

          const randomIndex = Math.floor(Math.random() * examNpc.confusionPhrases.length);
          const confusionReply = examNpc.confusionPhrases[randomIndex];

          setTimeout(() => {
            setDialogue((prev) => [
              ...prev,
              { role: "npc", text: confusionReply, isConfusion: true }
            ]);
            speakNpc(confusionReply, "confused");
          }, 500);
          return;
        }

        // 3. Usuário falou em inglês: Obtém resposta dinâmica do examinador
        setNpcExpression("listening");

        try {
          const replyRes = await fetch("/api/exam/reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              moduleId,
              userMessage: cleanInput,
              dialogue: [...dialogue, { role: "user", text: cleanInput }],
              confusionCount,
              attemptNumber
            })
          });

          if (replyRes.ok) {
            const replyData = await replyRes.json();
            if (replyData.ok && replyData.reply) {
              const isConfused = Boolean(replyData.isConfusion);
              if (isConfused) {
                setNpcExpression("confused");
                setConfusionCount((prev) => prev + 1);
              } else {
                setNpcExpression("pleased");
              }
              setDialogue((prev) => [
                ...prev,
                {
                  role: "npc",
                  text: replyData.reply,
                  isConfusion: isConfused,
                  speaker: "examiner",
                  questionId: replyData.nextQuestionId ?? examQuestions[answeredQuestions]?.id
                }
              ]);
              speakNpc(replyData.reply, isConfused ? "confused" : "pleased");
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to get exam reply from API, using fallback:", err);
        }

        // Fallback determinístico caso a API falhe
        setTimeout(() => {
          const npcReply = answeredQuestions >= requiredQuestionCount
            ? getExamCompletionReply(examNpc)
            : getNextExamReply(moduleId, attemptNumber, answeredQuestions);

          setDialogue((prev) => [
            ...prev,
            {
              role: "npc",
              text: npcReply,
              speaker: "examiner",
              questionId: examQuestions[answeredQuestions]?.id
            }
          ]);
          speakNpc(npcReply, "pleased");
        }, 700);
      } finally {
        setIsProcessingResponse(false);
      }
    },
    [attemptNumber, confusionCount, dialogue, examNpc, examQuestions, isEvaluating, isProcessingResponse, moduleId, requiredQuestionCount, speakNpc, turnCount]
  );

  // Inicia / para gravação de voz
  const toggleSpeechRecognition = () => {
    if (!isSpeechSupported) {
      alert("Seu navegador não suporta reconhecimento de voz nativo. Use a caixa de texto abaixo.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setNpcExpression("neutral");
      return;
    }

    const SpeechRecognitionClass = (window as unknown as {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setNpcExpression("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setTranscript(current);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcriptRef.current.trim()) {
        void handleProcessUserResponse(transcriptRef.current.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setNpcExpression("neutral");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Finalizar e avaliar prova
  const handleFinishExam = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const contextHistory = dialogue.map((t) => ({
        role: t.role === "npc" ? "crazy" : "user",
        text: t.text
      }));
      const examAnswers = dialogue
        .filter((turn) => turn.role === "user")
        .map((turn, index) => {
          const question = examQuestions.find((item) => item.id === turn.questionId) ?? examQuestions[index];
          return {
            questionId: question?.id,
            question: question?.question,
            focus: question?.focus,
            answer: turn.text
          };
        });

      const res = await fetch("/api/modules/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          turns: Math.max(1, turnCount),
          isExam: true,
          confusionCount,
          answeredQuestions: turnCount,
          requiredQuestions: requiredQuestionCount,
          questionPlan: examQuestions.map((q) => ({
            id: q.id,
            focus: q.focus,
            question: q.question,
            responseGoal: q.responseGoal,
            correctionFocus: q.correctionFocus,
            modelAnswer: q.modelAnswer
          })),
          examAnswers,
          contextHistory
        })
      });

      const data = await res.json();
      if (data.ok && data.evaluation) {
        const score10 = Number(data.score10 ?? (data.evaluation.overall_score / 10).toFixed(1));
        const approved = Boolean(data.isApproved ?? score10 >= 6.0);

        setEvaluationResult({
          overall_score: data.evaluation.overall_score,
          score_10: score10,
          approved,
          feedback: data.evaluation.summary_feedback,
          strengths: data.evaluation.strengths || [],
          improvement_areas: data.evaluation.improvement_areas || [],
          questionFeedback: Array.isArray(data.questionFeedback) && data.questionFeedback.length > 0
            ? data.questionFeedback
            : examQuestions.map((question, index) => buildExamQuestionFeedback(question, examAnswers[index]?.answer || "")),
          nextStep: String(data.nextStep || "Continue praticando respostas completas no contexto do módulo."),
          rawEvaluation: data.evaluation
        });

        if (approved) {
          onSuccessApproved?.(data.evaluation);
        }

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            const speechText = approved
              ? "Parabéns! Você foi aprovado na prova com nota " + score10 + "! " + (data.evaluation.summary_feedback || "")
              : "Você tirou nota " + score10 + ". A nota mínima para aprovação é 6.0. Revise os pontos e tente novamente!";
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.lang = "pt-BR";
            utterance.rate = 1.05;
            window.speechSynthesis.speak(utterance);
          } catch {
            // ignore speech error
          }
        }
      } else {
        throw new Error(data.error || "Falha na avaliação");
      }
    } catch {
      // Sem confirmação da API, a prova não pode liberar avanço sem persistir a nota.
      const completionRatio = Math.min(1, turnCount / requiredQuestionCount);
      const score10 = Math.max(2.0, Number((2 + completionRatio * 6.5 - confusionCount * 1.4).toFixed(1)));
      const approved = false;

      const fallbackEval: ModuleEvaluationItem = {
        module_id: moduleId,
        overall_score: Math.round(score10 * 10),
        pronunciation_score: Math.round(score10 * 10),
        grammar_score: Math.round(Math.max(30, score10 * 10 - 5)),
        fluency_score: Math.round(score10 * 10),
        performance_level: "Em Desenvolvimento",
        summary_feedback: `Sua prova foi concluída, mas a nota não pôde ser registrada. Finalize novamente para salvar o avanço antes de liberar o próximo módulo.`,
        strengths: ["Participou da conversa", "Focou no cenário"],
        improvement_areas: ["Falar exclusivamente em inglês", "Pronúncia mais clara"],
        evaluated_at: new Date().toISOString()
      };

      setEvaluationResult({
        overall_score: fallbackEval.overall_score,
        score_10: score10,
        approved,
        feedback: fallbackEval.summary_feedback,
        strengths: fallbackEval.strengths,
        improvement_areas: fallbackEval.improvement_areas,
        questionFeedback: examQuestions.map((question, index) =>
          buildExamQuestionFeedback(question, examAnswers[index]?.answer || "")
        ),
        nextStep: "Revise as respostas por pergunta e repita o módulo focando no ponto mais fraco.",
        rawEvaluation: fallbackEval
      });

    } finally {
      setIsEvaluating(false);
    }
  };

  const currentExamQuestion = examQuestions[Math.min(turnCount, Math.max(0, examQuestions.length - 1))];

  if (!isOpen) return null;

  return (
    <div className="exam-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="exam-modal-container">
        {/* Top Header da Prova */}
        <div className="exam-header-bar">
          <div className="exam-header-meta">
            <div className="exam-badge-pill">
              <Award size={14} className="badge-icon" />
              <span>PROVA PRÁTICA DA ETAPA {currentModule.stageNumber}</span>
            </div>
            <h2 className="exam-header-title">{currentModule.cleanTitle}</h2>
            <p className="exam-header-subtitle">
              Converse 100% em inglês • Sem dicas durante a prova • Nota mínima: <strong>6.0 / 10.0</strong>
            </p>
          </div>

          <button
            type="button"
            className="exam-close-btn"
            onClick={onClose}
            title="Sair da prova"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cenário e Objetivo em destaque */}
        <div className="exam-goal-banner">
          <div className="goal-flag">
            <Sparkles size={15} />
            <span>MISSÃO DA PROVA</span>
          </div>
          <p className="goal-text">{examNpc.scenarioGoal}</p>
        </div>

        <div className="exam-intro-banner" role="status">
          <strong>Mr.Crazy:</strong> {attemptNumber === 1
            ? "responda às perguntas em inglês. Eu avalio clareza, gramática, fluência e objetivo."
            : "perguntas novas, mesma regra: só inglês. A correção vem no final."}
        </div>

        {/* Corpo Principal: Avatar do NPC + Diálogo */}
        <div className="exam-stage-grid">
          {/* Coluna do Avatar Pixelado do NPC */}
          <div className="exam-npc-column">
            <div className="npc-podium">
              <PixelNpcCharacter
                avatarType={examNpc.avatarType}
                expression={npcExpression}
                name={examNpc.name}
                roleTitle={examNpc.rolePt}
                size={175}
              />

              {/* Status Reativo do Avatar */}
              <div className="npc-status-tag">
                {npcExpression === "confused" && (
                  <span className="status-confused animate-shake">
                    <AlertTriangle size={13} />
                    <span>Não Entendeu! (Huh?)</span>
                  </span>
                )}
                {npcExpression === "listening" && (
                  <span className="status-listening">
                    <span className="live-dot" />
                    <span>Ouvindo sua resposta...</span>
                  </span>
                )}
                {npcExpression === "speaking" && (
                  <span className="status-speaking">
                    <Volume2 size={13} />
                    <span>Falando em inglês...</span>
                  </span>
                )}
                {npcExpression === "pleased" && (
                  <span className="status-pleased">
                    <CheckCircle2 size={13} />
                    <span>Entendeu e respondeu!</span>
                  </span>
                )}
                {npcExpression === "neutral" && (
                  <span className="status-neutral">
                    <span>Aguardando sua fala</span>
                  </span>
                )}
              </div>
            </div>

            {/* Contador de Turnos & Alertas */}
            <div className="exam-metrics-card">
              <div className="metric-row">
                <span className="metric-label">Perguntas respondidas:</span>
                <span className="metric-value">{Math.min(turnCount, requiredQuestionCount)} / {requiredQuestionCount}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Vezes sem entender:</span>
                <span className={`metric-value ${confusionCount > 0 ? "text-amber" : ""}`}>
                  {confusionCount}
                </span>
              </div>
              <div className="metric-progress-bar">
                <div
                  className="metric-progress-fill"
                  style={{ width: `${Math.min(100, (turnCount / requiredQuestionCount) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Coluna do Diálogo & Chat em Tempo Real */}
          <div className="exam-chat-column">
            {currentExamQuestion && !evaluationResult && (
              <div className="exam-task-context" aria-live="polite">
                <span className="exam-task-kicker">FOCO DESTA PERGUNTA</span>
                <strong>{currentExamQuestion.focus}</strong>
                <p>{currentExamQuestion.responseGoal}</p>
              </div>
            )}
            <div className="exam-dialogue-feed">
              {dialogue.map((turn, index) => {
                const isNpc = turn.role === "npc";
                const author = turn.role === "user"
                  ? "Você (Aluno)"
                  : turn.speaker === "mrcrazy"
                    ? "Mr.Crazy"
                    : examNpc.name;
                return (
                  <div
                    key={`exam-turn-${index}`}
                    className={`exam-bubble-row ${isNpc ? "npc-row" : "user-row"}`}
                  >
                    <div className={`exam-bubble ${isNpc ? "npc-bubble" : "user-bubble"} ${turn.isConfusion ? "confusion-turn" : ""}`}>
                      <div className="bubble-header">
                        <span className="bubble-author">
                          {author}
                        </span>
                        {turn.isConfusion && (
                          <span className="confusion-pill">🤔 Confuso / Não entendeu</span>
                        )}
                      </div>
                      <p className="bubble-text">{turn.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={dialogueEndRef} />
            </div>

            {/* Input e Controles de Fala */}
            <div className="exam-input-dock">
              {turnCount >= requiredQuestionCount && !evaluationResult && (
                <div
                  className="exam-ready-banner animate-fade-in"
                  style={{
                    padding: "6px 12px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#34d399",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "8px"
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Você respondeu à banca. Clique em <strong>Finalizar Prova</strong> para o Mr.Crazy dar nota e resumo.</span>
                </div>
              )}

              {transcript && (
                <div className="exam-transcript-preview">
                  <span className="transcript-label">Detectando fala:</span>
                  <span className="transcript-text">"{transcript}"</span>
                </div>
              )}

              <div className="exam-controls-row">
                {/* Botão de Microfone */}
                <button
                  type="button"
                  className={`exam-mic-btn ${isListening ? "mic-recording" : ""}`}
                  onClick={toggleSpeechRecognition}
                  title={isListening ? "Parar de gravar" : "Falar em inglês"}
                  disabled={isEvaluating || isProcessingResponse}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  <span>{isListening ? "Ouvindo... (Toque p/ enviar)" : "Falar em Inglês"}</span>
                </button>

                {/* Input de Texto alternativo para digitação */}
                <form
                  className="exam-text-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualText.trim() && !isProcessingResponse) {
                      void handleProcessUserResponse(manualText.trim());
                    }
                  }}
                >
                  <input
                    type="text"
                    className="exam-text-input"
                    placeholder="Ou digite sua resposta em inglês..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    disabled={isEvaluating || isProcessingResponse}
                  />
                  <button
                    type="submit"
                    className="exam-send-btn"
                    disabled={!manualText.trim() || isEvaluating || isProcessingResponse}
                    title="Enviar resposta"
                  >
                    <Send size={16} />
                  </button>
                </form>

                {/* Botão de Finalizar Prova */}
                <button
                  type="button"
                  className="exam-finish-action-btn"
                  onClick={handleFinishExam}
                  disabled={turnCount < requiredQuestionCount || isEvaluating || isProcessingResponse}
                  title="Concluir a prova e calcular sua nota final"
                >
                  <Award size={16} />
                  <span>{isEvaluating ? "Avaliando..." : "Finalizar Prova"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* MODAL DE RESULTADO / NOTA DA PROVA */}
        {/* ============================================================= */}
        {evaluationResult && (
          <div className="exam-result-overlay animate-scale-in">
            <div className={`exam-result-card ${evaluationResult.approved ? "result-approved" : "result-failed"}`}>
              {/* Ícone e Status */}
              <div className="result-header">
                {evaluationResult.approved ? (
                  <div className="result-icon-badge approved-badge">
                    <CheckCircle2 size={42} />
                  </div>
                ) : (
                  <div className="result-icon-badge failed-badge">
                    <XCircle size={42} />
                  </div>
                )}

                <div className="result-status-title">
                  <span className="result-verdict">
                    {evaluationResult.approved ? "🎉 APROVADO NA ETAPA!" : "❌ REPROVADO NA PROVA"}
                  </span>
                  <div className="result-score-tag">
                    <span className="score-big">{evaluationResult.score_10}</span>
                    <span className="score-scale">/ 10.0</span>
                  </div>
                </div>
              </div>

              {/* Mensagem de Feedback Pedagógico */}
              <div className="result-feedback-box">
                <p className="result-feedback-text">{evaluationResult.feedback}</p>
                {!evaluationResult.approved && (
                  <div className="result-failure-notice">
                    <AlertTriangle size={15} />
                    <span>
                      A nota mínima para aprovação é <strong>6.0</strong>. Você precisa de mais clareza para se comunicar com o avatar da etapa.
                    </span>
                  </div>
                )}
              </div>

              {/* Pontos Fortes e Melhorias */}
              <div className="result-points-grid">
                {evaluationResult.strengths.length > 0 && (
                  <div className="result-points-card strengths-card">
                    <span className="card-title">✅ Resumo do que você acertou (Pontos Fortes):</span>
                    <ul>
                      {evaluationResult.strengths.map((str, i) => (
                        <li key={`str-${i}`}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluationResult.improvement_areas.length > 0 && (
                  <div className="result-points-card areas-card">
                    <span className="card-title">⚠️ O que você errou / Pontos para melhorar:</span>
                    <ul>
                      {evaluationResult.improvement_areas.map((area, i) => (
                        <li key={`area-${i}`}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {evaluationResult.questionFeedback.length > 0 && (
                <section className="exam-answer-review" aria-label="Correção por pergunta">
                  <div className="exam-answer-review-heading">
                    <span className="card-title">CORREÇÃO POR PERGUNTA</span>
                    <span className="exam-answer-review-hint">O que funcionou e como melhorar</span>
                  </div>
                  <div className="exam-answer-review-list">
                    {evaluationResult.questionFeedback.map((review, index) => (
                      <article className="exam-answer-review-item" key={`${review.question_id}-${index}`}>
                        <div className="exam-answer-review-topline">
                          <span>#{index + 1} · {review.focus}</span>
                          <strong>{(review.score / 10).toFixed(1)}/10</strong>
                        </div>
                        <p className="exam-answer-review-question">{review.question}</p>
                        <p><b>Sua resposta:</b> {review.answer}</p>
                        <p className="review-positive"><b>Funcionou:</b> {review.what_went_well}</p>
                        <p><b>Ajuste:</b> {review.correction}</p>
                        <p><b>Modelo:</b> {review.model_answer}</p>
                        <p className="review-pronunciation"><b>Pronúncia:</b> {review.pronunciation_tip}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <div className="exam-next-step">
                <strong>Próximo treino</strong>
                <span>{evaluationResult.nextStep}</span>
              </div>

              {/* Ações Finais */}
              <div className="result-actions-row">
                {!evaluationResult.approved ? (
                  <>
                    {attemptNumber === 1 && (
                      <button
                        type="button"
                        className="result-retry-btn"
                        onClick={() => startPracticalAttempt(2)}
                      >
                        <RotateCcw size={16} />
                        <span>Fazer uma segunda tentativa</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="result-study-btn"
                      onClick={onRedoModule || onClose}
                    >
                      <span>Refazer este módulo</span>
                    </button>
                  </>
                ) : (
                  <>
                    {nextModule ? (
                      <button
                        type="button"
                        className="result-success-btn"
                        onClick={() => {
                          if (onNextModule) {
                            onNextModule(nextModule.id);
                          } else {
                            onClose();
                          }
                        }}
                      >
                        <span>Avançar para Próxima Etapa: {nextModule.cleanTitle || nextModule.title}</span>
                        <ArrowRight size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="result-success-btn"
                        onClick={onClose}
                      >
                        <span>Parabéns! Você Concluiu Todo o Treinamento!</span>
                        <Award size={18} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
