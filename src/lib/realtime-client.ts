import type { LearningLevel, VoiceState } from "@/lib/mr-crazy";
import { openMicrophone, type AudioFrequencyMetrics, type MicrophoneCapture } from "./voice/microphone";
import { VoiceError, getConnectionError, isAbortError, waitFor, type VoiceDiagnostic, type VoiceStage } from "./voice/diagnostics";
import { isNoiseOrHallucination } from "./voice/noise-filter";

export { getConnectionError, isAbortError } from "./voice/diagnostics";
export { isNoiseOrHallucination } from "./voice/noise-filter";
export type { VoiceDiagnostic } from "./voice/diagnostics";
export type { AudioFrequencyMetrics } from "./voice/microphone";
export type RealtimeConnectionStatus = "idle" | "connecting" | "connected" | "failed";
export type RealtimeController = {
  disconnect: () => void;
  finishTurn: () => void;
  commitTurn: () => void;
  cancelTurn: () => void;
  sendText: (text: string) => boolean;
  setMicrophoneEnabled: (enabled: boolean) => void;
  interrupt: () => void;
  updateInstructions: (instructions: string) => boolean;
};
type Options = {
  level: LearningLevel;
  mode: string;
  moduleId?: string;
  conceptIndex?: number;
  initialMicrophoneEnabled?: boolean;
  deviceId?: string;
  signal?: AbortSignal;
  getRecentContext?: () => { role: string; text: string }[];
  onStatus: (status: RealtimeConnectionStatus) => void;
  onVoiceState: (state: VoiceState) => void;
  onUserSpeechStarted?: () => void;
  onUserTranscript: (text: string, complete: boolean) => void;
  onAssistantTranscript: (text: string, complete: boolean) => void;
  onError: (message: string) => void;
  onDiagnostic?: (event: VoiceDiagnostic) => void;
  onInputLevel?: (level: number) => void;
  onInputMetrics?: (metrics: AudioFrequencyMetrics) => void;
  onOutputMetrics?: (metrics: AudioFrequencyMetrics) => void;
};
type Content = { text?: string; transcript?: string };
type ServerEvent = {
  type: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  text?: string;
  error?: { code?: string; message?: string };
  response?: { id?: string; status?: string; output?: { content?: Content[] }[]; status_details?: { error?: { code?: string; message?: string } } };
};
type SessionErrorPayload = {
  error?: string;
  code?: string;
  providerCode?: string;
  providerStatus?: number;
  diagnosticId?: string;
  providerMessage?: string;
  providerParam?: string;
  testedModel?: string;
};

function parseSessionErrorPayload(body: string): SessionErrorPayload {
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed as SessionErrorPayload : {};
  } catch {
    return {};
  }
}

async function readSessionText(response: Response, signal: AbortSignal, timeoutCode = "session_body_timeout") {
  return waitFor(response.text(), signal, 5000, timeoutCode);
}

