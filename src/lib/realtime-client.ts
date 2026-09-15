import type { LearningLevel, VoiceState } from "@/lib/mr-crazy";

type RealtimeServerEvent = {
  type?: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  text?: string;
  error?: { message?: string };
  item?: {
    id?: string;
    type?: string;
    role?: string;
    content?: Array<{
      type?: string;
      text?: string;
      transcript?: string;
    }>;
  };
  response?: {
    id?: string;
    status?: string;
    status_details?: { error?: { message?: string } };
    output?: Array<{
      type?: string;
      role?: string;
      content?: Array<{
        type?: string;
        text?: string;
        transcript?: string;
      }>;
    }>;
  };
};

export type RealtimeConnectionStatus = "idle" | "connecting" | "connected" | "failed";

export type RealtimeController = {
  disconnect: () => void;
  finishTurn: () => void;
  sendText: (text: string) => boolean;
  setMicrophoneEnabled: (enabled: boolean) => void;
  interrupt: () => void;
};

type ConnectRealtimeOptions = {
  level: LearningLevel;
  mode: string;
  moduleId?: string;
  signal?: AbortSignal;
  getRecentContext?: () => { role: string; text: string }[];
  onStatus: (status: RealtimeConnectionStatus) => void;
  onVoiceState: (state: VoiceState) => void;
  onUserTranscript: (text: string, complete: boolean) => void;
  onAssistantTranscript: (text: string, complete: boolean) => void;
  onError: (message: string) => void;
};

function buildInitialResponse(level: LearningLevel, mode: string) {
  if (mode === "free-conversation") {
    const basicHelp = level === "basic"
      ? "Pergunte o que ele quer aprender hoje e ofereça ajuda com uma frase curta quando ele escolher a situação."
      : "Pergunte o que ele quer aprender hoje e deixe o assunto nascer antes de puxar inglês.";

    return `Inicie a sessão agora com no máximo duas frases curtas em português e pare. É conversa livre: pergunte o que o usuário quer aprender hoje ou se quer conversar livre, sem listar opções demais. ${basicHelp}`;
  }

  return "Inicie a sessão agora. Pergunte em português o que o usuário quer aprender hoje, diga em poucas palavras o foco do treino escolhido e termine com uma pergunta em inglês adequada ao nível. Não espere o usuário falar primeiro.";
}

function isGreetingOrCasualStart(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/[.,!?;:()]/g, "");
  if (!t) return false;
  const greetings = [
    "oi", "olá", "ola", "e aí", "e ai", "opa", "fala", "fala aí", "fala ai",
    "fala mr crazy", "fala mister crazy", "oi mr crazy", "oi mister crazy",
    "ola mr crazy", "salve", "hey", "hello", "hi", "bom dia", "boa tarde",
    "boa noite", "tudo bem", "tudo bom", "como vai", "beleza", "tranquilo",
    "como você tá", "como voce ta", "como cê tá", "como ce ta", "tudo certo",
    "e aí mr crazy", "e ai mr crazy", "eae", "opa mr crazy"
  ];
  if (greetings.includes(t)) return true;
  const words = t.split(/\s+/);
  if (words.length <= 5) {
    const firstTwo = words.slice(0, 2).join(" ");
    if (greetings.includes(words[0]) || greetings.includes(firstTwo)) return true;
  }
  return false;
}

