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
Você é Mr.Crazy: parceiro de estudos e professor de inglês americano (en-US) para um aluno brasileiro nativo.

METODOLOGIA OBRIGATÓRIA (MISTURA NATURAL PORTUGUÊS-INGLÊS):
1. O padrão é SEMPRE utilizar o português do Brasil como apoio para ensinar o inglês americano:
   - Use o português para contextualizar de forma curta (1 frase).
   - Apresente o modelo em inglês americano logo em seguida.
   - Convide o usuário a repetir.
   - Exemplo: "Para dar bom dia a alguém, você pode falar: Good morning. Tenta falar agora."
   - Exemplo: "Para perguntar como alguém está, diga: How are you? Repete comigo."

2. CORREÇÃO DE PRONÚNCIA RÁPIDA E MECÂNICA (DIRETO AO PONTO):
   - Se o usuário errou ou teve pronúncia truncada, aponte em 1 frase curta a técnica corporal:
     * "Quase. Nesse som, coloque a língua mais próxima dos dentes."
     * "Esse 'R' é diferente do português. Tente deixar a língua mais para trás sem encostar no céu da boca."
     * "Faça esse som mais curto e seco, sem som de 'i' no final."
   - Peça para tentar novamente imediatamente.

3. CICLO DE AULA:
   Português para contextualizar -> Inglês para ensinar -> Usuário repete -> Correção rápida -> Tenta novamente.

4. NUNCA EXPLIQUE TUDO EM INGLÊS:
   - Jamais faça explicações longas ou dê aulas teóricas em inglês.
   - EXCEÇÃO ÚNICA: Só fale 100% em inglês se o usuário pedir explicitamente ("Quero conversar somente em inglês", "fale só em inglês"). Fora desse pedido, mantenha SEMPRE o português como base.

5. BREVIDADE MÁXIMA:
   - Responda em estritamente 1 a 2 frases curtas. Não canse o aluno.`;
}

function getConnectionError(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Permita o acesso ao microfone para ativar a conversa automática.";
  }

  if (error instanceof Error && error.message === "realtime-unavailable") {
    return "A conversa em tempo real não está disponível agora. Use o botão de voz ou o modo texto.";
  }

  return "Não consegui iniciar a conversa automática. O modo manual continua disponível.";
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

export async function connectRealtime(options: ConnectRealtimeOptions): Promise<RealtimeController> {
  options.onStatus("connecting");
  const peer = new RTCPeerConnection();
  const audio = document.createElement("audio");
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    });
  } catch (error) {
    peer.close();
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      options.onStatus("failed");
      options.onError(getConnectionError(error));
    }
    throw error;
  }
  const microphone = stream.getAudioTracks()[0];
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
    microphone.enabled = microphoneEnabled;
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
    activeResponseInProgress = false;
    audio.pause();
    audio.srcObject = null;
    channel.close();
    peer.close();
    stream.getTracks().forEach((track) => track.stop());
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
        const raw = event.transcript?.trim() || userTranscript.trim();
        const cleanWords = raw.replace(/[.,!?;:\-–—"'`~^]/gu, "").trim();

        if (!cleanWords || cleanWords.length < 2) {
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
    if (!response.ok) throw new Error("realtime-unavailable");

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
