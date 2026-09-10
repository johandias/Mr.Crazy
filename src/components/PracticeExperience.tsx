"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  MessagesSquare,
  Plane,
  Rocket,
  Shuffle,
  Sparkles,
  UserRound
} from "lucide-react";
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
import {
  clampCrazyLevel,
  getEmotion,
  getMistakeLabel,
  normalizeLearningLevel,
  type AnalysisResponse,
  type LearningLevel,
  type MistakeCategory,
  type VoiceState
} from "@/lib/mr-crazy";

type SessionMode = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type LevelOption = {
  id: LearningLevel;
  label: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  placeholder: string;
  examples: string[];
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
  learningLevel: LearningLevel;
};

const modes: SessionMode[] = [
  { id: "free-conversation", label: "Conversa livre", icon: Sparkles },
  { id: "work-english", label: "Trabalho", icon: BriefcaseBusiness },
  { id: "job-interview", label: "Entrevista", icon: UserRound },
  { id: "travel", label: "Viagem", icon: Plane },
  { id: "random-topic", label: "Aleatório", icon: Shuffle }
];

const levelOptions: LevelOption[] = [
  {
    id: "basic",
    label: "Básico",
    description: "Conversas fáceis do dia",
    badge: "A1-A2",
    icon: BookOpen,
    placeholder: 'Como falo "eu estou cansado hoje"?',
    examples: ['Como falo "eu estou cansado hoje"?', "Vamos conversar.", "I have 22 years.", "Yesterday I go to school."]
  },
  {
    id: "intermediate",
    label: "Intermediário",
    description: "Rotina, trabalho e viagens",
    badge: "B1-B2",
    icon: MessagesSquare,
    placeholder: "Yesterday I go to work.",
    examples: ["Yesterday I go to work.", "We played-i video games.", "Is necessary to decide fast.", "Tell me about yourself."]
  },
  {
    id: "advanced",
    label: "Avançado",
    description: "Argumentos e precisão",
    badge: "C1",
    icon: Rocket,
    placeholder: "Quero conversar sobre trabalho remoto.",
    examples: [
      "Quero conversar sobre trabalho remoto.",
      "I actually pretend to migrate the servers.",
      "She went yesterday?",
      "We need decide the trade-off."
    ]
  }
];

const openingLines = [
  "Ô preguiçoso, bora fazer algo, né? Me manda uma frase em inglês.",
  "Acorda, campeão da enrolação. Fala uma frase em inglês para eu corrigir.",
  "Bora trabalhar, preguiçoso. Uma frase em inglês, sem drama.",
  "Chega de olhar para a tela. Fala em inglês e tenta não me irritar no primeiro verbo.",
  "Opa, preguiçoso, apareceu. Agora manda inglês antes que eu perca a paciência.",
  "Vamos lá, gênio do depois eu faço. Me dá uma frase em inglês."
];

function getNextOpeningLine() {
  if (typeof window === "undefined") {
    return openingLines[0];
  }

  const storageKey = "mr-crazy-opening-index";
  const current = Number.parseInt(window.localStorage.getItem(storageKey) ?? "-1", 10);
  const next = Number.isFinite(current) ? (current + 1) % openingLines.length : 0;
  window.localStorage.setItem(storageKey, String(next));

  return openingLines[next];
}

function getStableVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const normalizedLang = lang.toLowerCase();
  const languageRoot = normalizedLang.split("-")[0] ?? normalizedLang;
  const preferredName = /(google|microsoft|luciana|francisca|antonio|maria|natural)/iu;

  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLang && preferredName.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLang) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(languageRoot)) ??
    null
  );
}

function splitSpeechText(text: string) {
  return text.match(/[^.!?]+[.!?]?/gu)?.map((part) => part.trim()).filter(Boolean) ?? [text];
}

function getCrazyBubbleText(voiceState: VoiceState, openingLine: string, analysis: AnalysisResponse | null) {
  if (voiceState === "listening") {
    return "Estou ouvindo. Fala em inglês, preguiçoso.";
  }

  if (voiceState === "transcribing") {
    return "Peguei sua fala. Agora deixa eu ver o tamanho do estrago.";
  }

  if (voiceState === "analyzing") {
    return "Estou analisando. Se tiver erro, eu vou achar.";
  }

  if (voiceState === "reacting") {
    return analysis?.reaction ?? "Calma aí, estou preparando a bronca.";
  }

  if (voiceState === "speaking") {
    return analysis?.reaction ?? "Falando...";
  }

  return analysis?.reaction ?? openingLine;
}

function getUserBubble(voiceState: VoiceState, transcript: string) {
  const cleanTranscript = transcript.trim();

  if (cleanTranscript) {
    return {
      label: "Você disse",
      text: cleanTranscript
    };
  }

  if (voiceState === "listening") {
    return {
      label: "Escutando",
      text: "Pode falar agora."
    };
  }

  return null;
}

