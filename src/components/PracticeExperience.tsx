"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Box,
  BrainCircuit,
  BriefcaseBusiness,
  Mic,
  MicOff,
  MessagesSquare,
  Plane,
  Radio,
  Rocket,
  Shuffle,
  Square,
  Sparkles,
  Volume2,
  Sword,
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
import { RpgCharacter } from "@/components/RpgCharacter";
import { SessionHeader } from "@/components/SessionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { playGeneratedSpeech } from "@/lib/generated-speech-playback";
import {
  connectRealtime,
  type RealtimeConnectionStatus,
  type RealtimeController
} from "@/lib/realtime-client";
import { playSpeech, type SpeechSegment } from "@/lib/speech-playback";
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

type CharacterId = "voxel" | "rpg";

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
  contextHistory: ConversationTurn[];
  learningLevel: LearningLevel;
  character: CharacterId;
};

const modes: SessionMode[] = [
  { id: "free-conversation", label: "Conversa livre", icon: Sparkles },
  { id: "work-english", label: "Trabalho", icon: BriefcaseBusiness },
  { id: "job-interview", label: "Entrevista", icon: UserRound },
  { id: "travel", label: "Viagem", icon: Plane },
  { id: "random-topic", label: "Aleatório", icon: Shuffle }
];

const characters: Array<{ id: CharacterId; label: string; description: string; icon: LucideIcon }> = [
  { id: "voxel", label: "Fúria 3D", description: "Voxels reativos", icon: Box },
  { id: "rpg", label: "Mestre RPG", description: "Herói pixelado", icon: Sword }
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
  "Opa, preguiçoso. Bora acordar esse inglês.",
  "Chegou. Hoje eu quero ver esse inglês sair sem drama.",
  "Vamos destravar essa fala antes que ela crie poeira.",
  "E aí, cabeça de vento aplicado? Vamos treinar direito.",
  "Até que enfim apareceu. Bora fazer esse inglês trabalhar.",
  "Acorda, campeão da enrolação. Me diz o foco de hoje."
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
  const greeting = openingGreetings[openingIndex % openingGreetings.length] ?? openingGreetings[0];

  if (mode === "free-conversation") {
    const invitations: Record<LearningLevel, string> = {
      basic: "O que você quer aprender hoje: uma situação do dia, uma frase específica ou conversa livre?",
      intermediate: "O que você quer treinar hoje: conversa livre, trabalho, viagem ou alguma frase que travou?",
      advanced: "Qual assunto você quer destravar hoje? Pode ser livre; eu corrijo só o que realmente atrapalhar."
    };

    return `${greeting} ${invitations[level]}`;
  }

  const briefing = getTrainingBriefing(level, mode);

  return `${greeting} Hoje vamos treinar ${briefing.focus}; se quiser mudar o foco, fala agora. "${briefing.question}" Responde em inglês.`;
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

function parseSpeechSegments(text: string, defaultLang = "pt-BR"): SpeechSegment[] {
  if (defaultLang === "en-US") {
    return [{ text, lang: "en-US" }];
  }

  const segments: SpeechSegment[] = [];
  const quoteRegex = /["“]([^"“”]+)["”]/gu;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = quoteRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim();
    if (before) {
      segments.push({ text: before, lang: "pt-BR" });
    }

    const quoted = (match[1] ?? "").trim();
    if (quoted) {
      segments.push({ text: quoted, lang: "en-US" });
    }

    lastIndex = match.index + match[0].length;
  }

  const after = text.slice(lastIndex).trim();
  if (after) {
    segments.push({ text: after, lang: "pt-BR" });
  }

  return segments.length > 0 ? segments : [{ text, lang: defaultLang as "pt-BR" | "en-US" }];
}

