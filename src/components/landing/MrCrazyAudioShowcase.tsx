"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, Sparkles, Flame, Mic } from "lucide-react";
import { RpgCharacter, type CharacterGesture } from "@/components/RpgCharacter";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";
import type { LiveAudioVisualizer } from "@/components/VoiceInputControl";

interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  gesture: CharacterGesture;
  emotion: Emotion;
  crazyLevel: number;
}

const SUBTITLES: SubtitleSegment[] = [
  {
    id: 1,
    start: 0,
    end: 3.5,
    text: "Fala aí! Eu sou o Mr. Crazy. E sim, suas aulas vão ser comigo.",
    gesture: "thumbsup",
    emotion: "calm",
    crazyLevel: 15
  },
  {
    id: 2,
    start: 3.5,
    end: 7.8,
    text: "Aqui você não vai ficar só lendo regra e decorando palavra.",
    gesture: "finger",
    emotion: "annoyed",
    crazyLevel: 45
  },
  {
    id: 3,
    start: 7.8,
    end: 13.8,
    text: "Eu vou conversar com você, fazer perguntas, corrigir suas respostas e te colocar pra falar inglês de verdade.",
    gesture: "idle",
    emotion: "calm",
    crazyLevel: 25
  },
  {
    id: 4,
    start: 13.8,
    end: 20.8,
    text: "As aulas funcionam por etapas: eu explico, você responde com a sua voz, eu analiso o que você falou e a gente continua a conversa.",
    gesture: "finger",
    emotion: "calm",
    crazyLevel: 20
  },
  {
    id: 5,
    start: 20.8,
    end: 25.8,
    text: "E o que você tá vendo aqui agora já é um pouquinho de como tudo vai funcionar por dentro.",
    gesture: "thumbsup",
    emotion: "calm",
    crazyLevel: 20
  },
  {
    id: 6,
    start: 25.8,
    end: 29.8,
    text: "Vai ter prática, desafios, progresso por fases e muita conversa.",
    gesture: "idle",
    emotion: "calm",
    crazyLevel: 30
  },
  {
    id: 7,
    start: 29.8,
    end: 34.5,
    text: "A ideia é simples: você fala cada vez mais, trava cada vez menos e evolui comigo.",
    gesture: "thumbsup",
    emotion: "calm",
    crazyLevel: 35
  },
  {
    id: 8,
    start: 34.5,
    end: 38.0,
    text: "Então, bora começar!",
    gesture: "watergun",
    emotion: "crazy",
    crazyLevel: 85
  }
];

