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

function getConnectionError(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Permita o acesso ao microfone para conversar com o Mr.Crazy.";
  }

  if (error instanceof Error && error.message) {
    if (error.message === "realtime-unavailable") {
      return "A conversa em tempo real está temporariamente indisponível. Toque para tentar novamente.";
    }
    return error.message;
  }

  return "Não consegui conectar o microfone. Toque no botão para tentar novamente.";
}

function waitForDataChannel(channel: RTCDataChannel, signal?: AbortSignal) {
  if (channel.readyState === "open") return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => finish(new Error("data-channel-timeout")), 12_000);
    const onOpen = () => finish();
    const onAbort = () => finish(new DOMException("Aborted", "AbortError"));
    const finish = (error?: Error | DOMException) => {
      window.clearTimeout(timeout);
      channel.removeEventListener("open", onOpen);
      signal?.removeEventListener("abort", onAbort);
      if (error) reject(error);
      else resolve();
    };

    channel.addEventListener("open", onOpen, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
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

  const hasLiveTrack =
    masterMicrophoneStream &&
    masterMicrophoneStream.getAudioTracks().some((t) => t.readyState === "live");

  if (!hasLiveTrack) {
    masterMicrophoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("mr-crazy-mic-granted", "true");
      }
    } catch {
      // Ignore storage issues
    }
  }

  const parentTrack = masterMicrophoneStream!.getAudioTracks().find((t) => t.readyState === "live");
  if (!parentTrack) {
    throw new Error("Nenhum microfone ativo detectado no dispositivo.");
  }

  // Ativa a track mestre apenas se o app estiver visível na tela
  parentTrack.enabled = isPageVisible;

  // Clona a faixa mestre exclusivamente para esta conexão WebRTC.
  // No iOS Safari, isso NÃO dispara o popup de permissão novamente e entrega uma faixa limpa ao RTCPeerConnection.
  const sessionTrack = parentTrack.clone();
  sessionTrack.enabled = isPageVisible;
  const sessionStream = new MediaStream([sessionTrack]);

  return { track: sessionTrack, stream: sessionStream };
}

export function releasePersistentMicrophoneStream() {
  if (masterMicrophoneStream) {
    masterMicrophoneStream.getTracks().forEach((t) => t.stop());
    masterMicrophoneStream = null;
  }
}

export async function connectRealtime(options: ConnectRealtimeOptions): Promise<RealtimeController> {
  options.onStatus("connecting");
  const peer = new RTCPeerConnection();
  const audio = document.createElement("audio");
  let microphone: MediaStreamTrack;
  let stream: MediaStream;
  try {
    const sessionMedia = await getMicrophoneSessionMedia();
    microphone = sessionMedia.track;
    stream = sessionMedia.stream;
  } catch (error) {
    peer.close();
    if (!(error instanceof DOMException && error.name === "AbortError")) {
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
    void audio.play().catch(() => options.onError("O navegador bloqueou o áudio. Interaja com a página e tente novamente."));
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
    // Encerra a faixa clonada da sessão WebRTC
    try {
      microphone.stop();
    } catch {}
    // Muta a faixa mestre enquanto o usuário não estiver em prática ativa,
    // sem matar a permissão concedida pelo iOS!
    if (masterMicrophoneStream) {
      masterMicrophoneStream.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
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
          if (!activeResponseInProgress && !audioPlaying) {
            options.onVoiceState("listening");
          }
        }, 5000);
        break;
      case "conversation.item.input_audio_transcription.delta":
        userTranscript += event.delta ?? "";
        options.onUserTranscript(userTranscript, false);
        if ((audioPlaying || assistantAudioActive || activeResponseInProgress) && userTranscript.trim().length > 2) {
          cancelAssistantPlayback();
        }
        break;
      case "conversation.item.input_audio_transcription.completed": {
        clearInterruptionTimer();
        clearTranscriptionSafetyTimer();
        const raw = event.transcript?.trim() || userTranscript.trim();
        const cleanWords = raw.replace(/[.,!?;:\-–—"'`~^]/gu, "").trim();

        if (!cleanWords || cleanWords.length < 1) {
          userTranscript = "";
          options.onUserTranscript("", false);
          options.onVoiceState("listening");
          break;
        }

        userTranscript = raw;
        options.onUserTranscript(userTranscript, true);
        options.onVoiceState("analyzing");
        activeResponseInProgress = true;

        const currentContext = getContextSnapshot();
        localSessionTurns.push({ role: "user", text: userTranscript });
        if (localSessionTurns.length > 12) localSessionTurns.shift();

        send({
          type: "response.create",
          response: { instructions: buildTranscriptBoundResponse(userTranscript, currentContext) }
        });
        break;
      }
      case "conversation.item.input_audio_transcription.failed":
        clearTranscriptionSafetyTimer();
        options.onVoiceState("listening");
        break;
      case "response.created":
        activeResponseInProgress = true;
        assistantTranscript = "";
        options.onVoiceState("analyzing");
        break;
      case "response.output_audio_transcript.delta":
        assistantTranscript += event.delta ?? "";
        options.onAssistantTranscript(assistantTranscript, false);
        break;
      case "response.output_audio_transcript.done":
        assistantTranscript = event.transcript?.trim() || assistantTranscript.trim();
        options.onAssistantTranscript(assistantTranscript, true);
        if (assistantTranscript) {
          localSessionTurns.push({ role: "crazy", text: assistantTranscript });
          if (localSessionTurns.length > 12) localSessionTurns.shift();
        }
        break;
      case "output_audio_buffer.started":
        audioPlaying = true;
        assistantAudioActive = true;
        syncMicrophone();
        audio.muted = false;
        void audio.play().catch(() => {});
        options.onVoiceState("speaking");
        break;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        audioPlaying = false;
        assistantAudioActive = false;
        activeResponseInProgress = false;
        window.setTimeout(syncMicrophone, 180);
        audio.muted = false;
        options.onVoiceState("listening");
        break;
      case "response.done":
        activeResponseInProgress = false;
        if (!audioPlaying) options.onVoiceState("listening");
        break;
      case "error": {
        const errorMsg = event.error?.message || "";
        // Ignora erros inofensivos de corrida de cancelamento da OpenAI Realtime
        if (
          errorMsg.toLowerCase().includes("cancellation failed") ||
          errorMsg.toLowerCase().includes("no active response") ||
          errorMsg.toLowerCase().includes("buffer is empty")
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
    const response = await fetch(
      `/api/realtime/session?level=${encodeURIComponent(options.level)}&mode=${encodeURIComponent(options.mode)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
        signal: options.signal
      }
    );

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
    await waitForDataChannel(channel, options.signal);
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

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
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      options.onStatus("failed");
      options.onError(getConnectionError(error));
    }
    throw error;
  }
}
