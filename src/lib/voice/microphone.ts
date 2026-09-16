import { VoiceError, waitFor } from "./diagnostics";

export type MicrophoneCapture = {
  stream: MediaStream;
  track: MediaStreamTrack;
  stop: () => void;
  setEnabled: (enabled: boolean) => void;
  resume: () => void;
};

export async function openMicrophone(options: {
  signal: AbortSignal;
  deviceId?: string;
  onLevel?: (level: number) => void;
}): Promise<MicrophoneCapture> {
  if (options.signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new VoiceError("capture_unsupported", "A captura precisa de HTTPS e de um navegador com suporte a microfone.");
  }
  let abandoned = false;
  const acquire = async () => {
    const audio: MediaTrackConstraints = {
      echoCancellation: true, noiseSuppression: true, autoGainControl: true,
      channelCount: { ideal: 1 },
      ...(options.deviceId ? { deviceId: { exact: options.deviceId } } : {})
    };
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio });
    } catch (error) {
      // Retry constraints only, never retry a denied permission or change a selected device.
      if (options.deviceId || options.signal.aborted || abandoned || !(error instanceof Error) || error.name !== "OverconstrainedError") throw error;
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    if (abandoned || options.signal.aborted) {
      stream.getTracks().forEach(track => track.stop());
      throw new DOMException("Aborted", "AbortError");
    }
    return stream;
  };
  let stream: MediaStream;
  try { stream = await waitFor(acquire(), options.signal, 20_000, "microphone_permission_timeout"); }
  catch (error) { abandoned = true; throw error; }
  const track = stream.getAudioTracks()[0];
  if (!track || track.readyState !== "live") {
    stream.getTracks().forEach(item => item.stop());
    throw new VoiceError("microphone_no_track", "O dispositivo abriu sem uma faixa de áudio ativa.");
  }
  let stopped = false;
  let context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    options.signal.removeEventListener("abort", stop);
    clearInterval(timer);
    source?.disconnect();
    if (context) void context.close().catch(() => {});
    stream.getTracks().forEach(item => item.stop());
    options.onLevel?.(0);
  };
  options.signal.addEventListener("abort", stop, { once: true });
  if (options.signal.aborted) { stop(); throw new DOMException("Aborted", "AbortError"); }
  // Metering is observational. Server VAD remains responsible for turn detection.
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && options.onLevel) {
      context = new AudioContextClass();
      source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      timer = setInterval(() => {
        if (stopped) return;
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
        options.onLevel?.(track.enabled && !track.muted ? Math.min(1, rms * 8) : 0);
      }, 150);
      void context.resume().catch(() => {});
    }
  } catch {
    source?.disconnect();
    if (context) void context.close().catch(() => {});
    context = undefined;
  }
  return {
    stream, track, stop,
    setEnabled(enabled) { if (!stopped) track.enabled = enabled; },
    resume() { if (!stopped && context?.state === "suspended") void context.resume().catch(() => {}); }
  };
}
