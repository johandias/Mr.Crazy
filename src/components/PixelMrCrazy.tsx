"use client";

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
 * Mr. Crazy: Avatar Bola Flutuante Futurista (The Sentient AI Orb).
 * 100% código nativo SVG, CSS e React.
 * Uma esfera de energia flutuante hiper-carismática com degradês volumétricos 3D,
 * brilho estelar, olhos digitais expressivos com tracking de olhar e piscar,
 * boca articulada com visemas para sincronia labial em tempo real,
 * anel orbital e gestos holográficos flutuantes.
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
  const mouth = voiceState === "speaking" ? phoneme : 4;
  const energy = Math.max(0.25, crazyLevel / 100);

  // Parallax dos olhos e boca acompanhando suavemente o mouse/toque
  const faceX = Math.round(lookX * 4);
  const faceY = Math.round(lookY * 3);
  const pupilX = Math.round(lookX * 3.5);
  const pupilY = Math.round(lookY * 2.5);

  const mouthLabels = ["aberta", "esticada", "redonda", "fechando", "repouso"] as const;
  const mouthLabel = mouthLabels[mouth] ?? "repouso";

  const isAngryOrCrazy = crazyLevel >= 45 || emotion === "irritated" || emotion === "crazy" || emotion === "annoyed";

  const ids = {
    auraGlow: `${instanceId}-aura-glow`,
    floorShadow: `${instanceId}-floor-shadow`,
    glowFilter: `${instanceId}-glow`,
    orbGrad: `${instanceId}-orb-grad`,
    orbGleamGrad: `${instanceId}-orb-gleam`,
    ringGrad: `${instanceId}-ring-grad`,
    eyeIrisGrad: `${instanceId}-eye-iris`,
    heartGrad: `${instanceId}-heart-grad`
  };

  return (
    <svg
      className={`pixel-mr-crazy-art pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""} ${isAwake ? "pixel-awake" : ""}`}
      viewBox="0 0 280 340"
      role="img"
      aria-label={`Mr. Crazy avatar bola flutuante ${activity === "speaking" ? `falando com boca ${mouthLabel}` : "pronto"}`}
      shapeRendering="crispEdges"
      data-phoneme={mouth}
      style={{
        "--pixel-energy": energy,
        "--look-x": lookX,
        "--look-y": lookY
      } as CSSProperties}
    >
      <defs>
        {/* Aura de energia luminosa pulsante atrás da esfera */}
        <radialGradient id={ids.auraGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#f43f5e" : "#38bdf8"} stopOpacity={isAngryOrCrazy ? ".5" : ".38"} />
          <stop offset="50%" stopColor={isAngryOrCrazy ? "#e11d48" : "#0284c7"} stopOpacity=".15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão sob a esfera que levita */}
        <radialGradient id={ids.floorShadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity=".7" />
          <stop offset="55%" stopColor="#000000" stopOpacity=".2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Filtro de brilho suave */}
        <filter id={ids.glowFilter} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Degradê 3D Volumétrico da Esfera (Iluminação dramática) */}
        <radialGradient id={ids.orbGrad} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="12%" stopColor={isAngryOrCrazy ? "#ffe4e6" : "#e0f2fe"} />
          <stop offset="30%" stopColor={isAngryOrCrazy ? "#fb7185" : "#38bdf8"} />
          <stop offset="58%" stopColor={isAngryOrCrazy ? "#e11d48" : "#0284c7"} />
          <stop offset="82%" stopColor={isAngryOrCrazy ? "#881337" : "#0f172a"} />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        {/* Brilho Especular em Meia-Lua (Efeito de Vidro / Energia) */}
        <linearGradient id={ids.orbGleamGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity=".75" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity=".15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Anel Orbital Iluminado */}
        <linearGradient id={ids.ringGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>

        {/* Íris Holográfica dos Olhos */}
        <radialGradient id={ids.eyeIrisGrad} cx="38%" cy="36%" r="62%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor={isAngryOrCrazy ? "#f43f5e" : "#38bdf8"} />
          <stop offset="75%" stopColor={isAngryOrCrazy ? "#9f1239" : "#0284c7"} />
          <stop offset="100%" stopColor="#090d16" />
        </radialGradient>

        {/* Coração Holográfico */}
        <linearGradient id={ids.heartGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
      </defs>

      {/* Sombra de chão suave que reage à levitação */}
      <g className="pixel-ground-shadow" aria-hidden="true">
        <ellipse cx="140" cy="308" rx="58" ry="10" fill={`url(#${ids.floorShadow})`} />
      </g>

      {/* ========================================================
          CORPO PRINCIPAL: ESFERA FLUTUANTE (THE SENTIENT ORB)
          ======================================================== */}
      <g className="pixel-rig pixel-body">
        {/* Aura de energia no fundo da esfera */}
        <circle cx="140" cy="155" r="95" fill={`url(#${ids.auraGlow})`} />

        {/* Anel Orbital Traseiro */}
        <g transform="translate(140, 155) rotate(-22)">
          <ellipse cx="0" cy="0" rx="98" ry="24" fill="none" stroke={`url(#${ids.ringGrad})`} strokeWidth="3" strokeDasharray="180 32" strokeOpacity=".4" filter={`url(#${ids.glowFilter})`} />
        </g>

        {/* ESFERA PRINCIPAL 3D COM DEGRADÊ RICO E BRILHO */}
        <circle
          cx="140"
          cy="155"
          r="78"
          fill={`url(#${ids.orbGrad})`}
          stroke={isAngryOrCrazy ? "#f43f5e" : "#38bdf8"}
          strokeWidth="2.5"
          filter={`url(#${ids.glowFilter})`}
        />

        {/* Reflexo Especular Curvo Superior (Vidro / Brilho Cósmico) */}
        <ellipse cx="128" cy="108" rx="42" ry="22" fill={`url(#${ids.orbGleamGrad})`} transform="rotate(-18 128 108)" />

        {/* Luz de Borda / Rim Light Inferior */}
        <path
          d="M84 186 C94 216 120 230 140 230 C160 230 186 216 196 186 C182 222 158 226 140 226 C122 226 98 222 84 186 Z"
          fill="#38bdf8"
          fillOpacity=".35"
          filter={`url(#${ids.glowFilter})`}
        />

        {/* Pequena estrela / centelha de brilho no topo da esfera */}
        <g transform="translate(112, 92)">
          <circle cx="0" cy="0" r="3" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
          <path d="M0 -6 L0 6 M-6 0 L6 0" stroke="#ffffff" strokeWidth="1.2" />
        </g>

        {/* Anel Orbital Frontal */}
        <g transform="translate(140, 155) rotate(-22)">
          <path d="M-98 0 C-98 16 98 16 98 0" fill="none" stroke={`url(#${ids.ringGrad})`} strokeWidth="3.5" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
          {/* Partícula / satélite de energia no anel */}
          <circle cx="82" cy="7" r="4.5" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
        </g>

        {/* ========================================================
            ROSTO HOLOGRÁFICO DA ESFERA: OLHOS E BOCA EXPRESSIVOS
            ======================================================== */}
        <g className="pixel-head" transform={`translate(${faceX}, ${faceY})`}>
          {/* Sobrancelhas Flutuantes Expressivas */}
          <g className="pixel-eyebrows">
            {isAngryOrCrazy ? (
              <>
                <path d="M104 126 L126 135" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <path d="M176 126 L154 135" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
              </>
            ) : (
              <>
                <path d="M102 125 Q116 118 128 123" stroke="#38bdf8" strokeWidth="3.2" fill="none" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <path d="M178 125 Q164 118 152 123" stroke="#38bdf8" strokeWidth="3.2" fill="none" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
              </>
            )}
          </g>

          {/* OLHOS DIGITAIS GRANDES E EXPRESSIVOS (PISCAM E RASTREIAM O CURSOR) */}
          <g className="pixel-eyes">
            {/* Olho Esquerdo */}
            <g className="pixel-eye pixel-eye-left">
              <ellipse cx="116" cy="144" rx="14" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="116" cy="144" r="9" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="116" cy="144" r="5" fill="#090d16" />
                {/* Brilhos Especulares */}
                <circle cx="113" cy="141" r="2.8" fill="#ffffff" />
                <circle cx="119" cy="147" r="1.3" fill="#ffffff" />
              </g>
              {/* Delineado Superior */}
              <path d="M101 138 C106 130 126 130 131 138" stroke="#0f172a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </g>

            {/* Olho Direito */}
            <g className="pixel-eye pixel-eye-right">
              <ellipse cx="164" cy="144" rx="14" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="164" cy="144" r="9" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="164" cy="144" r="5" fill="#090d16" />
                {/* Brilhos Especulares */}
                <circle cx="161" cy="141" r="2.8" fill="#ffffff" />
                <circle cx="167" cy="147" r="1.3" fill="#ffffff" />
              </g>
              {/* Delineado Superior */}
              <path d="M149 138 C154 130 174 130 179 138" stroke="#0f172a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </g>

            {/* Pálpebras de Piscar Natural */}
            <path
              className="pixel-eyelid-blink"
              d="M101 144 C107 151 125 151 131 144 M149 144 C155 151 173 151 179 144"
              stroke="#0f172a"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* ========================================================
              BOCA DA BOLA: FALA EM TEMPO REAL COM O WEBRTC (pixel-mouth)
              ======================================================== */}
          <g className="pixel-mouth" data-viseme={mouth}>
            {/* 0. Visema ABERTA (A, O) - Grande e Animada */}
            {mouth === 0 && (
              <g className="viseme-open">
                <path d="M126 172 C126 167 154 167 154 172 C156 188 151 193 140 193 C129 193 124 188 126 172 Z" fill="#090d16" stroke="#ffffff" strokeWidth="2" filter={`url(#${ids.glowFilter})`} />
                {/* Dentes Superiores Brancos */}
                <path d="M129 171 H151 V177 H129 Z" fill="#ffffff" />
                <line x1="136" y1="171" x2="136" y2="177" stroke="#94a3b8" strokeWidth="1" />
                <line x1="144" y1="171" x2="144" y2="177" stroke="#94a3b8" strokeWidth="1" />
                {/* Língua Iluminada */}
                <ellipse cx="140" cy="189" rx="7" ry="4" fill="#f43f5e" />
              </g>
            )}

            {/* 1. Visema ESTICADA (E, I) - Grande Sorriso com Dentes */}
            {mouth === 1 && (
              <g className="viseme-wide">
                <path d="M124 174 C130 170 150 170 156 174 C158 185 152 188 140 188 C128 188 122 185 124 174 Z" fill="#090d16" stroke="#ffffff" strokeWidth="2" filter={`url(#${ids.glowFilter})`} />
                <path d="M127 173 H153 V179 H127 Z" fill="#ffffff" />
                <line x1="134" y1="173" x2="134" y2="179" stroke="#94a3b8" strokeWidth="1" />
                <line x1="140" y1="173" x2="140" y2="179" stroke="#94a3b8" strokeWidth="1" />
                <line x1="146" y1="173" x2="146" y2="179" stroke="#94a3b8" strokeWidth="1" />
                <path d="M124 174 Q140 170 156 174" stroke="#f43f5e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* 2. Visema REDONDA (O, U, W) */}
            {mouth === 2 && (
              <g className="viseme-round">
                <ellipse cx="140" cy="178" rx="9" ry="8" fill="#090d16" stroke="#ffffff" strokeWidth="2.2" filter={`url(#${ids.glowFilter})`} />
                <ellipse cx="140" cy="177" rx="5" ry="3.5" fill="#f43f5e" />
                <circle cx="140" cy="178" r="3" fill="#020617" />
              </g>
            )}

            {/* 3. Visema FECHANDO (Consoantes M, P, B) */}
            {mouth === 3 && (
              <g className="viseme-close">
                <path d="M128 178 Q140 174 152 178" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <path d="M130 178.5 Q140 180 150 178.5" stroke="#f43f5e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* 4. Visema REPOUSO / PHONEME-REST-LIVE (Sorriso Amigável e Inteligente) */}
            {mouth === 4 && (
              <g className="viseme-rest phoneme-rest-live">
                <path d="M128 176 Q140 173 152 176" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <path d="M130 177 Q140 180 150 177" stroke="#38bdf8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                {/* Ponto de brilho estelar no sorriso */}
                <circle cx="151" cy="175" r="1.6" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
              </g>
            )}
          </g>
        </g>

        {/* ========================================================
            GESTOS HOLOGRÁFICOS FLUTUANTES (pixel-gesture-layer)
            ======================================================== */}
        <g className="pixel-gesture-layer">
          {/* Gesto Thumbsup Holográfico Flutuante */}
          {gesture === "thumbsup" && (
            <g className="pixel-gesture-thumbsup">
              <g transform="translate(208, 118)">
                <circle cx="16" cy="16" r="22" fill="#0f172a" fillOpacity=".8" stroke="#fbbf24" strokeWidth="2" filter={`url(#ids.glowFilter)`} />
                {/* Polegar de Energia Dourada */}
                <path
                  d="M14 24 C11 24 8 20 8 16 C8 12 11 8 14 6 C16 4 20 5 20 8 C20 11 20 14 23 16 C25 18 26 19 26 21 C26 23 24 24 21 24 Z"
                  fill="#fde047"
                  filter={`url(#${ids.glowFilter})`}
                />
                <circle cx="24" cy="6" r="3.5" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
              </g>
            </g>
          )}

          {/* Gesto Heart Holográfico Flutuante */}
          {gesture === "heart" && (
            <g className="pixel-gesture-heart">
              <g transform="translate(140, 64)">
                <circle cx="0" cy="0" r="22" fill="#0f172a" fillOpacity=".8" stroke="#ec4899" strokeWidth="2" filter={`url(#ids.glowFilter)`} />
                <path
                  d="M0 -6 C-5 -14 -16 -12 -16 -4 C-16 5 0 14 0 14 C0 14 16 5 16 -4 C16 -12 5 -14 0 -6 Z"
                  fill={`url(#${ids.heartGrad})`}
                  filter={`url(#${ids.glowFilter})`}
                />
              </g>
            </g>
          )}

          {/* Gesto Watergun (Disparo de Energia / Raio) */}
          {gesture === "watergun" && (
            <g className="pixel-gesture-watergun">
              <g transform="translate(208, 150)">
                <circle cx="16" cy="16" r="20" fill="#0f172a" fillOpacity=".8" stroke="#38bdf8" strokeWidth="2" filter={`url(#ids.glowFilter)`} />
                <line x1="8" y1="16" x2="42" y2="16" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <line x1="8" y1="16" x2="42" y2="16" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              </g>
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
