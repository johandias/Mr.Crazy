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
  Square,
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
  type ConversationTurn,
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

const openingGreetings = [
  "E aí! Bora colocar esse inglês pra jogo?",
  "Fala comigo! Chega de enrolar e bora destravar essa fala.",
  "Chegou quem faltava! Hoje quero ver essa pronúncia afiada.",
  "Opa, na área! Menos teoria e mais prática de verdade.",
  "Preparado? Respira fundo e solta o inglês sem medo!",
  "Bora treinar! Quero ver você falar como um nativo hoje."
];

function getNextOpeningIndex() {
  if (typeof window === "undefined") {
    return 0;
  }

  const storageKey = "mr-crazy-opening-index";
  const current = Number.parseInt(window.localStorage.getItem(storageKey) ?? "-1", 10);
  const next = Number.isFinite(current) ? (current + 1) % openingGreetings.length : 0;
  window.localStorage.setItem(storageKey, String(next));

  return next;
}

function getTrainingBriefing(level: LearningLevel, mode: string) {
  const byMode: Record<string, Record<LearningLevel, { focus: string; question: string }>> = {
    "work-english": {
      basic: { focus: "trabalho em frases simples", question: "What did you do at work today?" },
      intermediate: { focus: "rotina de trabalho com passado e motivo", question: "What problem did you solve at work this week?" },
      advanced: { focus: "explicar decisões de trabalho com clareza", question: "What trade-off did you handle at work recently?" }
    },
    "job-interview": {
      basic: { focus: "respostas curtas de entrevista", question: "What is one strength you have?" },
      intermediate: { focus: "respostas de entrevista com exemplo", question: "Tell me about a challenge you handled." },
      advanced: { focus: "respostas estruturadas e precisas", question: "Tell me about a failure and what you changed after it." }
    },
    travel: {
      basic: { focus: "perguntas fáceis de viagem", question: "Where is the hotel?" },
      intermediate: { focus: "pedidos e direções em viagem", question: "How can I get to the nearest subway station?" },
      advanced: { focus: "resolver problemas de viagem", question: "My flight was delayed. What should I do next?" }
    }
  };

  const fallback: Record<LearningLevel, { focus: string; question: string }> = {
    basic: { focus: "conversa básica do dia a dia", question: "What did you do yesterday?" },
    intermediate: { focus: "conversa com passado, motivo e detalhe", question: "What did you do yesterday, and why was it important?" },
    advanced: { focus: "opinião clara com argumento", question: "Do you think remote work improves productivity? Why?" }
  };

  return byMode[mode]?.[level] ?? fallback[level];
}

function buildOpeningLine(level: LearningLevel, mode: string, openingIndex: number) {
  const briefing = getTrainingBriefing(level, mode);
  const greeting = openingGreetings[openingIndex % openingGreetings.length] ?? openingGreetings[0];

  return `${greeting} Me responde em inglês: "${briefing.question}"`;
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

type SpeechSegment = {
  text: string;
  lang: "pt-BR" | "en-US";
};

function parseSpeechSegments(text: string, defaultLang = "pt-BR"): SpeechSegment[] {
  if (defaultLang === "en-US") {
    return splitSpeechText(text).map((part) => ({ text: part, lang: "en-US" }));
  }

  const segments: SpeechSegment[] = [];
  const quoteRegex = /["'“]([^"'“”]+)["'”]/gu;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = quoteRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim();
    if (before) {
      splitSpeechText(before).forEach((sentence) => {
        if (sentence.trim()) segments.push({ text: sentence.trim(), lang: "pt-BR" });
      });
    }

    const quoted = (match[1] ?? "").trim();
    if (quoted) {
      segments.push({ text: quoted, lang: "en-US" });
    }

    lastIndex = match.index + match[0].length;
  }

  const after = text.slice(lastIndex).trim();
  if (after) {
    splitSpeechText(after).forEach((sentence) => {
      if (sentence.trim()) segments.push({ text: sentence.trim(), lang: "pt-BR" });
    });
  }

  return segments.length > 0 ? segments : [{ text, lang: defaultLang as "pt-BR" | "en-US" }];
}

