"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  Mic,
  MicOff,
  Menu,
  MessagesSquare,
  Plane,
  Rocket,
  RotateCcw,
  Send,
  Shuffle,
  Sparkles,
  Volume2,
  UserRound,
  PictureInPicture2,
  ExternalLink,
  X
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PictureInPictureManager, type PictureInPictureManagerHandle } from "@/components/PictureInPictureManager";
import { ConversationBubble } from "@/components/ConversationBubble";
import { ListeningWave } from "@/components/ListeningWave";
import { RpgCharacter, type CharacterGesture } from "@/components/RpgCharacter";
import { SessionHeader } from "@/components/SessionHeader";
import {
  LEARNING_MODULES,
  getModuleById,
  getStoredModuleId,
  setStoredModuleId,
  DEFAULT_MODULE_ID
} from "@/lib/modules";
import { ModuleSelector, type ModuleEvaluationItem } from "@/components/ModuleSelector";
import { ModuleEvaluationModal } from "@/components/ModuleEvaluationModal";
import { ExamModal } from "@/components/exam/ExamModal";
import { playGeneratedSpeech } from "@/lib/generated-speech-playback";
import {
  connectRealtime,
  getConnectionError,
  isAbortError,
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
  "Opa, tudo bem? Bora destravar a fala hoje.",
  "E aí, pronto para praticar?",
  "Fala comigo! Como posso te ajudar hoje?",
  "Opa! Vamos bater um papo e treinar?",
  "E aí, tudo certo? Me diz o que você quer ver hoje.",
  "Opa, bora praticar um pouco?"
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

function buildOpeningLine(
  level: LearningLevel,
  mode: string,
  openingIndex: number,
  nickname?: string,
  gender?: string,
  moduleId?: string
) {
  const isFemale = gender === "feminino";
  const namePart = nickname?.trim() ? ` ${nickname.trim()}` : "";
  const readyWord = isFemale ? "pronta" : "pronto";
  const welcomeWord = isFemale ? "bem-vinda" : "bem-vindo";

  if (moduleId) {
    const mod = getModuleById(moduleId);
    if (mod.id === "free-conversation") {
      return `Hey${namePart}! Good to see you! We're in free conversation mode now. Let's talk in English! How are you doing today?`;
    }
    return `Fala${namePart}! ${mod.initialGreeting.pt}`;
  }

  const customGreetings = [
    `Fala${namePart}! Tudo ${readyWord} pro treino de hoje?`,
    `E aí${namePart}! Seja ${welcomeWord}.`,
    `Tudo certo${namePart}? Bora destravar essa fala hoje!`,
    `Opa${namePart}! Mais um dia ${isFemale ? "focada" : "focado"} no inglês.`
  ];

  const greeting = customGreetings[openingIndex % customGreetings.length] ?? customGreetings[0];

  if (mode === "free-conversation") {
    const invitations: Record<LearningLevel, string> = {
      basic: "O que você quer aprender hoje: uma situação do dia, uma frase específica ou bater um papo?",
      intermediate: "O que você quer treinar hoje: conversa livre, trabalho, viagem ou alguma frase que travou?",
      advanced: "Qual assunto você quer destravar hoje? Pode ser livre; eu te dou suporte com o que precisar."
    };

    return `${greeting} ${invitations[level]}`;
  }

  const briefing = getTrainingBriefing(level, mode);

  return `${greeting} Hoje podemos praticar ${briefing.focus}. Você pode falar em português e eu te apoio com o inglês!`;
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
    return realtimeStatus === "connected" ? "Pode falar. Estou ouvindo." : "Estou ouvindo! Pode falar...";
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

  // Histórico mantido APENAS durante o uso da aba (sessionStorage). Ao fechar e reabrir, inicia nova instância limpa.
  let sessionTurns: ConversationTurn[] = [];
  try {
    const rawSession = window.sessionStorage.getItem("mr-crazy-session-turns");
    if (rawSession) {
      const parsedTurns = JSON.parse(rawSession);
      if (Array.isArray(parsedTurns)) {
        sessionTurns = parsedTurns
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const role = item.role === "user" || item.role === "crazy" ? item.role : null;
            const text = typeof item.text === "string" ? item.text.trim() : "";
            return role && text ? { role, text } : null;
          })
          .filter((item): item is ConversationTurn => Boolean(item))
          .slice(-50);
      }
    }
  } catch {
    sessionTurns = [];
  }

  const stored = window.localStorage.getItem("mr-crazy-session");
  if (!stored) {
    return { ...fallback, contextHistory: sessionTurns };
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StoredSession>;
    return {
      crazyLevel: typeof parsed.crazyLevel === "number" ? parsed.crazyLevel : fallback.crazyLevel,
      xp: typeof parsed.xp === "number" ? parsed.xp : fallback.xp,
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : fallback.mistakes,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 6) : fallback.history,
      contextHistory: sessionTurns, // Sempre da sessão atual em memória/sessionStorage!
      learningLevel: normalizeLearningLevel(parsed.learningLevel),
      character: parsed.character === "rpg" ? "rpg" : "voxel"
    };
  } catch {
    window.localStorage.removeItem("mr-crazy-session");
    return { ...fallback, contextHistory: sessionTurns };
  }
}

