"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, AudioLines, LoaderCircle, Mic, Send, Square, Volume2 } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "crazy";
  text: string;
  source?: "voice" | "text";
};

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "crazy",
  text: "Conversa beta liberada. Fala em inglês ou me pede ajuda em português. Manda uma mensagem.",
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function BetaConversation({ userName }: Readonly<{ userName: string }>) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const sendMessage = async (rawMessage: string, source: "voice" | "text") => {
    const message = rawMessage.trim();
    if (!message || isSending) return;

    const history = messages.slice(-8).map(({ role, text }) => ({ role, text }));
    const userMessage: ChatMessage = { id: createMessageId(), role: "user", text: message, source };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    transcriptRef.current = "";
    setIsSending(true);
    setError("");

    try {
      const response = await fetch("/api/conversation/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history })
      });
      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !payload.reply) throw new Error(payload.error || "Não consegui obter a resposta.");

      setMessages((current) => [...current, { id: createMessageId(), role: "crazy", text: payload.reply! }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não consegui enviar sua mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft, "text");
  };

  const toggleVoiceMessage = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setError("Seu navegador não oferece transcrição de voz. Use a mensagem escrita.");
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
      const transcript = transcriptRef.current.trim();
      if (transcript) void sendMessage(transcript, "voice");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const playReplyAudio = async (message: ChatMessage) => {
    if (playingMessageId === message.id) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setPlayingMessageId(null);
      return;
    }

    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setPlayingMessageId(message.id);

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message.text })
      });
      if (!response.ok) throw new Error("speech-unavailable");

      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPlayingMessageId(null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setPlayingMessageId(null);
      };
      await audio.play();
    } catch {
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.lang = /[áàâãéêíóôõúç]/iu.test(message.text) ? "pt-BR" : "en-US";
      utterance.onend = () => setPlayingMessageId(null);
      utterance.onerror = () => setPlayingMessageId(null);
      window.speechSynthesis?.speak(utterance);
    }
  };

  return (
    <main className="beta-conversation-page">
      <section className="beta-conversation-shell" aria-label="Conversa beta com Mr.Crazy">
        <header className="beta-conversation-header">
          <Link href="/practice" className="beta-conversation-back" aria-label="Voltar para a prática">
            <ArrowLeft size={18} />
          </Link>
          <Image
            src="/assets/character/mr_crazy_avatar_clean.png"
            alt="Mr.Crazy"
            className="beta-conversation-avatar"
            width={46}
            height={46}
            priority
          />
          <div>
            <div className="beta-conversation-title-row">
              <h1>Mr.Crazy</h1>
              <span>Beta</span>
            </div>
            <p>Professor de inglês · responde por texto</p>
          </div>
        </header>

        <div className="beta-conversation-notice">
          <AudioLines size={15} />
          <span>Fale em inglês. Sua fala será transcrita antes de o professor responder.</span>
        </div>

        <div className="beta-conversation-messages" role="log" aria-live="polite" aria-label="Mensagens da conversa">
          <div className="beta-conversation-day">CONVERSA BETA</div>
          {messages.map((message) => (
            <article key={message.id} className={`beta-message beta-message-${message.role}`}>
              {message.role === "crazy" && (
                <Image
                  src="/assets/character/mr_crazy_avatar_clean.png"
                  alt=""
                  className="beta-message-avatar"
                  width={28}
                  height={28}
                />
              )}
              <div className="beta-message-content">
                <p>{message.text}</p>
                <footer>
                  {message.source === "voice" && <span><Mic size={11} /> Voz</span>}
                  {message.role === "crazy" && (
                    <button type="button" onClick={() => void playReplyAudio(message)}>
                      <Volume2 size={12} />
                      {playingMessageId === message.id ? "Parar" : "Ouvir"}
                    </button>
                  )}
                </footer>
              </div>
            </article>
          ))}
          {isSending && (
            <div className="beta-message beta-message-crazy beta-message-loading" aria-label="Mr.Crazy está digitando">
              <Image src="/assets/character/mr_crazy_avatar_clean.png" alt="" className="beta-message-avatar" width={28} height={28} />
              <span><i /> <i /> <i /></span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="beta-conversation-error" role="alert">{error}</p>}

        <form className="beta-conversation-composer" onSubmit={handleSubmit}>
          <button
            type="button"
            className={`beta-voice-button ${isRecording ? "is-recording" : ""}`}
            onClick={toggleVoiceMessage}
            disabled={isSending}
            title={isRecording ? "Parar e enviar áudio" : "Enviar mensagem de voz"}
            aria-label={isRecording ? "Parar e enviar áudio" : "Enviar mensagem de voz"}
          >
            {isRecording ? <Square size={15} fill="currentColor" /> : <Mic size={19} />}
          </button>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isRecording ? "Ouvindo sua mensagem..." : `Mensagem para o Mr.Crazy, ${userName}`}
            disabled={isSending}
            maxLength={500}
            aria-label="Mensagem para o Mr.Crazy"
          />
          <button type="submit" className="beta-send-button" disabled={!draft.trim() || isSending} aria-label="Enviar mensagem">
            {isSending ? <LoaderCircle size={18} className="beta-spin" /> : <Send size={18} />}
          </button>
        </form>
      </section>
    </main>
  );
}
