import type { LearningLevel, VoiceState } from "@/lib/mr-crazy";

type RealtimeServerEvent = {
  type?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
};

export type RealtimeConnectionStatus = "connecting" | "connected" | "failed";

export type RealtimeController = {
  disconnect: () => void;
  finishTurn: () => void;
  sendText: (text: string) => boolean;
  setMicrophoneEnabled: (enabled: boolean) => void;
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

function buildTranscriptBoundResponse(
  transcript: string,
  recentTurns: { role: string; text: string }[] = []
) {
  const cleanTranscript = transcript.trim();
  if (!cleanTranscript) {
    return "O último áudio não gerou transcrição nítida. Peça em uma única frase curta em português do Brasil para o usuário repetir.";
  }

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
  .join("\n")}

DIRETRIZ DE CONTINUIDADE DO DIÁLOGO:
- O aluno acabou de falar agora: "${cleanTranscript}".
- Use o contexto acima para entender exatamente o que está acontecendo: se no turno anterior você ensinou uma expressão ou pediu para o aluno repetir uma palavra/frase, avalie a tentativa dele agora e dê continuidade ao ciclo de prática.
- Se o aluno estiver respondendo a uma pergunta sua ou trazendo uma dúvida, responda diretamente em português do Brasil.`
      : `O aluno acabou de falar: "${cleanTranscript}".`;

  return `${contextSection}
Você é Mr.Crazy: professor de inglês americano (en-US) para alunos brasileiros. Sua língua principal de comunicação e ensino é SEMPRE o PORTUGUÊS DO BRASIL.

DIRETRIZES DE IDIOMA E ENSINO:
1. LÍNGUA PRINCIPAL: PORTUGUÊS DO BRASIL
   - Fale sempre em português para acolher, orientar, conversar, tirar dúvidas e dar feedbacks.
   - Como ensinar exemplos e frases: Diga a explicação em português e forneça em inglês APENAS a frase ou expressão exata que o aluno tem que praticar. Exemplo: "Para pedir a conta, você diz: 'Could I have the check, please?'. Tenta falar essa frase."
   - ÚNICA EXCEÇÃO PARA FALAR EM INGLÊS COM O ALUNO: Você SÓ deve falar diretamente em inglês se o aluno pedir explicitamente para ter uma conversa em inglês (ex: "vamos falar em inglês", "fala em inglês comigo", "let's speak in English"). Nessa exceção, converse em inglês simulando uma pessoa real batendo papo com outra.

2. RESPOSTA DIRETA A DÚVIDAS E PERGUNTAS:
   - Se o aluno fez uma pergunta (dúvidas de inglês, vocabulário, gramática ou qualquer outro assunto), RESPONDA DIRETAMENTE à pergunta dele em português com didática e carisma.
   - NUNCA force o aluno a repetir quando ele estiver tirando dúvidas ou conversando. Dialogue como um professor de verdade.

3. REPETIÇÃO INTELIGENTE (SEM TRAVAMENTO E REGRA DOS 70%):
   - REGRA DOS 70%: Se o aluno falou cerca de 70% certo ou compreensível de primeira, CONSIDERE VÁLIDO! Elogie ("Boa!", "Perfeito!", "Deu pra entender muito bem!") e AVANCE PARA OUTRAS PALAVRAS ou continue a conversa. NÃO peça repetição se a mensagem já foi transmitida!
   - Se o aluno errar de primeira: apenas aponte o ajuste com carinho em português ("quase, na próxima lembra de...") e avance para praticar outra frase/situação.
   - Só peça repetição se ele errar MUITO a ponto de quebrar totalmente a compreensão.
   - LIMITE ESTRITO: no MÁXIMO 3 tentativas no total. Chegou na 3ª, elogie a evolução e PULE IMEDIATAMENTE para outra palavra. NUNCA peça pela 4ª vez!
   - EXCEÇÃO: Só peça repetições contínuas se o próprio aluno pedir para treinar aquela palavra ou frase até ficar perfeita (ex: "quero falar essa direito", "deixa eu tentar de novo"). Quando for ele que quer, aí sim peça repetições.

4. CONCISÃO E NATURALIDADE:
   - Seja conciso: 1 a 2 frases objetivas e humanas por intervenção. Mantenha o ritmo de bate-papo ágil.`;
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
    return "Permita o acesso ao microfone para conversar com o Mr.Crazy.";
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
      if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
        finish(new Error("peer-connection-failed"));
      }
    };
    const onIceState = () => {
      if (peer.iceConnectionState === "failed" || peer.iceConnectionState === "disconnected") {
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

  // Encerra completamente o hardware quando o usuário fecha a aba ou sai do site
  window.addEventListener("pagehide", () => {
    if (masterMicrophoneStream) {
      masterMicrophoneStream.getTracks().forEach((t) => t.stop());
      masterMicrophoneStream = null;
    }
  });
}

export async function getMicrophoneSessionMedia(): Promise<{ track: MediaStreamTrack; stream: MediaStream }> {
  setupVisibilityListener();

  // Sempre libera streams anteriores para garantir uma faixa 100% nova e com transmissão ativa no WebKit/iOS
  releasePersistentMicrophoneStream();

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

export function releasePersistentMicrophoneStream() {
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
    if (audioPlaying || assistantAudioActive || activeResponseInProgress) {
      audioPlaying = false;
      assistantAudioActive = false;
      audio.muted = true;
      audio.pause();
      if (activeResponseInProgress) {
        activeResponseInProgress = false;
        send({ type: "response.cancel" });
      }
    }
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
      microphone.stop();
    } catch {}
    if (masterMicrophoneStream) {
      masterMicrophoneStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      masterMicrophoneStream = null;
    }
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
        userTranscript = "";
        options.onUserTranscript("", false);
        options.onVoiceState("listening");
        if (audioPlaying || assistantAudioActive || activeResponseInProgress) {
          clearInterruptionTimer();
          interruptionTimer = window.setTimeout(() => {
            cancelAssistantPlayback();
          }, 320);
        }
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
      case "response.audio_transcript.done":
        if (typeof event.transcript === "string") {
          assistantTranscript = event.transcript.trim();
        }
        if (assistantTranscript.trim()) {
          localSessionTurns.push({ role: "crazy", text: assistantTranscript.trim() });
          if (localSessionTurns.length > 12) localSessionTurns.shift();
        }
        options.onAssistantTranscript(assistantTranscript, true);
        options.onVoiceState("speaking");
        break;
      case "output_audio_buffer.started":
        clearInterruptionTimer();
        audioPlaying = true;
        assistantAudioActive = true;
        activeResponseInProgress = true;
        options.onVoiceState("speaking");
        break;
      case "output_audio_buffer.stopped":
        audioPlaying = false;
        assistantAudioActive = false;
        activeResponseInProgress = false;
        options.onVoiceState("listening");
        break;
      case "response.created":
        activeResponseInProgress = true;
        break;
      case "response.done":
        activeResponseInProgress = false;
        if (!audioPlaying && !assistantAudioActive) {
          options.onVoiceState("listening");
        }
        break;
      case "error": {
        const errorMsg = event.error?.message || "";
        if (
          errorMsg.includes("buffer is empty") ||
          errorMsg.includes("already active") ||
          errorMsg.includes("cancelled")
        ) {
          console.warn("[Realtime] Aviso transitório ignorado:", errorMsg);
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

    const { signal: fetchSignal, cleanup: cleanupFetchSignal } = createMergedTimeoutSignal(options.signal, 18000);

    let response: Response;
    try {
      response = await fetch(
        `/api/realtime/session?level=${encodeURIComponent(options.level)}&mode=${encodeURIComponent(options.mode)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
          signal: fetchSignal
        }
      );
    } finally {
      cleanupFetchSignal();
    }

    if (!response.ok) {
      let errorMsg = "realtime-unavailable";
      try {
        const errorData = (await response.json()) as { error?: string; providerCode?: string };
        if (errorData?.error) {
          errorMsg = errorData.error;
          if (errorData.providerCode) {
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
      sendText(text: string) {
        const cleanText = text.trim();
        if (!cleanText) return false;
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