function getCrazyBubbleText(
  voiceState: VoiceState,
  openingLine: string,
  analysis: AnalysisResponse | null,
  realtimeReply: string,
  realtimeStatus: RealtimeConnectionStatus
) {
  if (realtimeStatus === "connecting") {
    return "Preparando a conversa ao vivo...";
  }

  if (realtimeReply.trim()) {
    return realtimeReply;
  }

  if (voiceState === "listening") {
    return realtimeStatus === "connected" ? "Pode falar. Estou ouvindo." : "Estou ouvindo! Pode falar em inglês...";
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
    contextHistory: [],
    learningLevel: "basic",
    character: "voxel"
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
      contextHistory: Array.isArray(parsed.contextHistory) ? parsed.contextHistory.slice(-10) : fallback.contextHistory,
      learningLevel: normalizeLearningLevel(parsed.learningLevel),
      character: parsed.character === "rpg" ? "rpg" : "voxel"
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
  const [realtimeReply, setRealtimeReply] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionStatus>("connecting");
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [openingIndex, setOpeningIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState("free-conversation");
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel>("basic");
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("voxel");
  const [mistakes, setMistakes] = useState<MistakeCategory[]>([]);
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [contextHistory, setContextHistory] = useState<ConversationTurn[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [speechRetry, setSpeechRetry] = useState<{ segments: SpeechSegment[]; nextState: VoiceState } | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const cancelPlaybackRef = useRef<(() => void) | null>(null);
  const ptVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const enVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef("");
  const analysisQueuedRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const introSpokenRef = useRef(false);
  const realtimeRef = useRef<RealtimeController | null>(null);
  const lastScoredTranscriptRef = useRef("");
  const scoringContextRef = useRef({
    mistakes: [] as MistakeCategory[],
    crazyLevel: 16,
    selectedMode: "free-conversation",
    selectedLevel: "basic" as LearningLevel,
    contextHistory: [] as ConversationTurn[]
  });

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
    () => getCrazyBubbleText(voiceState, openingLine, analysis, realtimeReply, realtimeStatus),
    [analysis, openingLine, realtimeReply, realtimeStatus, voiceState]
  );
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasSpeechRecognition =
    typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    scoringContextRef.current = { mistakes, crazyLevel, selectedMode, selectedLevel, contextHistory };
  }, [contextHistory, crazyLevel, mistakes, selectedLevel, selectedMode]);

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

  const cancelSpeech = useCallback(() => {
    cancelPlaybackRef.current?.();
    cancelPlaybackRef.current = null;
    setSpeechRetry(null);
  }, []);

  const speakSegments = useCallback((segments: SpeechSegment[], nextState: VoiceState) => {
    cancelSpeech();
    if (!canSpeak) {
      setErrorMessage("A voz não está disponível neste navegador.");
      setVoiceState(nextState);
      return;
    }

    const synth = window.speechSynthesis;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setErrorMessage("");
    cancelPlaybackRef.current = playSpeech({
      synth,
      segments,
      createUtterance: (text) => new SpeechSynthesisUtterance(text),
      getVoice: (lang) => {
        const ref = lang === "pt-BR" ? ptVoiceRef : enVoiceRef;
        ref.current ??= getStableVoice(synth.getVoices(), lang);
        return ref.current;
      },
      onState: setVoiceState,
      onEnd: () => setVoiceState(nextState),
      onError: (reason, remaining) => {
        setVoiceState(nextState);
        setSpeechRetry({ segments: remaining, nextState });
        setErrorMessage(reason === "not-allowed" || reason === "start-timeout"
          ? "O áudio não iniciou automaticamente. Toque em Ouvir Mr.Crazy."
          : "Não consegui reproduzir a voz. Toque em Ouvir Mr.Crazy para tentar novamente.");
      }
    });
  }, [canSpeak, cancelSpeech]);

  const speak = useCallback((text: string, nextState: VoiceState = "waiting_for_repeat", lang = "pt-BR") => {
    const segments = parseSpeechSegments(text, lang);
    cancelSpeech();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setErrorMessage("");

    cancelPlaybackRef.current = playGeneratedSpeech({
      text,
      fetchAudio: async (signal) => {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal
        });
        if (!response.ok) throw new Error(`speech-${response.status}`);
        return response.blob();
      },
      createAudio: (url) => new Audio(url),
      createObjectUrl: (blob) => URL.createObjectURL(blob),
      revokeObjectUrl: (url) => URL.revokeObjectURL(url),
      onState: setVoiceState,
      onEnd: () => setVoiceState(nextState),
      onError: () => speakSegments(segments, nextState)
    });
  }, [cancelSpeech, speakSegments]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current === null) return;

    window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  }, []);

  const applyAnalysisResult = useCallback((result: AnalysisResponse, sentence: string, addConversationContext: boolean) => {
    setAnalysis(result);
    setCrazyLevel((current) => clampCrazyLevel(current + result.crazy_delta));
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

    if (addConversationContext) {
      setContextHistory((current) => [
        ...current.slice(-4),
        { role: "user", text: sentence },
        { role: "crazy", text: `${result.reaction} ${result.correction} ${result.follow_up}` }
      ]);
    }
  }, []);

  const scoreRealtimeSentence = useCallback(async (sentence: string) => {
    const cleanSentence = sentence.trim();
    if (!cleanSentence || lastScoredTranscriptRef.current === cleanSentence) return;

    lastScoredTranscriptRef.current = cleanSentence;
    const current = scoringContextRef.current;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: cleanSentence,
          previousMistakes: current.mistakes,
          crazyLevel: current.crazyLevel,
          mode: current.selectedMode,
          learningLevel: current.selectedLevel,
          contextHistory: [...current.contextHistory, { role: "user", text: cleanSentence }]
        })
      });

      if (!response.ok) throw new Error("realtime scoring failed");
      applyAnalysisResult((await response.json()) as AnalysisResponse, cleanSentence, false);
    } catch {
      lastScoredTranscriptRef.current = "";
    }
  }, [applyAnalysisResult]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = getStoredSession();
      setOpeningIndex(getNextOpeningIndex());
      setCrazyLevel(stored.crazyLevel);
      setXp(stored.xp);
      setMistakes(stored.mistakes);
      setHistory(stored.history);
      setContextHistory(stored.contextHistory);
      setSelectedLevel(stored.learningLevel);
      setSelectedCharacter(stored.character);
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      cancelPlaybackRef.current?.();
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      realtimeRef.current?.disconnect();
      realtimeRef.current = null;
    };
  }, [clearSilenceTimer]);

  useEffect(() => {
    if (
      !storageReady ||
      realtimeStatus !== "failed" ||
      introSpokenRef.current ||
      transcript ||
      analysis ||
      voiceState !== "idle"
    ) return;

    const timeoutId = window.setTimeout(() => {
      introSpokenRef.current = true;
      setContextHistory((current) => (current.length ? current : [{ role: "crazy", text: openingLine }]));
      speak(openingLine, "idle", "pt-BR");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [analysis, openingLine, realtimeStatus, speak, storageReady, transcript, voiceState]);

  useEffect(() => {
    if (!storageReady) return;

    const abortController = new AbortController();
    let activeController: RealtimeController | null = null;
    const timeoutId = window.setTimeout(() => {
      realtimeRef.current?.disconnect();
      realtimeRef.current = null;
      cancelSpeech();
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      setAnalysis(null);
      setTranscript("");
      transcriptRef.current = "";
      setRealtimeReply("");
      setRealtimeStatus("connecting");
      setMicrophoneEnabled(true);
      setErrorMessage("");
      setVoiceState("preparing_speech");

      void connectRealtime({
        level: selectedLevel,
        mode: selectedMode,
        signal: abortController.signal,
        onStatus: setRealtimeStatus,
        onVoiceState: setVoiceState,
        onUserTranscript: (text, complete) => {
          setTranscript(text);
          transcriptRef.current = text;
          if (complete && text.trim()) {
            setContextHistory((current) => [...current.slice(-8), { role: "user", text: text.trim() }]);
            void scoreRealtimeSentence(text);
          }
        },
        onAssistantTranscript: (text, complete) => {
          setRealtimeReply(text);
          if (complete && text.trim()) {
            setContextHistory((current) => [...current.slice(-8), { role: "crazy", text: text.trim() }]);
            lastScoredTranscriptRef.current = "";
          }
        },
        onError: setErrorMessage
      }).then((controller) => {
        if (abortController.signal.aborted) {
          controller.disconnect();
          return;
        }
        activeController = controller;
        realtimeRef.current = controller;
      }).catch(() => {
        if (!abortController.signal.aborted) setVoiceState("idle");
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
      activeController?.disconnect();
      if (realtimeRef.current === activeController) realtimeRef.current = null;
    };
  }, [cancelSpeech, scoreRealtimeSentence, selectedLevel, selectedMode, storageReady]);

  useEffect(() => {
    if (!storageReady) return;

    window.localStorage.setItem(
      "mr-crazy-session",
      JSON.stringify({
        crazyLevel,
        xp,
        mistakes,
        history,
        contextHistory,
        learningLevel: selectedLevel,
        character: selectedCharacter
      })
    );
  }, [contextHistory, crazyLevel, xp, mistakes, history, selectedCharacter, selectedLevel, storageReady]);

  async function analyzeSentence(sentence: string) {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) return;

    introSpokenRef.current = true;
    cancelSpeech();
    clearSilenceTimer();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
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
      applyAnalysisResult(result, cleanSentence, true);
      speak(`${result.reaction} ${result.correction} ${result.follow_up}`);
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

    introSpokenRef.current = true;
    cancelSpeech();
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
      if (recognitionRef.current !== recognition) return;
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
      if (recognitionRef.current !== recognition) return;
      setErrorMessage("Não consegui capturar o áudio. O modo texto está pronto.");
      setTranscript("");
      transcriptRef.current = "";
      clearSilenceTimer();
      setVoiceState("idle");
      textInputRef.current?.focus();
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
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
    submitSentence(sentence);
  }

  function submitSentence(sentence: string) {
    if (realtimeStatus === "connected" && realtimeRef.current?.sendText(sentence)) {
      setAnalysis(null);
      void scoreRealtimeSentence(sentence);
      return;
    }

    void analyzeSentence(sentence);
  }

  function toggleRealtimeMicrophone() {
    if (realtimeStatus !== "connected" || !realtimeRef.current) return;
    const nextEnabled = !microphoneEnabled;
    realtimeRef.current.setMicrophoneEnabled(nextEnabled);
    setMicrophoneEnabled(nextEnabled);
    setVoiceState(nextEnabled ? "listening" : "idle");
  }

  function finishRealtimeTurn() {
    realtimeRef.current?.finishTurn();
  }

  function resetTrainingContext() {
    cancelSpeech();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    clearSilenceTimer();
    setAnalysis(null);
    setRealtimeReply("");
    setTranscript("");
    transcriptRef.current = "";
    setContextHistory([]);
    lastScoredTranscriptRef.current = "";
    setVoiceState("idle");
    setOpeningIndex(getNextOpeningIndex());
    introSpokenRef.current = false;
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
                onClick={() => {
                  if (selectedLevel === level.id) return;
                  setSelectedLevel(level.id);
                  resetTrainingContext();
                }}
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
                onClick={() => {
                  if (selectedMode === mode.id) return;
                  setSelectedMode(mode.id);
                  resetTrainingContext();
                }}
              >
                <Icon size={15} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </section>

        <section className="character-picker" aria-label="Escolha do personagem">
          {characters.map((character) => {
            const Icon = character.icon;
            return (
              <button
                type="button"
                key={character.id}
                className={selectedCharacter === character.id ? "active" : ""}
                aria-pressed={selectedCharacter === character.id}
                onClick={() => setSelectedCharacter(character.id)}
              >
                <span className={`character-picker-icon ${character.id}`} aria-hidden="true">
                  <Icon size={17} />
                </span>
                <span>
                  <strong>{character.label}</strong>
                  <small>{character.description}</small>
                </span>
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
            {selectedCharacter === "rpg" ? (
              <RpgCharacter crazyLevel={crazyLevel} emotion={emotion} voiceState={voiceState} />
            ) : (
              <CrazyCharacter crazyLevel={crazyLevel} emotion={emotion} voiceState={voiceState} />
            )}
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
            {speechRetry ? (
              <div className="action-row">
                <button className="ghost-action" type="button" onClick={() => speakSegments(speechRetry.segments, speechRetry.nextState)}>
                  <Volume2 size={18} />
                  Ouvir Mr.Crazy
                </button>
              </div>
            ) : null}
            <CorrectionDisplay analysis={analysis} />
            {analysis ? (
              <>
                <div className="action-row">
                  <ListenButton
                    onClick={speakCorrection}
                    disabled={voiceState === "listening" || voiceState === "speaking" || voiceState === "preparing_speech" || voiceState === "analyzing"}
                  />
                  <RepeatButton
                    onClick={startListening}
                    disabled={voiceState === "listening" || voiceState === "speaking" || voiceState === "preparing_speech" || voiceState === "analyzing"}
                  />
                </div>
                <PronunciationFeedback
                  score={analysis.mistake_type === "learning_request" ? null : analysis.pronunciation_score}
                />
              </>
            ) : null}
          </motion.aside>
        </section>

        <section
          className={`practice-controls ${voiceState === "listening" ? "listening" : ""} ${realtimeStatus !== "failed" ? "realtime" : ""}`}
          aria-label="Controle de voz"
        >
          {realtimeStatus === "failed" ? (
            <VoiceButton state={voiceState} onClick={handleVoiceClick} disabled={voiceState === "analyzing" || voiceState === "speaking" || voiceState === "preparing_speech"} />
          ) : (
            <div className={`realtime-control ${realtimeStatus}`}>
              <div className="realtime-copy">
                <Radio size={19} className={realtimeStatus === "connected" ? "realtime-pulse" : "spin"} />
                <span>
                  <strong>{realtimeStatus === "connected" ? "Conversa automática ativa" : "Conectando à voz..."}</strong>
                  <small>
                    {voiceState === "speaking"
                      ? "Mr.Crazy está falando"
                      : voiceState === "analyzing" || voiceState === "transcribing"
                        ? "Preparando resposta"
                        : microphoneEnabled
                          ? "Fale quando quiser"
                          : "Microfone pausado"}
                  </small>
                </span>
              </div>
              <div className="realtime-actions">
                <button
                  type="button"
                  onClick={toggleRealtimeMicrophone}
                  disabled={realtimeStatus !== "connected"}
                  aria-label={microphoneEnabled ? "Pausar microfone" : "Ativar microfone"}
                  title={microphoneEnabled ? "Pausar microfone" : "Ativar microfone"}
                >
                  {microphoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  type="button"
                  onClick={finishRealtimeTurn}
                  disabled={realtimeStatus !== "connected" || !microphoneEnabled || voiceState !== "listening"}
                  aria-label="Encerrar minha fala"
                  title="Use apenas se a pausa automática não for detectada"
                >
                  <Square size={17} />
                  <span>Terminei</span>
                </button>
              </div>
            </div>
          )}
          {realtimeStatus === "failed" && voiceState === "listening" ? (
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
            <button type="submit">{realtimeStatus === "connected" ? "Enviar" : "Analisar"}</button>
          </form>
          <div className="example-row" aria-label="Frases de teste">
            {activeLevel.examples.map((example) => (
              <button type="button" key={example} onClick={() => submitSentence(example)}>
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