function buildTranscriptBoundResponse(
  transcript: string,
  recentTurns: { role: string; text: string }[] = []
) {
  const cleanTranscript = transcript.trim();
  if (!cleanTranscript) {
    return "O último áudio não gerou transcrição nítida. Peça em uma única frase curta em português do Brasil para o usuário repetir.";
  }

  const isGreeting = isGreetingOrCasualStart(cleanTranscript);

  const contextSection =
    recentTurns.length > 0
      ? `
CONTEXTO DA CONVERSA NESTA INSTÂNCIA ATUAL (MEMÓRIA TEMPORÁRIA DA SESSÃO):
CONTEXTO DA CONVERSA NESTA INSTÂNCIA ATUAL (MEMÓRIA TEMPORÁRIA DA SESSÃO - ÚLTIMAS 2 MENSAGENS):
${recentTurns
  .slice(-6)
  .slice(-2)
  .map(
    (turn) =>
      `- ${turn.role === "user" ? "Aluno" : "Mr.Crazy (você)"}: "${turn.text}"`
  )
  .join("\n")}`
      : "";

  let dynamicDirective = "";
  if (isGreeting) {
    dynamicDirective = `
DIRETRIZ CRÍTICA DE CUMPRIMENTO:
- O aluno acabou de te cumprimentar ou iniciar o contato: "${cleanTranscript}".
- ATENÇÃO: ISSO NÃO É UM EXERCÍCIO DE INGLÊS. NUNCA diga "você acertou", "muito bom", "parabéns" nem avalie pronúncia aqui!
- CUMPRIMENTE DE VOLTA com calor humano, amizade e energia em PORTUGUÊS DO BRASIL (ex: "E aí! Tudo ótimo por aqui, e com você? Bora treinar inglês ou quer bater um papo primeiro?").
- Mantenha a conversa livre, espontânea e acolhedora.`;
  } else {
    dynamicDirective = `
DIRETRIZ DE CONTINUIDADE DO DIÁLOGO:
- O aluno acabou de falar agora: "${cleanTranscript}".
- Analise o contexto: se no turno anterior você pediu para ele praticar uma frase ou palavra em inglês, avalie com a regra dos 70% e dê sequência.
- Se o aluno estiver conversando em português, tirando dúvidas, contando algo do dia ou fazendo perguntas: RESPONDA DIRETAMENTE AO PAPO OU À DÚVIDA EM PORTUGUÊS! NUNCA diga "você acertou" se ele estava apenas conversando em português.
- Deixe o algoritmo livre: seja um tutor parceiro, inteligente e descontraído, sem cobranças mecânicas.`;
  }

  return `${contextSection}
${dynamicDirective}

Você é Mr.Crazy: mentor e professor brasileiro ensinando inglês americano autêntico (en-US) para alunos brasileiros. Sua língua principal de comunicação e ensino é SEMPRE o PORTUGUÊS DO BRASIL.

DIRETRIZES DE FLUXO LIVRE E ENSINO:
1. LÍNGUA PRINCIPAL: PORTUGUÊS DO BRASIL
   - Fale sempre em português para acolher, orientar, conversar, tirar dúvidas e dar feedbacks.
   - Como ensinar frases: Diga a explicação em português e forneça em inglês APENAS a frase ou expressão exata que o aluno tem que praticar. Exemplo: "Para pedir água, você diz: 'Could I get some water, please?'. Tenta falar essa frase."
   - ÚNICA EXCEÇÃO PARA FALAR EM INGLÊS: Você SÓ deve bater papo em inglês se o aluno pedir explicitamente para falar em inglês (ex: "vamos falar em inglês", "fala em inglês comigo", "let's speak in English").

2. CUMPRIMENTOS E BATE-PAPO LIVRE:
   - Cumprimentos ("oi", "tudo bem?") NUNCA são avaliados como acerto ou erro. Cumprimente de volta como um amigo.
   - Se o aluno estiver conversando sobre a vida, trabalho ou tirando dúvidas, responda em português com carisma. Não force exercícios a todo momento.

3. TÉCNICAS FÍSICAS DE PRONÚNCIA (BOCA, LÍNGUA E DENTES):
   - Quando ensinar ou corrigir sons em inglês americano, ensine a técnica anatômica curta:
     * Som do 'TH' (think, thank, the, that): "Ponta da língua levemente entre os dentes da frente soprando o ar, sem som de 'f' nem de 'd'."
     * 'R' americano / retroflexo (car, red, work, world): "Enrola a ponta da língua pra trás no meio da boca sem encostar no céu da boca (igual sotaque do interior)."
     * Consoantes finais secas (stop, bad, like, job, cat): "Corta o som seco na boca sem colocar a vogal 'i' no final (não fale 'stopi')."
     * 'L' final / Dark L (call, milk, feel): "A ponta da língua sobe atrás dos dentes da frente e o fundo da boca abre, sem virar som de 'u'."
     * 'W' (water, wait): "Faz um biquinho redondo de beijo no início."
     * Vogais curtas frouxas (sheet vs shit, beach vs bitch): "No 'i' curto, relaxa o maxilar e faz quase som de 'ê'."

4. REGRA DOS 70% (SEM TRAVAR O ALUNO):
   - Se a tentativa de inglês foi cerca de 70% compreensível, CONSIDERE VÁLIDO! Elogie ("Boa!", "Perfeito, deu pra entender certinho!") e AVANCE para outra frase ou assunto.
   - Máximo de 2 a 3 tentativas. Se não saiu perfeito, elogie o esforço e pule para a próxima palavra.

5. CONCISÃO E NATURALIDADE:
   - Seja conciso: 1 a 2 frases objetivas por resposta. Mantenha o ritmo de bate-papo ágil.`;
}

