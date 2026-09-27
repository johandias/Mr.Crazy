import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import type { VoiceState } from "@/lib/mr-crazy";

type Props = {
  active: boolean;
  speaking?: boolean;
  meterRef?: RefObject<HTMLMeterElement | null>;
  voiceState?: VoiceState;
  isAwake?: boolean;
  talkMode?: "continuous" | "push-to-talk";
  isHolding?: boolean;
};

export function ListeningWave({
  active,
  speaking = false,
  meterRef,
  voiceState,
  isAwake = true,
  talkMode = "continuous",
  isHolding = false
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAudible, setIsAudible] = useState(false);

  useEffect(() => {
    if (!active || speaking) {
      setIsAudible(false);
      return;
    }

    let animationFrameId: number;
    let smoothLevel = 0;

    const checkLevel = () => {
      const rawLevel = meterRef?.current?.value ?? 0;
      // Smooth attack and release for responsive audio visualizer
      if (rawLevel > smoothLevel) {
        smoothLevel = smoothLevel * 0.35 + rawLevel * 0.65;
      } else {
        smoothLevel = smoothLevel * 0.82 + rawLevel * 0.18;
      }

      const audible = smoothLevel > 0.12;
      setIsAudible(audible);

      if (containerRef.current) {
        containerRef.current.style.setProperty("--user-level", smoothLevel.toFixed(3));
      }
      animationFrameId = requestAnimationFrame(checkLevel);
    };

    animationFrameId = requestAnimationFrame(checkLevel);
    return () => cancelAnimationFrame(animationFrameId);
  }, [active, speaking, meterRef]);

  let statusBadge = "Toque no microfone para falar";
  if (speaking) {
    statusBadge = "🗣️ Mr. Crazy falando...";
  } else if (talkMode === "push-to-talk") {
    if (isHolding) {
      statusBadge = "🔴 Gravando áudio... Solte para enviar";
    } else {
      statusBadge = "🔘 Segure o microfone para falar";
    }
  } else if (!isAwake && active) {
    statusBadge = "😴 Mr. Crazy na rede... Fale para acordar!";
  } else if (isAudible) {
    statusBadge = "🎙️ Ouvindo você...";
  } else if (active) {
    statusBadge = "🎙️ Pode falar, estou ouvindo...";
  } else if (voiceState === "preparing_speech") {
    statusBadge = "Preparando resposta...";
  }

  return (
    <div
      ref={containerRef}
      className={`listening-wave-hub ${active ? "is-active" : "is-inactive"} ${speaking ? "is-speaking" : ""} ${isAudible ? "is-audible" : ""}`}
      aria-hidden="true"
    >
      <div className="wave-status-pill">
        <span className="wave-status-dot" />
        <span className="wave-status-label">{statusBadge}</span>
      </div>

      <div className="listening-wave-bars">
        {Array.from({ length: 20 }).map((_, index) => {
          // Center bars are weighted higher for a natural parabolic equalizer shape
          const centerDist = Math.abs(index - 9.5);
          const centerWeight = Math.max(0.25, 1 - (centerDist / 9.5) * 0.7);
          const heightMultiplier = speaking
            ? [0.35, 0.7, 1.0, 0.5, 0.9, 0.6, 0.85, 1.0, 0.65, 0.4][index % 10]
            : centerWeight;

          return (
            <span
              key={index}
              style={
                {
                  animationDelay: `${index * 36}ms`,
                  "--height-mult": `${heightMultiplier}`,
                  "--center-weight": `${centerWeight.toFixed(2)}`
                } as CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
}
