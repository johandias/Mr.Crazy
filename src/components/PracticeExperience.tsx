"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, BriefcaseBusiness, Plane, Shuffle, Sparkles, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ConversationBubble } from "@/components/ConversationBubble";
import { CorrectionDisplay } from "@/components/CorrectionDisplay";
import { CrazyCharacter } from "@/components/CrazyCharacter";
import { ListenButton } from "@/components/ListenButton";
import { ListeningWave } from "@/components/ListeningWave";
import { PronunciationFeedback } from "@/components/PronunciationFeedback";
import { RepeatButton } from "@/components/RepeatButton";
import { SessionHeader } from "@/components/SessionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { clampCrazyLevel, getEmotion, type AnalysisResponse, type MistakeCategory, type VoiceState } from "@/lib/mr-crazy";

type SessionMode = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

type PracticeHistory = {
  sentence: string;
  corrected: string;
  mistake: MistakeCategory;
  createdAt: string;
};

type StoredSession = {
  crazyLevel: number;
  xp: number;
  mistakes: MistakeCategory[];
  history: PracticeHistory[];
};

const modes: SessionMode[] = [
  { id: "free-conversation", label: "Free conversation", icon: Sparkles },
  { id: "work-english", label: "Work English", icon: BriefcaseBusiness },
  { id: "job-interview", label: "Job Interview", icon: UserRound },
  { id: "travel", label: "Travel", icon: Plane },
  { id: "random-topic", label: "Random", icon: Shuffle }
];

const examples = ["Yesterday I go to work.", "I have 22 years.", "We played-i video games.", "Tell me about yourself."];

function getStoredSession(): StoredSession {
  const fallback: StoredSession = {
    crazyLevel: 16,
    xp: 420,
    mistakes: [],
    history: []
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem("mr-crazy-session");
  if (!stored) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StoredSession>;
    return {
      crazyLevel: typeof parsed.crazyLevel === "number" ? parsed.crazyLevel : fallback.crazyLevel,
      xp: typeof parsed.xp === "number" ? parsed.xp : fallback.xp,
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : fallback.mistakes,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 6) : fallback.history
    };
  } catch {
    window.localStorage.removeItem("mr-crazy-session");
    return fallback;
  }
}

