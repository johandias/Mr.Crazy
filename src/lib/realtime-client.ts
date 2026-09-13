import type { LearningLevel, VoiceState } from "@/lib/mr-crazy";

type RealtimeServerEvent = {
  type?: string;
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
${recentTurns
  .slice(-6)
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

  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microfone bloqueado. No iPhone, toque no ícone 'aA' ao lado do endereço do site > Ajustes do Site > Microfone: Permitir.";
  }

  if (error instanceof Error && error.message) {
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
    if (error.message.toLowerCase().includes("abort")) {
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
        track.enabled = isPageVisible;
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
      return { track: liveTrack, stream: masterMicrophoneStream };
    }
    masterMicrophoneStream = null;
  }

  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Seu navegador não suporta captura de áudio ou a página não está em conexão segura (HTTPS).");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

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

  return { track, stream };
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

  audio.autoplay = true;
  audio.setAttribute("playsinline", "");
  peer.ontrack = (event) => {
    audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
    void audio.play().catch(() => {
      // No Safari / iOS, autoplay é adiado pelo navegador até o primeiro toque na tela.
      // NÃO derrubamos a conexão! O áudio é retomado automaticamente no próximo toque.
      const resume = () => {
        void audio.play().catch(() => {});
      };
      window.addEventListener("touchstart", resume, { once: true, passive: true });
      window.addEventListener("click", resume, { once: true });
    });
  };
  peer.addTrack(microphone, stream);

  const send = (event: object) => {
    if (channel.readyState !== "open") return false;
    channel.send(JSON.stringify(event));
    return true;
  };

  const syncMicrophone = () => {
    const shouldEnable = microphoneEnabled && isPageVisible;
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

  const cancelAssistantPlayback = () => {
    clearInterruptionTimer();
    audioPlaying = false;
    assistantAudioActive = false;
    audio.muted = true;
    audio.pause();
    if (activeResponseInProgress) {
      activeResponseInProgress = false;
      send({ type: "response.cancel" });
    }
    syncMicrophone();
    options.onVoiceState("listening");
  };

  const disconnect = () => {
    if (disconnected) return;
    disconnected = true;
    clearInterruptionTimer();
    clearTranscriptionSafetyTimer();
    activeResponseInProgress = false;
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
      microphone.enabled = false;
    } catch {}
  };

  options.signal?.addEventListener("abort", disconnect, { once: true });
  peer.addEventListener("connectionstatechange", () => {
    if (!disconnected && (peer.connectionState === "failed" || peer.connectionState === "disconnected")) {
      options.onStatus("failed");
      options.onVoiceState("idle");
      options.onError("A conexão de voz caiu. Use o controle manual enquanto ela é restabelecida.");
    }
  });

  channel.addEventListener("message", (message) => {
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
        options.onVoiceState("transcribing");
        break;
      case "input_audio_buffer.speech_stopped":
        clearInterruptionTimer();
        options.onVoiceState("transcribing");
        clearTranscriptionSafetyTimer();
        transcriptionSafetyTimer = window.setTimeout(() => {
          if (!activeResponseInProgress) {
            options.onVoiceState("listening");
          }
        }, 3500);
        break;
      case "conversation.item.input_audio_transcription.delta":
        if (typeof event.delta === "string") {
          userTranscript += event.delta;
          options.onUserTranscript(userTranscript, false);
          options.onVoiceState("listening");
        }
        break;
      case "conversation.item.input_audio_transcription.completed":
        clearTranscriptionSafetyTimer();
        if (typeof event.transcript === "string") {
          const rawTranscript = event.transcript.trim();
          if (rawTranscript) {
            userTranscript = rawTranscript;
          }
        }
        if (userTranscript.trim()) {
          const finalUserText = userTranscript.trim();
          localSessionTurns.push({ role: "user", text: finalUserText });
          if (localSessionTurns.length > 12) localSessionTurns.shift();
          options.onUserTranscript(finalUserText, true);
          options.onVoiceState("analyzing");
          const recentTurns = getContextSnapshot();
          send({
            type: "response.create",
            response: { instructions: buildTranscriptBoundResponse(finalUserText, recentTurns) }
          });
        } else {
          options.onVoiceState("listening");
        }
        break;
      case "response.output_item.added":
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        assistantTranscript = "";
        options.onAssistantTranscript("", false);
        break;
      case "response.audio_transcript.delta":
        if (typeof event.delta === "string") {
          assistantTranscript += event.delta;
          options.onAssistantTranscript(assistantTranscript, false);
          options.onVoiceState("speaking");
        }
        break;
      case "response.text.delta":
        if (typeof event.delta === "string") {
          assistantTranscript += event.delta;
          options.onAssistantTranscript(assistantTranscript, false);
          options.onVoiceState("speaking");
        }
        break;
      case "response.audio_transcript.done":
        if (typeof event.transcript === "string" && event.transcript.trim()) {
          assistantTranscript = event.transcript.trim();
        }
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        options.onVoiceState("speaking");
        break;
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
        clearInterruptionTimer();
        audioPlaying = true;
        assistantAudioActive = true;
        activeResponseInProgress = true;
        // Isola o microfone para impedir eco acústico do alto-falante cortando a fala do professor
        microphone.enabled = false;
        options.onVoiceState("speaking");
        break;
      case "output_audio_buffer.stopped":
        audioPlaying = false;
        assistantAudioActive = false;
        activeResponseInProgress = false;
        if (assistantTranscript.trim()) {
          commitAssistantTurn(assistantTranscript);
        }
        syncMicrophone();
        options.onVoiceState("listening");
        break;
      case "response.created":
        activeResponseInProgress = true;
        break;
      case "response.done":
        activeResponseInProgress = false;
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
        if (!audioPlaying && !assistantAudioActive) {
          syncMicrophone();
          options.onVoiceState("listening");
        }
        break;
      case "error": {
        const errorMsg = event.error?.message || "";
        if (
          errorMsg.includes("buffer is empty") ||
          errorMsg.includes("already active") ||
          errorMsg.includes("cancelled") ||
          errorMsg.includes("session.type") ||
          errorMsg.includes("session.update")
        ) {
          console.warn("[Realtime] Aviso não crítico ignorado:", errorMsg);
          break;
        }
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
        const timer = setTimeout(finish, 180);
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

    let response: Response;
    try {
      response = await fetch(
        `/api/realtime/session?level=${encodeURIComponent(options.level)}&mode=${encodeURIComponent(options.mode)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: sdpToSend,
          signal: fetchSignal
        }
      );
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

    microphone.enabled = true;
    microphoneEnabled = true;

    options.onStatus("connected");
    options.onVoiceState("listening");

    return {
      disconnect,
      setMicrophoneEnabled,
      interrupt: cancelAssistantPlayback,
      sendText(text: string) {
        const cleanText = text.trim();
        if (!cleanText) return false;
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
