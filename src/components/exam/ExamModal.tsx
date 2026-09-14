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
  ArrowRight,
  HelpCircle,
  Flame
} from "lucide-react";
import { getModuleById, type ExamNpcConfig } from "@/lib/modules";
import { PixelNpcCharacter, type NpcExpression } from "@/components/map/PixelNpcCharacter";
import type { ModuleEvaluationItem } from "@/components/ModuleSelector";

interface ExamTurn {
  role: "npc" | "user";
  text: string;
  isConfusion?: boolean;
}

interface ExamModalProps {
  isOpen: boolean;
  moduleId: string;
  onClose: () => void;
  onSuccessApproved?: (evaluation: ModuleEvaluationItem) => void;
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
  onSuccessApproved
}: ExamModalProps) {
  const currentModule = getModuleById(moduleId);
  const examNpc: ExamNpcConfig = currentModule.examNpc;

  const [dialogue, setDialogue] = useState<ExamTurn[]>([]);
  const [npcExpression, setNpcExpression] = useState<NpcExpression>("neutral");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const [confusionCount, setConfusionCount] = useState(0);
  const [turnCount, setTurnCount] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    overall_score: number;
    score_10: number;
    approved: boolean;
    feedback: string;
    strengths: string[];
    improvement_areas: string[];
    rawEvaluation: ModuleEvaluationItem;
  } | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dialogueEndRef = useRef<HTMLDivElement>(null);
  const isSpeechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

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

  // Reinicia o exame ao abrir ou trocar de módulo
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const initialGreeting = examNpc.initialGreetingEn;
    setDialogue([{ role: "npc", text: initialGreeting }]);
    setNpcExpression("speaking");
    setConfusionCount(0);
    setTurnCount(0);
    setEvaluationResult(null);
    setIsEvaluating(false);
    setTranscript("");
    setManualText("");

    // Fala a saudação inicial do NPC
    const timer = setTimeout(() => {
      speakNpc(initialGreeting, "neutral");
    }, 400);

    return () => clearTimeout(timer);
  }, [isOpen, moduleId, examNpc.initialGreetingEn, speakNpc]);

  // Scroll automático no diálogo
  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogue]);

  // Processa a fala do aluno
  const handleProcessUserResponse = useCallback(
    async (userInput: string) => {
      const cleanInput = userInput.trim();
      if (!cleanInput || isEvaluating) return;

      // 1. Adiciona a fala do aluno ao diálogo
      setDialogue((prev) => [...prev, { role: "user", text: cleanInput }]);
      setTurnCount((prev) => prev + 1);
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

      // 3. Usuário falou em inglês: NPC responde no contexto do papel
      setNpcExpression("listening");

      // Gerador dinâmico de resposta contextual do NPC
      setTimeout(() => {
        let npcReply = "";
        const lower = cleanInput.toLowerCase();

        if (examNpc.avatarType === "waiter") {
          if (lower.includes("table") || lower.includes("two") || lower.includes("seat")) {
            npcReply = "Right this way! Here is a comfortable table by the window. Can I start you off with something to drink?";
          } else if (lower.includes("coffee") || lower.includes("water") || lower.includes("drink") || lower.includes("tea")) {
            npcReply = "Excellent choice. I will bring that right away. Are you ready to order your main course, or do you need a minute?";
          } else if (lower.includes("check") || lower.includes("bill") || lower.includes("pay")) {
            npcReply = "Certainly, here is the check for your table. We accept card or cash. Did you enjoy everything tonight?";
          } else {
            npcReply = "Sounds delicious! I have put that order through to the kitchen. Can I get you anything else in the meantime?";
          }
        } else if (examNpc.avatarType === "neighbor") {
          if (lower.includes("brazil") || lower.includes("name is") || lower.includes("i'm")) {
            npcReply = "Oh, wonderful to meet you! Brazil is beautiful. Have you been living in this neighborhood long, or did you just move in?";
          } else if (lower.includes("how are you") || lower.includes("good morning") || lower.includes("fine")) {
            npcReply = "I'm doing really well, thank you for asking! Let me know if you need any recommendations for the best spots around town.";
          } else {
            npcReply = "That's very interesting! It's always great having friendly neighbors around. Have a fantastic day ahead!";
          }
        } else if (examNpc.avatarType === "cashier") {
          if (lower.includes("how much") || lower.includes("price") || lower.includes("cost")) {
            npcReply = "This jacket is twenty-nine dollars, and it's on a special 20% discount today! Would you like to try it on?";
          } else if (lower.includes("card") || lower.includes("cash") || lower.includes("pay")) {
            npcReply = "Perfect, you can tap your card right on the terminal. Would you like your receipt in the bag or via email?";
          } else {
            npcReply = "We certainly have that in medium and large in the back. Let me grab one for you to check out!";
          }
        } else if (examNpc.avatarType === "receptionist") {
          if (lower.includes("vacation") || lower.includes("holiday") || lower.includes("visit")) {
            npcReply = "Understood. Vacation for ten days. Where will you be staying during your visit, and do you have your return ticket ready?";
          } else if (lower.includes("hotel") || lower.includes("reservation") || lower.includes("name")) {
            npcReply = "All your documents are in order. Welcome to the country, enjoy your stay!";
          } else {
            npcReply = "Please place your luggage on the scale and keep your passport open to the photo page.";
          }
        } else {
          npcReply = "Understood. That makes complete sense from your perspective. Could you elaborate on how you plan to execute that?";
        }

        setDialogue((prev) => [...prev, { role: "npc", text: npcReply }]);
        speakNpc(npcReply, "pleased");
      }, 700);
    },
    [isEvaluating, examNpc, speakNpc]
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

      const res = await fetch("/api/modules/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          turns: Math.max(1, turnCount),
          isExam: true,
          confusionCount,
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
          rawEvaluation: data.evaluation
        });

        if (approved) {
          onSuccessApproved?.(data.evaluation);
        }
      } else {
        throw new Error(data.error || "Falha na avaliação");
      }
    } catch {
      // Fallback determinístico seguro
      const score10 = Math.max(2.0, Number((8.5 - confusionCount * 1.8 + Math.min(1.5, turnCount * 0.4)).toFixed(1)));
      const approved = score10 >= 6.0;

      const fallbackEval: ModuleEvaluationItem = {
        module_id: moduleId,
        overall_score: Math.round(score10 * 10),
        pronunciation_score: Math.round(score10 * 10),
        grammar_score: Math.round(Math.max(30, score10 * 10 - 5)),
        fluency_score: Math.round(score10 * 10),
        performance_level: approved ? "Bom" : "Em Desenvolvimento",
        summary_feedback: approved
          ? `Parabéns! Você foi APROVADO na prova com nota ${score10}/10.0! Comunicação efetiva em inglês com ${examNpc.name}.`
          : `Você obteve nota ${score10}/10.0. A nota mínima para aprovação é 6.0. O avatar não compreendeu várias falas. Tente novamente!`,
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
        rawEvaluation: fallbackEval
      });

      if (approved) {
        onSuccessApproved?.(fallbackEval);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

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
              Regra: Fale 100% em Inglês • Sem dicas do tutor • Nota mínima para passar: <strong>6.0 / 10.0</strong>
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
                <span className="metric-label">Turnos realizados:</span>
                <span className="metric-value">{turnCount} / {examNpc.minTurns}</span>
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
                  style={{ width: `${Math.min(100, (turnCount / examNpc.minTurns) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Coluna do Diálogo & Chat em Tempo Real */}
          <div className="exam-chat-column">
            <div className="exam-dialogue-feed">
              {dialogue.map((turn, index) => {
                const isNpc = turn.role === "npc";
                return (
                  <div
                    key={`exam-turn-${index}`}
                    className={`exam-bubble-row ${isNpc ? "npc-row" : "user-row"}`}
                  >
                    <div className={`exam-bubble ${isNpc ? "npc-bubble" : "user-bubble"} ${turn.isConfusion ? "confusion-turn" : ""}`}>
                      <div className="bubble-header">
                        <span className="bubble-author">
                          {isNpc ? examNpc.name : "Você (Aluno)"}
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
                  disabled={isEvaluating}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  <span>{isListening ? "Ouvindo... (Toque p/ enviar)" : "Falar em Inglês"}</span>
                </button>

                {/* Input de Texto alternativo para digitação */}
                <form
                  className="exam-text-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualText.trim()) {
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
                    disabled={isEvaluating}
                  />
                  <button
                    type="submit"
                    className="exam-send-btn"
                    disabled={!manualText.trim() || isEvaluating}
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
                  disabled={turnCount < 2 || isEvaluating}
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
                    <span className="card-title">Pontos Fortes:</span>
                    <ul>
                      {evaluationResult.strengths.map((str, i) => (
                        <li key={`str-${i}`}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluationResult.improvement_areas.length > 0 && (
                  <div className="result-points-card areas-card">
                    <span className="card-title">O que melhorar:</span>
                    <ul>
                      {evaluationResult.improvement_areas.map((area, i) => (
                        <li key={`area-${i}`}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Ações Finais */}
              <div className="result-actions-row">
                {!evaluationResult.approved ? (
                  <>
                    <button
                      type="button"
                      className="result-retry-btn"
                      onClick={() => {
                        setEvaluationResult(null);
                        setDialogue([{ role: "npc", text: examNpc.initialGreetingEn }]);
                        setNpcExpression("speaking");
                        setConfusionCount(0);
                        setTurnCount(0);
                        speakNpc(examNpc.initialGreetingEn, "neutral");
                      }}
                    >
                      <RotateCcw size={16} />
                      <span>Tentar Novamente a Prova</span>
                    </button>
                    <button
                      type="button"
                      className="result-study-btn"
                      onClick={onClose}
                    >
                      <span>Revisar Conceitos com Mr. Crazy</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="result-success-btn"
                    onClick={onClose}
                  >
                    <span>Avançar no Mapa de Aprendizado</span>
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
