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

function buildTranscriptBoundResponse(transcript: string) {
  const cleanTranscript = transcript.trim();
  if (!cleanTranscript) {
    return "O último áudio não gerou transcrição nítida. Peça em uma única frase curta em português do Brasil para o usuário repetir.";
  }

  return `O usuário acabou de falar: "${cleanTranscript}".
Você é Mr.Crazy: parceiro de estudos humano, descontraído e direto, ensinando inglês americano (en-US) para um aluno brasileiro nativo.

REGRA ABSOLUTA DE IDIOMA:
- FALE SEMPRE EM PORTUGUÊS DO BRASIL (pt-BR). Sua fala e sua resposta devem ser em português brasileiro natural.
- O inglês americano entra apenas como APOIO pedagógico (frases de exemplo, pronúncia ou expressões para treinar).
- NÃO TENTE LEVAR TUDO PARA O INGLÊS: se o usuário falou em português (saudação, pergunta, desabafo ou dúvida), responda em português brasileiro. Não force o usuário a falar inglês.
- NUNCA fale exclusivamente em inglês, a não ser que o usuário tenha pedido expressamente ("vamos falar só em inglês", "fale em inglês comigo").

DIRETRIZES FUNDAMENTAIS:
1. BREVIDADE MÁXIMA: Responda em estritamente 1 a 2 frases curtas e diretas. Não seja prolixo, não fale várias coisas juntas e jamais repita explicações.
2. SAUDAÇÕES E BATE-PAPO: Se o usuário cumprimentou ("opa, tudo bem?", "oi"), retribua de forma humana e calorosa em português do Brasil em 1 frase curta (ex: "Opa, tudo ótimo! Como posso te ajudar hoje?"). Sem avaliar e sem empurrar inglês.
3. PRÁTICA ASSISTIDA: Quando o usuário pedir para treinar ou perguntar como falar algo, ensine a frase em inglês americano e guie 1 passo por vez.
4. TÉCNICA DE PRONÚNCIA: Se ensinar pronúncia para o brasileiro, ensine a mecânica da língua em português (ex: travar o som seco sem "i" no fim; ponta da língua entre os dentes pro 'th').
5. REGRA DOS 80%: Se a comunicação fez sentido, continue como um amigo humano, sem jargões robóticos como "Passou!" ou "Muito bem!".`;
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

  let interruptionTimer: number | null = null;
  const clearInterruptionTimer = () => {
    if (interruptionTimer !== null) {
      window.clearTimeout(interruptionTimer);
      interruptionTimer = null;
    }
  };

  const cancelAssistantPlayback = () => {
    clearInterruptionTimer();
    if (audioPlaying || assistantAudioActive) {
      audioPlaying = false;
      assistantAudioActive = false;
      audio.muted = true;
      audio.pause();
      send({ type: "response.cancel" });
    }
  };

  const disconnect = () => {
    if (disconnected) return;
    disconnected = true;
    clearInterruptionTimer();
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
        if (audioPlaying || assistantAudioActive) {
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
        if ((audioPlaying || assistantAudioActive) && userTranscript.trim().length > 2) {
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
        send({
          type: "response.create",
          response: { instructions: buildTranscriptBoundResponse(userTranscript) }
        });
        break;
      }
      case "response.created":
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
        window.setTimeout(syncMicrophone, 180);
        audio.muted = false;
        options.onVoiceState("listening");
        break;
      case "response.done":
        if (!audioPlaying) options.onVoiceState("listening");
        break;
      case "error":
        options.onError(event.error?.message || "A API de voz retornou um erro.");
        break;
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
          response: { instructions: buildTranscriptBoundResponse(cleanText) }
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
