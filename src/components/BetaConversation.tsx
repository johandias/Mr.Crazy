"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  HelpCircle,
  LoaderCircle,
  Mic,
  RotateCcw,
  Send,
  Settings,
  Sparkles,
  Square,
  Volume2
} from "lucide-react";

export type ConversationOption = {
  textEn: string;
  textPt?: string;
};

type TeachingCard = {
  intentPt: string;
  mainPhrase: string;
  phoneticPt: string;
  explanationPt: string;
  alternatives: Array<{ phraseEn: string; contextPt: string }>;
};

type ChatMessage = {
  id: string;
  role: "user" | "crazy";
  text: string;
  source?: "voice" | "text" | "option";
  correction?: string;
  explanationPt?: string;
  followUp?: string;
  options?: ConversationOption[];
  teachingCard?: TeachingCard;
  isQuickOption?: boolean;
  createdAt?: string;
};

type ConversationReplyPayload = {
  reply?: string;
  correction?: string;
  explanationPt?: string;
  followUp?: string;
  options?: ConversationOption[];
  teachingCard?: TeachingCard;
  error?: string;
};

type FailedTurn = {
  message: string;
  source: "voice" | "text";
  history: Array<Pick<ChatMessage, "role" | "text">>;
};

const starterPrompts = [
  "Como falo que estou com fome?",
  "Qual frase uso para pedir desconto?",
  "Simule uma conversa em um restaurante.",
  "Corrija: I have 30 years old."
];

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getMessageTime() {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function getSpeakableText(message: ChatMessage) {
  return [message.text, message.correction, message.followUp].filter(Boolean).join(" ");
}

function getHistoryText(message: ChatMessage) {
  return message.role === "crazy" ? getSpeakableText(message) : message.text;
}

export function BetaConversation({ userName, learningLevel }: Readonly<{ userName: string; learningLevel?: string }>) {
  const isAdvanced = Boolean(
    learningLevel &&
    (learningLevel.toLowerCase().includes("advanced") ||
     learningLevel.toLowerCase().includes("avançad"))
  );
  const isBeginner = !isAdvanced;

  const [showExplainer, setShowExplainer] = useState(isBeginner);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "crazy",
      text: isBeginner
        ? `Olá, ${userName}! Esta é a nossa Conversa Livre com o Mr. Crazy. Aqui você treina inglês da vida real sem medo de errar. Eu converso com você em inglês, mas explico tudo em português para você entender com clareza. E você pode responder direto tocando nas alternativas prontas abaixo!`
        : `Welcome, ${userName}! This is our Free Conversation room. Here we dive straight into natural, real-world English with instant coaching on pronunciation, connected speech and idioms.`,
      followUp: isBeginner
        ? "Qual dessas situações práticas você quer treinar agora?"
        : "Which real-world scenario would you like to explore today?",
      options: isBeginner
        ? [
            { textEn: "I'd like to practice ordering at a restaurant.", textPt: "🍽️ Pedir comida e bebida em um restaurante" },
            { textEn: "Let's practice a simple job introduction.", textPt: "💼 Apresentação rápida de trabalho / entrevista" },
            { textEn: "I need English for traveling and airport.", textPt: "✈️ Situações de viagem, aeroporto e hotel" },
            { textEn: "I want to chat about games, movies, and hobbies.", textPt: "🎮 Bate-papo casual sobre hobbies e jogos" }
          ]
        : [
            { textEn: "Let's debate tech trends and future career plans.", textPt: "🚀 Debater tendências de tecnologia e carreira" },
            { textEn: "I want to debate movies, series, or video games.", textPt: "🎬 Debater filmes, séries e entretenimento" },
            { textEn: "Let's simulate a challenging professional interview.", textPt: "💼 Simulação de entrevista de emprego exigente" }
          ]
    }
  ]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [failedTurn, setFailedTurn] = useState<FailedTurn | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    setIsVoiceSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }, [draft]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const requestReply = async (
    message: string,
    source: "voice" | "text",
    history: Array<Pick<ChatMessage, "role" | "text">>
  ) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setIsSending(true);
    setError("");
    setFailedTurn(null);

    try {
      const response = await fetch("/api/conversation/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history })
      });
      const payload = (await response.json()) as ConversationReplyPayload;
      if (!response.ok || !payload.reply) throw new Error(payload.error || "Não consegui obter a resposta.");

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "crazy",
          text: payload.reply,
          correction: payload.correction,
          explanationPt: payload.explanationPt,
          followUp: payload.followUp,
          options: payload.options,
          teachingCard: payload.teachingCard,
          createdAt: getMessageTime()
        }
      ]);
    } catch (requestError) {
      setFailedTurn({ message, source, history });
      setError(requestError instanceof Error ? requestError.message : "Não consegui enviar sua mensagem.");
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const sendMessage = (rawMessage: string, source: "voice" | "text" | "option" = "text") => {
    const message = rawMessage.trim();
    if (!message || isSendingRef.current) return;

    const history = messages.slice(-12).map((item) => ({ role: item.role, text: getHistoryText(item) }));
    setMessages((current) => [
      ...current,
      {
        id: createMessageId(),
        role: "user",
        text: message,
        source,
        isQuickOption: source === "option",
        createdAt: getMessageTime()
      }
    ]);
    setDraft("");
    transcriptRef.current = "";
    void requestReply(message, source === "voice" ? "voice" : "text", history);
  };

  const handleSelectOption = (option: ConversationOption) => {
    if (isSendingRef.current) return;
    sendMessage(option.textEn, "option");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft, "text");
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(draft, "text");
    }
  };

  const toggleVoiceMessage = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsVoiceSupported(false);
      setError("A transcrição de voz não está disponível neste navegador. Digite sua mensagem.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    transcriptRef.current = "";
    setError("");

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
      transcriptRef.current = transcript;
      setDraft(transcript);
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        setError("Não consegui transcrever essa fala. Tente novamente ou digite a mensagem.");
      }
    };
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      const transcript = transcriptRef.current.trim();
      if (transcript) sendMessage(transcript, "voice");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const playReplyAudio = async (message: ChatMessage) => {
    if (playingMessageId === message.id) {
      audioRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setPlayingMessageId(null);
      return;
    }

    audioRef.current?.pause();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setPlayingMessageId(message.id);
    const speakableText = getSpeakableText(message);

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: speakableText })
      });
      if (!response.ok) throw new Error("speech-unavailable");

      const url = URL.createObjectURL(await response.blob());
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioUrlRef.current = null;
        setPlayingMessageId(null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioUrlRef.current = null;
        setPlayingMessageId(null);
      };
      await audio.play();
    } catch {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      const utterance = new SpeechSynthesisUtterance(speakableText);
      utterance.lang = /[áàâãéêíóôõúç]/iu.test(speakableText) ? "pt-BR" : "en-US";
      utterance.onend = () => setPlayingMessageId(null);
      utterance.onerror = () => setPlayingMessageId(null);
      window.speechSynthesis?.speak(utterance);
    }
  };

  const noticeText = isRecording
    ? "Ouvindo em inglês. Toque no botão vermelho para enviar."
    : isSending
      ? "Mr.Crazy está analisando sua mensagem."
      : "Texto ou voz: você conversa e recebe feedback objetivo.";

  const lastCrazyIndex = messages.map((m) => m.role).lastIndexOf("crazy");
  const showStarterPrompts = messages.length <= 1 && (!messages[0]?.options || messages[0].options.length === 0);

  return (
    <main className="beta-conversation-page">
      <section className="beta-conversation-shell" aria-label="Conversa com Mr.Crazy">
        <header className="beta-conversation-header">
          <Link href="/practice" className="beta-conversation-back" aria-label="Voltar para a prática">
            <ArrowLeft size={19} />
          </Link>
          <Image
            src="/assets/character/mr_crazy_avatar_clean.png"
            alt="Mr.Crazy"
            className="beta-conversation-avatar"
            width={46}
            height={46}
            priority
          />
          <div className="beta-conversation-identity">
            <div className="beta-conversation-title-row">
              <h1>Mr.Crazy</h1>
              <span>Beta</span>
            </div>
            <p><i aria-hidden="true" /> Professor online{learningLevel ? ` · nível ${learningLevel}` : ""}</p>
          </div>
          <Link href="/settings" className="beta-conversation-settings" aria-label="Abrir configurações">
            <Settings size={18} />
          </Link>
        </header>

        <div className={`beta-conversation-notice ${isRecording ? "is-recording" : ""}`} role="status">
          {isSending ? <LoaderCircle size={15} className="beta-spin" /> : <AudioLines size={15} />}
          <span>{noticeText}</span>
        </div>

        <div className={`beta-explainer-banner ${showExplainer ? "is-expanded" : "is-collapsed"}`}>
          <div className="beta-explainer-header">
            <div className="beta-explainer-title">
              <HelpCircle size={14} className="beta-explainer-icon" />
              <span>{isBeginner ? "O que é a Conversa Beta e como funciona?" : "Como funciona a Conversa Beta"}</span>
              {isBeginner ? <span className="beta-explainer-pill">Para iniciantes</span> : null}
            </div>
            <button
              type="button"
              className="beta-explainer-toggle"
              onClick={() => setShowExplainer(!showExplainer)}
              aria-expanded={showExplainer}
              aria-label={showExplainer ? "Recolher explicação" : "Ver como funciona"}
            >
              {showExplainer ? (
                <>
                  Recolher <ChevronUp size={13} />
                </>
              ) : (
                <>
                  Como funciona? <ChevronDown size={13} />
                </>
              )}
            </button>
          </div>
          {showExplainer && (
            <div className="beta-explainer-content">
              <p className="beta-explainer-lead">
                Aqui você treina <strong>conversação da vida real</strong> com o Mr. Crazy sem medo de travar:
              </p>
              <div className="beta-explainer-grid">
                <div className="beta-explainer-col">
                  <div className="beta-col-icon">⚡</div>
                  <div className="beta-col-text">
                    <strong>Respostas com 1 Toque</strong>
                    <p>Trava na hora de falar? Toque nas <em>alternativas prontas</em> para responder na hora sem digitar.</p>
                  </div>
                </div>
                <div className="beta-explainer-col">
                  <div className="beta-col-icon">🇧🇷</div>
                  <div className="beta-col-text">
                    <strong>Explicações em Português</strong>
                    <p>Mr. Crazy traduz o sentido, explica por que errou e ensina a melhor forma de falar.</p>
                  </div>
                </div>
                <div className="beta-explainer-col">
                  <div className="beta-col-icon">🎙️</div>
                  <div className="beta-col-text">
                    <strong>Voz ou Teclado Livre</strong>
                    <p>Quando se sentir seguro, fale pelo microfone ou digite livremente em inglês.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={messagesRef} className="beta-conversation-messages" role="log" aria-live="polite" aria-label="Mensagens da conversa">
          <div className="beta-conversation-day">Sessão de prática</div>
          {messages.map((message, index) => (
            <article key={message.id} className={`beta-message beta-message-${message.role}`}>
              {message.role === "crazy" ? (
                <Image
                  src="/assets/character/mr_crazy_avatar_clean.png"
                  alt=""
                  className="beta-message-avatar"
                  width={30}
                  height={30}
                />
              ) : null}
              <div className="beta-message-content">
                <p className="beta-message-primary">{message.text}</p>
                {message.correction ? (
                  <div className="beta-coach-feedback">
                    <span><BadgeCheck size={13} /> Melhor forma</span>
                    <strong lang="en">{message.correction}</strong>
                    {message.explanationPt ? <small>{message.explanationPt}</small> : null}
                  </div>
                ) : null}
                {message.followUp ? <p className="beta-message-follow-up">{message.followUp}</p> : null}

                {message.role === "crazy" && message.options && message.options.length > 0 && index === lastCrazyIndex && (
                  <div className="beta-interactive-card" aria-label="Alternativas para responder">
                    <div className="beta-interactive-header">
                      <div className="beta-interactive-title">
                        <Sparkles size={13} className="beta-sparkle-icon" />
                        <span>Escolha uma resposta para enviar agora:</span>
                      </div>
                      <small className="beta-interactive-hint">Toque para responder na hora, sem digitar</small>
                    </div>
                    <div className="beta-interactive-options">
                      {message.options.map((option, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="beta-interactive-option-btn"
                          onClick={() => handleSelectOption(option)}
                          disabled={isSending}
                          title={`Responder: "${option.textEn}"`}
                          aria-label={`Responder com alternativa: ${option.textEn}`}
                        >
                          <span className="beta-option-badge">{String.fromCharCode(65 + idx)}</span>
                          <div className="beta-option-content">
                            <strong className="beta-option-en" lang="en">{option.textEn}</strong>
                            {option.textPt ? <span className="beta-option-pt">{option.textPt}</span> : null}
                          </div>
                          <span className="beta-option-send-tag">
                            Enviar <ArrowRight size={13} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.role === "crazy" && message.teachingCard && (
                  <div className="beta-teaching-card" aria-label="Dica de como falar em inglês">
                    <div className="beta-teaching-card-header">
                      <span className="beta-teaching-card-label">📚 Como falar em inglês</span>
                      <span className="beta-teaching-card-intent">{message.teachingCard.intentPt}</span>
                    </div>
                    <div className="beta-teaching-card-main">
                      <span className="beta-teaching-main-phrase" lang="en">{message.teachingCard.mainPhrase}</span>
                      <span className="beta-teaching-phonetic">🔊 {message.teachingCard.phoneticPt}</span>
                    </div>
                    <p className="beta-teaching-explanation">{message.teachingCard.explanationPt}</p>
                    {message.teachingCard.alternatives && message.teachingCard.alternatives.length > 0 && (
                      <div className="beta-teaching-alternatives">
                        <span className="beta-teaching-alternatives-label">Variações — toque para praticar:</span>
                        {message.teachingCard.alternatives.map((alt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="beta-teaching-alt-btn"
                            onClick={() => handleSelectOption({ textEn: alt.phraseEn, textPt: alt.contextPt })}
                            disabled={isSending}
                          >
                            <span className="beta-alt-phrase" lang="en">{alt.phraseEn}</span>
                            <span className="beta-alt-context">{alt.contextPt}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <footer>
                  {message.source === "voice" ? <span><Mic size={11} /> Voz transcrita</span> : null}
                  {message.isQuickOption || message.source === "option" ? (
                    <span className="beta-chosen-badge"><Check size={11} /> Alternativa rápida</span>
                  ) : null}
                  {message.createdAt ? <time>{message.createdAt}</time> : null}
                  {message.role === "crazy" ? (
                    <button type="button" onClick={() => void playReplyAudio(message)} aria-label={`${playingMessageId === message.id ? "Parar" : "Ouvir"} resposta`}>
                      <Volume2 size={12} />
                      {playingMessageId === message.id ? "Parar" : "Ouvir"}
                    </button>
                  ) : null}
                </footer>
              </div>
            </article>
          ))}

          {showStarterPrompts ? (
            <div className="beta-starter-prompts" aria-label="Sugestões para começar">
              <span>Comece por aqui</span>
              {starterPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => sendMessage(prompt, "text")}>
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          {isSending ? (
            <div className="beta-message beta-message-crazy beta-message-loading" aria-label="Mr.Crazy está preparando o feedback">
              <Image src="/assets/character/mr_crazy_avatar_clean.png" alt="" className="beta-message-avatar" width={30} height={30} />
              <span><i /> <i /> <i /></span>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="beta-conversation-error" role="alert">
            <CircleAlert size={15} />
            <span>{error}</span>
            {failedTurn ? (
              <button type="button" onClick={() => void requestReply(failedTurn.message, failedTurn.source, failedTurn.history)}>
                <RotateCcw size={13} /> Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}

        <form className="beta-conversation-composer" onSubmit={handleSubmit}>
          <button
            type="button"
            className={`beta-voice-button ${isRecording ? "is-recording" : ""}`}
            onClick={toggleVoiceMessage}
            disabled={isSending || !isVoiceSupported}
            title={isRecording ? "Parar e enviar" : isVoiceSupported ? "Falar em inglês" : "Voz indisponível neste navegador"}
            aria-label={isRecording ? "Parar e enviar mensagem" : "Falar em inglês"}
          >
            {isRecording ? <Square size={15} fill="currentColor" /> : <Mic size={19} />}
          </button>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={isRecording ? "Ouvindo sua mensagem..." : "Escreva ou fale em inglês..."}
            disabled={isSending}
            maxLength={700}
            rows={1}
            aria-label={`Mensagem para o Mr.Crazy, ${userName}`}
          />
          <button type="submit" className="beta-send-button" disabled={!draft.trim() || isSending || isRecording} aria-label="Enviar mensagem">
            {isSending ? <LoaderCircle size={18} className="beta-spin" /> : <Send size={18} />}
          </button>
        </form>
      </section>
    </main>
  );
}