function getCrazyBubbleText(voiceState: VoiceState, openingLine: string, analysis: AnalysisResponse | null) {
  if (voiceState === "listening") {
    return "Estou ouvindo! Pode falar em inglês...";
  }

  if (voiceState === "transcribing") {
    return "Captei sua voz! Processando o que você falou...";
  }

  if (voiceState === "analyzing") {
    return "Hummm... Analisando pronúncia e gramática!";
  }

  if (voiceState === "reacting") {
    return analysis?.reaction ?? "Prontinho! Olha só o meu feedback:";
  }

  if (voiceState === "speaking") {
    return analysis?.reaction ?? openingLine;
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
  const [openingIndex, setOpeningIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState("free-conversation");
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel>("basic");
  const [mistakes, setMistakes] = useState<MistakeCategory[]>([]);
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [contextHistory, setContextHistory] = useState<ConversationTurn[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechTokenRef = useRef(0);
  const ptVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const enVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef("");
  const analysisQueuedRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const introSpokenRef = useRef(false);

  const emotion = useMemo(() => getEmotion(crazyLevel), [crazyLevel]);
  const activeLevel = useMemo(
    () => levelOptions.find((level) => level.id === selectedLevel) ?? levelOptions[0],
    [selectedLevel]
  );
  const openingLine = useMemo(
    () => buildOpeningLine(selectedLevel, selectedMode, openingIndex),
    [openingIndex, selectedLevel, selectedMode]
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
    const segments = parseSpeechSegments(text, lang);
    const token = speechTokenRef.current + 1;
    const voices = synth.getVoices();
    if (!ptVoiceRef.current) {
      ptVoiceRef.current = getStableVoice(voices, "pt-BR");
    }
    if (!enVoiceRef.current) {
      enVoiceRef.current = getStableVoice(voices, "en-US");
    }

    speechTokenRef.current = token;

    synth.cancel();
    synth.resume();
    setVoiceState("speaking");

    const speakSegment = (index: number) => {
      if (speechTokenRef.current !== token) return;

      if (index >= segments.length) {
        setVoiceState(nextState);
        return;
      }

      const seg = segments[index];
      const targetVoice = seg.lang === "pt-BR" ? ptVoiceRef.current : enVoiceRef.current;
      const utterance = new SpeechSynthesisUtterance(seg.text);
      utterance.lang = seg.lang;
      utterance.voice = targetVoice;
      utterance.rate = seg.lang === "pt-BR" ? 1.02 : 0.92;
      utterance.pitch = 1.02;
      utterance.volume = 1;
      utterance.onend = () => speakSegment(index + 1);
      utterance.onerror = () => setVoiceState(nextState);
      synth.speak(utterance);
    };

    speakSegment(0);
  }, [canSpeak]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current === null) return;

    window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = getStoredSession();
      setOpeningIndex(getNextOpeningIndex());
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
    return () => clearSilenceTimer();
  }, [clearSilenceTimer]);

  useEffect(() => {
    if (!storageReady || introSpokenRef.current || transcript || analysis || voiceState !== "idle") return;

    introSpokenRef.current = true;
    const timeoutId = window.setTimeout(() => speak(openingLine, "idle", "pt-BR"), 600);

    return () => window.clearTimeout(timeoutId);
  }, [analysis, openingLine, speak, storageReady, transcript, voiceState]);

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

    clearSilenceTimer();
    analysisQueuedRef.current = true;
    setErrorMessage("");
    setTranscript(cleanSentence);
    transcriptRef.current = cleanSentence;
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
          learningLevel: selectedLevel,
          contextHistory: [
            ...contextHistory,
            { role: "user", text: cleanSentence }
          ]
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
      setContextHistory((prev) => [
        ...prev.slice(-4),
        { role: "user", text: cleanSentence },
        { role: "crazy", text: `${result.reaction} ${result.correction} ${result.follow_up}` }
      ]);

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
    } finally {
      analysisQueuedRef.current = false;
    }
  }

  function queueTranscriptAnalysis(candidate: string) {
    const cleanTranscript = candidate.trim();

    if (!cleanTranscript || analysisQueuedRef.current) {
      return false;
    }

    analysisQueuedRef.current = true;
    clearSilenceTimer();
    recognitionRef.current?.stop();
    setVoiceState("transcribing");
    window.setTimeout(() => analyzeSentence(cleanTranscript), 220);

    return true;
  }

  function scheduleSilenceAnalysis(candidate: string) {
    clearSilenceTimer();
    const cleanTranscript = candidate.trim();
    if (!cleanTranscript) return;

    silenceTimerRef.current = window.setTimeout(() => {
      queueTranscriptAnalysis(cleanTranscript);
    }, 2400);
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
    transcriptRef.current = "";
    setAnalysis(null);
    analysisQueuedRef.current = false;
    clearSilenceTimer();
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setTranscript(text);
      transcriptRef.current = text;
      scheduleSilenceAnalysis(text);

      const isFinal = Array.from(event.results).some((result) => result.isFinal);
      if (isFinal) {
        queueTranscriptAnalysis(text);
      }
    };

    recognition.onerror = () => {
      setErrorMessage("Não consegui capturar o áudio. O modo texto está pronto.");
      setTranscript("");
      transcriptRef.current = "";
      clearSilenceTimer();
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

  function stopListeningAndAnalyze() {
    if (voiceState !== "listening") return;

    if (queueTranscriptAnalysis(transcriptRef.current)) {
      return;
    }

    clearSilenceTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setTranscript("");
    transcriptRef.current = "";
    setVoiceState("idle");
    setErrorMessage("Não ouvi nada aproveitável. Fala mais alto ou usa o modo texto.");
    textInputRef.current?.focus();
  }

  function handleVoiceClick() {
    if (voiceState === "listening") {
      stopListeningAndAnalyze();
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

        <section className={`practice-controls ${voiceState === "listening" ? "listening" : ""}`} aria-label="Controle de voz">
          <VoiceButton state={voiceState} onClick={handleVoiceClick} disabled={voiceState === "analyzing" || voiceState === "speaking"} />
          {voiceState === "listening" ? (
            <button className="stop-listening-button" type="button" onClick={stopListeningAndAnalyze}>
              <Square size={18} />
              Parar e analisar
            </button>
          ) : null}
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
