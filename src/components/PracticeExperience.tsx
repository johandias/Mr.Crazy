"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
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
import { VoiceInputControl } from "@/components/VoiceInputControl";
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
  const [realtimeReply, setRealtimeReply] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionStatus>("idle");
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
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

  const triggerGesture = useCallback((gesture: CharacterGesture) => {
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    setActiveGesture(gesture);
    gestureTimeoutRef.current = setTimeout(() => {
      setActiveGesture("idle");
    }, 3800);
  }, []);

  const handleAvatarTap = useCallback(() => {
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
  const teachingConcepts = useMemo(
    () => (activeModule?.concepts ? activeModule.concepts.filter((c) => !c.isExam) : []),
    [activeModule]
  );
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
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

  const handleSelectModule = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
    setStoredModuleId(moduleId);
    scoringContextRef.current.selectedModuleId = moduleId;
    try {
      window.sessionStorage.setItem("mr-crazy-module-entered", "true");
    } catch {}
    setModuleTurnsCount(0);
    setCurrentConceptIndex(0);
    setIsLessonCompleted(false);
    setCurrentEvaluation(null);
    setIsSelectingModule(false);

    if (moduleId === "free-conversation") {
      setSelectedMode("free-conversation");
      scoringContextRef.current.selectedMode = "free-conversation";
    }

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

      if (teachingConcepts.length > 0) {
        setCurrentConceptIndex((curr) => {
          const shouldAdvance = result.correct || nextTurns >= (curr + 1) * 2;
          if (shouldAdvance) {
            if (curr < teachingConcepts.length - 1) {
              return curr + 1;
            }
            setIsLessonCompleted(true);
            return curr;
          }
          return curr;
        });
      }

      return nextTurns;
    });
  }, [teachingConcepts]);

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
    setMicrophoneEnabled(false);
    setVoiceDiagnostics([]);
    setErrorMessage("");
    setVoiceState("preparing_speech");
    setAnalysisSource("manual");

    const level = scoringContextRef.current.selectedLevel;
    const mode = scoringContextRef.current.selectedMode;
    const moduleId = scoringContextRef.current.selectedModuleId || selectedModuleId;

    return connectRealtime({
      level,
      mode,
      moduleId,
      signal: abortController.signal,
      deviceId: inputDeviceRef.current,
      onInputLevel: (level) => {
        if (connectAbortRef.current === abortController && inputMeterRef.current) inputMeterRef.current.value = level;
      },
      onDiagnostic: (event) => {
        if (connectAbortRef.current === abortController && !abortController.signal.aborted) {
          setVoiceDiagnostics(current => [...current.slice(-29), event]);
        }
      },
      getRecentContext: () =>
        (scoringContextRef.current.contextHistory.length ? scoringContextRef.current.contextHistory : [{ role: "crazy", text: openingLine }]).slice(-6).map((turn) => ({
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
        }
      },
      onAssistantTranscript: (text, complete) => {
        if (connectAbortRef.current !== abortController || abortController.signal.aborted) return;
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
          // Disparo automático de gestos e avaliação estrita de fase
          const lower = clean.toLowerCase();
          const isPraise = /(boa|muito bom|parabéns|mandou bem|show|perfeito|excelente|ótimo|certinho|destravou|dominou|fase concluída|próxima fase|fase seguinte|mandou bala)/i.test(lower);
          const isCorrection = /(quase|atenção|cuidado|ajuste|língua|dente|errou|errado|ops|cacete|caramba|pqp|esguicho|acorda|tente|repete|de novo|mais uma vez)/i.test(lower);

          if (isPraise && !isCorrection) {
            triggerGesture(Math.random() > 0.5 ? "thumbsup" : "heart");
            // O aluno só passa de fase quando o Mr. Crazy avaliar que ele realmente está bem
            if (teachingConcepts.length > 0) {
              setCurrentConceptIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= teachingConcepts.length) {
                  setIsLessonCompleted(true);
                  return Math.max(0, teachingConcepts.length - 1);
                }
                return nextIndex;
              });
            }
          } else if (isCorrection) {
            const options: CharacterGesture[] = ["watergun", "smoke", "finger"];
            triggerGesture(options[Math.floor(Math.random() * options.length)]);
            // Se errou ou precisa de ajuste, mantém o aluno na fase atual para dominar
          }

          setModuleTurnsCount((prev) => prev + 1);
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
      setMicrophoneEnabled(true);
      setVoiceState("listening");
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
    setCurrentConceptIndex(0);
    setIsLessonCompleted(false);
    setModuleTurnsCount(0);
    clearConversationHistory();
  }, [clearConversationHistory]);

  function speakCorrection() {
    if (!analysis) return;
    speak(analysis.corrected_sentence, "waiting_for_repeat", "en-US");
  }

  if (isSelectingModule) {
    return (
      <AppShell isAdmin={isAdmin}>
        <main className="practice-main map-desktop-expanded-view">
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
          <div className="practice-header-nav-row">
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
            <div className="practice-header-actions-group">
              <button
                type="button"
                className="stage-exam-action-btn"
                onClick={() => setIsExamModalOpen(true)}
                title={`Fazer a prova do módulo 100% em inglês com o avatar ${activeModule.examNpc.name}`}
              >
                <Award size={14} />
                <span>Prova</span>
              </button>
              <button
                type="button"
                className="module-evaluate-action-btn desktop-only-btn"
                onClick={handleEvaluateModule}
                disabled={isEvaluating}
                title="Concluir este módulo e receber sua avaliação do Mr. Crazy"
              >
                <Award size={14} />
                <span>{isEvaluating ? "Avaliando..." : "Avaliar"}</span>
              </button>
              <div className="header-actions-group">
                <button
                  type="button"
                  className={`pip-btn desktop-only-btn ${isPipActive ? "active" : ""}`}
                  onClick={handleTogglePiP}
                  aria-label="Ativar Modo Pop-up Flutuante"
                  title="Pop-up Flutuante"
                >
                  <PictureInPicture2 size={20} />
                  {isPipActive && <span className="pip-badge-active" />}
                </button>
                <button
                  type="button"
                  className="pip-btn pip-standalone-btn desktop-only-btn"
                  onClick={handleOpenStandalonePopup}
                  aria-label="Abrir em Janela Pop-up Pequena"
                  title="Abrir em Janela Pop-up separada"
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
                  <Menu size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="practice-header-stats-row">
            <SessionHeader crazyLevel={crazyLevel} emotion={emotion} xp={xp} level={`${activeLevel.badge} ${activeLevel.label}`} />
          </div>
        </div>

        {teachingConcepts.length > 0 && (
          <div className="teaching-concept-pill-bar">
            <div className="teaching-concept-badge">
              <span className="concept-step-number">
                Tópico {Math.min(currentConceptIndex + 1, teachingConcepts.length)}/{teachingConcepts.length}
              </span>
              <span className="concept-step-title">
                {teachingConcepts[currentConceptIndex]?.title || activeModule.title}
              </span>
            </div>
            {isLessonCompleted ? (
              <span className="concept-completed-pill">Aula Concluída ✔</span>
            ) : (
              <span className="concept-objective-hint">
                {teachingConcepts[currentConceptIndex]?.objective}
              </span>
            )}
          </div>
        )}

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

            <VoiceInputControl
              status={realtimeStatus}
              enabled={microphoneEnabled}
              error={errorMessage}
              diagnostics={voiceDiagnostics}
              meterRef={inputMeterRef}
              deviceId={inputDeviceId}
              onToggle={handleAvatarMicClick}
              onReconnect={() => void connectSession()}
              onDeviceChange={(id) => {
                inputDeviceRef.current = id;
                setInputDeviceId(id);
                if (realtimeStatus === "connected") void connectSession();
              }}
            />

            {/* Sugestões rápidas de resposta para destravar a conversa */}
            {suggestedReplies.length > 0 && (
              <div className="chat-suggestions-bar" aria-label="Sugestões de resposta rápida">
                <div className="suggestions-chips-row">
                  {suggestedReplies.map((reply, idx) => (
                    <button
                      key={`sug-${idx}-${reply}`}
                      type="button"
                      className="suggestion-chip-btn"
                      disabled={voiceState === "analyzing"}
                      onClick={() => handleSuggestionClick(reply)}
                      title={`Enviar frase: "${reply}"`}
                    >
                      <Sparkles size={11} className="chip-icon" />
                      <span>{reply}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Digitação rápida para não travar o aluno se o microfone falhar */}
            <form
              className="quick-text-input-bar"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                handleSubmit(e);
              }}
            >
              <input
                ref={mainInputRef}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={
                  voiceState === "analyzing"
                    ? "Mr.Crazy está analisando..."
                    : "Digite em inglês ou português..."
                }
                aria-label="Mensagem para o professor"
                disabled={voiceState === "analyzing"}
              />
              <button
                type="submit"
                disabled={!manualText.trim() || voiceState === "analyzing"}
                title="Enviar frase"
              >
                <Send size={15} />
              </button>
            </form>
            <ListeningWave active={voiceState === "listening" || voiceState === "speaking" || voiceState === "transcribing" || voiceState === "analyzing"} />
          </motion.div>

          <motion.aside
            ref={conversationContainerRef}
            className="conversation-panel clean-conversation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
          >
            {allConversationItems.length > 3 && (
              <button
                type="button"
                className="history-visibility-toggle"
                onClick={() => setShowAllMessages((prev) => !prev)}
                title={showAllMessages ? "Ocultar mensagens anteriores" : "Mostrar mensagens anteriores"}
              >
                {showAllMessages
                  ? "↓ Focar nas 3 últimas mensagens"
                  : `↑ Ver mensagens anteriores (${allConversationItems.length - 3})`}
              </button>
            )}

            {allConversationItems.map((item, idx) => {
              const distanceFromEnd = allConversationItems.length - 1 - idx;
              const fadeLevel = showAllMessages
                ? 0
                : distanceFromEnd === 0
                ? 0
                : distanceFromEnd === 1
                ? 0
                : distanceFromEnd === 2
                ? 1
                : 2;
              const isOlderHidden = !showAllMessages && distanceFromEnd >= 3;

              return (
                <ConversationBubble
                  key={item.key}
                  label={item.role === "user" ? "Você" : "Mr.Crazy"}
                  tone={item.role === "user" ? "user" : "crazy"}
                  isTyping={item.isTyping}
                  fadeLevel={fadeLevel}
                  isOlderHidden={isOlderHidden}
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
              );
            })}

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
                    <span>🏆 Enfrentar o Chefão (Prova da Fase)</span>
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
                    <span>Refazer Treinamento</span>
                  </button>
                </div>
              </div>
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