export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error) {
    if (error.name === "AbortError") return true;
    const msg = error.message.toLowerCase();
    if (msg.includes("abort") || msg.includes("aborted")) return true;
  }
  const str = String(error).toLowerCase();
  return str.includes("abort") || str.includes("aborted");
}

export function isTimeoutError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof DOMException && error.name === "TimeoutError") return true;
  if (error instanceof Error) {
    if (error.name === "TimeoutError") return true;
    const msg = error.message.toLowerCase();
    if (msg.includes("timeout") || msg.includes("timed out")) return true;
  }
  const str = String(error).toLowerCase();
  return str.includes("timeout") || str.includes("timed out");
}

export function getConnectionError(error: unknown) {
  if (isAbortError(error)) {
    return "A conexão foi reiniciada. Toque no botão para tentar novamente.";
  }

  if (isTimeoutError(error)) {
    return "A conexão demorou a responder. Toque no botão para tentar novamente.";
  }

  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Microfone bloqueado. Permita o acesso ao microfone nos ajustes do navegador para falar.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError" || error.name === "OverconstrainedError") {
      return "Nenhum microfone encontrado. Conecte um fone de ouvido ou verifique se o microfone está ativo no seu aparelho.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "O microfone está sendo usado por outro aplicativo. Feche outros apps ou abas e tente novamente.";
    }
  }

  if (error instanceof Error && error.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes("requested device not found") || msg.includes("device not found") || msg.includes("notfounderror")) {
      return "Nenhum microfone encontrado. Conecte um fone de ouvido ou verifique se o microfone está ativo no seu aparelho.";
    }
    if (msg.includes("permission denied") || msg.includes("not allowed")) {
      return "Microfone bloqueado. Permita o acesso ao microfone nos ajustes do navegador para falar.";
    }
    if (msg.includes("in use") || msg.includes("already in use") || msg.includes("not readable")) {
      return "O microfone está sendo usado por outro app. Feche outros apps e tente novamente.";
    }
    if (error.message === "realtime-unavailable") {
      return "A conversa em tempo real está temporariamente indisponível. Toque para tentar novamente.";
    }
    if (
      error.message === "data-channel-timeout" ||
      error.message === "peer-connection-failed" ||
      error.message === "ice-connection-failed" ||
      error.message === "TimeoutError"
    ) {
      return "A conexão demorou a responder. Toque no botão para tentar novamente.";
    }
    if (msg.includes("abort")) {
      return "A conexão foi reiniciada. Toque no botão para tentar novamente.";
    }
    return error.message;
  }

  return "Não consegui conectar o microfone. Toque no botão para tentar novamente.";
}

function createMergedTimeoutSignal(signal?: AbortSignal, timeoutMs = 18000): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = window.setTimeout(() => {
    controller.abort(new DOMException("TimeoutError", "TimeoutError"));
  }, timeoutMs);

  const onAbort = () => {
    controller.abort(signal?.reason ?? new DOMException("Aborted", "AbortError"));
  };

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  const cleanup = () => {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  };

  return { signal: controller.signal, cleanup };
}

function waitForDataChannel(
  channel: RTCDataChannel,
  peer: RTCPeerConnection,
  signal?: AbortSignal
) {
  if (channel.readyState === "open") return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    let finished = false;
    const timeout = window.setTimeout(() => finish(new Error("data-channel-timeout")), 14_000);

    const onOpen = () => finish();
    const onAbort = () => finish(new DOMException("Aborted", "AbortError"));
    const onPeerState = () => {
      if (peer.connectionState === "failed") {
        finish(new Error("peer-connection-failed"));
      }
    };
    const onIceState = () => {
      if (peer.iceConnectionState === "failed") {
        finish(new Error("ice-connection-failed"));
      }
    };

    const finish = (error?: Error | DOMException) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      channel.removeEventListener("open", onOpen);
      signal?.removeEventListener("abort", onAbort);
      peer.removeEventListener("connectionstatechange", onPeerState);
      peer.removeEventListener("iceconnectionstatechange", onIceState);
      if (error) reject(error);
      else resolve();
    };

    channel.addEventListener("open", onOpen, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
    peer.addEventListener("connectionstatechange", onPeerState);
    peer.addEventListener("iceconnectionstatechange", onIceState);
  });
}

