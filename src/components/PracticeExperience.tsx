"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
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
  Keyboard,
  X
} from "lucide-react";
import { VoiceInputControl, type LiveAudioVisualizer } from "@/components/VoiceInputControl";
import type { VoiceDiagnostic } from "@/lib/realtime-client";
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
import {
  getLessonResumePosition,
  LESSON_STEP_LABELS,
  LESSON_STEPS_PER_PHASE
} from "@/lib/lesson-progress";
import {
  getFallbackPhaseTargets,
  getTeachingTargetForStep,
  normalizePhaseTargets,
  type TeachingTarget
} from "@/lib/lesson-target";
import { isNoiseOrHallucination } from "@/lib/voice/noise-filter";
import { buildRealtimeInstructions } from "@/lib/realtime-session";
import { ModuleSelector, type ModuleEvaluationItem } from "@/components/ModuleSelector";
import { PracticeStartScreen } from "@/components/PracticeStartScreen";
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
import { isMicrophoneAlreadyGranted } from "@/lib/voice/mic-permission";
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
import type { UserGender } from "@/lib/auth";

type SessionMode = {
  id: string;
  label: string;
  icon: LucideIcon;
};

function isUserGender(value: unknown): value is UserGender {
  return value === "masculino" || value === "feminino" || value === "outro" || value === "prefiro_nao_dizer";
}

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
  moduleId?: string,
  conceptIndex?: number,
  teachingTarget?: TeachingTarget
) {
  const isFemale = gender === "feminino";
  const cleanNickname = nickname?.replace(/\s*\(admin\)/i, "").trim();
  const namePart = cleanNickname ? ` ${cleanNickname}` : "";
  const readyWord = isFemale ? "pronta" : "pronto";
  const welcomeWord = isFemale ? "bem-vinda" : "bem-vindo";

  if (moduleId) {
    const mod = getModuleById(moduleId);
    if (mod.id === "free-conversation") {
      return `Hey${namePart}! Good to see you! We're in free conversation mode now. Let's talk in English! How are you doing today?`;
    }
    const teaching = mod.concepts?.filter((c) => !c.isExam) || [];
    const activeConcept = (typeof conceptIndex === "number" && teaching[conceptIndex]) ? teaching[conceptIndex] : teaching[0];
    if (activeConcept) {
      const meaning = teachingTarget?.meaningPt || activeConcept.meaningPt || activeConcept.objective;
      const phrase = teachingTarget?.phraseEn || activeConcept.targetPhrase || activeConcept.samplePhrases[0];
      return `Pra dizer '${meaning}', fala: '${phrase}'. Sua vez!`;
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
  const [realtimeReply, setRealtimeReply] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionStatus>("idle");
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [openingIndex, setOpeningIndex] = useState(0);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_MODULE_ID;
    return getStoredModuleId();
  });
  const [selectedMode, setSelectedMode] = useState(() => {
    const modId = typeof window === "undefined" ? DEFAULT_MODULE_ID : getStoredModuleId();
    return modId === "free-conversation" ? "free-conversation" : "module-practice";
  });
  const [isSelectingModule, setIsSelectingModule] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get("practice") === "1" ||
        urlParams.get("treino") === "1" ||
        urlParams.get("popup") === "true"
      ) {
        return false;
      }
      if (urlParams.get("map") === "1" || urlParams.get("modulos") === "1") {
        return true;
      }
    }
    // A primeira tela ao entrar é o Mapa de Etapas
    return true;
  });
  const [isPracticeIntro, setIsPracticeIntro] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const urlParams = new URLSearchParams(window.location.search);
    return !(
      urlParams.get("practice") === "1" ||
      urlParams.get("map") === "1" ||
      urlParams.get("modulos") === "1" ||
      urlParams.get("popup") === "true"
    );
  });

  const [talkMode, setTalkMode] = useState<"continuous" | "push-to-talk">(() => {
    if (typeof window === "undefined") return "continuous";
    try {
      return (window.localStorage.getItem("mr-crazy-talk-mode") as "continuous" | "push-to-talk") || "continuous";
    } catch {
      return "continuous";
    }
  });
  const [isHoldingToTalk, setIsHoldingToTalk] = useState(false);

  const handleTalkModeChange = useCallback((mode: "continuous" | "push-to-talk") => {
    setTalkMode(mode);
    try {
      window.localStorage.setItem("mr-crazy-talk-mode", mode);
    } catch {}
    if (mode === "push-to-talk") {
      setMicrophoneEnabled(false);
      realtimeRef.current?.setMicrophoneEnabled(false);
    }
  }, []);

  const microphoneEnabledRef = useRef(false);
  const voiceStateRef = useRef<VoiceState>("idle");
  const isHoldingAudioRef = useRef(false);
  const audioMetricsRef = useRef<LiveAudioVisualizer>({
    source: "none",
    level: 0,
    bass: 0,
    bands: new Array(12).fill(0)
  });

  useEffect(() => {
    microphoneEnabledRef.current = microphoneEnabled;
  }, [microphoneEnabled]);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const handleHoldStart = useCallback(() => {
    isHoldingAudioRef.current = true;
    setIsHoldingToTalk(true);
    setMicrophoneEnabled(true);
    setIsCharacterAwake(true);
    realtimeRef.current?.setMicrophoneEnabled(true);
  }, []);

  const handleHoldEnd = useCallback(() => {
    isHoldingAudioRef.current = false;
    setIsHoldingToTalk(false);
    setMicrophoneEnabled(false);
    realtimeRef.current?.commitTurn();
  }, []);

  const handleHoldCancel = useCallback(() => {
    isHoldingAudioRef.current = false;
    setIsHoldingToTalk(false);
    setMicrophoneEnabled(false);
    realtimeRef.current?.cancelTurn();
  }, []);
  const [moduleTurnsCount, setModuleTurnsCount] = useState(0);
  const [currentEvaluation, setCurrentEvaluation] = useState<ModuleEvaluationItem | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<LearningLevel>("basic");
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("rpg");
  const [activeGesture, setActiveGesture] = useState<CharacterGesture>("idle");
  const gestureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [mistakes, setMistakes] = useState<MistakeCategory[]>([]);
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [voiceDiagnostics, setVoiceDiagnostics] = useState<VoiceDiagnostic[]>([]);
  const [inputDeviceId, setInputDeviceId] = useState("");
  const inputDeviceRef = useRef("");
  const inputMeterRef = useRef<HTMLMeterElement | null>(null);
  const [contextHistory, setContextHistory] = useState<ConversationTurn[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [speechRetry, setSpeechRetry] = useState<{ segments: SpeechSegment[]; nextState: VoiceState } | null>(null);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState("");
  const cancelPlaybackRef = useRef<(() => void) | null>(null);
  const ptVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const enVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const analysisQueuedRef = useRef(false);
  const pipRef = useRef<PictureInPictureManagerHandle | null>(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isPopupMode, setIsPopupMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.location.search.includes("popup=true");
    }
    return false;
  });
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

  const triggerGesture = useCallback((gesture: CharacterGesture) => {
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    setActiveGesture(gesture);
    gestureTimeoutRef.current = setTimeout(() => {
      setActiveGesture("idle");
    }, 2600);
  }, []);

  useEffect(() => {
    if (voiceState !== "speaking") return;

    setActiveGesture("idle");
    let turn = 0;
    const gestures: CharacterGesture[] = emotion === "crazy" || emotion === "irritated"
      ? ["idle", "finger", "idle", "thumbsup", "idle"]
      : ["idle", "thumbsup", "idle", "heart", "idle"];
    const interval = window.setInterval(() => {
      turn = (turn + 1) % gestures.length;
      setActiveGesture(gestures[turn]);
    }, 1450);

    return () => window.clearInterval(interval);
  }, [emotion, voiceState]);

  const handleAvatarTap = useCallback(() => {
    setIsCharacterAwake(true);
    if (voiceState === "speaking" && realtimeRef.current) {
      realtimeRef.current.interrupt();
      setVoiceState("listening");
    }
    const gestures: CharacterGesture[] = ["watergun", "smoke", "finger", "thumbsup", "heart"];
    const currentIndex = gestures.indexOf(activeGesture);
    const nextGesture = gestures[(currentIndex + 1) % gestures.length] || "watergun";
    triggerGesture(nextGesture);
  }, [voiceState, activeGesture, triggerGesture]);
  const introSpokenRef = useRef(false);
  const realtimeRef = useRef<RealtimeController | null>(null);
  const connectAbortRef = useRef<AbortController | null>(null);
  const hasAutoConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);


  const scoringContextRef = useRef({
    mistakes: [] as MistakeCategory[],
    crazyLevel: 16,
    selectedMode: (typeof window === "undefined" ? DEFAULT_MODULE_ID : getStoredModuleId()) === "free-conversation" ? "free-conversation" : "module-practice",
    selectedModuleId: typeof window === "undefined" ? DEFAULT_MODULE_ID : getStoredModuleId(),
    selectedLevel: "basic" as LearningLevel,
    currentConceptIndex: 0,
    contextHistory: [] as ConversationTurn[]
  });

  const [studentProfile, setStudentProfile] = useState<{
    nickname?: string;
    gender?: UserGender;
  } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.profile) {
          setStudentProfile({
            nickname: data.profile.nickname,
            gender: isUserGender(data.profile.gender) ? data.profile.gender : undefined
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
  const teachingConcepts = useMemo(
    () => (activeModule?.concepts ? activeModule.concepts.filter((c) => !c.isExam) : []),
    [activeModule]
  );
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [currentLessonStepIndex, setCurrentLessonStepIndex] = useState(0);
  const [phaseTargets, setPhaseTargets] = useState<TeachingTarget[]>(() =>
    getFallbackPhaseTargets(activeModule, 0)
  );
  const [isStudyCardVisible, setIsStudyCardVisible] = useState(false);
  const [speechBubbleHasOverflow, setSpeechBubbleHasOverflow] = useState(false);
  const [speechBubbleIsScrolled, setSpeechBubbleIsScrolled] = useState(false);
  const speechBubbleScrollRef = useRef<HTMLDivElement>(null);
  const currentConceptIndexRef = useRef(0);
  const currentLessonStepIndexRef = useRef(0);
  const teachingTarget = useMemo(
    () => getTeachingTargetForStep(phaseTargets, currentLessonStepIndex),
    [currentLessonStepIndex, phaseTargets]
  );

  useEffect(() => {
    currentConceptIndexRef.current = currentConceptIndex;
    currentLessonStepIndexRef.current = currentLessonStepIndex;
  }, [currentConceptIndex, currentLessonStepIndex]);

  useEffect(() => {
    const fallbackTargets = getFallbackPhaseTargets(activeModule, currentConceptIndex);
    setPhaseTargets(fallbackTargets);
    setIsStudyCardVisible(false);

    if (activeModule.id === "free-conversation" || teachingConcepts.length === 0) return;

    const controller = new AbortController();
    fetch("/api/modules/lesson-target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: activeModule.id, phaseIndex: currentConceptIndex }),
      signal: controller.signal
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.ok || controller.signal.aborted) return;
        setPhaseTargets(normalizePhaseTargets(data.targets, activeModule, currentConceptIndex));
      })
      .catch((error) => {
        if (!isAbortError(error)) console.warn("[Practice] Falha ao gerar alvos da fase:", error);
      });

    return () => controller.abort();
  }, [activeModule, currentConceptIndex, teachingConcepts.length]);

  useEffect(() => {
    // Sincroniza dinamicamente as instruções WebRTC com a fase atual do aluno
    if (realtimeRef.current && realtimeStatus === "connected") {
      try {
        const updatedInstructions = buildRealtimeInstructions(
          selectedLevel,
          selectedMode,
          studentProfile,
          selectedModuleId,
          currentConceptIndex,
          currentLessonStepIndex,
          phaseTargets
        );
        realtimeRef.current.updateInstructions(updatedInstructions);
      } catch (err) {
        console.warn("[Practice] Erro ao sincronizar instruções WebRTC:", err);
      }
    }
  }, [currentConceptIndex, currentLessonStepIndex, phaseTargets, selectedModuleId, selectedLevel, selectedMode, studentProfile, realtimeStatus]);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [isModuleCompleted, setIsModuleCompleted] = useState(false);
  const [isCharacterAwake, setIsCharacterAwake] = useState(false);
  const hasUserAttemptedPhaseRef = useRef(false);
  const [showAllMessages, setShowAllMessages] = useState(false);

  const currentModuleIndex = useMemo(
    () => LEARNING_MODULES.findIndex((m) => m.id === selectedModuleId),
    [selectedModuleId]
  );
  const nextModule = useMemo(
    () =>
      currentModuleIndex >= 0 && currentModuleIndex < LEARNING_MODULES.length - 1
        ? LEARNING_MODULES[currentModuleIndex + 1]
        : null,
    [currentModuleIndex]
  );

  type StageTransition = {
    nextModule: (typeof LEARNING_MODULES)[number];
    score: number;
    feedback: string;
    countdown: number;
    targetConcept?: {
      title: string;
      objective: string;
      phrase: string;
    };
  };

  const [stageTransition, setStageTransition] = useState<StageTransition | null>(null);

  const handleSelectModule = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
    setStoredModuleId(moduleId);
    scoringContextRef.current.selectedModuleId = moduleId;
    try {
      window.sessionStorage.setItem("mr-crazy-module-entered", "true");
    } catch {}
    setModuleTurnsCount(0);
    currentConceptIndexRef.current = 0;
    currentLessonStepIndexRef.current = 0;
    setCurrentConceptIndex(0);
    setCurrentLessonStepIndex(0);
    setIsLessonCompleted(false);
    setIsModuleCompleted(false);
    setIsCharacterAwake(false);
    hasUserAttemptedPhaseRef.current = false;
    setCurrentEvaluation(null);
    setMicrophoneEnabled(false);
    realtimeRef.current?.setMicrophoneEnabled(false);
    setIsSelectingModule(false);

    if (moduleId === "free-conversation") {
      setSelectedMode("free-conversation");
      scoringContextRef.current.selectedMode = "free-conversation";
    } else {
      setSelectedMode("module-practice");
      scoringContextRef.current.selectedMode = "module-practice";
    }
    setIsStudyCardVisible(false);

    cancelSpeech();
    setAnalysis(null);
    setAnalysisSource("manual");
    setRealtimeReply("");
    setTranscript("");
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
        selectedModuleId,
        currentConceptIndex,
        teachingTarget
      ),
    [openingIndex, selectedLevel, selectedMode, studentProfile?.gender, studentProfile?.nickname, selectedModuleId, currentConceptIndex, teachingTarget]
  );

  useEffect(() => {
    if (!storageReady || selectedModuleId === "free-conversation" || teachingConcepts.length === 0) return;
    const controller = new AbortController();

    fetch("/api/modules/progress", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null) as {
          ok?: boolean;
          error?: string;
          progress?: Array<{
            module_id?: string;
            status?: string;
            progress_percent?: number;
            total_turns?: number;
            completed_missions?: string[];
          }>;
        } | null;
        if (!response.ok) throw new Error(data?.error || "Não foi possível carregar seu progresso salvo.");
        return data;
      })
      .then((data) => {
        if (!data?.ok || controller.signal.aborted || !Array.isArray(data.progress)) return;
        const record = data.progress.find((item: { module_id?: string }) => item?.module_id === selectedModuleId);
        if (!record) return;

        const completedMissions = Array.isArray(record.completed_missions) ? record.completed_missions : [];
        const resume = getLessonResumePosition(completedMissions, teachingConcepts.map((concept) => concept.id));
        const completedModule = record.status === "completed" || record.progress_percent >= 100;

        currentConceptIndexRef.current = resume.phaseIndex;
        currentLessonStepIndexRef.current = resume.stepIndex;
        setCurrentConceptIndex(resume.phaseIndex);
        setCurrentLessonStepIndex(resume.stepIndex);
        setModuleTurnsCount(Math.max(0, Number(record.total_turns) || 0));
        setIsModuleCompleted(completedModule);
        setIsLessonCompleted(!completedModule && resume.lessonCompleted);
      })
      .catch((error) => {
        if (!isAbortError(error)) {
          console.warn("[Practice] Falha ao restaurar progresso:", error);
          setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar seu progresso salvo.");
        }
      });

    return () => controller.abort();
  }, [selectedModuleId, storageReady, teachingConcepts]);

  const progressWriteQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));

  const persistLessonProgress = useCallback(({
    addTurns = 0,
    phaseIndex,
    stepIndex
  }: {
    addTurns?: number;
    phaseIndex?: number;
    stepIndex?: number;
  }) => {
    if (selectedModuleId === "free-conversation") return true;
    const write = async () => {
      try {
        const response = await fetch("/api/modules/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId: selectedModuleId,
            addTurns,
            phaseIndex,
            stepIndex,
            teachingTarget: teachingTargetRef.current
              ? {
                  phaseId: teachingTargetRef.current.phaseId,
                  phraseEn: teachingTargetRef.current.phraseEn
                }
              : undefined
          })
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(data?.error || "Não foi possível registrar o avanço.");
        }
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível registrar o avanço.");
        return false;
      }
    };

    progressWriteQueueRef.current = progressWriteQueueRef.current.then(write, write);
    return progressWriteQueueRef.current;
  }, [selectedModuleId]);

  const completeCurrentLessonStep = useCallback(async (addTurns = 0) => {
    const phaseIndex = currentConceptIndexRef.current;
    const stepIndex = currentLessonStepIndexRef.current;
    const phase = teachingConcepts[phaseIndex];
    if (!phase) return;

    const persisted = await persistLessonProgress({ addTurns, phaseIndex, stepIndex });
    if (!persisted) return;

    if (stepIndex < LESSON_STEPS_PER_PHASE - 1) {
      const nextStep = stepIndex + 1;
      currentLessonStepIndexRef.current = nextStep;
      setCurrentLessonStepIndex(nextStep);
      return;
    }

    if (phaseIndex < teachingConcepts.length - 1) {
      const nextPhase = phaseIndex + 1;
      currentConceptIndexRef.current = nextPhase;
      currentLessonStepIndexRef.current = 0;
      setCurrentConceptIndex(nextPhase);
      setCurrentLessonStepIndex(0);
      return;
    }

    setIsLessonCompleted(true);
  }, [persistLessonProgress, teachingConcepts]);

  const persistLessonProgressRef = useRef(persistLessonProgress);
  const completeCurrentLessonStepRef = useRef(completeCurrentLessonStep);
  const teachingTargetRef = useRef(teachingTarget);
  const openingLineRef = useRef(openingLine);

  useEffect(() => {
    persistLessonProgressRef.current = persistLessonProgress;
    completeCurrentLessonStepRef.current = completeCurrentLessonStep;
    teachingTargetRef.current = teachingTarget;
    openingLineRef.current = openingLine;
  }, [completeCurrentLessonStep, openingLine, persistLessonProgress, teachingTarget]);

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
      return { text: clean, isTyping: false };
    }
    if (voiceState === "analyzing") {
      return { text: "Analisando sua resposta...", isTyping: true };
    }
    return null;
  }, [contextHistory, realtimeReply, voiceState]);

  const allConversationItems = useMemo(() => {
    const items: Array<{
      key: string;
      role: "user" | "crazy";
      text: string;
      isTyping?: boolean;
    }> = conversationDisplayItems.map((item) => ({
      key: item.key,
      role: item.role,
      text: item.text,
      isTyping: false
    }));

    if (liveUserItem) {
      items.push({
        key: "live-user",
        role: "user",
        text: liveUserItem.text,
        isTyping: false
      });
    }

    if (liveCrazyItem) {
      items.push({
        key: "live-crazy",
        role: "crazy",
        text: liveCrazyItem.text,
        isTyping: liveCrazyItem.isTyping
      });
    }

    return items;
  }, [conversationDisplayItems, liveUserItem, liveCrazyItem]);

  const latestCrazySpeech = useMemo(() => {
    if (!isCharacterAwake && contextHistory.length === 0) {
      return "Bora treinar? Toque no microfone e diga a frase abaixo.";
    }
    for (let i = allConversationItems.length - 1; i >= 0; i--) {
      const item = allConversationItems[i];
      if (item.role === "crazy" && item.text.trim()) {
        return item.text.trim();
      }
    }
    return openingLine || "Fala aí! Eu sou o Mr. Crazy! Pode falar no microfone para treinar inglês comigo!";
  }, [allConversationItems, openingLine, isCharacterAwake, contextHistory.length]);

  const shouldShowStudyGuide = Boolean(
    teachingTarget && (isStudyCardVisible || (!isCharacterAwake && selectedMode === "module-practice"))
  );

  useEffect(() => {
    const container = speechBubbleScrollRef.current;
    if (!container) return;

    container.scrollTop = 0;
    setSpeechBubbleIsScrolled(false);
    const updateOverflow = () => setSpeechBubbleHasOverflow(container.scrollHeight > container.clientHeight + 2);
    const frame = window.requestAnimationFrame(updateOverflow);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateOverflow);
    observer?.observe(container);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [latestCrazySpeech, shouldShowStudyGuide, teachingTarget]);

  const latestUserSpeech = useMemo(() => {
    if (transcript.trim()) return transcript.trim();
    if (liveUserItem?.text.trim()) return liveUserItem.text.trim();
    for (let i = allConversationItems.length - 1; i >= 0; i--) {
      const item = allConversationItems[i];
      if (item.role === "user" && item.text.trim()) {
        return item.text.trim();
      }
    }
    return "";
  }, [transcript, liveUserItem, allConversationItems]);

  const suggestedReplies = useMemo(() => {
    const suggestions: string[] = [];

    // Prioridade 1: Frase em inglês citada na última fala do Mr. Crazy
    const lastCrazy =
      [...contextHistory].reverse().find((t) => t.role === "crazy")?.text || openingLine;
    const quoteMatch = /["“]([^"“”]{3,50})["”]/u.exec(lastCrazy);
    if (quoteMatch && quoteMatch[1]) {
      const quoted = quoteMatch[1].trim();
      if (!/^(o|a|os|as|do|da|no|na|de|em)$/i.test(quoted)) {
        suggestions.push(quoted);
      }
    }

    // Prioridade 2: Frase alvo do módulo pedagógico ativo
    if (activeModule?.samplePhrases && activeModule.samplePhrases.length > 0) {
      const modSentence =
        activeModule.samplePhrases[moduleTurnsCount % activeModule.samplePhrases.length];
      if (modSentence && !suggestions.includes(modSentence)) {
        suggestions.push(modSentence);
      }
    }

    // Prioridade 3: Ajuda pedagógica comum
    if (suggestions.length < 3) {
      suggestions.push("Como falo isso em inglês?");
    }
    if (suggestions.length < 3) {
      suggestions.push("Não entendi o erro, me ajuda?");
    }

    return suggestions.slice(0, 3);
  }, [contextHistory, openingLine, activeModule, moduleTurnsCount]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      scrollToBottom(false);
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

  useEffect(() => {
    scoringContextRef.current = {
      mistakes,
      crazyLevel,
      selectedMode,
      selectedModuleId,
      selectedLevel,
      currentConceptIndex,
      contextHistory
    };
  }, [contextHistory, crazyLevel, currentConceptIndex, mistakes, selectedLevel, selectedMode, selectedModuleId]);

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
    setCurrentlySpeakingText("");
  }, []);

  const speakSegments = useCallback((segments: SpeechSegment[], nextState: VoiceState) => {
    cancelSpeech();
    if (!canSpeak) {
      setErrorMessage("A voz não está disponível neste navegador.");
      setVoiceState(nextState);
      return;
    }

    const fullText = segments.map((s) => s.text).join(" ");
    setCurrentlySpeakingText(fullText);

    const synth = window.speechSynthesis;
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
      onEnd: () => {
        setCurrentlySpeakingText("");
        setVoiceState(nextState);
      },
      onError: (reason, remaining) => {
        setCurrentlySpeakingText("");
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
    setErrorMessage("");
    setCurrentlySpeakingText(text);

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
      onEnd: () => {
        setCurrentlySpeakingText("");
        setVoiceState(nextState);
      },
      onError: () => {
        speakSegments(segments, nextState);
      }
    });
  }, [cancelSpeech, speakSegments]);


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

    setModuleTurnsCount((prev) => prev + 1);
    if (result.correct && teachingConcepts.length > 0) {
      void completeCurrentLessonStep(1);
    } else {
      void persistLessonProgress({ addTurns: 1 });
    }
  }, [completeCurrentLessonStep, persistLessonProgress, teachingConcepts.length]);

  const handleImmediateStartNextStage = useCallback(() => {
    if (!stageTransition) return;
    const target = stageTransition;
    setStageTransition(null);
    handleSelectModule(target.nextModule.id);

    const phraseToRepeat = target.targetConcept?.phrase || target.nextModule.initialGreeting.en;
    const speechAnnouncement = `Boa! Agora fala: ${phraseToRepeat}. Sua vez!`;

    setTimeout(() => {
      speak(speechAnnouncement, "waiting_for_repeat", "pt-BR");
    }, 400);
  }, [stageTransition, handleSelectModule, speak]);

  useEffect(() => {
    if (!stageTransition) return;

    if (stageTransition.countdown <= 0) {
      handleImmediateStartNextStage();
      return;
    }

    const timer = setInterval(() => {
      setStageTransition((prev) => {
        if (!prev) return null;
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stageTransition, handleImmediateStartNextStage]);

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
          const evalItem = data.evaluation;
          setCurrentEvaluation(evalItem);
          const score = typeof evalItem.overall_score === "number" ? evalItem.overall_score : 70;

          triggerGesture(score >= 70 ? "heart" : "watergun");
          speak(
            `Você concluiu a avaliação do módulo ${activeModule.cleanTitle || activeModule.title} com nota ${score}! ${evalItem.summary_feedback}`
          );
        }
      }
    } catch (err) {
      console.warn("Failed to evaluate module:", err);
    } finally {
      setIsEvaluating(false);
    }
  }, [isEvaluating, selectedModuleId, moduleTurnsCount, contextHistory, mistakes, activeModule, triggerGesture, speak]);

  useEffect(() => {
    if (isLessonCompleted && !isModuleCompleted && !currentEvaluation && !isExamModalOpen) {
      // Abre a prova prática automaticamente ao concluir todas as fases de treino.
      setIsExamModalOpen(true);
      setMicrophoneEnabled(false);
      realtimeRef.current?.setMicrophoneEnabled(false);
      triggerGesture("thumbsup");
      speak(
        "Você concluiu as fases. Agora é a prova prática: converse em inglês e use o que aprendeu. A correção vem no final."
      );
    }
  }, [isLessonCompleted, isModuleCompleted, currentEvaluation, isExamModalOpen, activeModule, triggerGesture, speak]);

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
      cancelPlaybackRef.current?.();
      realtimeRef.current?.disconnect();
      realtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!storageReady || introSpokenRef.current) return;
    introSpokenRef.current = true;
  }, [storageReady]);

  const connectSession = useCallback((customSignal?: AbortSignal, isAutoConnect = false) => {
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

    realtimeRef.current?.disconnect();
    realtimeRef.current = null;
    cancelSpeech();
    setAnalysis(null);
    setTranscript("");
    setRealtimeReply("");
    setRealtimeStatus("connecting");
    if (!isAutoConnect) setIsCharacterAwake(true);
    setMicrophoneEnabled(false);
    setVoiceDiagnostics([]);
    setErrorMessage("");
    setVoiceState("preparing_speech");
    setAnalysisSource("manual");

    const level = scoringContextRef.current.selectedLevel;
    const mode = scoringContextRef.current.selectedMode;
    const moduleId = scoringContextRef.current.selectedModuleId || selectedModuleId;
    const conceptIndex = scoringContextRef.current.currentConceptIndex;

    return connectRealtime({
      level,
      mode,
      moduleId,
      conceptIndex,
      initialMicrophoneEnabled: false,
      signal: abortController.signal,
      deviceId: inputDeviceRef.current,
      onInputLevel: (level) => {
        if (connectAbortRef.current === abortController && inputMeterRef.current) inputMeterRef.current.value = level;
        if (level > 0.05) {
          setIsCharacterAwake(true);
        }
      },
      onInputMetrics: (metrics) => {
        if (microphoneEnabledRef.current || isHoldingAudioRef.current) {
          if (metrics.level > 0.03) {
            setIsCharacterAwake(true);
          }
          audioMetricsRef.current = {
            source: "user",
            level: metrics.level,
            bass: metrics.bass,
            bands: metrics.bands
          };
        } else if (audioMetricsRef.current.source === "user") {
          audioMetricsRef.current = {
            source: "none",
            level: 0,
            bass: 0,
            bands: new Array(12).fill(0)
          };
        }
      },
      onOutputMetrics: (metrics) => {
        if (voiceStateRef.current === "speaking" && metrics.level > 0.02) {
          audioMetricsRef.current = {
            source: "crazy",
            level: metrics.level,
            bass: metrics.bass,
            bands: metrics.bands
          };
        } else if (audioMetricsRef.current.source === "crazy") {
          audioMetricsRef.current = {
            source: "none",
            level: 0,
            bass: 0,
            bands: new Array(12).fill(0)
          };
        }
      },
      onUserSpeechStarted: () => {
        setIsCharacterAwake(true);
      },
      onDiagnostic: (event) => {
        if (connectAbortRef.current === abortController && !abortController.signal.aborted) {
          setVoiceDiagnostics(current => [...current.slice(-29), event]);
        }
      },
      getRecentContext: () =>
        (scoringContextRef.current.contextHistory.length ? scoringContextRef.current.contextHistory : [{ role: "crazy", text: openingLineRef.current }]).slice(-6).map((turn) => ({
          role: turn.role,
          text: turn.text
        })),
      onStatus: (status) => {
        if (connectAbortRef.current === abortController && !abortController.signal.aborted) {
          setRealtimeStatus(status);
          if (status === "failed") {
            realtimeRef.current = null;
            setMicrophoneEnabled(false);
            setVoiceState("idle");
          }
        }
      },
      onVoiceState: (state) => {
        if (connectAbortRef.current === abortController && !abortController.signal.aborted) {
          setVoiceState(state);
          if (state === "speaking" || state === "preparing_speech" || state === "analyzing") {
            setIsCharacterAwake(true);
          }
          if (state === "listening") {
            cancelSpeech();
            setRealtimeReply("");
          }
        }
      },
      onUserTranscript: (text, complete) => {
        if (connectAbortRef.current !== abortController || abortController.signal.aborted) return;
        setTranscript(text);
        if (complete && text.trim()) {
          const clean = text.trim();
          // Ignora ruído de fundo, respiração, cliques e alucinações curtas do Whisper
          if (isNoiseOrHallucination(clean)) {
            setTranscript("");
            realtimeRef.current?.interrupt();
            return;
          }

          setIsCharacterAwake(true);
          hasUserAttemptedPhaseRef.current = true;
          setIsStudyCardVisible(true);
          setModuleTurnsCount((prev) => prev + 1);
          void persistLessonProgressRef.current({ addTurns: 1 });

          setContextHistory((current) => {
            const base =
              current.length === 0 && openingLineRef.current.trim()
                ? [{ role: "crazy" as const, text: openingLineRef.current.trim() }]
                : current;
            const last = base[base.length - 1];
            if (last && last.role === "user" && last.text === clean) return base;
            return [...base.slice(-49), { role: "user", text: clean }];
          });
          setTranscript("");
        }
      },
      onAssistantTranscript: (text, complete) => {
        if (connectAbortRef.current !== abortController || abortController.signal.aborted) return;

        // Revela o cartão didático de fala assim que o Mr. Crazy começa a introduzir ou pedir treino da frase
        const lowerText = text.toLowerCase();
        const targetPhraseClean = (teachingTargetRef.current?.phraseEn || "").toLowerCase().trim();
        const isTeachingOrAskingToPractice =
          /(vamos treinar|fala pra mim|diga pra mim|repita comigo|repete comigo|em inglês se fala|em inglês é|como se fala|como falar|como pedir|como dizer|a pronúncia soa|a pronúncia é|tente falar|tenta falar|agora é sua vez|sua vez|manda ver|bora treinar essa|bora praticar essa|pronúncia aportuguesada|fase [1-9]|pra dizer)/i.test(lowerText) ||
          (targetPhraseClean.length >= 4 && lowerText.includes(targetPhraseClean));

        if (isTeachingOrAskingToPractice) {
          setIsStudyCardVisible(true);
        }

        if (!complete) {
          setRealtimeReply(text);
          return;
        }

        const clean = text.trim();
        if (clean) {
          setContextHistory((current) => {
            const base =
              current.length === 0 && openingLineRef.current.trim()
                ? [{ role: "crazy" as const, text: openingLineRef.current.trim() }]
                : current;
            const last = base[base.length - 1];
            if (last && last.role === "crazy" && last.text === clean) return base;
            return [...base.slice(-49), { role: "crazy", text: clean }];
          });
          setRealtimeReply("");

          // Disparo automático de gestos, avaliação de fase e sincronização estrita com o Mr. Crazy
          const lower = clean.toLowerCase();
          const isGreetingOnly = /(tudo ótimo por aqui|tudo bem por aqui|como você tá|e com você|bora treinar|o que manda|fala comigo|seja bem-vindo|seja bem-vinda)/i.test(lower);
          const isInstruction = /(vamos treinar|fala pra mim|diga pra mim|repita comigo|em inglês se fala|a pronúncia soa|como se fala|tente falar|como falar|como se diz|pra dizer)/i.test(lower);
          const isPraise = /(aí sim|boa|muito bom|parabéns|mandou bem|mandou benzão|show|perfeito|excelente|ótimo|certinho|destravou|dominou|dominada|fase concluída|etapa concluída|próxima fase|fase seguinte|mandou bala|aleluia)/i.test(lower);
          const isCorrection = /(quase|atenção|cuidado|ajuste|língua|dente|errou|errado|ops|esguicho|acorda pra cuspir|tá errado|não é assim|pronúncia torta|não consegui te ouvir|não te ouvi|não entendi|burrada|que porcaria)/i.test(lower);

          if (isInstruction) setIsStudyCardVisible(true);

          if (isPraise && !isCorrection && !isInstruction) {
            setIsStudyCardVisible(false);
          }

          if (hasUserAttemptedPhaseRef.current && isPraise && !isCorrection) {
            hasUserAttemptedPhaseRef.current = false;
            void completeCurrentLessonStepRef.current();
          }

          if (isCorrection) {
            const options: CharacterGesture[] = ["watergun", "smoke", "finger"];
            triggerGesture(options[Math.floor(Math.random() * options.length)]);
            // Errou: Puticidade sobe e ele fica mais puto!
            setCrazyLevel((prev) => clampCrazyLevel(prev + 18));
          } else if (isPraise && !isCorrection && !isInstruction && !isGreetingOnly) {
            triggerGesture(Math.random() > 0.5 ? "thumbsup" : "heart");
            // Acertou: Puticidade esfria um pouco
            setCrazyLevel((prev) => clampCrazyLevel(prev - 12));
          }

        }
      },
      onError: (err) => {
        if (connectAbortRef.current === abortController && !abortController.signal.aborted) {
          setErrorMessage(err);
          if (realtimeRef.current) return;
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
            setRealtimeStatus("failed");
            setVoiceState("idle");
            setMicrophoneEnabled(false);
            setErrorMessage(err);
          }
        }
      }
    }).then((controller) => {
      if (abortController.signal.aborted || connectAbortRef.current !== abortController) {
        controller.disconnect();
        return null;
      }
      realtimeRef.current = controller;
      setRealtimeStatus("connected");
      controller.setMicrophoneEnabled(false);
      setMicrophoneEnabled(false);
      setVoiceState("idle");

      return controller;
    }).catch((err) => {
      if (!abortController.signal.aborted && connectAbortRef.current === abortController) {
        if (!isAbortError(err)) {
          setRealtimeStatus("failed");
          setVoiceState("idle");
          setMicrophoneEnabled(false);
          setErrorMessage(getConnectionError(err));
          if (isAutoConnect && (err instanceof Error && (err.name === "NotAllowedError" || err.name === "SecurityError"))) {
            setRealtimeStatus("idle");
            setVoiceState("idle");
            setMicrophoneEnabled(false);
          } else {
            setRealtimeStatus("failed");
            setVoiceState("idle");
            setMicrophoneEnabled(false);
            setErrorMessage(getConnectionError(err));
          }
        }
      }
      return null;
    }).finally(() => {
      if (connectAbortRef.current === abortController) {
        isConnectingRef.current = false;
      }
    });
  }, [cancelSpeech]);

  useEffect(() => {
    if (!storageReady || hasAutoConnectedRef.current) return;
    hasAutoConnectedRef.current = true;
    void connectSession(undefined, true);
  }, [storageReady, connectSession]);

  useEffect(() => {
    return () => {
      if (connectAbortRef.current) {
        connectAbortRef.current.abort();
        connectAbortRef.current = null;
      }
      realtimeRef.current?.disconnect();
      realtimeRef.current = null;
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
    analysisQueuedRef.current = true;
    setErrorMessage("");
    setTranscript("");
    setAnalysis(null);
    setAnalysisSource("manual");
    setVoiceState("analyzing");

    // Adiciona imediatamente a mensagem do usuário ao histórico visual para feedback instantâneo
    setContextHistory((current) => {
      const base =
        current.length === 0 && openingLine.trim()
          ? [{ role: "crazy" as const, text: openingLine.trim() }]
          : current;
      const last = base[base.length - 1];
      if (last && last.role === "user" && last.text === cleanSentence) return base;
      return [...base.slice(-49), { role: "user" as const, text: cleanSentence }];
    });

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
          conceptIndex: currentConceptIndex,
          lessonStepIndex: currentLessonStepIndex,
          teachingTarget,
          learningLevel: selectedLevel,
          inputSource: "manual",
          contextHistory: [
            ...contextHistory.slice(-4),
            { role: "user", text: cleanSentence }
          ]
        })
      });

      if (!response.ok) {
        let errMessage = "A análise demorou a responder. Tente novamente.";
        try {
          const errData = (await response.json()) as { error?: string };
          if (errData?.error) errMessage = errData.error;
        } catch {}
        setErrorMessage(errMessage);
        setVoiceState("idle");
        return;
      }

      const result = (await response.json()) as AnalysisResponse;
      applyAnalysisResult(result, cleanSentence, false);
      setContextHistory((current) => [
        ...current.slice(-49),
        { role: "crazy" as const, text: `${result.reaction} ${result.correction} ${result.follow_up}` }
      ]);
      speak(`${result.reaction} ${result.correction} ${result.follow_up}`);
    } catch {
      setErrorMessage("A análise demorou a responder. Tente novamente.");
      setVoiceState("idle");
    } finally {
      analysisQueuedRef.current = false;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sentence = manualText.trim();
    if (!sentence) return;
    setManualText("");
    submitSentence(sentence);
    mainInputRef.current?.focus();
  }

  function submitSentence(sentence: string) {
    cancelSpeech();
    if (realtimeStatus === "connected" && realtimeRef.current) {
      realtimeRef.current.interrupt();
      if (realtimeRef.current.sendText(sentence)) {
        setAnalysis(null);
        setAnalysisSource("manual");
        setRealtimeReply("");
      } else {
        setManualText(sentence);
        setErrorMessage("Aguarde o professor terminar para enviar a mensagem.");
      }
      return;
    }

    void analyzeSentence(sentence);
  }

  function handleSuggestionClick(suggestion: string) {
    if (voiceState === "analyzing") return;
    submitSentence(suggestion);
    mainInputRef.current?.focus();
  }

  function handleAvatarMicClick() {
    if (isConnectingRef.current) return;
    setErrorMessage("");
    if (realtimeStatus === "connected" && realtimeRef.current) {
      const enabled = !microphoneEnabled;
      realtimeRef.current.setMicrophoneEnabled(enabled);
      setMicrophoneEnabled(enabled);
      if (enabled) {
        setIsCharacterAwake(true);
        setVoiceState("listening");
      } else {
        setVoiceState("idle");
      }
      return;
    }
    void connectSession();
  }

  function finishRealtimeTurn() {
    realtimeRef.current?.finishTurn();
  }

  function resetTrainingContext() {
    cancelSpeech();
    setAnalysis(null);
    setAnalysisSource("manual");
    setRealtimeReply("");
    setTranscript("");
    setVoiceState("idle");
    introSpokenRef.current = false;
  }

  function clearConversationHistory() {
    resetTrainingContext();
    setContextHistory([]);
    setOpeningIndex(getNextOpeningIndex());
  }

  const handleAdvanceToNextModule = useCallback(() => {
    if (nextModule) {
      handleSelectModule(nextModule.id);
    } else {
      setIsSelectingModule(true);
    }
  }, [nextModule, handleSelectModule]);

  const handleRedoModule = useCallback(() => {
    currentConceptIndexRef.current = 0;
    currentLessonStepIndexRef.current = 0;
    setCurrentConceptIndex(0);
    setCurrentLessonStepIndex(0);
    setIsLessonCompleted(false);
    setIsCharacterAwake(false);
    hasUserAttemptedPhaseRef.current = false;
    setModuleTurnsCount(0);
    clearConversationHistory();
  }, [clearConversationHistory]);

  function speakCorrection() {
    if (!analysis) return;
    speak(analysis.corrected_sentence, "waiting_for_repeat", "en-US");
  }

  if (isPracticeIntro && !isPopupMode) {
    return (
      <AppShell isAdmin={isAdmin}>
        <PracticeStartScreen
          userName={studentProfile?.nickname?.replace(/\s*\(admin\)/i, "").trim()}
          moduleTitle={activeModule.cleanTitle || activeModule.title.replace(/^\d+\.\s*/, "")}
          moduleBadge={activeModule.levelBadge}
          crazyLevel={crazyLevel}
          emotion={emotion}
          voiceState={voiceState}
          onStart={() => {
            setIsPracticeIntro(false);
            setIsSelectingModule(false);
          }}
          onOpenMap={() => {
            setIsPracticeIntro(false);
            setIsSelectingModule(true);
          }}
        />
      </AppShell>
    );
  }

  if (isSelectingModule && !isPopupMode) {
    return (
      <AppShell isAdmin={isAdmin}>
        <main className="practice-main map-desktop-expanded-view">
          <ModuleSelector
            activeModuleId={selectedModuleId}
            onSelectModule={handleSelectModule}
            onClose={() => setIsSelectingModule(false)}
            userName={studentProfile?.nickname?.replace(/\s*\(admin\)/i, "").trim() || "Aluno"}
            streakDays={7}
            xp={xp}
          />
        </main>
      </AppShell>
    );
  }

  if (isPopupMode) {
    return (
      <main className="standalone-popup-window">
        {/* Marca d'água do Mr. Crazy de fundo */}
        <div className="popup-watermark-character" aria-hidden="true">
          <RpgCharacter
            crazyLevel={crazyLevel}
            emotion={emotion}
            voiceState={voiceState}
            gesture={activeGesture}
            isAwake={isCharacterAwake}
            onAwaken={() => setIsCharacterAwake(true)}
            onTap={handleAvatarTap}
          />
        </div>

        {/* Header compacto da janela popup */}
        <header className="popup-compact-header">
          <div className="popup-module-tag">
            <span className="popup-badge">{activeModule.levelBadge.split(" ")[0]}</span>
            <span className="popup-title">{activeModule.cleanTitle || activeModule.title}</span>
          </div>
          <div className="popup-header-actions">
            <button
              type="button"
              className="popup-header-btn"
              onClick={() => {
                if (typeof window !== "undefined") window.close();
              }}
              title="Fechar janela popup"
              aria-label="Fechar"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        {/* Diálogo da conversa focado puramente nos textos */}
        <div ref={conversationContainerRef} className="popup-dialogue-feed">
          {allConversationItems.length === 0 ? (
            <div className="popup-empty-hint">
              <p>{openingLine}</p>
            </div>
          ) : (
            allConversationItems.map((item) => (
              <ConversationBubble
                key={`popup-${item.key}`}
                label={item.role === "user" ? "Você" : "Mr.Crazy"}
                tone={item.role === "user" ? "user" : "crazy"}
                isTyping={item.isTyping}
                fadeLevel={0}
                isOlderHidden={false}
                onSpeak={
                  item.role === "crazy" && !item.isTyping
                    ? () => speak(item.text, "idle")
                    : undefined
                }
                isSpeaking={
                  item.role === "crazy" &&
                  currentlySpeakingText === item.text &&
                  voiceState === "speaking"
                }
              >
                {item.text}
              </ConversationBubble>
            ))
          )}
          <div ref={messagesEndRef} className="messages-bottom-anchor" />
        </div>

        {/* Rodapé: Equalizador de barras na fala + Botão de mic + Input de digitação */}
        <footer className="popup-compact-footer">
          <div className="popup-wave-row">
            <ListeningWave
              active={
                voiceState === "listening" ||
                voiceState === "speaking" ||
                voiceState === "transcribing" ||
                voiceState === "analyzing"
              }
              speaking={voiceState === "speaking"}
              isAwake={isCharacterAwake}
            />
          </div>

          <div className="popup-controls-row">
            <button
              type="button"
              className={`popup-mic-toggle-btn ${microphoneEnabled ? "is-active" : "is-muted"}`}
              onClick={handleAvatarMicClick}
              title={microphoneEnabled ? "Mutar microfone (mantém conexão ativa)" : "Ativar microfone"}
            >
              {microphoneEnabled ? <Volume2 size={16} /> : <X size={16} />}
              <span>{microphoneEnabled ? "Ouvindo" : "Mutado"}</span>
            </button>

            <form
              className="popup-text-input-form"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                handleSubmit(e);
              }}
            >
              <input
                ref={mainInputRef}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Fale no microfone ou digite..."
                aria-label="Mensagem para o Mr. Crazy"
                disabled={voiceState === "analyzing"}
              />
              <button
                type="submit"
                disabled={!manualText.trim() || voiceState === "analyzing"}
                title="Enviar frase"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </footer>

        {/* Notificação flutuante de avanço automático de fase (caso passe de fase enquanto no popup) */}
        {stageTransition && (
          <div className="stage-advance-countdown-card is-in-popup" role="dialog" aria-label="Avanço de Fase">
            <div className="stage-advance-card-content">
              <div className="stage-advance-badge-row">
                <span className="stage-score-badge">
                  🎉 Dominou! Nota {(stageTransition.score / 10).toFixed(1)}/10
                </span>
                <span className="stage-timer-badge">
                  {stageTransition.countdown}s
                </span>
              </div>
              <h4 className="stage-next-title">
                🚀 Próxima Fase: {stageTransition.nextModule.cleanTitle || stageTransition.nextModule.title}
              </h4>
              <p className="stage-next-training">
                <strong>Treino:</strong> {stageTransition.targetConcept?.objective || stageTransition.nextModule.description}
              </p>
              <button
                type="button"
                className="stage-start-now-btn"
                onClick={handleImmediateStartNextStage}
              >
                <Rocket size={14} />
                <span>Começar Agora ({stageTransition.countdown}s)</span>
              </button>
              <div className="stage-countdown-progress-bar">
                <div
                  className="stage-countdown-progress-fill"
                  style={{ width: `${(stageTransition.countdown / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
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

        <header className="practice-header-bar">
          <div className="practice-header-nav-row">
            {/* LADO ESQUERDO: Seletor de Módulo */}
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

            {/* CENTRO: Medidor de Puticidade + XP */}
            <div className="practice-header-stats-group">
              <SessionHeader crazyLevel={crazyLevel} emotion={emotion} xp={xp} level={`${activeLevel.badge} ${activeLevel.label}`} />
            </div>

            {/* LADO DIREITO: Histórico, Prova e Menu */}
            <div className="practice-header-actions-group">
              <button
                type="button"
                className={`header-icon-action-btn ${isHistoryExpanded ? "is-active" : ""}`}
                onClick={() => setIsHistoryExpanded((prev) => !prev)}
                title={isHistoryExpanded ? "Ocultar histórico" : "Ver conversa completa"}
                aria-label="Alternar histórico da conversa"
              >
                <MessagesSquare size={16} />
                {allConversationItems.length > 0 && (
                  <span className="header-icon-count-badge">{allConversationItems.length}</span>
                )}
              </button>

              <button
                type="button"
                className="stage-exam-action-btn"
                onClick={() => setIsExamModalOpen(true)}
                title={`Fazer a prova do módulo 100% em inglês com o avatar ${activeModule.examNpc.name}`}
              >
                <Award size={13} />
                <span>Prova</span>
              </button>

              <button
                type="button"
                className={`pip-btn desktop-only-btn ${isPipActive ? "active" : ""}`}
                onClick={handleTogglePiP}
                aria-label="Ativar Modo Pop-up Flutuante"
                title="Pop-up Flutuante"
              >
                <PictureInPicture2 size={18} />
                {isPipActive && <span className="pip-badge-active" />}
              </button>

              <button
                type="button"
                className="hamburger-btn"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Abrir menu de configurações e digitação"
                title="Opções de nível, tema e digitação"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Stepper e Progresso de Fases Compacto */}
        {teachingConcepts.length > 0 && (() => {
          const totalPhases = teachingConcepts.length;
          const currentPhaseNum = Math.min(currentConceptIndex + 1, totalPhases);
          const remainingPhases = Math.max(0, totalPhases - currentPhaseNum);
          const activeConcept = teachingConcepts[currentConceptIndex];

          return (
            <div className="teaching-concept-wrapper">
              <div className="teaching-concept-pill-bar">
                <div className="teaching-concept-badge">
                  <span className="concept-step-number">
                    Fase {currentPhaseNum}/{totalPhases}
                  </span>
                  <span className="concept-remaining-pill">
                    {remainingPhases === 0
                      ? "👑 Última Fase!"
                      : remainingPhases === 1
                      ? "Falta 1 fase para a prova"
                      : `Faltam ${remainingPhases} fases`}
                  </span>
                  <span className="concept-step-title">
                    {activeConcept?.title || activeModule.title}
                  </span>
                  <span className="concept-remaining-pill">
                    Etapa {currentLessonStepIndex + 1}/{LESSON_STEPS_PER_PHASE}: {LESSON_STEP_LABELS[currentLessonStepIndex]}
                  </span>
                </div>

                {/* Stepper visual com progresso das fases e a prova prática */}
                <div className="module-phase-stepper-track" aria-label="Progresso das fases do módulo">
                  {teachingConcepts.map((concept, idx) => {
                    const isPassed = idx < currentConceptIndex;
                    const isCurrent = idx === currentConceptIndex;
                    return (
                      <button
                        key={concept.id || idx}
                        type="button"
                        className={`phase-stepper-step ${isPassed ? "is-passed" : ""} ${isCurrent ? "is-current" : ""}`}
                        title={`Fase ${idx + 1}: ${concept.title}`}
                        aria-label={`Fase ${idx + 1}: ${concept.title}`}
                        aria-current={isCurrent ? "step" : undefined}
                        disabled={!isCurrent}
                      >
                        <div className="phase-stepper-bar-fill" />
                        <span className="phase-stepper-label">
                          {isPassed ? "✔" : `F${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className={`phase-stepper-step phase-stepper-boss ${currentConceptIndex >= totalPhases - 1 ? "is-boss-ready" : ""}`}
                    title="Prova prática do módulo"
                    disabled={!isLessonCompleted && !isModuleCompleted}
                    onClick={() => setIsExamModalOpen(true)}
                  >
                    <div className="phase-stepper-bar-fill" />
                    <span className="phase-stepper-label">
                      <Award size={10} /> Prova
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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

        <section className={`practice-stage clean-stage ${isHistoryExpanded ? "history-is-open" : "history-is-closed"}`}>
          <motion.div
            className="character-column"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Link href="/conversation" className="conversation-beta-launch">
              <Sparkles size={13} />
              <span>Conversa beta</span>
            </Link>

            {/* Balão de Fala do Mr. Crazy: com replay de voz e guia fonético integrado */}
            <div
              ref={speechBubbleScrollRef}
              className={`character-speech-bubble-container ${voiceState === "speaking" ? "is-speaking" : ""} ${speechBubbleHasOverflow ? "has-overflow" : ""} ${speechBubbleIsScrolled ? "is-scrolled" : ""}`}
              role="region"
              aria-label="Fala do Mr. Crazy"
              onScroll={(event) => setSpeechBubbleIsScrolled(event.currentTarget.scrollTop > 8)}
            >
              <div className="character-speech-bubble">
                <div className="speech-bubble-header">
                  <div className="speech-bubble-speaker-info">
                    <span className="speech-bubble-name">Mr.Crazy</span>
                    {voiceState === "speaking" ? (
                      <span className="speech-bubble-live-badge">Falando...</span>
                    ) : (
                      <span className="speech-bubble-tutor-badge">Tutor</span>
                    )}
                  </div>
                  {/* Botão de Repetir Fala do Mr. Crazy */}
                  <button
                    type="button"
                    className="speech-bubble-audio-btn"
                    onClick={() => speak(latestCrazySpeech, "idle")}
                    title="Ouvir fala do professor novamente"
                  >
                    <Volume2 size={13} />
                    <span>Ouvir</span>
                  </button>
                </div>

                <p className="speech-bubble-text">{latestCrazySpeech}</p>

                {/* Guia Didático Integrado de Pronúncia da Fase Ativa */}
                {shouldShowStudyGuide && teachingTarget && (
                  <div className="speech-bubble-didactic-footer">
                    <dl className="speech-study-guide">
                      <div className="speech-study-target">
                        <dt>Fale em inglês</dt>
                        <dd lang="en">{teachingTarget.phraseEn}</dd>
                      </div>
                      <div>
                        <dt>Significado</dt>
                        <dd>{teachingTarget.meaningPt}</dd>
                      </div>
                      <div>
                        <dt>Pronúncia aproximada</dt>
                        <dd>{teachingTarget.phoneticPt}</dd>
                      </div>
                    </dl>
                    {teachingTarget.phraseEn && (
                      <button
                        type="button"
                        className="speech-target-audio-btn"
                        onClick={() => {
                          const phrase = teachingTarget.phraseEn;
                          if (phrase) speak(phrase, "idle", "en-US");
                        }}
                        title="Ouvir pronúncia exata em inglês"
                      >
                        <Volume2 size={12} />
                        <span>Ouvir Frase</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Feedback em Tempo Real da Fala do Aluno (Live Transcript & Análise) */}
            {(transcript || (voiceState === "analyzing" && latestUserSpeech) || (voiceState === "listening" && latestUserSpeech)) && (
              <div className={`user-live-transcript-badge ${voiceState === "analyzing" ? "is-analyzing" : "is-live"}`}>
                <span className="user-live-transcript-dot" />
                <span className="user-live-transcript-label">
                  {voiceState === "analyzing" ? "Você falou: " : "Ouvindo você: "}
                </span>
                <span className="user-live-transcript-text">
                  "{transcript || latestUserSpeech}"
                </span>
                {voiceState === "analyzing" && (
                  <span className="user-live-analyzing-spinner">⚡ Analisando...</span>
                )}
              </div>
            )}

            <div className="character-avatar-wrapper">
              <RpgCharacter
                crazyLevel={crazyLevel}
                emotion={emotion}
                voiceState={voiceState}
                gesture={activeGesture}
                // No front principal, o professor precisa estar visível antes da primeira fala.
                // A cena da rede fica reservada para a tela de entrada/interação inicial.
                isAwake={isCharacterAwake || (!isPracticeIntro && !isSelectingModule)}
                onAwaken={() => setIsCharacterAwake(true)}
                onTap={handleAvatarTap}
              />
            </div>

            {/* Hub de Voz Central: Barrinhas de Áudio Responsivas + Botão de Microfone Animado */}
            <div className="practice-voice-hub">
              {/* Formulário de Digitação Rápida (quando ativado pelo botão de teclado) */}
              {isQuickInputOpen && (
                <form
                  className="quick-inline-text-form"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    handleSubmit(e);
                    setIsQuickInputOpen(false);
                  }}
                >
                  <input
                    ref={mainInputRef}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Digite em inglês ou português..."
                    autoFocus
                    disabled={voiceState === "analyzing"}
                  />
                  <button type="submit" disabled={!manualText.trim() || voiceState === "analyzing"} title="Enviar frase">
                    <Send size={14} />
                  </button>
                  <button type="button" onClick={() => setIsQuickInputOpen(false)} title="Fechar digitação">
                    <X size={14} />
                  </button>
                </form>
              )}

              <VoiceInputControl
                status={realtimeStatus}
                enabled={microphoneEnabled}
                speaking={voiceState === "speaking" || voiceState === "preparing_speech"}
                talkMode={talkMode}
                onTalkModeChange={handleTalkModeChange}
                onHoldStart={handleHoldStart}
                onHoldEnd={handleHoldEnd}
                onHoldCancel={handleHoldCancel}
                error={errorMessage}
                diagnostics={voiceDiagnostics}
                meterRef={inputMeterRef}
                audioMetricsRef={audioMetricsRef}
                deviceId={inputDeviceId}
                isAwake={isCharacterAwake}
                onToggle={handleAvatarMicClick}
                onReconnect={() => void connectSession()}
                onDeviceChange={(id) => {
                  inputDeviceRef.current = id;
                  setInputDeviceId(id);
                  if (realtimeStatus === "connected") void connectSession();
                }}
              />

              {/* Linha de Ações Auxiliares: Digitar e Histórico */}
              <div className="voice-dock-actions-row">
                <button
                  type="button"
                  className={`dock-action-pill-btn ${isQuickInputOpen ? "is-active" : ""}`}
                  onClick={() => setIsQuickInputOpen((prev) => !prev)}
                  title={isQuickInputOpen ? "Fechar teclado" : "Digitar por texto"}
                >
                  <Keyboard size={13} />
                  <span>{isQuickInputOpen ? "Fechar Teclado" : "Digitar"}</span>
                </button>
                <button
                  type="button"
                  className={`dock-action-pill-btn ${isHistoryExpanded ? "is-active" : ""}`}
                  onClick={() => setIsHistoryExpanded((prev) => !prev)}
                  title={isHistoryExpanded ? "Ocultar histórico" : "Ver conversa completa"}
                >
                  <MessagesSquare size={13} />
                  <span>
                    {isHistoryExpanded
                      ? "Ocultar Histórico"
                      : `Histórico (${allConversationItems.length})`}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Histórico da Conversa: renderizado quando expandido */}
          {isHistoryExpanded && (
            <motion.aside
              ref={conversationContainerRef}
              className="conversation-panel clean-conversation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="history-panel-header">
                <span className="history-panel-title">Histórico da Conversa</span>
                <button
                  type="button"
                  className="history-close-btn"
                  onClick={() => setIsHistoryExpanded(false)}
                  title="Fechar histórico e voltar ao balão"
                  aria-label="Fechar histórico"
                >
                  <X size={16} />
                </button>
              </div>

              {allConversationItems.map((item) => (
                <ConversationBubble
                  key={item.key}
                  label={item.role === "user" ? "Você" : "Mr.Crazy"}
                  tone={item.role === "user" ? "user" : "crazy"}
                  isTyping={item.isTyping}
                  fadeLevel={0}
                  isOlderHidden={false}
                  onSpeak={
                    item.role === "crazy" && !item.isTyping
                      ? () => speak(item.text, "idle")
                      : undefined
                  }
                  isSpeaking={
                    item.role === "crazy" &&
                    currentlySpeakingText === item.text &&
                    voiceState === "speaking"
                  }
                >
                  {item.text}
                </ConversationBubble>
              ))}

              {isLessonCompleted ? (
                <div className="lesson-completed-card" role="region" aria-label="Aula Concluída">
                  <div className="lesson-completed-header">
                    <Sparkles size={20} className="text-amber-400" />
                    <div>
                      <h4>🎉 Fases do Módulo Concluídas!</h4>
                      <p>
                        Você dominou todas as fases de treinamento de{" "}
                        <strong>{activeModule.cleanTitle || activeModule.title}</strong>!
                      </p>
                    </div>
                  </div>
                  <div className="lesson-completed-actions">
                    <button
                      type="button"
                      className="lesson-btn-exam highlight-exam"
                      onClick={() => setIsExamModalOpen(true)}
                    >
                      <Award size={18} />
                      <span>🏆 Fazer a prova prática</span>
                    </button>
                    {nextModule ? (
                      <button
                        type="button"
                        className="lesson-btn-advance"
                        onClick={handleAdvanceToNextModule}
                      >
                        <Rocket size={16} />
                        <span>Ir para Próximo Módulo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="lesson-btn-advance"
                        onClick={() => setIsSelectingModule(true)}
                      >
                        <Sparkles size={16} />
                        <span>Ver Mapa do Curso</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="lesson-btn-redo"
                      onClick={handleRedoModule}
                    >
                      <RotateCcw size={16} />
                      <span>Refazer Aula</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {speechRetry ? (
                <div className="action-row">
                  <button
                    className="ghost-action"
                    type="button"
                    onClick={() => speakSegments(speechRetry.segments, speechRetry.nextState)}
                  >
                    <Volume2 size={18} />
                    Ouvir Mr.Crazy
                  </button>
                </div>
              ) : null}
              <div ref={messagesEndRef} className="messages-bottom-anchor" />
            </motion.aside>
          )}
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
            setIsModuleCompleted(true);
          }}
          onNextModule={(nextModId) => {
            setIsExamModalOpen(false);
            handleSelectModule(nextModId);
            const nextMod = getModuleById(nextModId);
            triggerGesture("thumbsup");
            speak(`Você passou na prova prática e avançou para a etapa ${nextMod.cleanTitle || nextMod.title}!`);
          }}
          onRedoModule={() => {
            setIsExamModalOpen(false);
            setCurrentEvaluation(null);
            handleRedoModule();
          }}
        />

        {stageTransition && (
          <div className="stage-advance-countdown-card" role="dialog" aria-label="Avanço de Fase">
            <div className="stage-advance-card-content">
              <div className="stage-advance-badge-row">
                <span className="stage-score-badge">
                  🎉 Dominou a Fase! Nota {(stageTransition.score / 10).toFixed(1)}/10
                </span>
                <span className="stage-timer-badge">
                  Iniciando em {stageTransition.countdown}s
                </span>
              </div>

              <h3 className="stage-next-title">
                🚀 Próxima Fase: {stageTransition.nextModule.cleanTitle || stageTransition.nextModule.title}
              </h3>

              <p className="stage-next-training">
                <strong>O que vamos treinar:</strong>{" "}
                {stageTransition.targetConcept?.objective || stageTransition.nextModule.description}
              </p>

              {stageTransition.targetConcept?.phrase && (
                <div className="stage-next-phrase-preview">
                  <span>Frase para praticar:</span>
                  <strong>&ldquo;{stageTransition.targetConcept.phrase}&rdquo;</strong>
                </div>
              )}

              <div className="stage-advance-actions-row">
                <button
                  type="button"
                  className="stage-start-now-btn"
                  onClick={handleImmediateStartNextStage}
                >
                  <Rocket size={16} />
                  <span>Começar Agora ({stageTransition.countdown}s)</span>
                </button>
              </div>

              <div className="stage-countdown-progress-bar">
                <div
                  className="stage-countdown-progress-fill"
                  style={{ width: `${(stageTransition.countdown / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
