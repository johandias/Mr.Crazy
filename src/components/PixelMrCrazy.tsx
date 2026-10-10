import { useId, type CSSProperties } from "react";
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
  burstKey?: number;
  isAwake?: boolean;
}>;

/**
 * Mr. Crazy is intentionally drawn in code instead of being a flat bitmap.
 * The SVG keeps the RPG silhouette from the reference while leaving every
 * important part animatable: eyes, mouth, shoulders, cape, hands and impact FX.
 */
export function PixelMrCrazy({
  voiceState,
  gesture,
  emotion,
  crazyLevel,
  lookX,
  lookY,
  phoneme,
  isBlinking,
  burstKey = 0,
  isAwake = false
}: PixelMrCrazyProps) {
  const instanceId = useId().replace(/:/gu, "");
  const activity = voiceState === "speaking" ? "speaking" : voiceState === "listening" ? "listening" : "idle";
  const faceX = Math.round(lookX * 3);
  const faceY = Math.round(lookY * 2);
  const mouth = voiceState === "speaking" ? phoneme : 4;
  const energy = Math.max(0.25, crazyLevel / 100);
  const bodyLift = activity === "speaking" ? -4 : activity === "listening" ? 1 : 0;
  const mouthLabel = ["aberta", "esticada", "redonda", "fechando", "repouso"][mouth] ?? "repouso";

  const ids = {
    skin: `${instanceId}-skin`,
    skinShadow: `${instanceId}-skin-shadow`,
    hair: `${instanceId}-hair`,
    capeShadow: `${instanceId}-cape-shadow`,
    coat: `${instanceId}-coat`,
    coatShadow: `${instanceId}-coat-shadow`,
    gold: `${instanceId}-gold`,
    leather: `${instanceId}-leather`,
    glass: `${instanceId}-glass`,
    aura: `${instanceId}-aura`,
    shadow: `${instanceId}-shadow`,
    glow: `${instanceId}-glow`
  };

  return (
    <svg
      className={`pixel-mr-crazy-art pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""} ${isAwake ? "pixel-awake" : ""}`}
      viewBox="0 0 320 420"
      role="img"
      aria-label={`Mr. Crazy, personagem RPG ${activity === "speaking" ? `falando com boca ${mouthLabel}` : "pronto"}`}
      shapeRendering="crispEdges"
      data-phoneme={mouth}
      style={{ "--pixel-energy": energy } as CSSProperties}
    >
      <defs>
        <radialGradient id={ids.aura} cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#5eead4" stopOpacity=".28" />
          <stop offset="48%" stopColor="#38bdf8" stopOpacity=".1" />
          <stop offset="100%" stopColor="#0b1220" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ids.shadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#020617" stopOpacity=".8" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ids.skin} x1="20%" y1="10%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#fff1e7" />
          <stop offset="42%" stopColor="#f6b59d" />
          <stop offset="100%" stopColor="#b85d51" />
        </linearGradient>
        <linearGradient id={ids.skinShadow} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#f6b59d" />
          <stop offset="100%" stopColor="#8e3f3e" />
        </linearGradient>
        <linearGradient id={ids.hair} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#ffd08a" />
          <stop offset="28%" stopColor="#f97316" />
          <stop offset="72%" stopColor="#bd3d1f" />
          <stop offset="100%" stopColor="#5e1f25" />
        </linearGradient>
        <linearGradient id={ids.capeShadow} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7b2144" />
          <stop offset="100%" stopColor="#1c122d" />
        </linearGradient>
        <linearGradient id={ids.coat} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#58d0c5" />
          <stop offset="38%" stopColor="#137f87" />
          <stop offset="100%" stopColor="#0b354d" />
        </linearGradient>
        <linearGradient id={ids.coatShadow} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a6070" />
          <stop offset="100%" stopColor="#061c32" />
        </linearGradient>
        <linearGradient id={ids.gold} x1="5%" y1="0%" x2="95%" y2="100%">
          <stop offset="0%" stopColor="#fff2a6" />
          <stop offset="32%" stopColor="#f8c34c" />
          <stop offset="75%" stopColor="#b86b1d" />
          <stop offset="100%" stopColor="#673318" />
        </linearGradient>
        <linearGradient id={ids.leather} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c8784e" />
          <stop offset="55%" stopColor="#793b30" />
          <stop offset="100%" stopColor="#321a25" />
        </linearGradient>
        <linearGradient id={ids.glass} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9faff" stopOpacity=".75" />
          <stop offset="100%" stopColor="#5c94bf" stopOpacity=".15" />
        </linearGradient>
        <filter id={ids.glow} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <ellipse className="pixel-aura" cx="160" cy="190" rx="142" ry="178" fill={`url(#${ids.aura})`} />
      <ellipse className="pixel-ground-shadow" cx="160" cy="397" rx="105" ry="15" fill={`url(#${ids.shadow})`} />

      {burstKey > 0 && (
        <g key={burstKey} className="pixel-explosion-burst" aria-hidden="true">
          <circle className="pixel-explosion-ring" cx="160" cy="205" r="62" fill="none" />
          <path className="pixel-explosion-star" d="M160 105l12 67 42-38-32 51 64 8-65 10 39 47-50-34 1 67-13-65-45 37 34-52-65-6 64-12-36-48 48 35z" fill="#fbbf24" opacity=".9" />
          <path className="pixel-explosion-core" d="M160 157l10 35 37 10-37 10-10 36-10-36-37-10 37-10z" fill="#fff7c2" filter={`url(#${ids.glow})`} />
          <circle className="pixel-explosion-spark spark-one" cx="73" cy="163" r="6" fill="#67e8f9" />
          <circle className="pixel-explosion-spark spark-two" cx="246" cy="155" r="5" fill="#fb7185" />
          <circle className="pixel-explosion-spark spark-three" cx="82" cy="278" r="4" fill="#fbbf24" />
          <circle className="pixel-explosion-spark spark-four" cx="238" cy="285" r="6" fill="#f97316" />
        </g>
      )}

      <g className="pixel-rig" transform={`translate(0 ${bodyLift})`}>
        <g className="pixel-cape pixel-cape-back">
          <path d="M94 177c-34 14-58 51-67 111-4 30 1 66 10 89 26 10 48 12 72 7l10-167z" fill={`url(#${ids.capeShadow})`} stroke="#26142d" strokeWidth="6" />
          <path d="M226 177c34 14 58 51 67 111 4 30-1 66-10 89-26 10-48 12-72 7l-10-167z" fill={`url(#${ids.capeShadow})`} stroke="#26142d" strokeWidth="6" />
          <path d="M89 190c-25 26-37 76-34 151 14 9 29 12 45 12" fill="none" stroke="#f26b70" strokeOpacity=".5" strokeWidth="5" />
          <path d="M231 190c25 26 37 76 34 151-14 9-29 12-45 12" fill="none" stroke="#f26b70" strokeOpacity=".5" strokeWidth="5" />
        </g>

        <g className="pixel-legs">
          <path d="M120 292h48l-2 78-12 25h-49l8-33z" fill="#222b4c" stroke="#10162d" strokeWidth="6" />
          <path d="M152 292h48l7 70 8 33h-50l-12-25z" fill="#293458" stroke="#10162d" strokeWidth="6" />
          <path d="M108 358h51v39H92c-9 0-14-10-8-18l15-13z" fill={`url(#${ids.leather})`} stroke="#2f1b25" strokeWidth="6" />
          <path d="M161 358h51l17 18c6 8 1 18-8 18h-67z" fill={`url(#${ids.leather})`} stroke="#2f1b25" strokeWidth="6" />
          <path d="M107 364h45M173 364h46" stroke="#e09b60" strokeOpacity=".7" strokeWidth="5" />
          <rect x="129" y="369" width="14" height="11" rx="2" fill={`url(#${ids.gold})`} />
          <rect x="188" y="369" width="14" height="11" rx="2" fill={`url(#${ids.gold})`} />
        </g>

        <g className="pixel-body">
          <path d="M106 166c20-18 88-18 108 0l25 124c-18 18-43 28-79 28s-61-10-79-28z" fill={`url(#${ids.coatShadow})`} stroke="#07172b" strokeWidth="7" />
          <path d="M116 171c18-12 70-12 88 0l19 112c-18 12-39 18-63 18s-45-6-63-18z" fill={`url(#${ids.coat})`} />
          <path d="M160 171v127" stroke="#9de5dc" strokeOpacity=".4" strokeWidth="4" />
          <path d="M121 205h25M121 232h25M174 205h25M174 232h25" stroke="#82dfd3" strokeOpacity=".36" strokeWidth="5" strokeLinecap="round" />
          <path d="M106 277c32 10 76 10 108 0" stroke={`url(#${ids.gold})`} strokeWidth="10" />
          <rect x="142" y="265" width="36" height="31" rx="7" fill={`url(#${ids.gold})`} stroke="#75421d" strokeWidth="4" />
          <rect x="150" y="272" width="20" height="17" rx="3" fill="#321b2b" />
          <path d="M145 169l15 17 15-17" fill="#fff9ed" stroke="#d9d9d0" strokeWidth="3" />
          <path d="M150 170l10 25 10-25" fill="#1e2440" opacity=".92" />
          <circle cx="111" cy="194" r="12" fill={`url(#${ids.gold})`} stroke="#75421d" strokeWidth="4" />
          <circle cx="209" cy="194" r="12" fill={`url(#${ids.gold})`} stroke="#75421d" strokeWidth="4" />
        </g>

        <g className="pixel-arms pixel-arm-left">
          <path d="M111 178c-21 9-35 37-38 70l28 9 28-66z" fill={`url(#${ids.coatShadow})`} stroke="#07172b" strokeWidth="7" />
          <path d="M80 235c-5 11-4 27 4 37l22-8-7-31z" fill={`url(#${ids.leather})`} stroke="#321c27" strokeWidth="5" />
          <path d="M80 270c-3 13 6 25 21 27l16-15-11-17z" fill={`url(#${ids.skin})`} stroke="#6d3033" strokeWidth="5" />
        </g>
        <g className="pixel-arms pixel-arm-right">
          <path d="M209 178c21 9 35 37 38 70l-28 9-28-66z" fill={`url(#${ids.coatShadow})`} stroke="#07172b" strokeWidth="7" />
          <path d="M240 235c5 11 4 27-4 37l-22-8 7-31z" fill={`url(#${ids.leather})`} stroke="#321c27" strokeWidth="5" />
          <path d="M240 270c3 13-6 25-21 27l-16-15 11-17z" fill={`url(#${ids.skin})`} stroke="#6d3033" strokeWidth="5" />
        </g>

        <g className="pixel-head" transform={`translate(${faceX} ${faceY})`}>
          <path d="M103 95c0-37 22-62 57-62s57 25 57 62v54c0 27-23 48-57 48s-57-21-57-48z" fill={`url(#${ids.skin})`} stroke="#642f36" strokeWidth="7" />
          <path d="M107 102c-13-22-9-56 9-74l13-15 17 12 17-22 18 22 22-13 10 24c17 23 15 54 5 72l-15-17-11-29-21 9-22-18-25 26-20 8z" fill={`url(#${ids.hair})`} stroke="#5d2330" strokeWidth="7" strokeLinejoin="round" />
          <path d="M122 66c15-27 34-29 52-17M184 50c13 3 24 13 28 26M137 40l-10 31M171 35l-7 27M203 49l-6 22" fill="none" stroke="#ffd18a" strokeOpacity=".6" strokeWidth="7" strokeLinecap="round" />
          <path d="M109 124c-10 0-16 8-13 20 3 12 12 19 21 17M211 124c10 0 16 8 13 20-3 12-12 19-21 17" fill={`url(#${ids.skinShadow})`} stroke="#71353b" strokeWidth="5" />
          <g className="pixel-glasses" transform="translate(0 2)">
            <rect x="117" y="103" width="38" height="25" rx="8" fill={`url(#${ids.glass})`} stroke="#161b2d" strokeWidth="6" />
            <rect x="165" y="103" width="38" height="25" rx="8" fill={`url(#${ids.glass})`} stroke="#161b2d" strokeWidth="6" />
            <path d="M155 111h10" stroke="#161b2d" strokeWidth="6" />
            <path d="M120 108h20M168 108h20" stroke="#fff" strokeOpacity=".45" strokeWidth="3" />
          </g>
          <g className="pixel-eye pixel-eye-left">
            <ellipse cx="137" cy="115" rx="6" ry="7" fill="#13213b" />
            <circle cx={137 + faceX / 2} cy={113 + faceY / 2} r="2.5" fill="#fff" />
          </g>
          <g className="pixel-eye pixel-eye-right">
            <ellipse cx="183" cy="115" rx="6" ry="7" fill="#13213b" />
            <circle cx={183 + faceX / 2} cy={113 + faceY / 2} r="2.5" fill="#fff" />
          </g>
          <path d="M143 96c7-6 15-7 22-2M174 94c8-5 16-4 22 2" stroke="#6f2831" strokeWidth="7" strokeLinecap="round" />
          <path d="M157 118l-4 23 11 3" fill="none" stroke="#bc6c5c" strokeWidth="4" strokeLinecap="round" />
          <g className="pixel-mouth" data-phoneme={mouth} aria-label={`Boca ${mouthLabel}`}>
            {mouth === 0 && <ellipse className="mouth-viseme mouth-viseme-open" cx="160" cy="158" rx="19" ry="14" fill="#4a1626" stroke="#8f3940" strokeWidth="4" />}
            {mouth === 1 && <path className="mouth-viseme mouth-viseme-wide" d="M136 157c14 11 34 11 48 0-5 22-43 22-48 0z" fill="#4a1626" stroke="#8f3940" strokeWidth="4" />}
            {mouth === 2 && <ellipse className="mouth-viseme mouth-viseme-round" cx="160" cy="158" rx="11" ry="15" fill="#351224" stroke="#8f3940" strokeWidth="4" />}
            {mouth === 3 && <path className="mouth-viseme mouth-viseme-close" d="M145 158h30" stroke="#7b303b" strokeWidth="6" strokeLinecap="round" />}
            {mouth === 4 && <path className="mouth-viseme mouth-viseme-rest phoneme-rest-live" d="M146 158c9 5 19 5 28 0" fill="none" stroke="#9a4d4a" strokeWidth="4" strokeLinecap="round" />}
            {activity === "speaking" && mouth !== 3 && mouth !== 4 && <path d="M150 157h20" stroke="#fff2de" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />}
          </g>
          <path d="M138 176c13 9 31 9 44 0" fill="none" stroke="#ca6e5e" strokeWidth="4" strokeLinecap="round" />
        </g>

        {gesture === "finger" && <g className="pixel-gesture-layer pixel-gesture-finger"><path d="M229 252h14v-56h12v65h-8v14h-18z" fill={`url(#${ids.skin})`} stroke="#6d3033" strokeWidth="5" /><path d="M242 196h13v14h-13z" fill="#bd6556" /></g>}
        {gesture === "thumbsup" && <g className="pixel-gesture-layer pixel-gesture-thumbsup"><path d="M226 274h15v-42h13v53h-8v13h-20z" fill={`url(#${ids.skin})`} stroke="#6d3033" strokeWidth="5" /><path d="M241 232h13v15h-13z" fill="#bd6556" /></g>}
        {gesture === "heart" && <g className="pixel-gesture-layer pixel-gesture-heart"><path d="M135 250c-17-20-43 5-23 24l48 43 48-43c20-19-6-44-23-24l-25 24z" fill="#f24e73" stroke="#7e2148" strokeWidth="6" /><path d="M125 259l9-8M191 259l-9-8" stroke="#ffb0ba" strokeWidth="5" strokeLinecap="round" /></g>}
        {gesture === "watergun" && <g className="pixel-gesture-layer pixel-gesture-watergun"><path d="M226 274h29v-17h20v14h-11v13h-38z" fill={`url(#${ids.skin})`} stroke="#6d3033" strokeWidth="5" /><path d="M275 257h18v12h-18z" fill={`url(#${ids.gold})`} /><path d="M293 259h23v7h-23z" fill="#67e8f9" filter={`url(#${ids.glow})`} /></g>}
      </g>

      <g className="pixel-sparkles" aria-hidden="true">
        <path d="M39 142h7v25h-7zM30 151h25v7H30z" fill="#f9d86b" />
        <path d="M270 98h6v21h-6zM262 105h22v6h-22z" fill="#67e8f9" />
        <circle cx="63" cy="283" r="5" fill="#fb7185" /><circle cx="262" cy="318" r="5" fill="#fbbf24" />
      </g>
      {isAwake && <g className="pixel-input-ring" aria-hidden="true"><circle cx="160" cy="205" r="148" fill="none" /><circle cx="160" cy="205" r="132" fill="none" /></g>}
    </svg>
  );
}