export function PracticeExperience({ isAdmin }: { isAdmin?: boolean } = {}) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [crazyLevel, setCrazyLevel] = useState(16);
  const [xp, setXp] = useState(420);
  const [manualText, setManualText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [analysisSource, setAnalysisSource] = useState<"manual" | "voice">("manual");
  const [micGranted, setMicGranted] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem("mr-crazy-mic-granted") === "true";
    } catch {
      return true;
    }
  });
  const [realtimeReply, setRealtimeReply] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionStatus>(() => {
    if (typeof window === "undefined") return "connecting";
    try {
      const isGranted = window.localStorage.getItem("mr-crazy-mic-granted") === "true";
      return isGranted ? "connecting" : "idle";
    } catch {
      return "connecting";
    }
  });
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [openingIndex, setOpeningIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState("free-conversation");
  const [selectedModuleId, setSelectedModuleId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_MODULE_ID;
    return getStoredModuleId();
  });
  const [isSelectingModule, setIsSelectingModule] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("practice") === "1" || urlParams.get("treino") === "1") {
        return false;
      }
    }
    return true;
  });
  const [moduleTurnsCount, setModuleTurnsCount] = useState(0);
  const [currentEvaluation, setCurrentEvaluation] = useState<ModuleEvaluationItem | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel>("basic");
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("rpg");
  const [activeGesture, setActiveGesture] = useState<CharacterGesture>("idle");
  const gestureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  const pipRef = useRef<PictureInPictureManagerHandle | null>(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isPopupMode, setIsPopupMode] = useState(false);
  const [pipNotification, setPipNotification] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsPopupMode(window.location.search.includes("popup=true"));
    }
  }, []);

  const handleTogglePiP = () => {
    if (!pipRef.current) return;
    void pipRef.current.togglePiP().then((active) => {
      setIsPipActive(active);
      if (active) {
        setPipNotification("Modo Pop-up Flutuante Ativo! Você já pode abrir o WhatsApp ou outros apps que o Mr. Crazy continuará conversando.");
        window.setTimeout(() => setPipNotification(""), 5000);
      }
    });
  };

  const handleOpenStandalonePopup = () => {
    pipRef.current?.openStandalonePopup();
  };

  const triggerGesture = (gesture: CharacterGesture) => {
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    setActiveGesture(gesture);
    gestureTimeoutRef.current = setTimeout(() => {
      setActiveGesture("idle");
    }, 3800);
  };

  const handleAvatarTap = () => {
    if (voiceState === "speaking" && realtimeRef.current) {
      realtimeRef.current.interrupt();
      setVoiceState("listening");
    }
    const gestures: CharacterGesture[] = ["watergun", "smoke", "finger", "thumbsup", "heart"];
    const currentIndex = gestures.indexOf(activeGesture);
    const nextGesture = gestures[(currentIndex + 1) % gestures.length] || "watergun";
    triggerGesture(nextGesture);
  };
  const introSpokenRef = useRef(false);
  const realtimeRef = useRef<RealtimeController | null>(null);
  const connectAbortRef = useRef<AbortController | null>(null);
  const watchdogTimerRef = useRef<number | null>(null);
  const hasAutoConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);

  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current !== null) {
      window.clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  const scoringContextRef = useRef({
    mistakes: [] as MistakeCategory[],
    crazyLevel: 16,
    selectedMode: "free-conversation",
    selectedModuleId: DEFAULT_MODULE_ID,
    selectedLevel: "basic" as LearningLevel,
    contextHistory: [] as ConversationTurn[]
  });

  const [studentProfile, setStudentProfile] = useState<{
    nickname?: string;
    gender?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.profile) {
          setStudentProfile({
            nickname: data.profile.nickname,
            gender: data.profile.gender
          });
        }
      })
      .catch(() => {});
  }, []);

  // Telemetria de tempo de prática ativo e XP acumulado
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (voiceState === "listening" || voiceState === "speaking" || voiceState === "analyzing") {
      interval = setInterval(() => {
        fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addPracticeSeconds: 15, addXp: 2 })
        }).catch(() => {});
      }, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [voiceState]);

  const emotion = useMemo(() => getEmotion(crazyLevel), [crazyLevel]);
  const activeLevel = useMemo(
    () => levelOptions.find((level) => level.id === selectedLevel) ?? levelOptions[0],
    [selectedLevel]
  );
  const activeModule = useMemo(() => getModuleById(selectedModuleId), [selectedModuleId]);

  const handleSelectModule = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
    setStoredModuleId(moduleId);
    scoringContextRef.current.selectedModuleId = moduleId;
    try {
      window.sessionStorage.setItem("mr-crazy-module-entered", "true");
    } catch {}
    setModuleTurnsCount(0);
    setCurrentEvaluation(null);
    setIsSelectingModule(false);

    if (moduleId === "free-conversation") {
      setSelectedMode("free-conversation");
      scoringContextRef.current.selectedMode = "free-conversation";
    }

    cancelSpeech();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    clearSilenceTimer();
    setAnalysis(null);
    setAnalysisSource("manual");
    setRealtimeReply("");
    setTranscript("");
    transcriptRef.current = "";
    setVoiceState("idle");
    introSpokenRef.current = false;
    setContextHistory([]);
    setOpeningIndex(getNextOpeningIndex());

    if (realtimeRef.current) {
      realtimeRef.current.disconnect();
      realtimeRef.current = null;
      setRealtimeStatus("connecting");
      isConnectingRef.current = false;
      window.setTimeout(() => void connectSession(), 100);
    }
  }, []);

  const openingLine = useMemo(
    () =>
      buildOpeningLine(
        selectedLevel,
        selectedMode,
        openingIndex,
        studentProfile?.nickname,
        studentProfile?.gender,
        selectedModuleId
      ),
    [openingIndex, selectedLevel, selectedMode, studentProfile?.gender, studentProfile?.nickname, selectedModuleId]
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    const container = conversationContainerRef.current;
    if (!container) return;
    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const conversationDisplayItems = useMemo(() => {
    if (contextHistory.length > 0) {
      return contextHistory.map((turn, index) => ({
        key: `hist-${index}-${turn.role}`,
        role: turn.role,
        text: turn.text
      }));
    }

    return [
      {
        key: "opening-greeting",
        role: "crazy" as const,
        text: openingLine
      }
    ];
  }, [contextHistory, openingLine]);

  const liveUserItem = useMemo(() => {
    const clean = transcript.trim();
    if (clean) {
      const last = contextHistory[contextHistory.length - 1];
      if (last && last.role === "user" && last.text === clean) return null;
      return { text: clean };
    }
    return null;
  }, [contextHistory, transcript]);

  const liveCrazyItem = useMemo(() => {
    const clean = realtimeReply.trim();
    if (clean) {
      const last = contextHistory[contextHistory.length - 1];
      if (last && last.role === "crazy" && last.text === clean) return null;
      return { text: clean };
    }
    if (voiceState === "analyzing" && !liveUserItem) {
      return { text: "Hummm... Analisando..." };
    }
    return null;
  }, [contextHistory, liveUserItem, realtimeReply, voiceState]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      scrollToBottom(true);
    }, 45);
    return () => window.clearTimeout(timer);
  }, [contextHistory, transcript, realtimeReply, voiceState, liveUserItem, liveCrazyItem, scrollToBottom]);

  useEffect(() => {
    if (storageReady) {
      const timer = window.setTimeout(() => scrollToBottom(false), 120);
      return () => window.clearTimeout(timer);
    }
  }, [storageReady, scrollToBottom]);

  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasSpeechRecognition =
    typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    scoringContextRef.current = {
      mistakes,
      crazyLevel,
      selectedMode,
      selectedModuleId,
      selectedLevel,
      contextHistory
    };
  }, [contextHistory, crazyLevel, mistakes, selectedLevel, selectedMode, selectedModuleId]);

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

  const applyAnalysisResult = useCallback((
    result: AnalysisResponse,
    sentence: string,
    addConversationContext: boolean,
    source: "manual" | "voice" = "manual"
  ) => {
    setAnalysis(result);
    setAnalysisSource(source);
    const nextLevel = clampCrazyLevel(crazyLevel + result.crazy_delta);
    setCrazyLevel(nextLevel);
    setXp((current) => current + result.xp_delta);

    if (!result.correct) {
      setMistakes((current) => [result.mistake_type, ...current].slice(0, 12));
      if (nextLevel >= 50) {
        triggerGesture(Math.random() > 0.35 ? "finger" : "smoke");
      } else {
        const errorGestures: CharacterGesture[] = ["watergun", "smoke", "finger"];
        triggerGesture(errorGestures[Math.floor(Math.random() * errorGestures.length)]);
      }
    } else {
      triggerGesture(Math.random() > 0.5 ? "thumbsup" : "heart");
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

    setModuleTurnsCount((prev) => {
      const nextTurns = prev + 1;
      fetch("/api/modules/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: scoringContextRef.current.selectedModuleId,
          addTurns: 1
        })
      }).catch(() => {});
      return nextTurns;
    });
  }, []);

  const handleEvaluateModule = useCallback(async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/modules/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModuleId,
          turns: Math.max(1, moduleTurnsCount),
          contextHistory: contextHistory.slice(-2),
          mistakes: mistakes.slice(0, 5)
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.evaluation) {
          setCurrentEvaluation(data.evaluation);
          triggerGesture("heart");
          speak(
            `Sensacional! Você concluiu a avaliação do módulo ${activeModule.title} com nota ${data.evaluation.overall_score}! ${data.evaluation.summary_feedback}`
          );
        }
      }
    } catch (err) {
      console.warn("Failed to evaluate module:", err);
    } finally {
      setIsEvaluating(false);
    }
  }, [isEvaluating, selectedModuleId, moduleTurnsCount, contextHistory, mistakes, activeModule.title, speak]);

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
    if (!storageReady || introSpokenRef.current) return;
    introSpokenRef.current = true;
  }, [storageReady]);

  const connectSession = useCallback((customSignal?: AbortSignal) => {
    if (isConnectingRef.current) {
      return;
    }
    isConnectingRef.current = true;

    // Aborta de forma limpa qualquer conexão anterior ainda em progresso
    if (connectAbortRef.current) {
      connectAbortRef.current.abort();
      connectAbortRef.current = null;
    }

    const abortController = new AbortController();
    connectAbortRef.current = abortController;

    if (customSignal) {
      if (customSignal.aborted) {
        abortController.abort();
      } else {
        customSignal.addEventListener("abort", () => abortController.abort(), { once: true });
      }
    }

    clearWatchdog();
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
    setAnalysisSource("manual");

    // Watchdog de segurança (13s): se a conexão não abrir nem falhar, destrava a UI
    watchdogTimerRef.current = window.setTimeout(() => {
      if (connectAbortRef.current === abortController) {
        isConnectingRef.current = false;
        realtimeRef.current?.disconnect();
        realtimeRef.current = null;
        setRealtimeStatus("failed");
        setVoiceState("idle");
        setErrorMessage("A conexão demorou a responder. Toque no botão para tentar novamente.");
      }
    }, 13000);

    const level = scoringContextRef.current.selectedLevel;
    const mode = scoringContextRef.current.selectedMode;
    const moduleId = scoringContextRef.current.selectedModuleId || selectedModuleId;

    return connectRealtime({
      level,
      mode,
      moduleId,
      signal: abortController.signal,
      getRecentContext: () =>
        scoringContextRef.current.contextHistory.slice(-2).map((turn) => ({
          role: turn.role,
          text: turn.text
        })),
      onStatus: (status) => {
        if (connectAbortRef.current === abortController && !abortController.signal.aborted) {
          setRealtimeStatus(status);
        }
      },
      onVoiceState: (state) => {
        if (connectAbortRef.current === abortController && !abortController.signal.aborted) {
          setVoiceState(state);
        }
      },
      onUserTranscript: (text, complete) => {
        setTranscript(text);
        transcriptRef.current = text;
        if (complete && text.trim()) {
          const clean = text.trim();
          setContextHistory((current) => {
            const base =
              current.length === 0 && openingLine.trim()
                ? [{ role: "crazy" as const, text: openingLine.trim() }]
                : current;
            const last = base[base.length - 1];
            if (last && last.role === "user" && last.text === clean) return base;
            return [...base.slice(-49), { role: "user", text: clean }];
          });
          setTranscript("");
          transcriptRef.current = "";
        }
      },
      onAssistantTranscript: (text, complete) => {
        if (!complete) {
          setRealtimeReply(text);
          return;
        }

        const clean = text.trim();
        if (clean) {
          setContextHistory((current) => {
            const base =
              current.length === 0 && openingLine.trim()
                ? [{ role: "crazy" as const, text: openingLine.trim() }]
                : current;
            const last = base[base.length - 1];
            if (last && last.role === "crazy" && last.text === clean) return base;
            return [...base.slice(-49), { role: "crazy", text: clean }];
          });
          setRealtimeReply("");

          // Disparo automático de gestos conforme a reação do Mr.Crazy
          const lower = clean.toLowerCase();
          const isPraise = /(boa|muito bom|parabéns|mandou bem|show|perfeito|excelente|ótimo|certinho|destravou)/i.test(lower);
          const isCorrection = /(quase|atenção|cuidado|ajuste|língua|dente|errou|errado|ops|cacete|caramba|pqp|esguicho|acorda|tente|repete)/i.test(lower);

          if (isPraise) {
            triggerGesture(Math.random() > 0.5 ? "thumbsup" : "heart");
          } else if (isCorrection) {
            const options: CharacterGesture[] = ["watergun", "smoke", "finger"];
            triggerGesture(options[Math.floor(Math.random() * options.length)]);
          }
        }
      },
      onError: (err) => {
        if (connectAbortRef.current === abortController && !abortController.signal.aborted) {
          clearWatchdog();
          const lower = String(err).toLowerCase();
          if (
            lower.includes("active response") ||
            lower.includes("already active") ||
            lower.includes("in progress")
          ) {
            console.warn("[Practice] Ignorando aviso não-crítico do provedor:", err);
            return;
          }
          if (!isAbortError(err)) {
            setErrorMessage(err);
            setRealtimeStatus("failed");
            setVoiceState("idle");
          }
        }
      }
    }).then((controller) => {
      if (abortController.signal.aborted) {
        controller.disconnect();
        return null;
      }
      clearWatchdog();
      realtimeRef.current = controller;
      setRealtimeStatus("connected");
      setMicrophoneEnabled(true);
      setVoiceState("listening");
      return controller;
    }).catch((err) => {
      clearWatchdog();
      if (!abortController.signal.aborted && connectAbortRef.current === abortController) {
        if (!isAbortError(err)) {
          setRealtimeStatus("failed");
          setVoiceState("idle");
          setErrorMessage(getConnectionError(err));
        }
      }
      return null;
    }).finally(() => {
      if (connectAbortRef.current === abortController) {
        isConnectingRef.current = false;
      }
    });
  }, [cancelSpeech, clearWatchdog]);

  useEffect(() => {
    if (!storageReady || hasAutoConnectedRef.current) return;

    // No iPhone / Safari: se o microfone ainda não foi liberado neste aparelho,
    // NÃO executamos chamada em background no mount para não disparar popup temporário do WebKit.
    // O usuário dá 1 toque no botão do microfone, o Safari salva a permissão permanente, e nunca mais pede!
    const isGranted = typeof window !== "undefined" && window.localStorage.getItem("mr-crazy-mic-granted") === "true";
    if (!isGranted) {
      setRealtimeStatus("idle");
      setVoiceState("idle");
      setMicrophoneEnabled(false);
      return;
    }

    hasAutoConnectedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void connectSession();
    }, 50);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [connectSession, storageReady]);

  useEffect(() => {
    return () => {
      clearWatchdog();
      if (connectAbortRef.current) {
        connectAbortRef.current.abort();
        connectAbortRef.current = null;
      }
      realtimeRef.current?.disconnect();
      realtimeRef.current = null;
    };
  }, [clearWatchdog]);

  // Garante que o microfone fique ativo ESTRITAMENTE enquanto o usuário está usando o sistema
  useEffect(() => {
    const handleHide = () => {
      if (document.visibilityState === "hidden") {
        if (realtimeRef.current) {
          realtimeRef.current.setMicrophoneEnabled(false);
        }
      }
    };

    const handleShow = () => {
      if (document.visibilityState !== "hidden" && realtimeRef.current) {
        realtimeRef.current.setMicrophoneEnabled(true);
        setMicrophoneEnabled(true);
        setVoiceState("listening");
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleHide();
      } else {
        handleShow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleShow);
    window.addEventListener("pageshow", handleShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleShow);
      window.removeEventListener("pageshow", handleShow);
    };
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
        learningLevel: selectedLevel,
        character: selectedCharacter
      })
    );

    // Salva o histórico da conversa APENAS durante o uso da aba (sessionStorage). Ao fechar e reabrir, inicia nova instância.
    try {
      window.sessionStorage.setItem("mr-crazy-session-turns", JSON.stringify(contextHistory.slice(-50)));
    } catch {}
  }, [contextHistory, crazyLevel, xp, mistakes, history, selectedCharacter, selectedLevel, storageReady]);

  async function analyzeSentence(sentence: string) {
    const cleanSentence = sentence.trim();
    if (!cleanSentence || analysisQueuedRef.current) return;

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
    setAnalysisSource("manual");
    setVoiceState("analyzing");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: cleanSentence,
          previousMistakes: mistakes.slice(0, 5),
          crazyLevel,
          mode: selectedMode,
          moduleId: selectedModuleId,
          learningLevel: selectedLevel,
          inputSource: "manual",
          contextHistory: [
            ...contextHistory.slice(-4),
            ...contextHistory.slice(-1),
            { role: "user", text: cleanSentence }
          ]
        })
      });

      if (!response.ok) {
        let errMessage = "A análise falhou. Digite uma frase e tente de novo.";
        try {
          const errData = (await response.json()) as { error?: string };
          if (errData?.error) errMessage = errData.error;
        } catch {}
        setErrorMessage(errMessage);
        setVoiceState("idle");
        return;
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

  function scheduleSilenceAnalysis(candidate: string, delayMs = 1800) {
    clearSilenceTimer();
    const cleanTranscript = candidate.trim();
    if (!cleanTranscript) return;

    silenceTimerRef.current = window.setTimeout(() => {
      queueTranscriptAnalysis(cleanTranscript);
    }, delayMs);
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
    setAnalysisSource("manual");
    analysisQueuedRef.current = false;
    clearSilenceTimer();
    const recognition = new Recognition();
    recognition.lang = "pt-BR";
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

      const lastResult = event.results[event.results.length - 1];
      const isLastFinal = lastResult?.isFinal;
      scheduleSilenceAnalysis(text, isLastFinal ? 1200 : 2200);
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
      setAnalysisSource("manual");
      return;
    }

    void analyzeSentence(sentence);
  }

  function handleAvatarMicClick() {
    setMicGranted(true);
    try {
      window.localStorage.setItem("mr-crazy-mic-granted", "true");
    } catch {}

    // Limpa mensagens de erro transitórias para liberar a experiência
    setErrorMessage("");

    // 1. Se o canal Realtime WebRTC estiver ativo e conectado:
    if (realtimeStatus === "connected" && realtimeRef.current) {
      const nextEnabled = !microphoneEnabled;
      realtimeRef.current.setMicrophoneEnabled(nextEnabled);
      setMicrophoneEnabled(nextEnabled);
      setVoiceState(nextEnabled ? "listening" : "idle");
      return;
    }

    // 2. Se Realtime estiver desconectado/em falha, usa reconhecimento de voz nativo do navegador
    if (hasSpeechRecognition) {
      if (voiceState === "listening") {
        stopListeningAndAnalyze();
        setMicrophoneEnabled(false);
      } else {
        setMicrophoneEnabled(true);
        startListening();
      }

      // Em segundo plano, tenta restabelecer o Realtime sem travar a fala do aluno
      if (realtimeStatus !== "connecting") {
        isConnectingRef.current = false;
        if (connectAbortRef.current) {
          connectAbortRef.current.abort();
          connectAbortRef.current = null;
        }
        void connectSession();
      }
      return;
    }

    // 3. Fallback de reconexão Realtime caso o browser não tenha Web Speech
    isConnectingRef.current = false;
    if (connectAbortRef.current) {
      connectAbortRef.current.abort();
      connectAbortRef.current = null;
    }
    setRealtimeStatus("connecting");
    setMicrophoneEnabled(true);
    setVoiceState("preparing_speech");
    void connectSession();
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
    setAnalysisSource("manual");
    setRealtimeReply("");
    setTranscript("");
    transcriptRef.current = "";
    setVoiceState("idle");
    introSpokenRef.current = false;
  }

  function clearConversationHistory() {
    resetTrainingContext();
    setContextHistory([]);
    setOpeningIndex(getNextOpeningIndex());
  }

  function speakCorrection() {
    if (!analysis) return;
    speak(analysis.corrected_sentence, "waiting_for_repeat", "en-US");
  }

  if (isSelectingModule) {
    return (
      <AppShell isAdmin={isAdmin}>
        <main className="practice-main clean-layout">
          <ModuleSelector
            activeModuleId={selectedModuleId}
            onSelectModule={handleSelectModule}
            onClose={() => setIsSelectingModule(false)}
            userName={studentProfile?.nickname || "Aluno"}
            streakDays={7}
            xp={xp}
          />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell isAdmin={isAdmin}>
      <main className={`practice-main clean-layout ${isPopupMode ? "popup-compact" : ""}`}>
        <PictureInPictureManager
          ref={pipRef}
          voiceState={voiceState}
          realtimeStatus={realtimeStatus}
          currentText={
            (voiceState === "speaking" ? liveCrazyItem?.text || realtimeReply : liveUserItem?.text || transcript) ||
            (contextHistory[contextHistory.length - 1]?.text ?? openingLine)
          }
          microphoneEnabled={microphoneEnabled}
        />

        <div className="practice-header-bar">
          <SessionHeader crazyLevel={crazyLevel} emotion={emotion} xp={xp} level={`${activeLevel.badge} ${activeLevel.label}`} />
          <button
            type="button"
            className="active-module-pill-btn"
            onClick={() => setIsSelectingModule(true)}
            title="Trocar módulo de aprendizado (Saudações, Restaurante, Viagens, etc.)"
          >
            <BookOpen size={14} />
            <span className="module-pill-title">{activeModule.title.replace(/^\d+\.\s*/, "")}</span>
            <span className="module-pill-badge">{activeModule.levelBadge.split(" ")[0]}</span>
          </button>
          <button
            type="button"
            className="stage-exam-action-btn"
            onClick={() => setIsExamModalOpen(true)}
            title={`Fazer a prova do módulo 100% em inglês com o avatar ${activeModule.examNpc.name}`}
          >
            <Award size={14} />
            <span>Prova da Etapa</span>
          </button>
          <button
            type="button"
            className="module-evaluate-action-btn"
            onClick={handleEvaluateModule}
            disabled={isEvaluating}
            title="Concluir este módulo e receber sua avaliação do Mr. Crazy"
          >
            <Award size={14} />
            <span>{isEvaluating ? "Avaliando..." : "Avaliar Módulo"}</span>
          </button>
          <div className="header-actions-group">
            <button
              type="button"
              className={`pip-btn ${isPipActive ? "active" : ""}`}
              onClick={handleTogglePiP}
              aria-label="Ativar Modo Pop-up Flutuante"
              title="Pop-up Flutuante (Picture-in-Picture): use outros apps (WhatsApp, navegador) enquanto treina inglês"
            >
              <PictureInPicture2 size={20} />
              {isPipActive && <span className="pip-badge-active" />}
            </button>
            <button
              type="button"
              className="pip-btn pip-standalone-btn"
              onClick={handleOpenStandalonePopup}
              aria-label="Abrir em Janela Pop-up Pequena"
              title="Abrir em Janela Pop-up separada para usar ao lado de outros programas"
            >
              <ExternalLink size={20} />
            </button>
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menu de configurações e digitação"
              title="Opções de nível, tema e digitação"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {pipNotification && (
          <div className="popup-banner-tip pip-floating-toast">
            <Sparkles size={16} />
            <span>{pipNotification}</span>
          </div>
        )}

        {isPopupMode && (
          <div className="popup-banner-tip">
            <Sparkles size={16} />
            <span>Modo Janela Pop-up Ativo — Treine enquanto navega ou trabalha em outras janelas!</span>
          </div>
        )}

        <section className="practice-stage clean-stage">
          <motion.div
            className="character-column"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <RpgCharacter
              crazyLevel={crazyLevel}
              emotion={emotion}
              voiceState={voiceState}
              gesture={activeGesture}
              onTap={handleAvatarTap}
            />

            {/* Botão de Microfone Circular Elegante (Sem ON/OFF, apenas ícone e cores de estado) */}
            <div className="avatar-mic-dock">
              {(() => {
                const isListening = voiceState === "listening" || (realtimeStatus === "connected" && microphoneEnabled);
                const isConnecting = realtimeStatus === "connecting";

                return (
                  <button
                    type="button"
                    className={`avatar-mic-circle-btn ${
                      isListening ? "is-active" : "is-inactive"
                    } ${isConnecting ? "is-connecting" : ""}`}
                    onClick={handleAvatarMicClick}
                    aria-label={isListening ? "Microfone ligado. Toque para silenciar." : "Microfone desligado. Toque para falar."}
                    title={isListening ? "Microfone ligado (Toque para desligar)" : "Microfone desligado (Toque para falar)"}
                  >
                    {isListening && <span className="mic-circle-pulse-ring" />}
                    {isListening ? (
                      <Mic size={24} className="mic-circle-icon icon-active" />
                    ) : (
                      <MicOff size={22} className="mic-circle-icon icon-inactive" />
                    )}
                  </button>
                );
              })()}
            </div>

            {errorMessage ? (
              <div className="avatar-mic-error-box">
                <p className="avatar-mic-error">{errorMessage}</p>
                <button
                  type="button"
                  className="retry-connection-btn"
                  onClick={() => {
                    setErrorMessage("");
                    isConnectingRef.current = false;
                    void connectSession();
                  }}
                >
                  Tentar reconectar microfone
                </button>
              </div>
            ) : null}
            <ListeningWave active={voiceState === "listening" || voiceState === "speaking" || voiceState === "transcribing" || voiceState === "analyzing"} />
          </motion.div>

          <motion.aside
            ref={conversationContainerRef}
            className="conversation-panel clean-conversation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
          >
            {contextHistory.length > 2 ? (
              <div className="history-drag-hint" title="Arraste para ver mensagens anteriores">
                <span>↑ Deslize para ver mensagens anteriores</span>
              </div>
            ) : null}

            {conversationDisplayItems.map((item) => (
              <ConversationBubble
                key={item.key}
                label={item.role === "user" ? "Você" : "Mr.Crazy"}
                tone={item.role === "user" ? "user" : "crazy"}
              >
                {item.text}
              </ConversationBubble>
            ))}

            {liveUserItem ? (
              <ConversationBubble label="Você" tone="user">
                {liveUserItem.text}
              </ConversationBubble>
            ) : null}

            {liveCrazyItem ? (
              <ConversationBubble label="Mr.Crazy" tone="crazy">
                {liveCrazyItem.text}
              </ConversationBubble>
            ) : null}

            {speechRetry ? (
              <div className="action-row">
                <button className="ghost-action" type="button" onClick={() => speakSegments(speechRetry.segments, speechRetry.nextState)}>
                  <Volume2 size={18} />
                  Ouvir Mr.Crazy
                </button>
              </div>
            ) : null}
            <div ref={messagesEndRef} className="messages-bottom-anchor" />
          </motion.aside>
        </section>

        {isMenuOpen && (
          <div className="drawer-overlay" onClick={() => setIsMenuOpen(false)}>
            <aside className="drawer-panel" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="drawer-header">
                <div className="drawer-title">
                  <Menu size={18} />
                  <h2>Ajustes & Digitação</h2>
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="drawer-body">
                <div className="drawer-group">
                  <span className="drawer-group-title">Módulo Pedagógico</span>
                  <div className="drawer-module-preview-box">
                    <div className="drawer-module-info">
                      <strong className="drawer-module-name">{activeModule.title}</strong>
                      <span className="drawer-module-badge">{activeModule.levelBadge}</span>
                    </div>
                    <p className="drawer-module-scenario">{activeModule.subtitle}</p>
                    <button
                      type="button"
                      className="drawer-action-btn secondary"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsSelectingModule(true);
                      }}
                    >
                      <BookOpen size={16} />
                      Trocar Módulo de Estudo
                    </button>
                    <button
                      type="button"
                      className="drawer-action-btn primary"
                      style={{ marginTop: "6px" }}
                      disabled={isEvaluating}
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleEvaluateModule();
                      }}
                    >
                      <Award size={16} />
                      Concluir & Avaliar Desempenho
                    </button>
                  </div>
                </div>

                <div className="drawer-group">
                  <span className="drawer-group-title">Modo Multitarefa (Pop-up & PiP)</span>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-soft)", margin: "4px 0 10px", lineHeight: "1.4" }}>
                    Treine seu inglês enquanto mexe no WhatsApp, lê notícias ou estuda em outros apps.
                  </p>
                  <div className="drawer-pip-actions">
                    <button
                      type="button"
                      className="drawer-action-btn primary"
                      onClick={() => {
                        void handleTogglePiP();
                        setIsMenuOpen(false);
                      }}
                    >
                      <PictureInPicture2 size={18} />
                      {isPipActive ? "Fechar Pop-up (PiP)" : "Ativar Pop-up Flutuante (PiP)"}
                    </button>
                    <button
                      type="button"
                      className="drawer-action-btn secondary"
                      onClick={() => {
                        handleOpenStandalonePopup();
                        setIsMenuOpen(false);
                      }}
                    >
                      <ExternalLink size={18} />
                      Abrir em Janela Pop-up Separada
                    </button>
                  </div>
                </div>

                <div className="drawer-group">
                  <span className="drawer-group-title">Nível de Inglês</span>
                  <div className="drawer-level-options">
                    {levelOptions.map((level) => {
                      const Icon = level.icon;
                      const isSelected = selectedLevel === level.id;
                      return (
                        <button
                          key={level.id}
                          type="button"
                          className={`drawer-option-card ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            if (selectedLevel === level.id) return;
                            setSelectedLevel(level.id);
                            scoringContextRef.current.selectedLevel = level.id;
                            resetTrainingContext();
                            isConnectingRef.current = false;
                            void connectSession();
                          }}
                        >
                          <Icon size={18} />
                          <div className="drawer-option-text">
                            <strong>{level.label} ({level.badge})</strong>
                            <small>{level.description}</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="drawer-group">
                  <span className="drawer-group-title">Modo de Conversa</span>
                  <div className="drawer-mode-grid">
                    {modes.map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = selectedMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          className={`drawer-mode-pill ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            if (selectedMode === mode.id) return;
                            setSelectedMode(mode.id);
                            scoringContextRef.current.selectedMode = mode.id;
                            resetTrainingContext();
                            isConnectingRef.current = false;
                            void connectSession();
                          }}
                        >
                          <Icon size={16} />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="drawer-group">
                  <span className="drawer-group-title">Modo Digitação (Texto)</span>
                  <form
                    className="drawer-text-form"
                    onSubmit={(e: FormEvent<HTMLFormElement>) => {
                      handleSubmit(e);
                      setIsMenuOpen(false);
                    }}
                  >
                    <input
                      ref={textInputRef}
                      value={manualText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualText(e.target.value)}
                      placeholder={activeLevel.placeholder}
                      aria-label="Digite sua frase em inglês"
                    />
                    <button
                      type="submit"
                      disabled={!manualText.trim() || voiceState === "analyzing"}
                      title="Enviar mensagem"
                    >
                      <Send size={16} />
                      <span>{voiceState === "analyzing" ? "Analisando..." : "Enviar"}</span>
                    </button>
                  </form>

                  <div className="drawer-examples-box">
                    <small>Frases sugeridas para testar:</small>
                    <div className="drawer-chips">
                      {activeLevel.examples.map((example: string) => (
                        <button
                          key={example}
                          type="button"
                          disabled={voiceState === "analyzing"}
                          onClick={() => {
                            if (voiceState === "analyzing") return;
                            submitSentence(example);
                            setIsMenuOpen(false);
                          }}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="drawer-footer">
                <button
                  type="button"
                  className="drawer-reset-btn"
                  onClick={() => {
                    clearConversationHistory();
                    setIsMenuOpen(false);
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Limpar histórico de conversa</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        <ModuleEvaluationModal
          evaluation={currentEvaluation}
          isLoading={isEvaluating}
          onClose={() => setCurrentEvaluation(null)}
          onActionAgain={(modId) => {
            handleSelectModule(modId);
            setCurrentEvaluation(null);
          }}
          onNextModule={() => {
            setCurrentEvaluation(null);
            setIsSelectingModule(true);
          }}
        />

        <ExamModal
          isOpen={isExamModalOpen}
          moduleId={selectedModuleId}
          onClose={() => setIsExamModalOpen(false)}
          onSuccessApproved={(evalItem) => {
            setCurrentEvaluation(evalItem);
          }}
        />
      </main>
    </AppShell>
  );
}