export function PracticeExperience() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [crazyLevel, setCrazyLevel] = useState(16);
  const [xp, setXp] = useState(420);
  const [manualText, setManualText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [selectedMode, setSelectedMode] = useState("free-conversation");
  const [mistakes, setMistakes] = useState<MistakeCategory[]>([]);
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const emotion = useMemo(() => getEmotion(crazyLevel), [crazyLevel]);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasSpeechRecognition =
    typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = getStoredSession();
      setCrazyLevel(stored.crazyLevel);
      setXp(stored.xp);
      setMistakes(stored.mistakes);
      setHistory(stored.history);
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    window.localStorage.setItem(
      "mr-crazy-session",
      JSON.stringify({
        crazyLevel,
        xp,
        mistakes,
        history
      })
    );
  }, [crazyLevel, xp, mistakes, history, storageReady]);

  function speak(text: string, nextState: VoiceState = "waiting_for_repeat") {
    if (!canSpeak) {
      setVoiceState(nextState);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.96;
    utterance.pitch = emotion === "crazy" ? 1.12 : emotion === "calm" ? 0.95 : 1.02;
    utterance.onstart = () => setVoiceState("speaking");
    utterance.onend = () => setVoiceState(nextState);
    utterance.onerror = () => setVoiceState(nextState);
    window.speechSynthesis.speak(utterance);
  }

  async function analyzeSentence(sentence: string) {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) return;

    setErrorMessage("");
    setTranscript(cleanSentence);
    setVoiceState("analyzing");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: cleanSentence,
          previousMistakes: mistakes,
          crazyLevel,
          mode: selectedMode
        })
      });

      if (!response.ok) {
        throw new Error("analysis failed");
      }

      const result = (await response.json()) as AnalysisResponse;
      const nextCrazyLevel = clampCrazyLevel(crazyLevel + result.crazy_delta);
      setAnalysis(result);
      setCrazyLevel(nextCrazyLevel);
      setXp((current) => current + result.xp_delta);

      if (!result.correct) {
        setMistakes((current) => [result.mistake_type, ...current].slice(0, 12));
      }

      setHistory((current) =>
        [
          {
            sentence: result.user_sentence,
            corrected: result.corrected_sentence,
            mistake: result.mistake_type,
            createdAt: new Date().toISOString()
          },
          ...current
        ].slice(0, 6)
      );

      setVoiceState("reacting");
      window.setTimeout(() => {
        speak(`${result.reaction}. ${result.corrected_sentence}. ${result.follow_up}`);
      }, 420);
    } catch {
      setErrorMessage("A analise falhou. Digite uma frase e tente de novo.");
      setVoiceState("idle");
    }
  }

  function startListening() {
    setErrorMessage("");

    if (!hasSpeechRecognition) {
      setErrorMessage("Reconhecimento de voz indisponivel neste navegador.");
      textInputRef.current?.focus();
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return;

    window.speechSynthesis?.cancel();
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setTranscript(text);

      const isFinal = Array.from(event.results).some((result) => result.isFinal);
      if (isFinal) {
        setVoiceState("transcribing");
        window.setTimeout(() => analyzeSentence(text), 260);
      }
    };

    recognition.onerror = () => {
      setErrorMessage("Nao consegui capturar o audio. O modo texto esta pronto.");
      setVoiceState("idle");
      textInputRef.current?.focus();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setVoiceState((current) => (current === "listening" ? "idle" : current));
    };

    setVoiceState("listening");
    recognition.start();
  }

  function handleVoiceClick() {
    if (voiceState === "listening") {
      recognitionRef.current?.stop();
      return;
    }

    startListening();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sentence = manualText.trim();
    if (!sentence) return;
    setManualText("");
    analyzeSentence(sentence);
  }

  function speakCorrection() {
    if (!analysis) return;
    speak(analysis.corrected_sentence, "waiting_for_repeat");
  }

  return (
    <AppShell>
      <main className="practice-main">
        <SessionHeader crazyLevel={crazyLevel} emotion={emotion} xp={xp} level="Level B1" />

        <section className="mode-strip" aria-label="Tipos de sessao">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                className={selectedMode === mode.id ? "active" : ""}
                type="button"
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
              >
                <Icon size={15} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </section>

        <section className="practice-stage">
          <motion.div
            className="character-column"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <CrazyCharacter crazyLevel={crazyLevel} emotion={emotion} voiceState={voiceState} />
            <ListeningWave active={voiceState === "listening" || voiceState === "speaking"} />
          </motion.div>

          <motion.aside
            className="conversation-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
          >
            <ConversationBubble label="Voce disse" tone="user">
              {transcript || "Tell me about yourself."}
            </ConversationBubble>
            <ConversationBubble label="Mr.Crazy" tone="crazy">
              {analysis?.reaction || "I am calm. Suspiciously calm."}
            </ConversationBubble>
            <CorrectionDisplay analysis={analysis} />
            <div className="action-row">
              <ListenButton onClick={speakCorrection} disabled={!analysis} />
              <RepeatButton onClick={startListening} disabled={voiceState === "listening"} />
            </div>
            <PronunciationFeedback score={analysis?.pronunciation_score ?? null} />
          </motion.aside>
        </section>

        <section className="practice-controls" aria-label="Controle de voz">
          <VoiceButton state={voiceState} onClick={handleVoiceClick} disabled={voiceState === "analyzing" || voiceState === "speaking"} />
          <form className="text-fallback" onSubmit={handleSubmit}>
            <BrainCircuit size={17} />
            <label htmlFor="manual-sentence">Modo texto</label>
            <input
              id="manual-sentence"
              ref={textInputRef}
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              placeholder="Yesterday I go to work."
            />
            <button type="submit">Analisar</button>
          </form>
          <div className="example-row" aria-label="Frases de teste">
            {examples.map((example) => (
              <button type="button" key={example} onClick={() => analyzeSentence(example)}>
                {example}
              </button>
            ))}
          </div>
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
        </section>

        {history.length ? (
          <section className="session-trail" aria-label="Ultimas correcoes">
            {history.slice(0, 3).map((item) => (
              <article key={`${item.createdAt}-${item.sentence}`}>
                <span>{item.mistake === "none" ? "clean" : item.mistake.replaceAll("_", " ")}</span>
                <p>{item.corrected}</p>
              </article>
            ))}
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
