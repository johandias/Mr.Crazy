"use client";

import type { CSSProperties } from "react";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";

export type CharacterGesture = "idle" | "finger" | "smoke" | "heart" | "thumbsup";

const sparkPixels = [
  [29, 36],
  [128, 31],
  [21, 77],
  [139, 72],
  [34, 119],
  [126, 116]
] as const;

export function RpgCharacter({
  crazyLevel,
  emotion,
  voiceState,
  gesture = "idle",
  onTap
}: Readonly<{
  crazyLevel: number;
  emotion: Emotion;
  voiceState: VoiceState;
  gesture?: CharacterGesture;
  onTap?: () => void;
}>) {
  const activity = voiceState === "speaking" ? "speaking" : voiceState === "listening" ? "listening" : "idle";

  return (
    <div
      className={`character-stage rpg-character-stage ${emotion} ${activity} gesture-${gesture}`}
      style={{ "--rpg-energy": `${Math.max(0.25, crazyLevel / 100)}` } as CSSProperties}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onTap?.();
      }}
      aria-label={`Mr.Crazy ${activity === "speaking" ? "falando" : activity === "listening" ? "escutando" : "pronto"} - Gesto: ${gesture}. Toque para interagir.`}
      title="Toque no Mr.Crazy para ver gestos e reações!"
    >
      <svg className="rpg-character" viewBox="0 0 160 160" shapeRendering="crispEdges" aria-hidden="true">
        <g className="rpg-sparks">
          {sparkPixels.map(([x, y], index) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="5" height="5" style={{ animationDelay: `${index * 130}ms` }} />
          ))}
        </g>

        <g className="rpg-shadow-pixels">
          <rect x="42" y="141" width="76" height="5" />
          <rect x="52" y="146" width="56" height="4" />
        </g>

        <g className="rpg-hero">
          {/* Cape */}
          <g className="rpg-cape">
            <rect x="49" y="83" width="62" height="44" />
            <rect x="43" y="93" width="74" height="26" />
            <rect x="48" y="119" width="64" height="12" />
          </g>

          {/* Legs & Boots */}
          <g className="rpg-legs">
            <rect className="rpg-trouser" x="58" y="119" width="17" height="20" />
            <rect className="rpg-trouser" x="85" y="119" width="17" height="20" />
            <rect className="rpg-boot" x="53" y="135" width="24" height="8" />
            <rect className="rpg-boot" x="83" y="135" width="24" height="8" />
          </g>

          {/* Body & Armor */}
          <g className="rpg-body">
            <rect className="rpg-armor-dark" x="50" y="79" width="60" height="43" />
            <rect className="rpg-armor" x="57" y="82" width="46" height="35" />
            <rect className="rpg-belt" x="52" y="109" width="56" height="7" />
            <rect className="rpg-buckle" x="76" y="108" width="9" height="9" />
            <rect className="rpg-collar" x="67" y="77" width="26" height="10" />
            <rect className="rpg-emblem" x="76" y="90" width="9" height="9" />
            <rect className="rpg-emblem-core" x="79" y="93" width="3" height="3" />
          </g>

          {/* Left Arm */}
          <g className={`rpg-arm rpg-arm-left ${gesture === "heart" ? "arm-heart-left" : ""}`}>
            <rect className="rpg-armor-dark" x="37" y="84" width="15" height="31" />
            <rect className="rpg-glove" x="34" y="109" width="16" height="12" />
            {gesture !== "heart" ? (
              <>
                <rect className="rpg-book" x="22" y="112" width="29" height="20" />
                <rect className="rpg-book-page" x="25" y="115" width="10" height="14" />
                <rect className="rpg-book-page" x="38" y="115" width="10" height="14" />
                <rect className="rpg-book-rune" x="29" y="119" width="3" height="3" />
                <rect className="rpg-book-rune" x="41" y="123" width="4" height="2" />
              </>
            ) : (
              <g className="rpg-hand-heart-left">
                <rect className="rpg-skin" x="67" y="89" width="8" height="6" />
                <rect className="rpg-skin" x="70" y="94" width="6" height="6" />
              </g>
            )}
          </g>

          {/* Right Arm: Idle staff OR Gestures */}
          {gesture === "idle" && (
            <g className="rpg-arm rpg-arm-right">
              <rect className="rpg-armor-dark" x="108" y="84" width="15" height="31" />
              <rect className="rpg-glove" x="110" y="109" width="16" height="12" />
              <rect className="rpg-staff" x="128" y="60" width="6" height="76" />
              <rect className="rpg-staff-dark" x="130" y="62" width="3" height="72" />
              <rect className="rpg-staff-head" x="122" y="49" width="18" height="18" />
              <rect className="rpg-staff-core" x="127" y="54" width="8" height="8" />
            </g>
          )}

          {/* GESTO 1: DAR O DEDO */}
          {gesture === "finger" && (
            <g className="rpg-gesture-finger">
              <rect className="rpg-armor-dark" x="104" y="82" width="14" height="22" />
              <rect className="rpg-armor" x="102" y="72" width="16" height="14" />
              <rect className="rpg-skin-shadow" x="98" y="62" width="18" height="12" />
              <rect className="rpg-skin" x="100" y="63" width="14" height="10" />
              <rect className="rpg-skin-shadow" x="96" y="64" width="4" height="8" />
              <rect className="rpg-skin-shadow" x="112" y="64" width="4" height="8" />
              <rect className="rpg-skin-shadow" x="104" y="44" width="6" height="20" />
              <rect className="rpg-skin" x="105" y="45" width="4" height="18" />
              <rect className="rpg-skin-shadow" x="105" y="44" width="4" height="2" />
              <rect className="rpg-glove" x="101" y="74" width="16" height="4" />
              <rect className="rpg-sparkle-fx" x="101" y="38" width="3" height="3" fill="#ff4d4d" />
              <rect className="rpg-sparkle-fx" x="111" y="41" width="3" height="3" fill="#ff4d4d" />
            </g>
          )}

          {/* GESTO 2: FUMAR CIGARRO */}
          {gesture === "smoke" && (
            <g className="rpg-gesture-smoke">
              <rect className="rpg-armor-dark" x="106" y="82" width="14" height="24" />
              <rect className="rpg-skin" x="92" y="72" width="15" height="10" />
              <rect className="rpg-glove" x="101" y="76" width="9" height="12" />
              <rect className="rpg-cig-filter" x="87" y="72" width="6" height="3" fill="#cf7e3c" />
              <rect className="rpg-cig-paper" x="75" y="72" width="12" height="3" fill="#ffffff" />
              <rect className="rpg-cig-ember" x="72" y="72" width="3" height="3" fill="#ff3b00" />
              <g className="rpg-smoke-plumes">
                <circle className="rpg-smoke-p1" cx="70" cy="67" r="3" fill="rgba(220,230,242,0.65)" />
                <circle className="rpg-smoke-p2" cx="66" cy="58" r="4.5" fill="rgba(200,215,235,0.45)" />
                <circle className="rpg-smoke-p3" cx="62" cy="48" r="6" fill="rgba(180,200,225,0.25)" />
              </g>
            </g>
          )}

          {/* GESTO 3: FAZER UM CORAÇÃO */}
          {gesture === "heart" && (
            <g className="rpg-gesture-heart">
              <rect className="rpg-armor-dark" x="108" y="84" width="14" height="26" />
              <rect className="rpg-skin" x="84" y="89" width="8" height="6" />
              <rect className="rpg-skin" x="83" y="94" width="6" height="6" />
              <g className="rpg-heart-pulse">
                <rect x="76" y="87" width="3" height="3" fill="#ff2d60" />
                <rect x="80" y="87" width="3" height="3" fill="#ff2d60" />
                <rect x="74" y="90" width="11" height="3" fill="#ff2d60" />
                <rect x="76" y="93" width="7" height="3" fill="#ff2d60" />
                <rect x="78" y="96" width="3" height="3" fill="#ff2d60" />
                <rect x="77" y="90" width="2" height="2" fill="#ffffff" />
              </g>
            </g>
          )}

          {/* GESTO 4: JOINHA */}
          {gesture === "thumbsup" && (
            <g className="rpg-gesture-thumbsup">
              <rect className="rpg-armor-dark" x="106" y="82" width="14" height="26" />
              <rect className="rpg-glove" x="104" y="78" width="14" height="12" />
              <rect className="rpg-skin-shadow" x="106" y="68" width="15" height="11" />
              <rect className="rpg-skin" x="108" y="69" width="12" height="9" />
              <rect className="rpg-skin-shadow" x="110" y="55" width="7" height="14" />
              <rect className="rpg-skin" x="111" y="56" width="5" height="12" />
              <rect className="rpg-skin-shadow" x="111" y="55" width="5" height="2" />
              <g className="rpg-thumb-sparkle">
                <rect x="122" y="56" width="2" height="6" fill="#ffd152" />
                <rect x="120" y="58" width="6" height="2" fill="#ffd152" />
                <rect x="121" y="57" width="4" height="4" fill="#ffffff" />
              </g>
            </g>
          )}

          {/* Head & Face */}
          <g className="rpg-head">
            <rect className="rpg-hair-dark" x="51" y="34" width="58" height="40" />
            <rect className="rpg-hair" x="46" y="43" width="15" height="29" />
            <rect className="rpg-hair" x="99" y="40" width="16" height="34" />
            <rect className="rpg-hair" x="57" y="28" width="45" height="13" />
            <rect className="rpg-hair-hot" x="66" y="23" width="12" height="10" />
            <rect className="rpg-hair-hot" x="86" y="26" width="11" height="8" />
            <rect className="rpg-skin" x="57" y="43" width="46" height="38" />
            <rect className="rpg-skin-shadow" x="57" y="69" width="46" height="12" />
            <rect className="rpg-ear" x="51" y="54" width="7" height="15" />
            <rect className="rpg-ear" x="102" y="54" width="7" height="15" />

            <g className={`rpg-brows ${gesture === "finger" ? "brows-smirk" : gesture === "heart" ? "brows-happy" : ""}`}>
              <rect x="62" y="51" width="14" height="4" />
              <rect x="84" y="51" width="14" height="4" />
            </g>

            <g className={`rpg-eyes ${gesture === "smoke" ? "eyes-chill" : gesture === "thumbsup" ? "eyes-wink" : ""}`}>
              <rect className="rpg-eye" x="64" y="57" width="11" height="7" />
              <rect className="rpg-eye" x="85" y="57" width="11" height="7" />
              <rect className="rpg-pupil" x="69" y="58" width="4" height="5" />
              <rect className="rpg-pupil" x="87" y="58" width="4" height="5" />
            </g>

            <rect className="rpg-nose" x="78" y="62" width="5" height="7" />

            <g className={`rpg-mouth ${gesture === "smoke" ? "mouth-smoke" : ""}`}>
              <rect className="rpg-mouth-dark" x="70" y="71" width="20" height="6" />
              <rect className="rpg-mouth-glow" x="76" y="74" width="8" height="3" />
            </g>
          </g>
        </g>
      </svg>
      <div className="character-glow" aria-hidden="true" />
    </div>
  );
}
