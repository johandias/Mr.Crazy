import { VoiceError, waitFor } from "./diagnostics";
import { markMicrophoneGranted } from "./mic-permission";

export type MicrophoneCapture = {
  stream: MediaStream;
  track: MediaStreamTrack;
  stop: () => void;
  setEnabled: (enabled: boolean) => void;
  resume: () => void;
};

export type AudioFrequencyMetrics = {
  level: number;
  bass: number;
  mid: number;
  high: number;
  bands: number[];
};

export async function openMicrophone(options: {
  signal: AbortSignal;
  deviceId?: string;
  onLevel?: (level: number) => void;
  onMetrics?: (metrics: AudioFrequencyMetrics) => void;
}): Promise<MicrophoneCapture> {
  if (options.signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new VoiceError("capture_unsupported", "A captura precisa de HTTPS e de um navegador com suporte a microfone.");
  }
  let abandoned = false;
  const acquire = async () => {
    const audio: MediaTrackConstraints & { latency?: ConstrainDouble } = {
      echoCancellation: true, noiseSuppression: true, autoGainControl: true,
      channelCount: { ideal: 1 },
      latency: { ideal: 0.01 },
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
  // Persiste permissão concedida para sessões futuras (elimina re-prompt nos retornos)
  markMicrophoneGranted();
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
    options.onMetrics?.({ level: 0, bass: 0, mid: 0, high: 0, bands: new Array(12).fill(0) });
  };
  options.signal.addEventListener("abort", stop, { once: true });
  if (options.signal.aborted) { stop(); throw new DOMException("Aborted", "AbortError"); }
  // Metering is observational. Server VAD remains responsible for turn detection.
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && (options.onLevel || options.onMetrics)) {
      context = new AudioContextClass();
      source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Float32Array(analyser.fftSize);

      timer = setInterval(() => {
        if (stopped) return;
        if (!track.enabled || track.muted) {
          options.onLevel?.(0);
          options.onMetrics?.({ level: 0, bass: 0, mid: 0, high: 0, bands: new Array(12).fill(0) });
          return;
        }

        analyser.getFloatTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) sumSq += timeData[i] * timeData[i];
        const rms = Math.sqrt(sumSq / timeData.length);
        const level = Math.min(1, rms * 7.5);

        // Análise de graves (frequências fundamentais de voz / graves de 20Hz a 250Hz)
        let bassSum = 0;
        for (let b = 0; b <= 3; b++) bassSum += freqData[b];
        const bass = Math.min(1, (bassSum / (4 * 255)) * 1.7);

        // Médios (250Hz a 2000Hz)
        let midSum = 0;
        for (let b = 4; b <= 20; b++) midSum += freqData[b];
        const mid = Math.min(1, (midSum / (17 * 255)) * 1.4);

        // Agudos (2000Hz+)
        let highSum = 0;
        for (let b = 21; b <= 60; b++) highSum += freqData[b];
        const high = Math.min(1, (highSum / (40 * 255)) * 1.5);

        // 12 Bandas de espectro para equalizador visual dinâmico
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

        options.onLevel?.(level);
        options.onMetrics?.({ level, bass, mid, high, bands });
      }, 30);
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
