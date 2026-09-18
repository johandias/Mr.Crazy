import type { LearningLevel, VoiceState } from "@/lib/mr-crazy";
import { openMicrophone, type MicrophoneCapture } from "./voice/microphone";
import { VoiceError, getConnectionError, isAbortError, waitFor, type VoiceDiagnostic, type VoiceStage } from "./voice/diagnostics";

export { getConnectionError, isAbortError } from "./voice/diagnostics";
export type { VoiceDiagnostic } from "./voice/diagnostics";
export type RealtimeConnectionStatus = "idle" | "connecting" | "connected" | "failed";
export type RealtimeController = {
  disconnect: () => void;
  finishTurn: () => void;
  sendText: (text: string) => boolean;
  setMicrophoneEnabled: (enabled: boolean) => void;
  interrupt: () => void;
};
type Options = {
  level: LearningLevel;
  mode: string;
  moduleId?: string;
  deviceId?: string;
  signal?: AbortSignal;
  getRecentContext?: () => { role: string; text: string }[];
  onStatus: (status: RealtimeConnectionStatus) => void;
  onVoiceState: (state: VoiceState) => void;
  onUserTranscript: (text: string, complete: boolean) => void;
  onAssistantTranscript: (text: string, complete: boolean) => void;
  onError: (message: string) => void;
  onDiagnostic?: (event: VoiceDiagnostic) => void;
  onInputLevel?: (level: number) => void;
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
  let closed = false;
  let connected = false;
  let microphoneEnabled = true;
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
  const syncCapture = () => {
    capture?.setEnabled(microphoneEnabled && !playbackActive && document.visibilityState !== "hidden");
    if (!connected || closed) return;
    options.onVoiceState(playbackActive ? (audio?.paused ? "preparing_speech" : "speaking") : responseActive ? "analyzing" : microphoneEnabled && document.visibilityState !== "hidden" ? "listening" : "idle");
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
    if (!pendingTurn || userSpeaking || responseActive || playbackActive) return;
    later("turn", 1500, () => {
      if (!pendingTurn || userSpeaking || responseActive || playbackActive) return;
      pendingTurn = false;
      responseActive = send({ type: "response.create" });
      if (responseActive) { log("response_recovery", "Solicitada resposta ao áudio confirmado."); syncCapture(); watchResponse(); }
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
    if (audio?.srcObject && document.visibilityState !== "hidden") {
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
    capture = await openMicrophone({ signal: lifetime.signal, deviceId: options.deviceId, onLevel: options.onInputLevel });
    log("capture_ready", "Dispositivo de entrada aberto.");
    listen(capture.track, "ended", () => report(new VoiceError("microphone_ended", "O microfone foi desconectado. Escolha uma entrada e reconecte."), true));
    listen(capture.track, "mute", () => {
      if (document.visibilityState !== "hidden") later("capture-muted", 5000, () => {
        if (document.visibilityState !== "hidden") report(new VoiceError("microphone_interrupted", "O dispositivo parou de fornecer áudio. Verifique o microfone ou reconecte."), true);
      });
    });
    listen(capture.track, "unmute", () => clear("capture-muted"));
    stage = "offer";
    peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    channel = peer.createDataChannel("oai-events");
    audio = document.createElement("audio");
    audio.autoplay = true;
    audio.setAttribute("playsinline", "");
    audio.setAttribute("aria-hidden", "true");
    audio.style.display = "none";
    document.body.appendChild(audio);
    peer.addTrack(capture.track, capture.stream);
    listen(peer, "track", ((event: RTCTrackEvent) => {
      if (!audio) return;
      audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
      resume();
    }) as EventListener);
    listen(audio, "playing", () => { if (playbackActive) options.onVoiceState("speaking"); });
    listen(document, "visibilitychange", resume);
    listen(window, "pageshow", resume);
    listen(window, "pointerdown", resume);
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
          userSpeaking = true; clear("turn");
          if (!responseActive && !playbackActive) clear("response");
          stage = "listening"; log("speech_started", "A API detectou voz."); break;
        case "input_audio_buffer.speech_stopped":
          userSpeaking = false; options.onVoiceState("analyzing"); watchResponse(); recoverTurn(); break;
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
          options.onUserTranscript((event.transcript ?? transcripts.get(key) ?? "").trim(), true);
          transcripts.delete(key); break;
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
          stage = "playback"; playbackActive = true; clear("echo"); watchResponse(); syncCapture(); break;
        case "output_audio_buffer.stopped":
        case "output_audio_buffer.cleared":
          later("echo", 200, () => { playbackActive = false; if (!responseActive) clear("response"); syncCapture(); recoverTurn(); }); break;
        case "response.done": {
          responseActive = false;
          const text = event.response?.output?.flatMap(item => item.content ?? []).map(item => item.transcript ?? item.text ?? "").join(" ");
          commitAssistant(text || assistantText);
          if (!playbackActive) { clear("response"); syncCapture(); recoverTurn(); }
          if (event.response?.status === "failed") report(new VoiceError("response_failed", "A API não conseguiu gerar a resposta.", { providerCode: event.response.status_details?.error?.code }));
          break;
        }
        case "error":
          if (event.error?.code === "response_cancel_not_active" || event.error?.code === "input_audio_buffer_commit_empty") break;
          if (event.error?.code === "conversation_already_has_active_response") { responseActive = true; watchResponse(); break; }
          report(new VoiceError("provider_event_error", "A API de voz recusou uma operação. Consulte o código no diagnóstico.", { providerCode: event.error?.code }), !connected);
          if (connected) { responseActive = false; if (!playbackActive) clear("response"); syncCapture(); }
          break;
      }
    }) as EventListener);
    const offer = await waitFor(peer.createOffer(), lifetime.signal, 5000, "offer_timeout");
    await waitFor(peer.setLocalDescription(offer), lifetime.signal, 5000, "local_description_timeout");
    if (peer.iceGatheringState !== "complete") {
      await waitFor(new Promise<void>(resolve => {
        listen(peer!, "icegatheringstatechange", () => { if (peer?.iceGatheringState === "complete") resolve(); });
        later("ice-gather", 1500, resolve);
      }), lifetime.signal, 2000, "ice_gather_timeout");
    }
    const query = new URLSearchParams({ level: options.level, mode: options.mode, ...(options.moduleId ? { moduleId: options.moduleId } : {}) });
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
      if (error instanceof VoiceError && error.code.startsWith("client_secret")) throw error;
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
      setMicrophoneEnabled(enabled) { microphoneEnabled = enabled; resume(); },
      interrupt() {
        if (responseActive) send({ type: "response.cancel" });
        send({ type: "output_audio_buffer.clear" });
        responseActive = playbackActive = false; clear("response"); syncCapture();
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
      }
    };
  } catch (error) {
    if (!isAbortError(error) && !closed) report(error, true);
    else disconnect();
    throw error;
  }
}
