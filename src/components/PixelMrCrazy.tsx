import type { CSSProperties } from "react";
import type { CharacterGesture } from "@/components/RpgCharacter";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";

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

/** Mr. Crazy em pixel art vetorial: cada detalhe é desenhado em código e permanece animável. */
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
      viewBox="0 0 192 240"
      role="img"
      aria-label="Mr. Crazy, personagem pixel-art de RPG"
      shapeRendering="crispEdges"
      style={{ "--pixel-energy": Math.max(0.25, crazyLevel / 100) } as CSSProperties}
    >
      <ellipse className="pixel-ground-shadow" cx="96" cy="226" rx="55" ry="7" fill="#070b12" opacity=".8" />

      <g className="pixel-cape">
        <path fill="#351522" d="M55 112H43v8H34v14H27v54h8v18h15v11h22v-8h9v-77H55zM137 112h12v8h9v14h7v54h-8v18h-15v11h-22v-8h-9v-77h24z" />
        <path fill="#74263b" d="M53 116H43v12h-8v49h8v18h14v11h18v-70H53zM139 116h10v12h8v49h-8v18h-14v11h-18v-70h22z" />
        <path fill="#aa3d4b" d="M45 124h7v12h6v54h-9v-11h-6v-43h2zM147 124h-7v12h-6v54h9v-11h6v-43h-2z" />
        <path fill="#e26558" d="M39 132h5v30h-4v-7h-4v-18h3zM153 132h-5v30h4v-7h4v-18h-3z" />
        <path fill="#531c2b" d="M57 118h10v8H57zM135 118h-10v8h10z" />
      </g>

      <g className="pixel-legs">
        <path fill="#20233e" d="M66 169h27v35h-6v15H67v-7H56v-14h10zM99 169h27v29h10v14h-11v7h-20v-15h-6z" />
        <path fill="#353861" d="M70 173h20v28h-5v13H70v-7h-8v-9h8zM103 173h20v25h8v9h-8v7h-15v-14h-5z" />
        <path fill="#572e25" d="M59 202h34v22h-7v7H48v-17h11zM101 202h33v12h11v17h-38v-7h-6z" />
        <path fill="#8e4b36" d="M62 205h26v12H57v-7h5zM105 205h25v12h6v5h-31z" />
        <path fill="#d17a52" d="M63 207h15v4H63zM107 207h15v4h-15z" />
        <path fill="#26151b" d="M48 224h46v7H48zM98 224h47v7H98z" />
      </g>

      <g className="pixel-body">
        <path fill="#092f3b" d="M65 106h62v7h10v12h7v42h-7v13H55v-13h-7v-42h7v-12h10z" />
        <path fill="#155d68" d="M67 109h58v8h8v12h6v37h-9v11H62v-11h-9v-37h6v-12h8z" />
        <path fill="#23868b" d="M69 112h22v57H60v-30h5v-17h4zM101 112h22v10h6v47h-28z" />
        <path fill="#52b4aa" d="M70 117h9v42h-7v-10h-5v-23h3zM105 116h10v8h5v31h-6v-22h-9z" />
        <path fill="#0b3a49" d="M91 108h10v62H91zM59 160h74v9H59z" />
        <path fill="#f5c348" d="M91 114h10v11H91zM91 137h10v11H91zM91 159h10v10H91z" />
        <path fill="#8b5918" d="M94 116h4v6h-4zM94 139h4v6h-4zM94 161h4v6h-4z" />
        <path fill="#ffe291" d="M94 115h3v4h-3zM94 138h3v4h-3z" />
        <path fill="#f2b544" d="M58 162h76v6H58z" />
        <path fill="#f9d779" d="M63 163h20v2H63zM109 163h20v2h-20z" />
      </g>

      <g className="pixel-arms pixel-arm-left">
        <path fill="#092f3b" d="M58 115H45v7h-8v12h-7v27h8v12h18v-7h9v-37h-7z" />
        <path fill="#155d68" d="M54 118H45v8h-7v10h-5v21h8v10h12v-7h7v-31h-6z" />
        <path fill="#4aa69f" d="M43 123h7v24h-6v-10h-5v-8h4z" />
        <path fill="#f5c348" d="M45 117h12v7H45z" />
        <path fill="#ffd6b9" d="M31 153h13v8h7v9h-7v6H33v-5h-6v-12h4z" />
        <path fill="#c46d58" d="M29 160h8v10h-8zM40 170h8v5h-8z" />
        <rect fill="#ffe8ce" x="35" y="155" width="6" height="4" />
      </g>
      <g className="pixel-arms pixel-arm-right">
        <path fill="#092f3b" d="M134 115h13v7h8v12h7v27h-8v12h-18v-7h-9v-37h7z" />
        <path fill="#155d68" d="M138 118h9v8h7v10h5v21h-8v10h-12v-7h-7v-31h6z" />
        <path fill="#4aa69f" d="M149 123h-7v24h6v-10h5v-8h-4z" />
        <path fill="#f5c348" d="M135 117h12v7h-12z" />
        <path fill="#ffd6b9" d="M161 153h-13v8h-7v9h7v6h11v-5h6v-12h-4z" />
        <path fill="#c46d58" d="M163 160h-8v10h8zM152 170h-8v5h8z" />
        <rect fill="#ffe8ce" x="151" y="155" width="6" height="4" />
      </g>

      <g className="pixel-head" transform={`translate(${faceX} ${faceY})`}>
        <path fill="#a55745" d="M57 42h7V31h9v-8h10v-6h27v6h10v8h9v11h7v39h-7v14h-9v10H72v-10h-9V81h-6z" />
        <path fill="#ffd6b9" d="M63 45h7v-9h10v-6h22v6h10v9h8v33h-7v14h-10v9H80v-9H70V78h-7z" />
        <path fill="#f47b24" d="M56 48V35h8v-12h9v-9h10v8h8V9h10v8h12v8h10v9h8v14h-8v-7h-8v-8h-43v8h-9v7z" />
        <path fill="#c44419" d="M60 37h8V24h8v-6h7v11h-6v11h-9v9h-8zM101 15h10v9h10v10h8v8h-9v-5h-9v-9h-10z" />
        <path fill="#ffb45b" d="M72 24h8v-7h6v8h-5v8h-9zM94 13h7v9h-7zM113 25h8v8h-8z" />
        <path fill="#8f3d32" d="M63 68h14v5H63zM111 68h14v5h-14z" />
        <path fill="#3b2028" d="M70 61h17v5H70zM106 61h17v5h-17z" />
        <path fill="#fff0dc" d="M73 62h11v7H73zM109 62h11v7h-11z" />
        <g className="pixel-eye pixel-eye-left"><rect fill="#26151c" x="77" y="63" width="7" height="6" /><rect fill="#ffffff" x="78" y="63" width="2" height="2" /></g>
        <g className="pixel-eye pixel-eye-right"><rect fill="#26151c" x="109" y="63" width="7" height="6" /><rect fill="#ffffff" x="110" y="63" width="2" height="2" /></g>
        <path fill="#b5654d" d="M92 67h8v9h-4v5h-6v-5h2z" />
        <path fill="#e99979" d="M67 77h8v4h-8zM116 77h8v4h-8z" />
        <g className="pixel-mouth">
          {mouth === 2 ? <path fill="#48131c" d="M90 85h13v12H90z" /> : mouth === 1 ? <path fill="#48131c" d="M81 86h31v7H81z" /> : mouth === 3 ? <path fill="#48131c" d="M90 88h14v4H90z" /> : <path fill="#48131c" d="M84 86h25v6h-6v5H91v-5h-7z" />}
          {voiceState === "speaking" && mouth !== 2 && <rect fill="#fff4df" x="91" y="87" width="7" height="3" />}
        </g>
        <path fill="#7d352e" d="M81 98h28v5h-7v5H88v-5h-7z" />
        <path fill="#d9775b" d="M88 101h15v4H88z" />
      </g>

      <g className="pixel-gesture-layer" aria-hidden="true">
        <g className="pixel-gesture-finger"><path fill="#ffd6b9" d="M151 142h8v-31h7v38h-7v9h-8z" /><path fill="#c46d58" d="M159 111h7v9h-7z" /></g>
        <g className="pixel-gesture-thumbsup"><path fill="#ffd6b9" d="M150 151h10v-22h8v31h-6v9h-12z" /><path fill="#c46d58" d="M160 129h8v9h-8z" /></g>
        <g className="pixel-gesture-heart"><path fill="#f04a65" d="M77 144h8v-7h9v7h4v-7h9v7h8v11h-8v8h-7v7h-6v-7h-7v-8h-10z" /><path fill="#ff9ba7" d="M86 143h7v6h-7zM101 143h7v6h-7z" /></g>
        <g className="pixel-gesture-watergun"><path fill="#ffd6b9" d="M148 148h15v-9h11v8h-6v9h-20z" /><path fill="#f5c348" d="M172 139h10v7h-10z" /><path fill="#7dd3fc" d="M182 140h9v4h-9z" /></g>
      </g>

      <g className="pixel-sparkles" aria-hidden="true">
        <rect fill="#f5c348" x="31" y="71" width="5" height="5" /><rect fill="#ffe291" x="37" y="65" width="3" height="3" />
        <rect fill="#7dd3fc" x="153" y="83" width="5" height="5" /><rect fill="#f5c348" x="162" y="76" width="3" height="3" />
        <rect fill="#ffcf63" x="50" y="100" width="3" height="3" /><rect fill="#69d9d1" x="143" y="105" width="3" height="3" />
      </g>
    </svg>
  );
}
