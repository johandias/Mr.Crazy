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

const INITIAL_RESPONSE =
  "Inicie a sessão agora. Faça uma provocação curta em português, diga em poucas palavras o foco do treino e termine com uma pergunta em inglês adequada ao nível escolhido. Não espere o usuário falar primeiro.";

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

  const setMicrophoneEnabled = (enabled: boolean) => {
    microphoneEnabled = enabled;
    microphone.enabled = enabled;
  };

  const disconnect = () => {
    if (disconnected) return;
    disconnected = true;
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
        assistantTranscript = "";
        options.onUserTranscript("", false);
        options.onAssistantTranscript("", false);
        options.onVoiceState("listening");
        break;
      case "input_audio_buffer.speech_stopped":
        options.onVoiceState("transcribing");
        break;
      case "conversation.item.input_audio_transcription.delta":
        userTranscript += event.delta ?? "";
        options.onUserTranscript(userTranscript, false);
        break;
      case "conversation.item.input_audio_transcription.completed":
        userTranscript = event.transcript?.trim() || userTranscript.trim();
        options.onUserTranscript(userTranscript, true);
        options.onVoiceState("analyzing");
        break;
      case "response.created":
        assistantTranscript = "";
        options.onAssistantTranscript("", false);
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
        options.onVoiceState("speaking");
        break;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        audioPlaying = false;
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
    options.onVoiceState("analyzing");
    send({
      type: "response.create",
      response: { instructions: INITIAL_RESPONSE }
    });

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
        return created && send({ type: "response.create" });
      },
      finishTurn() {
        if (!microphoneEnabled) return;
        microphone.enabled = false;
        options.onVoiceState("transcribing");
        window.setTimeout(() => {
          if (!disconnected && microphoneEnabled) microphone.enabled = true;
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