function getStoredSession(): StoredSession {
  const fallback: StoredSession = {
    crazyLevel: 16,
    xp: 420,
    mistakes: [],
    history: [],
    learningLevel: "basic"
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
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 6) : fallback.history,
      learningLevel: normalizeLearningLevel(parsed.learningLevel)
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
  const [openingLine, setOpeningLine] = useState(openingLines[0]);
  const [selectedMode, setSelectedMode] = useState("free-conversation");
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel>("basic");
  const [mistakes, setMistakes] = useState<MistakeCategory[]>([]);
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechTokenRef = useRef(0);
  const ptVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const enVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const emotion = useMemo(() => getEmotion(crazyLevel), [crazyLevel]);
  const activeLevel = useMemo(
    () => levelOptions.find((level) => level.id === selectedLevel) ?? levelOptions[0],
    [selectedLevel]
  );
  const userBubble = useMemo(() => getUserBubble(voiceState, transcript), [transcript, voiceState]);
  const crazyBubbleText = useMemo(
    () => getCrazyBubbleText(voiceState, openingLine, analysis),
    [analysis, openingLine, voiceState]
  );
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasSpeechRecognition =
    typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!canSpeak) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      ptVoiceRef.current = getStableVoice(voices, "pt-BR");
      enVoiceRef.current = getStableVoice(voices, "en-US");
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
  }, [canSpeak]);

  const speak = useCallback((text: string, nextState: VoiceState = "waiting_for_repeat", lang = "pt-BR") => {
    if (!canSpeak) {
      setVoiceState(nextState);
      return;
    }

    const synth = window.speechSynthesis;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    const parts = splitSpeechText(text);
    const token = speechTokenRef.current + 1;
    const voices = synth.getVoices();
    if (lang === "pt-BR" && !ptVoiceRef.current) {
      ptVoiceRef.current = getStableVoice(voices, "pt-BR");
    }
    if (lang !== "pt-BR" && !enVoiceRef.current) {
      enVoiceRef.current = getStableVoice(voices, "en-US");
    }

    const voice = lang === "pt-BR" ? ptVoiceRef.current : enVoiceRef.current;
    speechTokenRef.current = token;

    synth.cancel();
    synth.resume();
    setVoiceState("speaking");

    const speakPart = (index: number) => {
      if (speechTokenRef.current !== token) return;

      if (index >= parts.length) {
        setVoiceState(nextState);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(parts[index]);
      utterance.lang = lang;
      utterance.voice = voice;
      utterance.rate = lang === "pt-BR" ? 0.98 : 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => speakPart(index + 1);
      utterance.onerror = () => setVoiceState(nextState);
      synth.speak(utterance);
    };

    speakPart(0);
  }, [canSpeak]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = getStoredSession();
      setOpeningLine(getNextOpeningLine());
      setCrazyLevel(stored.crazyLevel);
      setXp(stored.xp);
      setMistakes(stored.mistakes);
      setHistory(stored.history);
      setSelectedLevel(stored.learningLevel);
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
        history,
        learningLevel: selectedLevel
      })
    );
  }, [crazyLevel, xp, mistakes, history, selectedLevel, storageReady]);

  async function analyzeSentence(sentence: string) {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) return;

    setErrorMessage("");
    setTranscript(cleanSentence);
    setAnalysis(null);
    setVoiceState("analyzing");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: cleanSentence,
          previousMistakes: mistakes,
          crazyLevel,
          mode: selectedMode,
          learningLevel: selectedLevel
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
        speak(`${result.reaction}. ${result.correction}. ${result.follow_up}`);
      }, 420);
    } catch {
      setErrorMessage("A análise falhou. Digite uma frase e tente de novo.");
      setVoiceState("idle");
    }
  }

  function startListening() {
    setErrorMessage("");

    if (!hasSpeechRecognition) {
      setErrorMessage("Reconhecimento de voz indisponível neste navegador.");
      textInputRef.current?.focus();
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return;

    speechTokenRef.current += 1;
    window.speechSynthesis?.cancel();
    setTranscript("");
    setAnalysis(null);
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
      setErrorMessage("Não consegui capturar o áudio. O modo texto está pronto.");
      setTranscript("");
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
    speak(analysis.corrected_sentence, "waiting_for_repeat", "en-US");
  }

  return (
    <AppShell>
      <main className="practice-main">
        <SessionHeader crazyLevel={crazyLevel} emotion={emotion} xp={xp} level={`${activeLevel.badge} ${activeLevel.label}`} />

        <section className="level-strip" aria-label="Nível de inglês">
          {levelOptions.map((level) => {
            const Icon = level.icon;
            return (
              <button
                aria-pressed={selectedLevel === level.id}
                className={selectedLevel === level.id ? "active" : ""}
                type="button"
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
              >
                <Icon size={17} />
                <span>
                  <span>{level.label}</span>
                  <small>{level.description}</small>
                </span>
                <strong>{level.badge}</strong>
              </button>
            );
          })}
        </section>

        <section className="mode-strip" aria-label="Tipos de sessão">
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
            {userBubble ? (
              <ConversationBubble label={userBubble.label} tone="user">
                {userBubble.text}
              </ConversationBubble>
            ) : null}
            <ConversationBubble label="Mr.Crazy" tone="crazy">
              {crazyBubbleText}
            </ConversationBubble>
            <CorrectionDisplay analysis={analysis} />
            {analysis ? (
              <>
                <div className="action-row">
                  <ListenButton
                    onClick={speakCorrection}
                    disabled={voiceState === "listening" || voiceState === "speaking" || voiceState === "analyzing"}
                  />
                  <RepeatButton
                    onClick={startListening}
                    disabled={voiceState === "listening" || voiceState === "speaking" || voiceState === "analyzing"}
                  />
                </div>
                <PronunciationFeedback score={analysis.pronunciation_score} />
              </>
            ) : null}
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
              placeholder={activeLevel.placeholder}
            />
            <button type="submit">Analisar</button>
          </form>
          <div className="example-row" aria-label="Frases de teste">
            {activeLevel.examples.map((example) => (
              <button type="button" key={example} onClick={() => analyzeSentence(example)}>
                {example}
              </button>
            ))}
          </div>
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
        </section>

        {history.length ? (
          <section className="session-trail" aria-label="Últimas correções">
            {history.slice(0, 3).map((item) => (
              <article key={`${item.createdAt}-${item.sentence}`}>
                <span>{getMistakeLabel(item.mistake)}</span>
                <p>{item.corrected}</p>
              </article>
            ))}
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
