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
 * 100% CÓDIGO NATIVO SVG, CSS e REACT (sem canvas, sem imagens raster).
 * Esfera de energia flutuante com degradê 3D profundo, iluminação volumétrica,
 * brilho especular de vidro, olhos expressivos com piscar e tracking de olhar,
 * boca hiper-detalhada com dentes esculpidos, língua e visemas para fala em tempo real,
 * anel orbital com rotação e gestos holográficos flutuantes.
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
  const isSpeaking = voiceState === "speaking";
  const activity = isSpeaking ? "speaking" : voiceState === "listening" ? "listening" : "idle";
  const mouth = isSpeaking ? phoneme : 4;
  const energy = Math.max(0.25, crazyLevel / 100);

  // Parallax suave dos olhos e boca acompanhando o cursor do mouse ou toque
  const faceX = Math.round(lookX * 4);
  const faceY = Math.round(lookY * 3);
  const pupilX = Math.round(lookX * 3.6);
  const pupilY = Math.round(lookY * 2.6);

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
    mouthCavityGrad: `${instanceId}-mouth-cavity`,
    teethGrad: `${instanceId}-teeth-grad`,
    tongueGrad: `${instanceId}-tongue-grad`,
    heartGrad: `${instanceId}-heart-grad`
  };

  return (
    <svg
      className={`pixel-mr-crazy-art pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""} ${isAwake ? "pixel-awake" : ""}`}
      viewBox="0 0 280 340"
      role="img"
      aria-label={`Mr. Crazy avatar bola flutuante ${isSpeaking ? `falando com boca ${mouthLabel}` : "pronto"}`}
      shapeRendering="crispEdges"
      data-phoneme={mouth}
      style={{
        "--pixel-energy": energy,
        "--look-x": lookX,
        "--look-y": lookY
      } as CSSProperties}
    >
      <defs>
        {/* Aura luminosa de fundo */}
        <radialGradient id={ids.auraGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#f43f5e" : "#38bdf8"} stopOpacity={isAngryOrCrazy ? ".55" : ".42"} />
          <stop offset="45%" stopColor={isAngryOrCrazy ? "#e11d48" : "#0284c7"} stopOpacity=".16" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão que responde à altura da levitação */}
        <radialGradient id={ids.floorShadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity=".75" />
          <stop offset="50%" stopColor="#000000" stopOpacity=".25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Filtro de brilho estelar suave */}
        <filter id={ids.glowFilter} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Degradê 3D Volumétrico da Esfera (Iluminação Esférica Realista) */}
        <radialGradient id={ids.orbGrad} cx="34%" cy="26%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="14%" stopColor={isAngryOrCrazy ? "#ffe4e6" : "#e0f2fe"} />
          <stop offset="32%" stopColor={isAngryOrCrazy ? "#fb7185" : "#38bdf8"} />
          <stop offset="60%" stopColor={isAngryOrCrazy ? "#e11d48" : "#0284c7"} />
          <stop offset="84%" stopColor={isAngryOrCrazy ? "#881337" : "#0f172a"} />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        {/* Reflexo de Vidro Especular Superior */}
        <linearGradient id={ids.orbGleamGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity=".8" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity=".15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Anel Orbital Iluminado */}
        <linearGradient id={ids.ringGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>

        {/* Íris Holográfica dos Olhos com Profundidade */}
        <radialGradient id={ids.eyeIrisGrad} cx="38%" cy="36%" r="62%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="32%" stopColor={isAngryOrCrazy ? "#f43f5e" : "#67e8f9"} />
          <stop offset="68%" stopColor={isAngryOrCrazy ? "#9f1239" : "#0284c7"} />
          <stop offset="100%" stopColor="#090d16" />
        </radialGradient>

        {/* Cavidade Oral da Boca (Degradê com Profundidade) */}
        <radialGradient id={ids.mouthCavityGrad} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#3f071b" />
          <stop offset="60%" stopColor="#20030c" />
          <stop offset="100%" stopColor="#0a0104" />
        </radialGradient>

        {/* Esmalte dos Dentes com Sombra e Brilho */}
        <linearGradient id={ids.teethGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Língua 3D Volumétrica */}
        <linearGradient id={ids.tongueGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="60%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>

        {/* Coração Holográfico */}
        <linearGradient id={ids.heartGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
      </defs>

      {/* Sombra no chão que pulsa com a levitação */}
      <g className="pixel-ground-shadow" aria-hidden="true">
        <ellipse cx="140" cy="312" rx="56" ry="9" fill={`url(#${ids.floorShadow})`} />
      </g>

      {/* ========================================================
          CORPO: ESFERA FLUTUANTE (THE SENTIENT ORB)
          ======================================================== */}
      <g className="pixel-rig pixel-body">
        {/* Aura luminosa atrás da esfera */}
        <circle cx="140" cy="155" r="96" fill={`url(#${ids.auraGlow})`} />

        {/* Anel Orbital Traseiro (Efeito 3D de Órbita) */}
        <g transform="translate(140, 155) rotate(-22)">
          <ellipse cx="0" cy="0" rx="102" ry="26" fill="none" stroke={`url(#${ids.ringGrad})`} strokeWidth="3" strokeDasharray="190 34" strokeOpacity=".4" filter={`url(#${ids.glowFilter})`} />
        </g>

        {/* ESFERA PRINCIPAL 3D COM DEGRADÊ E BRILHO */}
        <circle
          cx="140"
          cy="155"
          r="78"
          fill={`url(#${ids.orbGrad})`}
          stroke={isAngryOrCrazy ? "#f43f5e" : "#38bdf8"}
          strokeWidth="2.5"
          filter={`url(#${ids.glowFilter})`}
        />

        {/* Brilho Especular Superior em Vidro Curvo */}
        <ellipse cx="128" cy="106" rx="44" ry="22" fill={`url(#${ids.orbGleamGrad})`} transform="rotate(-18 128 106)" />

        {/* Luz de Borda Inferior (Rim Light Ciano) */}
        <path
          d="M84 186 C94 216 120 230 140 230 C160 230 186 216 196 186 C182 222 158 226 140 226 C122 226 98 222 84 186 Z"
          fill="#38bdf8"
          fillOpacity=".38"
          filter={`url(#${ids.glowFilter})`}
        />

        {/* Centelha / Estrela de Brilho no Topo da Esfera */}
        <g transform="translate(110, 90)">
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
          <path d="M0 -7 L0 7 M-7 0 L7 0" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* Anel Orbital Frontal (Passa na Frente da Esfera) */}
        <g transform="translate(140, 155) rotate(-22)">
          <path d="M-102 0 C-102 18 102 18 102 0" fill="none" stroke={`url(#${ids.ringGrad})`} strokeWidth="3.8" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
          {/* Satélite / Ponto de Luz Orbitando */}
          <circle cx="84" cy="8" r="5" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
          <circle cx="84" cy="8" r="8" fill="#38bdf8" fillOpacity=".4" filter={`url(#${ids.glowFilter})`} />
        </g>

        {/* ========================================================
            ROSTO HOLOGRÁFICO DA ESFERA: OLHOS E BOCA EXPRESSIVOS
            ======================================================== */}
        <g className="pixel-head" transform={`translate(${faceX}, ${faceY})`}>
          {/* Sobrancelhas Flutuantes Expressivas */}
          <g className="pixel-eyebrows">
            {isAngryOrCrazy ? (
              <>
                <path d="M104 124 L126 133" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <path d="M176 124 L154 133" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
              </>
            ) : (
              <>
                <path d="M102 123 Q116 116 128 121" stroke="#ffffff" strokeWidth="3.2" fill="none" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <path d="M178 123 Q164 116 152 121" stroke="#ffffff" strokeWidth="3.2" fill="none" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
              </>
            )}
          </g>

          {/* OLHOS DIGITAIS GRANDES (PISCAM E ACOMPANHAM O CURSOR) */}
          <g className="pixel-eyes">
            {/* Olho Esquerdo */}
            <g className="pixel-eye pixel-eye-left">
              <ellipse cx="116" cy="142" rx="14" ry="17" fill="#ffffff" stroke="#090d16" strokeWidth="2.5" />
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="116" cy="142" r="9.5" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="116" cy="142" r="5.2" fill="#090d16" />
                {/* Brilhos Especulares */}
                <circle cx="113" cy="139" r="3" fill="#ffffff" />
                <circle cx="119" cy="145" r="1.4" fill="#ffffff" />
              </g>
              {/* Delineado Superior Marcante */}
              <path d="M101 136 C106 127 126 127 131 136" stroke="#090d16" strokeWidth="3.6" fill="none" strokeLinecap="round" />
            </g>

            {/* Olho Direito */}
            <g className="pixel-eye pixel-eye-right">
              <ellipse cx="164" cy="142" rx="14" ry="17" fill="#ffffff" stroke="#090d16" strokeWidth="2.5" />
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="164" cy="142" r="9.5" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="164" cy="142" r="5.2" fill="#090d16" />
                {/* Brilhos Especulares */}
                <circle cx="161" cy="139" r="3" fill="#ffffff" />
                <circle cx="167" cy="145" r="1.4" fill="#ffffff" />
              </g>
              {/* Delineado Superior Marcante */}
              <path d="M149 136 C154 127 174 127 179 136" stroke="#090d16" strokeWidth="3.6" fill="none" strokeLinecap="round" />
            </g>

            {/* Pálpebras de Piscar Natural (Ativadas via CSS .pixel-blinking) */}
            <path
              className="pixel-eyelid-blink"
              d="M101 142 C107 149 125 149 131 142 M149 142 C155 149 173 149 179 142"
              stroke="#090d16"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* ========================================================
              BOCA HIPER-DETALHADA: FALA EM TEMPO REAL (pixel-mouth)
              Dentes esculpidos, língua 3D, cavidade e visemas nítidos
              ======================================================== */}
          <g className="pixel-mouth" data-viseme={mouth}>
            {/* 0. Visema ABERTA (A, O) - Grande, com dentes superiores e inferiores e língua */}
            {mouth === 0 && (
              <g className="viseme-open">
                {/* Contorno e Cavidade Oral Profunda */}
                <path
                  d="M124 168 C124 163 156 163 156 168 C158 188 152 195 140 195 C128 195 122 188 124 168 Z"
                  fill={`url(#${ids.mouthCavityGrad})`}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter={`url(#${ids.glowFilter})`}
                />
                {/* Arco Dentário Superior com Dentes Individuais Esculpidos */}
                <path d="M127 167 H153 V174 H127 Z" fill={`url(#${ids.teethGrad})`} />
                <line x1="133" y1="167" x2="133" y2="174" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="138" y1="167" x2="138" y2="174" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="142" y1="167" x2="142" y2="174" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="147" y1="167" x2="147" y2="174" stroke="#94a3b8" strokeWidth="0.8" />

                {/* Língua Volumétrica 3D com Sulco Central */}
                <path
                  d="M131 187 C131 180 149 180 149 187 C149 193 131 193 131 187 Z"
                  fill={`url(#${ids.tongueGrad})`}
                />
                <line x1="140" y1="182" x2="140" y2="189" stroke="#be123c" strokeWidth="1" />
                <circle cx="138" cy="184" r="1" fill="#ffffff" fillOpacity=".6" />

                {/* Dentes Inferiores Sutis */}
                <path d="M132 191 H148 V194 H132 Z" fill={`url(#${ids.teethGrad})`} opacity=".85" />
              </g>
            )}

            {/* 1. Visema ESTICADA (E, I) - Grande Sorriso Radiante com Arcada Dentária Completa */}
            {mouth === 1 && (
              <g className="viseme-wide">
                {/* Fundo da boca sorrindo */}
                <path
                  d="M122 172 C130 166 150 166 158 172 C160 184 154 188 140 188 C126 188 120 184 122 172 Z"
                  fill={`url(#${ids.mouthCavityGrad})`}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter={`url(#${ids.glowFilter})`}
                />
                {/* Arcada Dentária Completa com dentes nítidos */}
                <path d="M125 170 H155 V178 H125 Z" fill={`url(#${ids.teethGrad})`} />
                <line x1="130" y1="170" x2="130" y2="178" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="135" y1="170" x2="135" y2="178" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="140" y1="170" x2="140" y2="178" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="145" y1="170" x2="145" y2="178" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="150" y1="170" x2="150" y2="178" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Lábio Inferior com Brilho Rosa */}
                <path d="M122 173 Q140 169 158 173" stroke="#f43f5e" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Covinhas nos cantos do sorriso */}
                <circle cx="120" cy="171" r="1.5" fill="#38bdf8" filter={`url(#${ids.glowFilter})`} />
                <circle cx="160" cy="171" r="1.5" fill="#38bdf8" filter={`url(#${ids.glowFilter})`} />
              </g>
            )}

            {/* 2. Visema REDONDA (O, U, W) - Boca Circular com Profundidade 3D */}
            {mouth === 2 && (
              <g className="viseme-round">
                <ellipse cx="140" cy="178" rx="10" ry="9" fill={`url(#${ids.mouthCavityGrad})`} stroke="#ffffff" strokeWidth="2.2" filter={`url(#${ids.glowFilter})`} />
                <path d="M134 172 Q140 170 146 172" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
                <ellipse cx="140" cy="180" rx="5" ry="3.5" fill={`url(#${ids.tongueGrad})`} />
                <circle cx="140" cy="177" r="2.5" fill="#020617" />
              </g>
            )}

            {/* 3. Visema FECHANDO (Consoantes M, B, P, F) - Lábios Fechados Esculpidos */}
            {mouth === 3 && (
              <g className="viseme-close">
                <path d="M126 178 Q140 173 154 178" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <path d="M128 178.5 Q140 180.5 152 178.5" stroke="#f43f5e" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* 4. Visema REPOUSO / PHONEME-REST-LIVE - Sorriso Confiante com Brilho no Dente */}
            {mouth === 4 && (
              <g className="viseme-rest phoneme-rest-live">
                <path d="M126 176 Q140 172 154 176" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <path d="M128 177 Q140 180.5 152 177" stroke="#38bdf8" strokeWidth="2" fill="none" strokeLinecap="round" />
                <circle cx="152" cy="174" r="2" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
                <path d="M152 170 L152 178 M148 174 L156 174" stroke="#ffffff" strokeWidth="1" />
              </g>
            )}
          </g>
        </g>

        {/* ========================================================
            GESTOS HOLOGRÁFICOS FLUTUANTES (pixel-gesture-layer)
            ======================================================== */}
        <g className="pixel-gesture-layer">
          {gesture === "thumbsup" && (
            <g className="pixel-gesture-thumbsup">
              <g transform="translate(210, 116)">
                <circle cx="16" cy="16" r="22" fill="#0f172a" fillOpacity=".85" stroke="#fbbf24" strokeWidth="2" filter={`url(#${ids.glowFilter})`} />
                <path
                  d="M14 24 C11 24 8 20 8 16 C8 12 11 8 14 6 C16 4 20 5 20 8 C20 11 20 14 23 16 C25 18 26 19 26 21 C26 23 24 24 21 24 Z"
                  fill="#fde047"
                  filter={`url(#${ids.glowFilter})`}
                />
                <circle cx="24" cy="6" r="3.5" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
              </g>
            </g>
          )}

          {gesture === "heart" && (
            <g className="pixel-gesture-heart">
              <g transform="translate(140, 60)">
                <circle cx="0" cy="0" r="22" fill="#0f172a" fillOpacity=".85" stroke="#ec4899" strokeWidth="2" filter={`url(#${ids.glowFilter})`} />
                <path
                  d="M0 -6 C-5 -14 -16 -12 -16 -4 C-16 5 0 14 0 14 C0 14 16 5 16 -4 C16 -12 5 -14 0 -6 Z"
                  fill={`url(#${ids.heartGrad})`}
                  filter={`url(#${ids.glowFilter})`}
                />
              </g>
            </g>
          )}

          {gesture === "watergun" && (
            <g className="pixel-gesture-watergun">
              <g transform="translate(208, 148)">
                <circle cx="16" cy="16" r="20" fill="#0f172a" fillOpacity=".85" stroke="#38bdf8" strokeWidth="2" filter={`url(#${ids.glowFilter})`} />
                <line x1="8" y1="16" x2="44" y2="16" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <line x1="8" y1="16" x2="44" y2="16" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              </g>
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
