"use client";

import type { CSSProperties } from "react";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";

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
  voiceState
}: Readonly<{ crazyLevel: number; emotion: Emotion; voiceState: VoiceState }>) {
  const activity = voiceState === "speaking" ? "speaking" : voiceState === "listening" ? "listening" : "idle";

  return (
    <div
      className={`character-stage rpg-character-stage ${emotion} ${activity}`}
      style={{ "--rpg-energy": `${Math.max(0.25, crazyLevel / 100)}` } as CSSProperties}
      role="img"
      aria-label={`Mestre RPG ${activity === "speaking" ? "falando" : activity === "listening" ? "escutando" : "pronto"}`}
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
          <g className="rpg-cape">
            <rect x="49" y="83" width="62" height="44" />
            <rect x="43" y="93" width="74" height="26" />
            <rect x="48" y="119" width="64" height="12" />
          </g>

          <g className="rpg-legs">
            <rect className="rpg-trouser" x="58" y="119" width="17" height="20" />
            <rect className="rpg-trouser" x="85" y="119" width="17" height="20" />
            <rect className="rpg-boot" x="53" y="135" width="24" height="8" />
            <rect className="rpg-boot" x="83" y="135" width="24" height="8" />
          </g>

          <g className="rpg-body">
            <rect className="rpg-armor-dark" x="50" y="79" width="60" height="43" />
            <rect className="rpg-armor" x="57" y="82" width="46" height="35" />
            <rect className="rpg-belt" x="52" y="109" width="56" height="7" />
            <rect className="rpg-buckle" x="76" y="108" width="9" height="9" />
            <rect className="rpg-collar" x="67" y="77" width="26" height="10" />
            <rect className="rpg-emblem" x="76" y="90" width="9" height="9" />
            <rect className="rpg-emblem-core" x="79" y="93" width="3" height="3" />
          </g>

          <g className="rpg-arm rpg-arm-left">
            <rect className="rpg-armor-dark" x="37" y="84" width="15" height="31" />
            <rect className="rpg-glove" x="34" y="109" width="16" height="12" />
            <rect className="rpg-book" x="22" y="112" width="29" height="20" />
            <rect className="rpg-book-page" x="25" y="115" width="10" height="14" />
            <rect className="rpg-book-page" x="38" y="115" width="10" height="14" />
            <rect className="rpg-book-rune" x="29" y="119" width="3" height="3" />
            <rect className="rpg-book-rune" x="41" y="123" width="4" height="2" />
          </g>

          <g className="rpg-arm rpg-arm-right">
            <rect className="rpg-armor-dark" x="108" y="84" width="15" height="31" />
            <rect className="rpg-glove" x="110" y="109" width="16" height="12" />
            <rect className="rpg-staff" x="128" y="60" width="6" height="76" />
            <rect className="rpg-staff-dark" x="130" y="62" width="3" height="72" />
            <rect className="rpg-staff-head" x="122" y="49" width="18" height="18" />
            <rect className="rpg-staff-core" x="127" y="54" width="8" height="8" />
          </g>

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

            <g className="rpg-brows">
              <rect x="62" y="51" width="14" height="4" />
              <rect x="84" y="51" width="14" height="4" />
            </g>
            <g className="rpg-eyes">
              <rect className="rpg-eye" x="64" y="57" width="11" height="7" />
              <rect className="rpg-eye" x="85" y="57" width="11" height="7" />
              <rect className="rpg-pupil" x="69" y="58" width="4" height="5" />
              <rect className="rpg-pupil" x="87" y="58" width="4" height="5" />
            </g>
            <rect className="rpg-nose" x="78" y="62" width="5" height="7" />
            <g className="rpg-mouth">
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
