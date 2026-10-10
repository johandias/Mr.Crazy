import type { Emotion, VoiceState } from "@/lib/mr-crazy";
import type { CharacterGesture } from "@/components/RpgCharacter";
import type { CSSProperties } from "react";

type PixelMrCrazyProps = Readonly<{
  voiceState: VoiceState;
  gesture: CharacterGesture;
  emotion: Emotion;
  crazyLevel: number;
  lookX: number;
  lookY: number;
  phoneme: number;
  isBlinking: boolean;
}>;

/**
 * Mr. Crazy em pixel art: silhuetas em degraus + pequenos blocos de luz criam
 * volume sem depender de textura, WebGL ou asset externo.
 */
export function PixelMrCrazy({
  voiceState,
  gesture,
  emotion,
  crazyLevel,
  lookX,
  lookY,
  phoneme,
  isBlinking
}: PixelMrCrazyProps) {
  const activity = voiceState === "speaking" ? "speaking" : voiceState === "listening" ? "listening" : "idle";
  const faceX = Math.round(lookX * 2);
  const faceY = Math.round(lookY * 1.5);
  const mouth = voiceState === "speaking" ? phoneme : 0;

  return (
    <svg
      className={`pixel-mr-crazy-art pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""}`}
      viewBox="0 0 160 210"
      role="img"
      aria-label="Mr. Crazy, personagem pixel-art de RPG"
      shapeRendering="crispEdges"
      style={{ "--pixel-energy": Math.max(0.25, crazyLevel / 100) } as CSSProperties}
    >
      <g className="pixel-cape">
        <path fill="#531c2b" d="M42 104h-9v8h-6v47h8v13h12v8h18v-8h10v-49H42zM118 104h9v8h6v47h-8v13h-12v8H95v-8H85v-49h33z" />
        <path fill="#8e2938" d="M39 109h11v9h7v48h-8v8H38v-9h-7v-45h8zM121 109h-11v9h-7v48h8v8h11v-9h7v-45h-8z" />
        <path fill="#c94c4b" d="M35 116h6v38h-5v-7h-4v-25h3zM125 116h-6v38h5v-7h4v-25h-3z" />
      </g>

      <g className="pixel-body">
        <path fill="#10343c" d="M55 103h50v6h8v12h6v43h-7v9H48v-9h-7v-43h6v-12h8z" />
        <path fill="#12545f" d="M58 106h44v7h8v12h5v38h-8v7H53v-7h-8v-38h5v-12h8z" />
        <path fill="#207c83" d="M61 109h15v56H54v-34h5v-14h2zM84 109h16v8h6v48H84z" />
        <path fill="#41a5a0" d="M61 113h7v43h-6v-8h-4v-27h3zM91 113h7v8h5v29h-5v-22h-7z" />
        <path fill="#0b3d48" d="M76 106h8v61h-8zM49 159h60v8H49z" />
        <path fill="#f2b544" d="M76 111h8v9h-8zM76 130h8v9h-8zM76 149h8v9h-8z" />
        <path fill="#8d5b15" d="M78 113h3v5h-3zM78 132h3v5h-3zM78 151h3v5h-3z" />
        <path fill="#f7d878" d="M78 112h2v3h-2zM78 131h2v3h-2z" />
      </g>

      <g className="pixel-legs">
        <path fill="#242541" d="M55 165h22v25h-5v12H54v-7h-7v-16h8zM84 165h22v14h8v16h-7v7H88v-12h-4z" />
        <path fill="#3d3d66" d="M58 168h16v20h-4v10H56v-6h-4v-13h6zM87 168h16v13h7v13h-5v5H91v-11h-4z" />
        <path fill="#5b2f20" d="M51 188h23v16h-5v5H45v-11h6zM90 188h22v16h5v5H85v-11h5z" />
        <path fill="#9b5434" d="M54 190h16v8H52v-5h2zM93 190h16v8H91v-5h2z" />
        <path fill="#d47a4c" d="M55 191h8v3h-8zM94 191h8v3h-8z" />
      </g>

      <g className="pixel-arms pixel-arm-left">
        <path fill="#0b3d48" d="M47 116h-9v7h-7v25h7v8h12v-8h7v-20h-6v-12z" />
        <path fill="#207c83" d="M43 119h-6v9h-4v16h7v7h8v-7h5v-16h-5v-9z" />
        <path fill="#ffd2b4" d="M31 145h11v9h-5v5h-8v-5h-3v-6h5z" />
        <path fill="#b9684f" d="M29 150h7v6h-7z" />
      </g>
      <g className="pixel-arms pixel-arm-right">
        <path fill="#0b3d48" d="M113 116h9v7h7v25h-7v8h-12v-8h-7v-20h6v-12z" />
        <path fill="#207c83" d="M117 119h6v9h4v16h-7v7h-8v-7h-5v-16h5v-9z" />
        <path fill="#ffd2b4" d="M129 145h-11v9h5v5h8v-5h3v-6h-5z" />
        <path fill="#b9684f" d="M124 150h7v6h-7z" />
      </g>

      <g className="pixel-head" transform={`translate(${faceX} ${faceY})`}>
        <path fill="#b9684f" d="M54 39h8v-8h8v-6h20v6h8v8h8v29h-6v13h-8v9H68v-9h-8V68h-6z" />
        <path fill="#ffd2b4" d="M59 43h7v-7h9v-5h14v5h9v7h6v25h-6v12H68V68h-9z" />
        <path fill="#f97316" d="M54 43v-9h7v-9h8v-7h7v5h8v-8h8v7h10v6h7v9h5v11h-8v-6H62v6z" />
        <path fill="#9a3412" d="M58 37h8v-8h7v-5h5v7h-7v9h-8v8h-5zM91 23h7v7h8v8h6v7h-7v-5h-8v-8h-6z" />
        <path fill="#ffb05f" d="M65 29h6v-6h5v6h-5v6h-6zM88 20h5v7h-5zM100 31h6v7h-6z" />
        <path fill="#8a483e" d="M60 62h12v5H60zM88 62h12v5H88z" />
        <g className="pixel-eye pixel-eye-left"><rect fill="#28151a" x="65" y="60" width="8" height="5" /><rect fill="#fff1d6" x="66" y="60" width="2" height="2" /></g>
        <g className="pixel-eye pixel-eye-right"><rect fill="#28151a" x="88" y="60" width="8" height="5" /><rect fill="#fff1d6" x="89" y="60" width="2" height="2" /></g>
        <path fill="#b9684f" d="M78 64h6v8h-4v4h-5v-4h3z" />
        <g className="pixel-mouth">
          {mouth === 2 ? <rect fill="#46131c" x="76" y="78" width="9" height="9" /> : mouth === 1 ? <rect fill="#46131c" x="70" y="79" width="22" height="5" /> : mouth === 3 ? <rect fill="#46131c" x="75" y="80" width="11" height="3" /> : <path fill="#46131c" d="M71 79h20v5h-5v3h-10v-3h-5z" />}
          {voiceState === "speaking" && mouth !== 2 && <rect fill="#fff1d6" x="75" y="79" width="4" height="2" />}
        </g>
        <path fill="#f0a27e" d="M65 70h7v3h-7zM89 70h7v3h-7z" />
      </g>

      <g className="pixel-gesture-layer" aria-hidden="true">
        <g className="pixel-gesture-finger"><path fill="#ffd2b4" d="M122 117h7v-18h5v23h-5v7h-7z" /><path fill="#b9684f" d="M129 99h5v6h-5z" /></g>
        <g className="pixel-gesture-thumbsup"><path fill="#ffd2b4" d="M121 126h8v-12h6v18h-5v6h-9z" /><path fill="#b9684f" d="M129 114h6v6h-6z" /></g>
        <g className="pixel-gesture-heart"><path fill="#f43f5e" d="M67 126h6v-5h6v5h3v-5h6v5h6v8H88v6h-5v5h-5v-5h-5v-6h-6z" /><path fill="#ff9b9b" d="M73 126h5v4h-5zM85 126h5v4h-5z" /></g>
        <g className="pixel-gesture-watergun"><path fill="#ffd2b4" d="M119 124h10v-6h9v6h-5v6h-14z" /><path fill="#f2b544" d="M136 118h8v5h-8z" /><path fill="#7dd3fc" d="M145 119h7v3h-7z" /></g>
      </g>

      <g className="pixel-sparkles" aria-hidden="true">
        <rect fill="#f2b544" x="24" y="67" width="4" height="4" /><rect fill="#f7d878" x="28" y="63" width="3" height="3" />
        <rect fill="#7dd3fc" x="132" y="77" width="4" height="4" /><rect fill="#f2b544" x="138" y="72" width="3" height="3" />
      </g>
    </svg>
  );
}