export async function connectRealtime(options: Options): Promise<RealtimeController> {
  const id = crypto.randomUUID();
  const started = Date.now();
  const lifetime = new AbortController();
  let stage: VoiceStage = "microphone";
  let capture: MicrophoneCapture | undefined;
  let peer: RTCPeerConnection | undefined;
  let channel: RTCDataChannel | undefined;
  let audio: HTMLAudioElement | undefined;
  let remoteAudioCtx: AudioContext | undefined;
  let remoteAnalyser: AnalyserNode | undefined;
  let remoteTimer: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  let connected = false;
  let microphoneEnabled = options.initialMicrophoneEnabled ?? false;
  let responseActive = false;
  let playbackActive = false;
  let userSpeaking = false;
  let pendingTurn = false;
  let assistantText = "";
  let assistantCommitted = false;
  const transcripts = new Map<string, string>();
  const completed = new Set<string>();
  const cleanup: (() => void)[] = [];
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const clear = (key: string) => { clearTimeout(timers.get(key)); timers.delete(key); };
  const later = (key: string, ms: number, fn: () => void) => {
    clear(key);
    timers.set(key, setTimeout(() => { timers.delete(key); if (!closed) fn(); }, ms));
  };
  const log = (code: string, message: string, details: Partial<VoiceDiagnostic> = {}) => {
    const event = { id, stage, code, message, elapsedMs: Date.now() - started, ...details };
    options.onDiagnostic?.(event);
    // No SDP, credentials, device identifiers, audio or transcripts are logged.
    console.info("[Voice]", event);
  };
  const listen = (target: EventTarget, type: string, listener: EventListener) => {
    target.addEventListener(type, listener);
    cleanup.push(() => target.removeEventListener(type, listener));
  };
  const disconnect = () => {
    if (closed) return;
    closed = true;
    lifetime.abort();
    cleanup.forEach(remove => remove());
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();
    clearInterval(remoteTimer);
    if (remoteAudioCtx) void remoteAudioCtx.close().catch(() => {});
    remoteAudioCtx = undefined;
    remoteAnalyser = undefined;
    capture?.stop();
    channel?.close();
    peer?.close();
    if (audio) { audio.pause(); audio.srcObject = null; audio.remove(); }
  };
  const report = (error: unknown, fatal = false) => {
    if (closed) return;
    const message = getConnectionError(error);
    log(error instanceof VoiceError ? error.code : error instanceof Error ? error.name : "unknown_error", message, error instanceof VoiceError ? error.details : {});
    if (fatal) { disconnect(); options.onStatus("failed"); options.onVoiceState("idle"); }
    options.onError(message);
  };
  const send = (event: object) => {
    if (closed || channel?.readyState !== "open") return false;
    try { channel.send(JSON.stringify(event)); return true; }
    catch { report(new VoiceError("channel_send_failed", "A conexão não conseguiu enviar a mensagem. Reconecte a voz."), true); return false; }
  };
  let echoGuardActive = false;
  const syncCapture = () => {
    const shouldCapture = microphoneEnabled && !pendingTurn && !playbackActive && !responseActive && !echoGuardActive && document.visibilityState !== "hidden";
    capture?.setEnabled(shouldCapture);
    if (!connected || closed) return;
    options.onVoiceState(
      playbackActive
        ? (audio?.paused ? "preparing_speech" : "speaking")
        : responseActive || pendingTurn
        ? "analyzing"
        : microphoneEnabled && document.visibilityState !== "hidden"
        ? "listening"
        : "idle"
    );
  };
  const watchResponse = () => later("response", 30_000, () => {
    if (responseActive) send({ type: "response.cancel" });
    send({ type: "output_audio_buffer.clear" });
    responseActive = playbackActive = false;
    syncCapture();
    report(new VoiceError("response_timeout", "O áudio foi recebido, mas a resposta demorou demais. Tente novamente."));
  });
  const recoverTurn = () => {
    clear("turn");
    if (!pendingTurn || userSpeaking || playbackActive) return;
    later("turn", 1500, () => {
      if (!pendingTurn || userSpeaking || playbackActive) return;
      pendingTurn = false;
      responseActive = true;
      syncCapture();
      if (send({ type: "response.create" })) {
        log("response_recovery", "Solicitada resposta de contingência.");
        watchResponse();
      } else {
        responseActive = false;
        syncCapture();
      }
    });
  };
  const commitAssistant = (text = assistantText) => {
    if (!text.trim() || assistantCommitted) return;
    assistantCommitted = true;
    options.onAssistantTranscript(text.trim(), true);
  };
  const resume = () => {
    if (document.visibilityState === "hidden") clear("capture-muted");
    capture?.resume();
    syncCapture();
    if (audio?.srcObject && audio.paused && document.visibilityState !== "hidden") {
      void audio.play().catch(() => report(new VoiceError("playback_blocked", "O navegador bloqueou o som. Toque na tela para liberar o áudio.")));
    }
  };
  const abort = () => disconnect();
  options.signal?.addEventListener("abort", abort, { once: true });
  cleanup.push(() => options.signal?.removeEventListener("abort", abort));
  options.onStatus("connecting");

  try {
    if (options.signal?.aborted) { disconnect(); throw new DOMException("Aborted", "AbortError"); }
    log("capture_start", "Solicitando acesso ao microfone.");
    capture = await openMicrophone({
      signal: lifetime.signal,
      deviceId: options.deviceId,
      initialEnabled: microphoneEnabled,
      onLevel: options.onInputLevel,
      onMetrics: options.onInputMetrics
    });
    capture.setEnabled(microphoneEnabled);
    log("capture_ready", "Dispositivo de entrada aberto.");
    listen(capture.track, "ended", () => report(new VoiceError("microphone_ended", "O microfone foi desconectado. Escolha uma entrada e reconecte."), true));
    listen(capture.track, "mute", () => {
      if (microphoneEnabled && document.visibilityState !== "hidden") {
        later("capture-muted", 5000, () => {
          if (microphoneEnabled && document.visibilityState !== "hidden") {
            report(new VoiceError("microphone_interrupted", "O dispositivo parou de fornecer áudio. Verifique o microfone ou reconecte."), true);
          }
        });
      }
    });
    listen(capture.track, "unmute", () => clear("capture-muted"));

    const setupRemoteAnalyser = (stream: MediaStream) => {
      try {
        const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        if (!remoteAudioCtx) remoteAudioCtx = new AudioContextClass();
        const source = remoteAudioCtx.createMediaStreamSource(stream);
        remoteAnalyser = remoteAudioCtx.createAnalyser();
        remoteAnalyser.fftSize = 256;
        remoteAnalyser.smoothingTimeConstant = 0.55;
        source.connect(remoteAnalyser);
        // Sink silencioso para estabilidade de clock do Web Audio no Chrome/Safari sem duplicar saída
        const silentGain = remoteAudioCtx.createGain();
        silentGain.gain.value = 0;
        remoteAnalyser.connect(silentGain);
        silentGain.connect(remoteAudioCtx.destination);

        const freqData = new Uint8Array(remoteAnalyser.frequencyBinCount);
        const timeData = new Float32Array(remoteAnalyser.fftSize);

        clearInterval(remoteTimer);
        remoteTimer = setInterval(() => {
          if (closed || !remoteAnalyser) return;
          if (!playbackActive) {
            options.onOutputMetrics?.({ level: 0, bass: 0, mid: 0, high: 0, bands: new Array(12).fill(0) });
            return;
          }

          remoteAnalyser.getFloatTimeDomainData(timeData);
          remoteAnalyser.getByteFrequencyData(freqData);

          let sumSq = 0;
          for (let i = 0; i < timeData.length; i++) sumSq += timeData[i] * timeData[i];
          const rms = Math.sqrt(sumSq / timeData.length);
          const level = Math.min(1, rms * 7.5);

          // Análise de graves (voz do Mr. Crazy / graves e peso de 20Hz a 250Hz)
          let bassSum = 0;
          for (let b = 0; b <= 3; b++) bassSum += freqData[b];
          const bass = Math.min(1, (bassSum / (4 * 255)) * 1.7);

          let midSum = 0;
          for (let b = 4; b <= 20; b++) midSum += freqData[b];
          const mid = Math.min(1, (midSum / (17 * 255)) * 1.4);

          let highSum = 0;
          for (let b = 21; b <= 60; b++) highSum += freqData[b];
          const high = Math.min(1, (highSum / (40 * 255)) * 1.5);

          const bandRanges = [
            [0, 1], [1, 2], [2, 3], [3, 5], [5, 8], [8, 12],
            [12, 18], [18, 26], [26, 36], [36, 50], [50, 70], [70, 100]
          ];
          const bands = bandRanges.map(([start, end]) => {
            let bSum = 0;
            let count = 0;
            for (let k = start; k <= end && k < freqData.length; k++) {
              bSum += freqData[k];
              count++;
            }
            const avg = count > 0 ? bSum / (count * 255) : 0;
            return Math.min(1, avg * 1.5);
          });

          options.onOutputMetrics?.({ level, bass, mid, high, bands });
        }, 50);
        void remoteAudioCtx.resume().catch(() => {});
      } catch (err) {
        console.warn("[Voice] Remote analyser error", err);
      }
    };

    stage = "offer";
    peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    channel = peer.createDataChannel("oai-events");
    audio = document.createElement("audio");
    audio.autoplay = true;
    audio.setAttribute("playsinline", "");
    audio.setAttribute("aria-hidden", "true");
    try {
      const vol = parseFloat(window.localStorage.getItem("mr-crazy-audio-volume") || "100");
      if (!isNaN(vol)) audio.volume = Math.max(0, Math.min(1, vol / 100));
    } catch {}
    // Mantém o elemento no DOM com baixa opacidade para evitar que o iOS/Android throttle o playback de background
    audio.style.position = "fixed";
    audio.style.pointerEvents = "none";
    audio.style.opacity = "0.001";
    audio.style.width = "1px";
    audio.style.height = "1px";
    audio.style.bottom = "0";
    audio.style.right = "0";
    document.body.appendChild(audio);
    peer.addTrack(capture.track, capture.stream);
    listen(peer, "track", ((event: RTCTrackEvent) => {
      if (!audio) return;
      const remoteStream = event.streams[0] ?? new MediaStream([event.track]);
      audio.srcObject = remoteStream;
      setupRemoteAnalyser(remoteStream);
      resume();
    }) as EventListener);
    listen(audio, "playing", () => { if (playbackActive) options.onVoiceState("speaking"); });
    listen(document, "visibilitychange", resume);
    listen(window, "pageshow", resume);
    listen(window, "pointerdown", () => {
      if (audio?.srcObject && audio.paused && playbackActive && document.visibilityState !== "hidden") {
        void audio.play().catch(() => {});
      }
    });
    listen(window, "pagehide", () => { capture?.setEnabled(false); });
    listen(peer, "connectionstatechange", () => {
      log("peer_state", `Transporte: ${peer?.connectionState}.`);
      if (peer?.connectionState === "failed") report(new VoiceError("transport_failed", "A rede bloqueou ou perdeu a conexão de áudio. Tente outra rede e reconecte."), true);
      else if (peer?.connectionState === "disconnected") later("network", 6000, () => report(new VoiceError("transport_disconnected", "A conexão de áudio caiu. Reconecte para continuar."), true));
      else if (peer?.connectionState === "connected") clear("network");
    });
    listen(channel, "close", () => report(new VoiceError("channel_closed", "O canal da conversa foi encerrado. Reconecte para continuar."), true));
    listen(channel, "error", () => report(new VoiceError("channel_error", "O canal de mensagens da voz falhou. Reconecte para continuar."), true));
    let markReady!: () => void;
    let sessionReady = false;
    let channelReady = channel.readyState === "open";
    const ready = new Promise<void>(resolve => { markReady = resolve; });
    const checkReady = () => { if (sessionReady && channelReady) markReady(); };
    listen(channel, "open", () => { channelReady = true; checkReady(); });
    listen(channel, "message", ((message: MessageEvent) => {
      if (closed) return;
      let event: ServerEvent;
      try { event = JSON.parse(String(message.data)); } catch { return; }
      if (!event || typeof event.type !== "string") return;
      switch (event.type) {
        case "session.created":
        case "session.updated":
          sessionReady = true; checkReady(); break;
        case "input_audio_buffer.speech_started":
          userSpeaking = true;
          clear("turn");
          options.onUserSpeechStarted?.();
          // A captura é desativada durante a fala do tutor; portanto, este evento
          // representa uma nova intervenção do aluno e precisa interromper a resposta.
          if (playbackActive || responseActive) {
            send({ type: "response.cancel" });
            send({ type: "output_audio_buffer.clear" });
            audio?.pause();
            playbackActive = false;
            responseActive = false;
          }
          responseActive = false;
          playbackActive = false;
          assistantText = "";
          assistantCommitted = false;
          clear("response");
          clear("echo");
          stage = "listening";
          options.onVoiceState("listening");
          log("speech_started", "Voz do aluno detectada.");
          break;
        case "input_audio_buffer.speech_stopped":
          userSpeaking = false;
          options.onVoiceState("analyzing");
          syncCapture();
          break;
        case "input_audio_buffer.committed":
          pendingTurn = true; recoverTurn(); break;
        case "conversation.item.input_audio_transcription.delta": {
          const key = event.item_id ?? "current";
          const text = (transcripts.get(key) ?? "") + (event.delta ?? "");
          transcripts.set(key, text); options.onUserTranscript(text, false); break;
        }
        case "conversation.item.input_audio_transcription.completed": {
          const key = event.item_id ?? "current";
          if (event.item_id && completed.has(key)) break;
          if (event.item_id) completed.add(key);
          if (completed.size > 100) completed.delete(completed.values().next().value!);
          const rawTranscript = (event.transcript ?? transcripts.get(key) ?? "").trim();
          transcripts.delete(key);

          if (isNoiseOrHallucination(rawTranscript)) {
            log("noise_cancelled", `Ruído ou alucinação descartada: "${rawTranscript}".`);
            // Se a resposta ainda não começou a falar e apenas estava sendo gerada, cancela.
            // Mas se o professor já estiver falando (playbackActive), NUNCA corta o áudio no meio da frase!
            if (responseActive && !playbackActive) {
              send({ type: "response.cancel" });
              send({ type: "output_audio_buffer.clear" });
              responseActive = false;
              clear("response");
              clear("echo");
              syncCapture();
            }
            options.onUserTranscript("", true);
            break;
          }

          options.onUserTranscript(rawTranscript, true);
          break;
        }
        case "conversation.item.input_audio_transcription.failed":
          report(new VoiceError("transcription_failed", "A transcrição não está disponível; a resposta continua usando o áudio.")); break;
        case "response.created":
          stage = "response"; pendingTurn = false; responseActive = true; assistantText = ""; assistantCommitted = false;
          clear("turn"); watchResponse(); syncCapture(); break;
        case "response.output_audio_transcript.delta":
        case "response.audio_transcript.delta":
        case "response.output_text.delta":
        case "response.text.delta":
          assistantText += event.delta ?? ""; options.onAssistantTranscript(assistantText, false); break;
        case "response.output_audio_transcript.done":
        case "response.audio_transcript.done":
        case "response.output_text.done":
        case "response.text.done":
          commitAssistant(event.transcript ?? event.text); break;
        case "output_audio_buffer.started":
          if (audio?.paused) { void audio.play().catch(() => {}); }
          stage = "playback"; playbackActive = true; clear("echo"); watchResponse(); syncCapture(); break;
        case "output_audio_buffer.stopped":
        case "output_audio_buffer.cleared":
          playbackActive = false;
          echoGuardActive = true;
          pendingTurn = false;
          clear("turn");
          if (!responseActive) clear("response");
          syncCapture();
          later("echo", 350, () => {
            echoGuardActive = false;
            syncCapture();
          });
          break;
        case "response.done": {
          responseActive = false;
          const text = event.response?.output?.flatMap(item => item.content ?? []).map(item => item.transcript ?? item.text ?? "").join(" ");
          commitAssistant(text || assistantText);
          if (event.response?.status !== "cancelled") {
            const text = event.response?.output?.flatMap(item => item.content ?? []).map(item => item.transcript ?? item.text ?? "").join(" ");
            commitAssistant(text || assistantText);
          }
          pendingTurn = false; clear("turn"); if (!playbackActive) { clear("response"); syncCapture(); }
          if (event.response?.status === "failed") report(new VoiceError("response_failed", "A API não conseguiu gerar a resposta.", { providerCode: event.response.status_details?.error?.code }));
          break;
        }
        case "error":
          if (event.error?.code === "response_cancel_not_active" || event.error?.code === "input_audio_buffer_commit_empty") break;
          if (event.error?.code === "response_cancel_not_active" || event.error?.code === "input_audio_buffer_commit_empty" || event.error?.code === "output_audio_buffer_clear_not_active") break;
          if (event.error?.code === "conversation_already_has_active_response") { responseActive = true; watchResponse(); break; }
          report(new VoiceError("provider_event_error", "A API de voz recusou uma operação. Consulte o código no diagnóstico.", { providerCode: event.error?.code }), !connected);
          if (connected) { responseActive = false; if (!playbackActive) clear("response"); syncCapture(); }
          break;
      }
    }) as EventListener);
    const offer = await waitFor(peer.createOffer(), lifetime.signal, 5000, "offer_timeout");
    await waitFor(peer.setLocalDescription(offer), lifetime.signal, 5000, "local_description_timeout");
    if (peer.iceGatheringState !== "complete") {
      try {
        // O endpoint SDP precisa receber candidatos ICE suficientes. Resolver no
        // primeiro candidato (ou em 150 ms) gera ofertas incompletas em redes
        // móveis/Vercel e deixa o botão preso em "Conectando".
        await waitFor(new Promise<void>(resolve => {
          const checkComplete = () => {
            if (peer?.iceGatheringState === "complete") resolve();
          };
          listen(peer!, "icegatheringstatechange", checkComplete);
          checkComplete();
        }), lifetime.signal, 1800, "ice_gather_timeout");
      } catch (error) {
        const availableSdp = peer.localDescription?.sdp ?? "";
        if (!availableSdp.includes("a=candidate:")) throw error;
        log("ice_partial", "ICE não terminou no limite; usando os candidatos disponíveis.");
      }
    }
    const query = new URLSearchParams({
      level: options.level,
      mode: options.mode,
      ...(options.moduleId ? { moduleId: options.moduleId } : {}),
      ...(options.conceptIndex !== undefined ? { conceptIndex: String(options.conceptIndex) } : {})
    });
    const localSdp = peer.localDescription?.sdp ?? offer.sdp;
    const openViaProxy = async () => {
      stage = "api"; log("session_request", "Abrindo sessão na API pelo proxy.");
      const response = await waitFor(fetch(`/api/realtime/session?${query}`, {
        method: "POST", headers: { "Content-Type": "application/sdp", "X-Voice-Request-Id": id },
        body: localSdp, signal: lifetime.signal
      }), lifetime.signal, 25_000, "session_request_timeout");
      const body = await readSessionText(response, lifetime.signal);
      if (!response.ok) {
        const payload = parseSessionErrorPayload(body);
        throw new VoiceError(payload.code ?? "session_rejected", payload.error || "O servidor recusou a conexão de voz. Consulte o status no diagnóstico.", {
          httpStatus: response.status, providerStatus: payload.providerStatus,
          providerCode: payload.providerCode, serverId: payload.diagnosticId ?? response.headers.get("X-Voice-Request-Id") ?? undefined,
          providerMessage: payload.providerMessage, providerParam: payload.providerParam, model: payload.testedModel
        });
      }
      return body;
    };
    const openDirect = async () => {
      stage = "api"; log("client_secret_request", "Gerando token efêmero de voz.");
      const tokenResponse = await waitFor(fetch(`/api/realtime/client-secret?${query}`, {
        method: "GET", headers: { "X-Voice-Request-Id": id }, signal: lifetime.signal
      }), lifetime.signal, 16_000, "client_secret_request_timeout");
      const tokenBody = await readSessionText(tokenResponse, lifetime.signal, "client_secret_body_timeout");
      if (!tokenResponse.ok) {
        const payload = parseSessionErrorPayload(tokenBody);
        throw new VoiceError(payload.code ?? "client_secret_rejected", payload.error || "O servidor recusou o token de voz.", {
          httpStatus: tokenResponse.status, providerStatus: payload.providerStatus,
          providerCode: payload.providerCode, serverId: payload.diagnosticId ?? tokenResponse.headers.get("X-Voice-Request-Id") ?? undefined,
          providerMessage: payload.providerMessage, providerParam: payload.providerParam, model: payload.testedModel
        });
      }
      let tokenPayload: { value?: string; model?: string; diagnosticId?: string };
      try { tokenPayload = JSON.parse(tokenBody); }
      catch { throw new VoiceError("invalid_client_secret", "O servidor retornou um token de voz inválido."); }
      if (!tokenPayload.value) throw new VoiceError("missing_client_secret", "O servidor não retornou o token de voz.");
      log("direct_session_request", "Abrindo sessão direta com a OpenAI.", { model: tokenPayload.model, serverId: tokenPayload.diagnosticId });
      const response = await waitFor(fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenPayload.value}`, "Content-Type": "application/sdp" },
        body: localSdp,
        signal: lifetime.signal
      }), lifetime.signal, 25_000, "direct_session_request_timeout");
      const body = await readSessionText(response, lifetime.signal, "direct_session_body_timeout");
      if (!response.ok) {
        const provider = parseSessionErrorPayload(body);
        throw new VoiceError(provider.code ?? "direct_session_rejected", "A OpenAI recusou a conexão direta de voz.", {
          httpStatus: response.status,
          providerStatus: response.status,
          providerCode: provider.code,
          providerMessage: provider.error,
          model: tokenPayload.model,
          serverId: tokenPayload.diagnosticId
        });
      }
      return body;
    };
    let body: string;
    try {
      body = await openDirect();
    } catch (error) {
      // O token efêmero é um caminho rápido, mas pode estar indisponível em um
      // deploy antigo ou ser bloqueado por CORS. Falhas de autenticação/cota não
      // devem gerar uma segunda chamada; falhas de infraestrutura podem usar o
      // proxy SDP, que é o caminho compatível de recuperação.
      if (error instanceof VoiceError && [401, 403, 429].includes(error.details.httpStatus ?? 0)) throw error;
      const message = getConnectionError(error);
      log(error instanceof VoiceError ? error.code : error instanceof Error ? error.name : "direct_session_failed", `Conexão direta falhou; tentando proxy. ${message}`, error instanceof VoiceError ? error.details : {});
      body = await openViaProxy();
    }
    if (!body.trimStart().startsWith("v=0")) throw new VoiceError("invalid_sdp_answer", "O servidor retornou uma resposta de conexão inválida.");
    stage = "transport"; log("session_accepted", "API aceitou a sessão. Aguardando o canal de áudio.");
    await waitFor(peer.setRemoteDescription({ type: "answer", sdp: body }), lifetime.signal, 5000, "remote_description_timeout");
    await waitFor(ready, lifetime.signal, 12_000, "transport_timeout");
    if (closed) throw new DOMException("Aborted", "AbortError");
    connected = true;
    for (const turn of (options.getRecentContext?.() ?? []).slice(-6)) {
      send({ type: "conversation.item.create", item: { type: "message", role: turn.role === "user" ? "user" : "assistant", content: [{ type: turn.role === "user" ? "input_text" : "output_text", text: turn.text }] } });
    }
    stage = "listening"; log("connected", "Conversa conectada. Detecção automática de fala ativa.");
    options.onStatus("connected"); syncCapture();
    return {
      disconnect,
      setMicrophoneEnabled(enabled) {
        microphoneEnabled = enabled;
        if (!enabled) clear("capture-muted");
        resume();
      },
      updateInstructions(instructions) {
        if (!instructions.trim()) return false;
        return send({ type: "session.update", session: { instructions } });
      },
      interrupt() {
        if (responseActive) send({ type: "response.cancel" });
        send({ type: "output_audio_buffer.clear" });
        responseActive = playbackActive = false; clear("response"); syncCapture();
        if (audio) { audio.pause(); }
        responseActive = playbackActive = false;
        assistantText = "";
        assistantCommitted = false;
        clear("response");
        clear("echo");
        syncCapture();
      },
      sendText(text) {
        if (!text.trim() || closed || responseActive || playbackActive || userSpeaking) return false;
        if (!send({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: text.trim() }] } })) return false;
        options.onUserTranscript(text.trim(), true);
        responseActive = send({ type: "response.create" });
        syncCapture(); watchResponse(); return responseActive;
      },
      finishTurn() {
        if (!microphoneEnabled || !userSpeaking) return;
        // Let server VAD observe silence instead of racing an explicit buffer commit.
        capture?.setEnabled(false); later("manual-stop", 1100, syncCapture);
      },
      commitTurn() {
        if (closed) return;
        userSpeaking = false;
        capture?.setEnabled(false);
        send({ type: "input_audio_buffer.commit" });
        responseActive = send({ type: "response.create" });
        syncCapture();
        watchResponse();
      },
      cancelTurn() {
        if (closed) return;
        userSpeaking = false;
        capture?.setEnabled(false);
        send({ type: "input_audio_buffer.clear" });
        syncCapture();
      }
    };
  } catch (error) {
    if (!isAbortError(error) && !closed) report(error, true);
    else disconnect();
    throw error;
  }
}