let masterMicrophoneStream: MediaStream | null = null;
let visibilityHandlerAttached = false;
let isPageVisible = typeof document !== "undefined" ? document.visibilityState === "visible" : true;

function setupVisibilityListener() {
  if (visibilityHandlerAttached || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  visibilityHandlerAttached = true;

  document.addEventListener("visibilitychange", () => {
    isPageVisible = document.visibilityState === "visible";
    if (masterMicrophoneStream) {
      masterMicrophoneStream.getAudioTracks().forEach((track) => {
        // Microfone SÓ fica ativo enquanto o usuário está usando o sistema na tela.
        // Se minimizado, aba trocada ou tela bloqueada, a captação é desativada no hardware.
        if (!isPageVisible) track.enabled = false;
      });
    }
  });

  // Silencia o microfone quando o usuário minimiza, bloqueia a tela ou sai temporariamente da aba
  window.addEventListener("pagehide", () => {
    if (masterMicrophoneStream) {
      masterMicrophoneStream.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
    }
  });
}

export async function getMicrophoneSessionMedia(): Promise<{ track: MediaStreamTrack; stream: MediaStream }> {
  setupVisibilityListener();

  // 1. REUTILIZAÇÃO PERSISTENTE: Se já possuímos uma faixa de áudio ativa no dispositivo, reutilizamos sem chamar getUserMedia()
  // No iPhone/WebKit, isso evita 100% que o sistema reabra o hardware ou solicite permissão novamente ao navegar
  if (masterMicrophoneStream) {
    const liveTrack = masterMicrophoneStream.getAudioTracks().find((t) => t.readyState === "live");
    if (liveTrack) {
      liveTrack.enabled = true;
      const sessionStream = masterMicrophoneStream.clone();
      return { track: sessionStream.getAudioTracks()[0], stream: sessionStream };
    }
    masterMicrophoneStream = null;
  }

  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Seu navegador não suporta captura de áudio ou a página não está em conexão segura (HTTPS).");
  }

  let stream: MediaStream | null = null;
  let lastError: unknown = null;

  // Nível 1: Áudio com processamento avançado (cancelamento de eco e supressão de ruído)
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "NotAllowedError") throw err;
    lastError = err;
    console.warn("[Microphone] Falha com restrições avançadas, tentando fallback { audio: true }:", err);
  }

  // Nível 2: Fallback amplo universal (compatível com Android, iOS e fones Bluetooth)
  if (!stream) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err2) {
      lastError = err2;
      console.warn("[Microphone] Falha com { audio: true }, tentando enumerar dispositivos de entrada:", err2);
    }
  }

  // Nível 3: Seleção explícita de dispositivo de áudio detectado no sistema
  if (!stream && typeof navigator.mediaDevices.enumerateDevices === "function") {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInput = devices.find((d) => d.kind === "audioinput" && d.deviceId);
      if (audioInput) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { ideal: audioInput.deviceId } }
        });
      }
    } catch (err3) {
      lastError = err3;
      console.warn("[Microphone] Falha na enumeração de dispositivos:", err3);
    }
  }

  if (!stream) {
    throw lastError || new Error("Nenhum microfone encontrado. Conecte um fone de ouvido ou verifique o microfone do seu aparelho.");
  }

  masterMicrophoneStream = stream;
  const track = stream.getAudioTracks()[0];
  if (!track) {
    throw new Error("Nenhum microfone ativo detectado no dispositivo.");
  }

  track.enabled = true;

  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mr-crazy-mic-granted", "true");
    }
  } catch {}

  const sessionStream = stream.clone();
  return { track: sessionStream.getAudioTracks()[0], stream: sessionStream };
}

export function releasePersistentMicrophoneStream(force = false) {
  if (!force) {
    // Em vez de matar a faixa no iOS (o que força o Safari a pedir permissão de novo), apenas silencia
    if (masterMicrophoneStream) {
      masterMicrophoneStream.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
    }
    return;
  }

  if (masterMicrophoneStream) {
    masterMicrophoneStream.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {}
    });
    masterMicrophoneStream = null;
  }
}