export function MrCrazyAudioShowcase() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Audio metrics passed to RpgCharacter
  const audioMetricsRef = useRef<LiveAudioVisualizer>({
    source: "none",
    level: 0,
    bass: 0,
    bands: []
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(37.5);
  const [isMuted, setIsMuted] = useState(false);
  const [waveBars, setWaveBars] = useState<number[]>(new Array(24).fill(6));

  // Current active segment
  const activeSegment = SUBTITLES.find(
    (s) => currentTime >= s.start && currentTime < s.end
  ) || SUBTITLES[0];

  const currentEmotion: Emotion = isPlaying ? activeSegment.emotion : "calm";
  const currentGesture: CharacterGesture = isPlaying ? activeSegment.gesture : "idle";
  const currentCrazyLevel: number = isPlaying ? activeSegment.crazyLevel : 15;
  const voiceState: VoiceState = isPlaying ? "speaking" : "idle";

  // Setup Web Audio API on first play gesture
  const initWebAudio = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    } catch {
      // Browsers may block before interaction or already have element connected
    }
  }, []);

  // Animation frame loop for equalizer and mouth sync
  useEffect(() => {
    if (!isPlaying) {
      audioMetricsRef.current = { source: "none", level: 0, bass: 0, bands: [] };
      setWaveBars(new Array(24).fill(6));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLoop = () => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        let bassSum = 0;
        const bars: number[] = [];

        for (let i = 0; i < 24; i++) {
          const index = Math.min(bufferLength - 1, Math.floor((i / 24) * bufferLength));
          const val = dataArray[index] || 0;
          sum += val;
          if (i < 4) bassSum += val;
          // Scale from min 4px to max 46px
          const barHeight = Math.max(4, Math.min(46, (val / 255) * 44 + 4));
          bars.push(barHeight);
        }

        const avg = sum / (24 * 255);
        const bassAvg = bassSum / (4 * 255);

        // Normalize bands 0..1 for character lip sync
        const normalizedBands = bars.map((b) => b / 46);

        audioMetricsRef.current = {
          source: "crazy",
          level: avg,
          bass: bassAvg,
          bands: normalizedBands
        };

        setWaveBars(bars);
      } else {
        // Fallback procedural wave bars if Web Audio is suspended
        const time = Date.now() / 150;
        const bars: number[] = [];
        for (let i = 0; i < 24; i++) {
          const wave = Math.sin(time + i * 0.4) * 0.5 + 0.5;
          bars.push(Math.round(wave * 26 + 6));
        }
        audioMetricsRef.current = {
          source: "crazy",
          level: 0.18,
          bass: 0.22,
          bands: bars.map((b) => b / 32)
        };
        setWaveBars(bars);
      }

      rafRef.current = requestAnimationFrame(updateAudioLoop);
    };

    rafRef.current = requestAnimationFrame(updateAudioLoop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  // Audio Play / Pause toggle
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    initWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch {
        // Ignored
      }
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Audio play prevented:", err);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleSegmentClick = (startTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      if (!isPlaying) {
        togglePlay();
      }
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        togglePlay();
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="landing-showcase-container">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src="/assets/audio/mrcrazy-landing-intro.mp3"
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Stage: Animated Mr. Crazy on Pedestal */}
      <div className="landing-showcase-stage">
        <div className="landing-showcase-pedestal">
          <div className="landing-showcase-energy-badge">
            {isPlaying ? (
              <>
                <Flame size={14} className="text-amber-400 animate-bounce" />
                <span>Nível de Energia: {currentCrazyLevel}%</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-amber-400" />
                <span>Toque no Play para ouvir o Mr. Crazy</span>
              </>
            )}
          </div>

          <div className="landing-showcase-stage-character">
            <RpgCharacter
              crazyLevel={currentCrazyLevel}
              emotion={currentEmotion}
              voiceState={voiceState}
              gesture={currentGesture}
              isAwake={true}
              audioMetricsRef={audioMetricsRef}
            />
          </div>
        </div>
      </div>

      {/* Interactive Audio Player & Dynamic Transcript */}
      <div className="landing-showcase-player-box">
        <div className="landing-showcase-player-header">
          <div>
            <h3 className="landing-showcase-player-title">O Recado do Mr. Crazy</h3>
            <p className="landing-showcase-player-sub">
              Ouça como o método funciona na voz original do professor
            </p>
          </div>
          <div className="landing-showcase-voice-badge">
            <Mic size={13} />
            <span>Voz Echo • Realtime</span>
          </div>
        </div>

        {/* Big Play / Pause and Waveform Equalizer */}
        <div className="landing-player-controls">
          <button
            type="button"
            className={`landing-player-play-btn ${isPlaying ? "playing" : ""}`}
            onClick={togglePlay}
            aria-label={isPlaying ? "Pausar áudio do Mr. Crazy" : "Ouvir áudio do Mr. Crazy"}
            title={isPlaying ? "Pausar" : "Dar Play"}
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 3 }} />}
          </button>

          <div className="landing-player-waveform" aria-hidden="true">
            {waveBars.map((height, i) => (
              <div
                key={i}
                className={`landing-wave-bar ${isPlaying ? "active" : ""}`}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="landing-btn-secondary"
              style={{ padding: "0.5rem", borderRadius: "0.5rem" }}
              onClick={handleRestart}
              title="Reiniciar áudio"
              aria-label="Reiniciar áudio"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              className="landing-btn-secondary"
              style={{ padding: "0.5rem", borderRadius: "0.5rem" }}
              onClick={toggleMute}
              title={isMuted ? "Ativar som" : "Mutar áudio"}
              aria-label={isMuted ? "Ativar som" : "Mutar áudio"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Progress Bar & Scrubber */}
        <div className="landing-player-progress-row">
          <input
            type="range"
            min={0}
            max={duration || 37.5}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="landing-player-slider"
            aria-label="Progresso do áudio do Mr. Crazy"
          />
          <div className="landing-player-time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Timed Subtitles (Karaoke-style synchronized transcript) */}
        <div className="landing-player-subtitles">
          <span style={{ fontSize: "0.725rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Transcrição Sincronizada (clique para pular):
          </span>
          {SUBTITLES.map((sub) => {
            const isActive = currentTime >= sub.start && currentTime < sub.end;
            return (
              <div
                key={sub.id}
                className={`landing-subtitle-line ${isActive ? "active" : ""}`}
                onClick={() => handleSegmentClick(sub.start)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleSegmentClick(sub.start);
                }}
              >
                {sub.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