const WHISPER_HALLUCINATIONS = [
  "amara.org",
  "legendas pela",
  "legendado por",
  "subtitles by",
  "obrigado por assistir",
  "obrigada por assistir",
  "deixe seu like",
  "inscreva-se no canal",
  "transcrição:",
  "transcrito por",
  "todos os direitos reservados",
  "curta e compartilhe",
  "não inventar",
  "nao inventar",
  "ruídos de respiração",
  "ruidos de respiracao",
  "legendas de vídeo",
  "legendas de video",
  "máxima fidelidade",
  "maxima fidelidade",
  "não inventar palavras",
  "nao inventar palavras",
  "boa noite, triângulos",
  "boa noite triângulos"
];

function isWhisperHallucination(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (!lower) return true;
  return WHISPER_HALLUCINATIONS.some((h) => lower.includes(h));
}

export async function connectRealtime(options: ConnectRealtimeOptions): Promise<RealtimeController> {
  options.onStatus("connecting");
  const peer = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  });
  const audio = document.createElement("audio");
  let microphone: MediaStreamTrack;
  let stream: MediaStream;
  try {
    const sessionMedia = await getMicrophoneSessionMedia();
    microphone = sessionMedia.track;
    stream = sessionMedia.stream;
    if (options.signal?.aborted) {
      microphone.stop();
      throw new DOMException("Aborted", "AbortError");
    }
  } catch (error) {
    peer.close();
    if (!isAbortError(error) && !options.signal?.aborted) {
      options.onStatus("failed");
      options.onError(getConnectionError(error));
    }
    throw error;
  }
  const channel = peer.createDataChannel("oai-events");
  let userTranscript = "";
  let assistantTranscript = "";
  let lastCommittedAssistantTranscript = "";
  let microphoneEnabled = true;
  let assistantAudioActive = false;
  let audioPlaying = false;
  let disconnected = false;
  let responseTimer: number | null = null;
  const completedTranscripts = new Set<string>();
  const resumeAudio = () => {
    if (!disconnected && audio.srcObject) void audio.play().catch(() => {});
  };
  window.addEventListener("pointerdown", resumeAudio);

  audio.autoplay = true;
  audio.setAttribute("playsinline", "");
  peer.ontrack = (event) => {
    audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
    void audio.play().catch(() => {
      // No Safari / iOS, autoplay é adiado pelo navegador até o primeiro toque na tela.
      // NÃO derrubamos a conexão! O áudio é retomado automaticamente no próximo toque.
      options.onError("Toque na tela para liberar o áudio do professor.");
    });
  };
  peer.addTrack(microphone, stream);

  const send = (event: object) => {
    if (channel.readyState !== "open") return false;
    channel.send(JSON.stringify(event));
    return true;
  };

  const syncMicrophone = () => {
    const shouldEnable = microphoneEnabled && document.visibilityState !== "hidden" && !assistantAudioActive;
    microphone.enabled = shouldEnable;
    if (masterMicrophoneStream) {
      masterMicrophoneStream.getAudioTracks().forEach((t) => {
        t.enabled = shouldEnable;
      });
    }
  };

  const setMicrophoneEnabled = (enabled: boolean) => {
    microphoneEnabled = enabled;
    syncMicrophone();
  };

  const onVisibility = () => {
    syncMicrophone();
    if (document.visibilityState !== "hidden") resumeAudio();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const localSessionTurns: { role: string; text: string }[] = [];
  const getContextSnapshot = (): { role: string; text: string }[] => {
    const external = options.getRecentContext?.() ?? [];
    if (external.length > 0) {
      return external.slice(-6);
    }
    return localSessionTurns.slice(-6);
  };

  const commitAssistantTurn = (explicitText?: string) => {
    const raw = (explicitText ?? assistantTranscript).trim();
    if (!raw) return;
    if (raw === lastCommittedAssistantTranscript) return;

    lastCommittedAssistantTranscript = raw;
    assistantTranscript = "";

    localSessionTurns.push({ role: "crazy", text: raw });
    if (localSessionTurns.length > 12) localSessionTurns.shift();

    options.onAssistantTranscript(raw, true);
  };

  let activeResponseInProgress = false;
  let pendingResponsePayload: { instructions?: string } | null = null;
  let interruptionTimer: number | null = null;
  const clearInterruptionTimer = () => {
    if (interruptionTimer !== null) {
      window.clearTimeout(interruptionTimer);
      interruptionTimer = null;
    }
  };

  let transcriptionSafetyTimer: number | null = null;
  const clearTranscriptionSafetyTimer = () => {
    if (transcriptionSafetyTimer !== null) {
      window.clearTimeout(transcriptionSafetyTimer);
      transcriptionSafetyTimer = null;
    }
  };

  let echoCooldownTimer: number | null = null;
  const clearEchoCooldown = () => {
    if (echoCooldownTimer !== null) {
      window.clearTimeout(echoCooldownTimer);
      echoCooldownTimer = null;
    }
  };

  const clearResponseTimer = () => {
    if (responseTimer !== null) window.clearTimeout(responseTimer);
    responseTimer = null;
  };
  const returnToListening = () => {
    clearResponseTimer();
    clearEchoCooldown();
    audioPlaying = false;
    assistantAudioActive = false;
    activeResponseInProgress = false;
    syncMicrophone();
    options.onVoiceState(microphoneEnabled ? "listening" : "idle");
  };
  const watchResponse = () => {
    clearResponseTimer();
    responseTimer = window.setTimeout(() => {
      if (disconnected) return;
      cancelAssistantPlayback();
      returnToListening();
      options.onError("A resposta demorou. Pode falar novamente ou reconectar o microfone.");
    }, 30_000);
  };

  const cancelAssistantPlayback = () => {
    clearInterruptionTimer();
    clearEchoCooldown();
    audioPlaying = false;
    assistantAudioActive = false;
    send({ type: "output_audio_buffer.clear" });
    if (activeResponseInProgress) {
      activeResponseInProgress = false;
      send({ type: "response.cancel" });
    }
    syncMicrophone();
    returnToListening();
  };

  const disconnect = () => {
    if (disconnected) return;
    disconnected = true;
    clearInterruptionTimer();
    clearTranscriptionSafetyTimer();
    clearEchoCooldown();
    clearResponseTimer();
    options.signal?.removeEventListener("abort", disconnect);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pointerdown", resumeAudio);
    activeResponseInProgress = false;
    pendingResponsePayload = null;
    audio.pause();
    audio.srcObject = null;
    try {
      channel.close();
    } catch {}
    try {
      peer.close();
    } catch {}
    try {
      // Silencia a captação sem destruir a faixa no hardware, garantindo que o iOS não volte a pedir permissão
      microphone.stop();
    } catch {}
  };

  options.signal?.addEventListener("abort", disconnect, { once: true });
  peer.addEventListener("connectionstatechange", () => {
    if (!disconnected && (peer.connectionState === "failed" || peer.connectionState === "disconnected")) {
      disconnect();
      options.onStatus("failed");
      options.onVoiceState("idle");
      options.onError("A conexão de voz caiu. Use o controle manual enquanto ela é restabelecida.");
    }
  });

  channel.addEventListener("message", (message) => {
    if (disconnected) return;
    let event: RealtimeServerEvent;
    try {
      event = JSON.parse(String(message.data)) as RealtimeServerEvent;
    } catch {
      return;
    }

    switch (event.type) {
      case "input_audio_buffer.speech_started":
        clearTranscriptionSafetyTimer();
        userTranscript = "";
        options.onUserTranscript("", false);
        if (!assistantAudioActive) options.onVoiceState("listening");
        break;
      case "input_audio_buffer.speech_stopped":
        clearInterruptionTimer();
        options.onVoiceState("analyzing");
        watchResponse();
        clearTranscriptionSafetyTimer();
        transcriptionSafetyTimer = window.setTimeout(() => {
          if (!activeResponseInProgress) {
          }
        }, 3500);
        break;
      case "conversation.item.input_audio_transcription.delta":
        if (typeof event.delta === "string") {
          userTranscript += event.delta;
          if (!isWhisperHallucination(userTranscript)) {
            options.onUserTranscript(userTranscript, false);
            options.onVoiceState("listening");
          }
        }
        break;
      case "conversation.item.input_audio_transcription.completed":
        clearTranscriptionSafetyTimer();
        if (event.item_id && completedTranscripts.has(event.item_id)) break;
        if (event.item_id) {
          completedTranscripts.add(event.item_id);
          if (completedTranscripts.size > 100) completedTranscripts.delete(completedTranscripts.values().next().value!);
        }
        if (typeof event.transcript === "string") {
          const rawTranscript = event.transcript.trim();
          if (rawTranscript && !isWhisperHallucination(rawTranscript)) {
            userTranscript = rawTranscript;
          } else {
            userTranscript = "";
          }
        }

        const candidateText = userTranscript.trim();
        userTranscript = "";

        // Se for alucinação ou texto vazio, descarta silenciosamente e limpa qualquer bolha transitória
        if (!candidateText || isWhisperHallucination(candidateText)) {
          options.onUserTranscript("", true);
          return;
        }

        localSessionTurns.push({ role: "user", text: candidateText });
        if (localSessionTurns.length > 12) localSessionTurns.shift();
        options.onUserTranscript(candidateText, true);
        // VAD creates the response from audio. Transcription is only a display event,
        // and may arrive after the assistant has already started answering.
        break;
      case "conversation.item.input_audio_transcription.failed":
        clearTranscriptionSafetyTimer();
        options.onUserTranscript("", true);
        options.onError("Não consegui exibir a transcrição deste áudio.");
        break;
      case "response.output_item.added":
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        assistantTranscript = "";
        options.onAssistantTranscript("", false);
        break;
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta":
        if (typeof event.delta === "string") {
          assistantTranscript += event.delta;
          options.onAssistantTranscript(assistantTranscript, false);
        }
        break;
      case "response.output_text.delta":
      case "response.text.delta":
        if (typeof event.delta === "string") {
          assistantTranscript += event.delta;
          options.onAssistantTranscript(assistantTranscript, false);
        }
        break;
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done":
        if (typeof event.transcript === "string" && event.transcript.trim()) {
          assistantTranscript = event.transcript.trim();
        }
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        break;
      case "response.output_text.done":
      case "response.text.done":
        if (typeof event.text === "string" && event.text.trim()) {
          assistantTranscript = event.text.trim();
        }
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        break;
      case "response.output_item.done":
        if (event.item?.content && Array.isArray(event.item.content)) {
          for (const c of event.item.content) {
            if (typeof c?.transcript === "string" && c.transcript.trim()) {
              assistantTranscript = c.transcript.trim();
            } else if (typeof c?.text === "string" && c.text.trim()) {
              assistantTranscript = c.text.trim();
            }
          }
        }
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        break;
      case "output_audio_buffer.started":
        clearResponseTimer();
        clearInterruptionTimer();
        clearEchoCooldown();
        audioPlaying = true;
        assistantAudioActive = true;
        // Isola completamente o microfone para impedir eco acústico do alto-falante
        microphone.enabled = false;
        options.onVoiceState("speaking");
        break;
      case "output_audio_buffer.cleared":
      case "output_audio_buffer.stopped":
        audioPlaying = false;
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        // Cooldown de 600ms após o término do áudio antes de reativar o microfone (evita eco da reverberação)
        clearEchoCooldown();
        echoCooldownTimer = window.setTimeout(() => {
          returnToListening();
        }, 200);
        break;
      case "response.created":
        activeResponseInProgress = true;
        clearEchoCooldown();
        watchResponse();
        options.onVoiceState("analyzing");
        break;
      case "response.done":
        activeResponseInProgress = false;
        if (pendingResponsePayload && !disconnected) {
          const payload = pendingResponsePayload;
          pendingResponsePayload = null;
          send({
            type: "response.create",
            response: payload
          });
        }
        if (event.response?.output && Array.isArray(event.response.output)) {
          for (const item of event.response.output) {
            if (item?.content && Array.isArray(item.content)) {
              for (const c of item.content) {
                if (typeof c?.transcript === "string" && c.transcript.trim()) {
                  assistantTranscript = c.transcript.trim();
                } else if (typeof c?.text === "string" && c.text.trim()) {
                  assistantTranscript = c.text.trim();
                }
              }
            }
          }
        }
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        if (!audioPlaying) {
          returnToListening();
        }
        if (event.response?.status === "failed") {
          options.onError(event.response.status_details?.error?.message || "A IA não conseguiu responder. Tente novamente.");
        }
        break;
      case "error": {
        const errorMsg = event.error?.message || "";
        const lower = errorMsg.toLowerCase();
        if (
          lower.includes("buffer is empty") ||
          lower.includes("already active") ||
          lower.includes("active response") ||
          lower.includes("in progress") ||
          lower.includes("cancelled") ||
          lower.includes("session.type") ||
          lower.includes("session.update")
        ) {
          console.warn("[Realtime] Aviso não crítico ignorado:", errorMsg);
          if (lower.includes("active response") || lower.includes("in progress")) {
            if (pendingResponsePayload && !disconnected) {
              window.setTimeout(() => {
                if (pendingResponsePayload && !disconnected) {
                  send({
                    type: "response.create",
                    response: pendingResponsePayload
                  });
                  pendingResponsePayload = null;
                }
              }, 250);
            }
          }
          break;
        }
        returnToListening();
        options.onError(errorMsg || "A API de voz retornou um erro.");
        break;
      }
    }
  });

  try {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    // Aguarda gathering rápido (host candidates já vêm no offer, máx 180ms para acelerar a conexão no mobile)
    if (peer.iceGatheringState !== "complete" && !peer.localDescription?.sdp?.includes("a=candidate:")) {
      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          peer.removeEventListener("icegatheringstatechange", onState);
          peer.removeEventListener("icecandidate", onCandidate);
          resolve();
        };
        const timer = setTimeout(finish, 60);
        const onState = () => {
          if (peer.iceGatheringState === "complete") finish();
        };
        const onCandidate = (event: RTCPeerConnectionIceEvent) => {
          if (event.candidate) finish();
        };
        peer.addEventListener("icegatheringstatechange", onState);
        peer.addEventListener("icecandidate", onCandidate);
      });
    }

    const sdpToSend = peer.localDescription?.sdp || offer.sdp;

    const { signal: fetchSignal, cleanup: cleanupFetchSignal } = createMergedTimeoutSignal(options.signal, 18000);

    const queryParams = new URLSearchParams({
      level: options.level,
      mode: options.mode,
      ...(options.moduleId ? { moduleId: options.moduleId } : {})
    });

    let response: Response;
    try {
      response = await fetch(`/api/realtime/session?${queryParams.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: sdpToSend,
        signal: fetchSignal
      });
    } finally {
      cleanupFetchSignal();
    }

    if (!response.ok) {
      let errorMsg = "realtime-unavailable";
      try {
        const errorData = (await response.json()) as { error?: string; providerCode?: string; providerMessage?: string; providerBody?: string };
        if (errorData?.error) {
          errorMsg = errorData.error;
          if (errorData.providerMessage) {
            errorMsg += ` (${errorData.providerMessage})`;
          } else if (errorData.providerCode) {
            errorMsg += ` (${errorData.providerCode})`;
          }
        }
      } catch {}
      throw new Error(errorMsg);
    }

    await peer.setRemoteDescription({ type: "answer", sdp: await response.text() });
    await waitForDataChannel(channel, peer, options.signal);
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

    microphoneEnabled = true;
    syncMicrophone();

    options.onStatus("connected");
    options.onVoiceState("listening");

    return {
      disconnect,
      setMicrophoneEnabled,
      interrupt: cancelAssistantPlayback,
      sendText(text: string) {
        const cleanText = text.trim();
        if (!cleanText || disconnected || channel.readyState !== "open" || activeResponseInProgress || audioPlaying) return false;
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        userTranscript = cleanText;
        options.onUserTranscript(cleanText, true);
        options.onVoiceState("analyzing");
        const currentContext = getContextSnapshot();
        localSessionTurns.push({ role: "user", text: cleanText });
        if (localSessionTurns.length > 12) localSessionTurns.shift();

        const created = send({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: cleanText }]
          }
        });
        watchResponse();
        activeResponseInProgress = true;
        return created && send({
          type: "response.create",
          response: { instructions: buildTranscriptBoundResponse(cleanText, currentContext) }
        });
      },
      finishTurn() {
        if (!microphoneEnabled) return;
        microphone.enabled = false;
        options.onVoiceState("transcribing");
        window.setTimeout(() => {
          if (!disconnected && microphoneEnabled) syncMicrophone();
        }, 700);
      }
    };
  } catch (error) {
    disconnect();
    if (!isAbortError(error) && !options.signal?.aborted) {
      options.onStatus("failed");
      options.onError(getConnectionError(error));
    }
    throw error;
  }
}
