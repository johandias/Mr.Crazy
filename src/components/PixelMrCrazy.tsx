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
 * Mr. Crazy: Novo Avatar "The Electric Mad Professor".
 * 100% código vetorial puro SVG, CSS e React.
 * Conceito: Mascote cientista louco icônico, carismático e ultra-expressivo.
 * Cabelo elétrico selvagem em prata e ciano neon com faíscas de energia,
 * olhos grandes e expressivos estilo comic/anime com rastreamento de olhar,
 * óculos de cientista na testa com lentes pulsantes,
 * jaleco tecnológico escuro com núcleo de energia e fones de estúdio,
 * e boca articulada em tempo real para sincronia fonética perfeita.
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

  // Parallax suave dos olhos e cabeça seguindo o cursor ou toque
  const faceX = Math.round(lookX * 3.5);
  const faceY = Math.round(lookY * 2.5);
  const pupilX = Math.round(lookX * 3.2);
  const pupilY = Math.round(lookY * 2.2);

  const mouthLabels = ["aberta", "esticada", "redonda", "fechando", "repouso"] as const;
  const mouthLabel = mouthLabels[mouth] ?? "repouso";

  const isAngryOrCrazy = crazyLevel >= 45 || emotion === "irritated" || emotion === "crazy" || emotion === "annoyed";

  const ids = {
    aura: `${instanceId}-aura`,
    floorShadow: `${instanceId}-floor-shadow`,
    glowFilter: `${instanceId}-glow`,
    electricSparkGrad: `${instanceId}-spark-grad`,
    hairBaseGrad: `${instanceId}-hair-base`,
    hairNeonGrad: `${instanceId}-hair-neon`,
    hairGleamGrad: `${instanceId}-hair-gleam`,
    skinGrad: `${instanceId}-skin-grad`,
    skinCheekGrad: `${instanceId}-skin-cheek`,
    coatGrad: `${instanceId}-coat-grad`,
    coatAccentGrad: `${instanceId}-coat-accent`,
    coreReactorGrad: `${instanceId}-core-reactor`,
    goggleLensGrad: `${instanceId}-goggle-lens`,
    eyeIrisGrad: `${instanceId}-eye-iris`,
    headphoneGrad: `${instanceId}-headphone`
  };

  return (
    <svg
      className={`pixel-mr-crazy-art pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""} ${isAwake ? "pixel-awake" : ""}`}
      viewBox="0 0 280 340"
      role="img"
      aria-label={`Mr. Crazy avatar ${activity === "speaking" ? `falando com boca ${mouthLabel}` : "pronto"}`}
      shapeRendering="crispEdges"
      data-phoneme={mouth}
      style={{
        "--pixel-energy": energy,
        "--look-x": lookX,
        "--look-y": lookY
      } as CSSProperties}
    >
      <defs>
        {/* Aura de energia do professor */}
        <radialGradient id={ids.aura} cx="50%" cy="42%" r="56%">
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#f43f5e" : "#06b6d4"} stopOpacity={isAngryOrCrazy ? ".3" : ".2"} />
          <stop offset="65%" stopColor={isAngryOrCrazy ? "#e11d48" : "#0284c7"} stopOpacity=".04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão */}
        <radialGradient id={ids.floorShadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity=".7" />
          <stop offset="60%" stopColor="#000000" stopOpacity=".2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Filtro de brilho neon suave */}
        <filter id={ids.glowFilter} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Cabelo Elétrico: Base Cinza-Chumbo / Prata Profunda */}
        <linearGradient id={ids.hairBaseGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="40%" stopColor="#334155" />
          <stop offset="75%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Cabelo Elétrico: Mechas Ciano Neon & Branco Elétrico */}
        <linearGradient id={ids.hairNeonGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="35%" stopColor="#06b6d4" />
          <stop offset="70%" stopColor="#38bdf8" />
          <stop offset="90%" stopColor="#a5f3fc" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Cabelo Elétrico: Pontas Brancas Incandescentes */}
        <linearGradient id={ids.hairGleamGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="60%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Pele de Anime Expressiva e Saudável */}
        <radialGradient id={ids.skinGrad} cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="45%" stopColor="#fed7aa" />
          <stop offset="80%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity=".85" />
        </radialGradient>

        {/* Rubor Suave */}
        <radialGradient id={ids.skinCheekGrad} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity=".4" />
          <stop offset="70%" stopColor="#fb7185" stopOpacity=".1" />
          <stop offset="100%" stopColor="#fdba74" stopOpacity="0" />
        </radialGradient>

        {/* Casaco Tecnológico Slate / Grafite Moderno */}
        <linearGradient id={ids.coatGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="40%" stopColor="#1e293b" />
          <stop offset="80%" stopColor="#334155" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Detalhes Neon do Casaco */}
        <linearGradient id={ids.coatAccentGrad} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Reator Central no Peito (Arc Grammar Core) */}
        <radialGradient id={ids.coreReactorGrad} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#67e8f9" />
          <stop offset="70%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0e7490" />
        </radialGradient>

        {/* Fones de Estúdio DJ / Professor */}
        <linearGradient id={ids.headphoneGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Lentes dos Óculos Tecnológicos na Testa */}
        <linearGradient id={ids.goggleLensGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity=".9" />
          <stop offset="60%" stopColor="#10b981" stopOpacity=".7" />
          <stop offset="100%" stopColor="#047857" stopOpacity=".95" />
        </linearGradient>

        {/* Íris Elétrica Azul-Cobalto / Ciano Vivo */}
        <radialGradient id={ids.eyeIrisGrad} cx="38%" cy="36%" r="62%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="30%" stopColor="#0284c7" />
          <stop offset="75%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </radialGradient>
      </defs>

      {/* Aura de energia no fundo */}
      <ellipse className="pixel-aura" cx="140" cy="165" rx="118" ry="142" fill={`url(#${ids.aura})`} />

      {/* Sombra de chão */}
      <g className="pixel-ground-shadow" aria-hidden="true">
        <ellipse cx="140" cy="326" rx="84" ry="10" fill={`url(#${ids.floorShadow})`} />
      </g>

      {/* ========================================================
          RIG HEROICO DO NOVO MR. CRAZY (THE ELECTRIC PROFESSOR)
          ======================================================== */}
      <g className="pixel-rig">
        {/* 1. PERNAS E TÊNIS MODERNOS */}
        <g className="pixel-legs">
          {/* Calça Cargo Chumbo */}
          <path d="M106 252 H133 V292 H106 Z" fill="#0f172a" />
          <path d="M108 254 H131 V290 H108 Z" fill="#1e293b" />
          <line x1="120" y1="256" x2="120" y2="288" stroke="#334155" strokeWidth="1.5" />

          <path d="M147 252 H174 V292 H147 Z" fill="#0f172a" />
          <path d="M149 254 H172 V290 H149 Z" fill="#1e293b" />
          <line x1="160" y1="256" x2="160" y2="288" stroke="#334155" strokeWidth="1.5" />

          {/* Tênis Esquerdo de Alta Tecnologia */}
          <g className="pixel-boot-left">
            <path
              d="M100 290 C100 302 99 316 100 324 C108 326 134 326 142 324 C145 322 143 318 141 314 C137 305 136 294 135 290 Z"
              fill="#0f172a"
            />
            <path
              d="M102 292 C102 302 101 314 102 322 C110 324 132 324 140 322 C142 320 141 316 139 313 C135 305 134 296 133 292 Z"
              fill="#1e293b"
            />
            {/* Sola Neon Ciano Iluminada */}
            <path d="M99 322 Q122 322 143 322 L144 326 Q122 326 100 326 Z" fill="#06b6d4" filter={`url(#${ids.glowFilter})`} />
            <rect x="110" y="300" width="16" height="5" rx="2" fill="#38bdf8" />
          </g>

          {/* Tênis Direito de Alta Tecnologia */}
          <g className="pixel-boot-right">
            <path
              d="M145 290 C144 294 143 305 139 314 C137 318 135 322 138 324 C146 326 172 326 180 324 C181 316 180 302 180 290 Z"
              fill="#0f172a"
            />
            <path
              d="M147 292 C146 296 145 305 141 313 C139 316 138 320 140 322 C148 324 170 324 178 322 C179 314 178 302 178 292 Z"
              fill="#1e293b"
            />
            {/* Sola Neon Ciano Iluminada */}
            <path d="M137 322 Q158 322 181 322 L180 326 Q158 326 136 326 Z" fill="#06b6d4" filter={`url(#${ids.glowFilter})`} />
            <rect x="154" y="300" width="16" height="5" rx="2" fill="#38bdf8" />
          </g>
        </g>

        {/* 2. TRONCO: JALECO TECNOLÓGICO, NÚCLEO ARC E FONES NO PESCOÇO */}
        <g className="pixel-body">
          {/* Base e Corte do Jaleco */}
          <path
            d="M84 158 C84 154 110 152 140 152 C170 152 196 154 196 158 C200 178 203 218 202 256 C162 258 118 258 78 256 C77 218 80 178 84 158 Z"
            fill="#090d16"
          />
          <path
            d="M88 160 C88 156 112 154 140 154 C168 154 192 156 192 160 C196 178 198 218 197 254 C160 256 120 256 83 254 C82 218 84 178 88 160 Z"
            fill={`url(#${ids.coatGrad})`}
          />

          {/* Faixas Neon Laterais de Energia no Casaco */}
          <path d="M96 166 L90 250" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
          <path d="M184 166 L190 250" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />

          {/* Gola Alta do Casaco */}
          <path d="M116 152 L124 180 L140 174 L156 180 L164 152 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <path d="M126 152 H154 V176 H126 Z" fill="#1e293b" />

          {/* NÚCLEO DE ENERGIA ARC REACTOR NO PEITO */}
          <g className="pixel-arc-core" transform="translate(140, 206)">
            {/* Anel Externo Dourado / Ciano */}
            <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" filter={`url(#${ids.glowFilter})`} />
            <circle cx="0" cy="0" r="12" fill={`url(#${ids.coreReactorGrad})`} />
            <circle cx="0" cy="0" r="7" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
            {/* Linhas de grade do reator */}
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#0891b2" strokeWidth="1" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#0891b2" strokeWidth="1" />
          </g>

          {/* FONES DE ESTÚDIO DESCANÇANDO NO PESCOÇO */}
          <g className="pixel-headphones">
            {/* Arco Traseiro */}
            <path d="M96 156 Q140 170 184 156" stroke="#0f172a" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M96 156 Q140 170 184 156" stroke="#38bdf8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {/* Concha Esquerda com Anel Neon */}
            <rect x="84" y="150" width="16" height="24" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" filter={`url(#${ids.glowFilter})`} />
            <circle cx="92" cy="162" r="4" fill="#06b6d4" />
            {/* Concha Direita com Anel Neon */}
            <rect x="180" y="150" width="16" height="24" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" filter={`url(#${ids.glowFilter})`} />
            <circle cx="188" cy="162" r="4" fill="#06b6d4" />
          </g>

          {/* Cinto Tecnológico com Fivela Iluminada */}
          <path d="M89 250 H191 V258 H89 Z" fill="#0f172a" />
          <rect x="130" y="248" width="20" height="12" rx="3" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
          <circle cx="140" cy="254" r="3" fill="#22d3ee" filter={`url(#${ids.glowFilter})`} />
        </g>

        {/* 3. BRAÇOS E MÃOS ANATÔMICAS EM REPOUSO */}
        <g className="pixel-arms">
          {/* Braço Esquerdo */}
          <g className="pixel-arm-left">
            <path
              d="M86 160 C78 180 72 208 70 240 C76 242 88 242 94 240 C95 212 99 184 104 164 Z"
              fill="#0f172a"
            />
            <path
              d="M88 162 C80 181 74 208 72 238 C77 240 86 240 92 238 C93 212 97 185 102 165 Z"
              fill={`url(#${ids.coatGrad})`}
            />
            {/* Faixa neon no punho */}
            <path d="M71 236 Q82 238 93 236 L94 240 Q82 242 70 240 Z" fill="#06b6d4" filter={`url(#${ids.glowFilter})`} />

            {/* Luva / Mão Esquerda Tecnológica */}
            <g className="pixel-hand-left">
              <path
                d="M72 240 C70 248 72 258 75 264 C80 266 88 266 91 264 C93 258 92 248 91 240 Z"
                fill="#0f172a"
              />
              <path
                d="M74 241 C72 248 73 257 76 262 C80 264 86 264 89 262 C91 257 91 248 89 241 Z"
                fill="#1e293b"
              />
              {/* Articulações dos dedos com acentos neon */}
              <circle cx="78" cy="254" r="1.5" fill="#38bdf8" />
              <circle cx="82" cy="255" r="1.5" fill="#38bdf8" />
              <circle cx="86" cy="254" r="1.5" fill="#38bdf8" />
            </g>
          </g>

          {/* Braço Direito */}
          <g className="pixel-arm-right">
            <path
              d="M194 160 C202 180 208 208 210 240 C204 242 192 242 186 240 C185 212 181 184 176 164 Z"
              fill="#0f172a"
            />
            <path
              d="M192 162 C200 181 206 208 208 238 C203 240 194 240 188 238 C187 212 183 185 178 165 Z"
              fill={`url(#${ids.coatGrad})`}
            />
            {/* Faixa neon no punho */}
            <path d="M187 236 Q198 238 209 236 L210 240 Q198 242 186 240 Z" fill="#06b6d4" filter={`url(#${ids.glowFilter})`} />

            {/* Luva / Mão Direita Tecnológica */}
            <g className="pixel-hand-right">
              <path
                d="M189 240 C188 248 187 258 189 264 C192 266 200 266 205 264 C208 258 210 248 208 240 Z"
                fill="#0f172a"
              />
              <path
                d="M191 241 C189 248 189 257 191 262 C194 264 200 264 203 262 C206 257 207 248 206 241 Z"
                fill="#1e293b"
              />
              {/* Articulações dos dedos com acentos neon */}
              <circle cx="194" cy="254" r="1.5" fill="#38bdf8" />
              <circle cx="198" cy="255" r="1.5" fill="#38bdf8" />
              <circle cx="202" cy="254" r="1.5" fill="#38bdf8" />
            </g>
          </g>
        </g>

        {/* 4. GESTOS CONDICIONAIS REATIVOS */}
        <g className="pixel-gesture-layer">
          {gesture === "thumbsup" && (
            <g className="pixel-gesture-thumbsup">
              <g transform="translate(186, 178)">
                <path
                  d="M16 26 C12 26 8 20 8 14 C8 8 13 4 16 2 C18 0 22 2 22 6 C22 10 22 14 24 16 C26 18 28 18 28 22 C28 26 24 28 20 28 Z"
                  fill="#0f172a"
                />
                <path
                  d="M17 25 C14 25 10 20 10 14 C10 9 14 5 17 4 C18 3 20 4 20 7 C20 10 20 14 23 16 C25 18 26 19 26 22 C26 24 23 26 19 26 Z"
                  fill="#06b6d4"
                />
                {/* Estrela de Energia de Aprovação */}
                <g className="pixel-sparkles">
                  <circle cx="28" cy="2" r="4" fill="#fde047" filter={`url(#${ids.glowFilter})`} />
                  <path d="M28 -4 L28 8 M22 2 L34 2" stroke="#eab308" strokeWidth="1.5" />
                </g>
              </g>
            </g>
          )}

          {gesture === "heart" && (
            <g className="pixel-gesture-heart">
              <g transform="translate(126, 166)">
                <path
                  d="M14 6 C10 0 2 2 2 8 C2 15 14 22 14 22 C14 22 26 15 26 8 C26 2 18 0 14 6 Z"
                  fill="#ec4899"
                  filter={`url(#${ids.glowFilter})`}
                />
                <path
                  d="M14 8 C11 2 4 4 4 9 C4 14 14 20 14 20 C14 20 24 14 24 9 C24 4 17 2 14 8 Z"
                  fill="#f472b6"
                />
              </g>
            </g>
          )}

          {gesture === "watergun" && (
            <g className="pixel-gesture-watergun">
              <g transform="translate(186, 182)">
                <path d="M8 18 H32 V24 H22 V30 H12 V24 H8 Z" fill="#0f172a" />
                <path d="M10 19 H30 V22 H20 V28 H14 V22 H10 Z" fill="#06b6d4" />
                {/* Feixe de Plasma Elétrico */}
                <line x1="33" y1="20" x2="70" y2="20" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <line x1="33" y1="20" x2="70" y2="20" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              </g>
            </g>
          )}

          {gesture === "finger" && (
            <g className="pixel-gesture-finger">
              <g transform="translate(186, 164)">
                <path d="M16 4 H22 V28 H12 V20 H16 Z" fill="#0f172a" />
                <path d="M18 6 H20 V26 H14 V21 H18 Z" fill="#06b6d4" />
                {/* Lâmpada de Ideia Flutuando */}
                <g transform="translate(10, -22)">
                  <circle cx="10" cy="10" r="7" fill="#fbbf24" filter={`url(#${ids.glowFilter})`} />
                  <rect x="7" y="17" width="6" height="4" rx="1" fill="#64748b" />
                </g>
              </g>
            </g>
          )}
        </g>

        {/* 5. CABEÇA, ROSTO COMIC EXPRESSIVO, CABELO ELÉTRICO E GOGGLES */}
        <g className="pixel-head" transform={`translate(${faceX}, ${faceY})`}>
          {/* ========================================================
              CABELO ELÉTRICO TRASEIRO: EXPLOSÃO SELVAGEM DE ENERGIA
              ======================================================== */}
          <g className="pixel-hair-back">
            {/* Silhueta Base Escura com Spikes Extremos de Cientista Maluco */}
            <path
              d="M44 140 C32 108 36 62 58 34 C78 8 110 2 140 2 C170 2 202 8 222 34 C244 62 248 108 236 140 C242 106 236 60 216 38 C196 16 170 12 140 12 C110 12 84 16 64 38 C44 60 38 106 44 140 Z"
              fill="#0f172a"
            />
            {/* Volume Elétrico Médio com Mechas Volumosas em Degradê de Ciano */}
            <path
              d="M48 134 C38 104 42 64 62 38 C82 12 112 6 140 6 C168 6 198 12 218 38 C238 64 242 104 232 134 C238 98 230 56 210 36 C190 16 166 12 140 12 C114 12 90 16 70 36 C50 56 42 98 48 134 Z"
              fill={`url(#${ids.hairBaseGrad})`}
            />

            {/* Espículas Elétricas Externas que explodem para todos os lados */}
            <path d="M40 92 L24 78 L44 70 L34 52 L56 44 L48 26 L76 20" fill="none" stroke={`url(#${ids.hairNeonGrad})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M240 92 L256 78 L236 70 L246 52 L224 44 L232 26 L204 20" fill="none" stroke={`url(#${ids.hairNeonGrad})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M102 12 L112 -4 L126 8 L140 -8 L154 8 L168 -4 L178 12" fill="none" stroke={`url(#${ids.hairGleamGrad})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${ids.glowFilter})`} />
          </g>

          {/* Pescoço com Sombra */}
          <path d="M122 144 H158 V162 H122 Z" fill="#c2410c" />
          <path d="M125 146 H155 V160 H125 Z" fill={`url(#${ids.skinGrad})`} />

          {/* Mandíbula e Rosto Estilizado Comic / Anime Proporcional */}
          <path
            d="M96 78 C94 106 98 128 114 146 C124 154 134 158 140 158 C146 158 156 154 166 146 C182 128 186 106 184 78 C182 54 170 44 140 44 C110 44 98 54 96 78 Z"
            fill="#c2410c"
          />
          <path
            d="M98 80 C96 106 100 126 115 144 C124 152 134 156 140 156 C146 156 156 152 165 144 C180 126 184 106 182 80 C180 56 168 46 140 46 C112 46 100 56 98 80 Z"
            fill={`url(#${ids.skinGrad})`}
          />

          {/* Orelhas com Brincos Tecnológicos */}
          <path d="M90 98 C88 90 96 84 98 88 V114 C96 118 88 112 90 104 Z" fill="#ea580c" />
          <path d="M92 99 C90 92 96 86 97 90 V112 C96 116 90 110 92 103 Z" fill={`url(#${ids.skinGrad})`} />
          <circle cx="93" cy="113" r="2.2" fill="#06b6d4" />

          <path d="M190 98 C192 90 184 84 182 88 V114 C184 118 192 112 190 104 Z" fill="#ea580c" />
          <path d="M188 99 C190 92 184 86 183 90 V112 C184 116 190 110 188 103 Z" fill={`url(#${ids.skinGrad})`} />
          <circle cx="187" cy="113" r="2.2" fill="#06b6d4" />

          {/* Raio / Vapor de Sobrecarga Elétrica quando louco ou irritado */}
          {isAngryOrCrazy && (
            <g className="pixel-steam-burst">
              <path d="M84 96 L74 88 L82 82 L70 72" stroke="#f43f5e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${ids.glowFilter})`} />
              <path d="M196 96 L206 88 L198 82 L210 72" stroke="#f43f5e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${ids.glowFilter})`} />
            </g>
          )}

          {/* Bochechas Coradas */}
          <ellipse cx="112" cy="120" rx="14" ry="7" fill={`url(#${ids.skinCheekGrad})`} />
          <ellipse cx="168" cy="120" rx="14" ry="7" fill={`url(#${ids.skinCheekGrad})`} />

          {/* Nariz Expressivo Comic */}
          <path d="M138 102 L137 118 Q140 122 143 118 L142 102 Z" fill="#fdba74" />
          <circle cx="140" cy="118" r="1.8" fill="#ea580c" />
          <circle cx="139" cy="116.5" r="0.8" fill="#ffffff" />

          {/* ÓCULOS TECNOLÓGICOS / GOGGLES POUSADOS NA TESTA (ESTILO DOC BROWN / CIENTISTA) */}
          <g className="pixel-goggles" transform="translate(0, -6)">
            {/* Tira de couro dos óculos que circunda a cabeça */}
            <path d="M88 66 Q140 58 192 66" stroke="#0f172a" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M88 66 Q140 58 192 66" stroke="#0284c7" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Lente e Armação Esquerda */}
            <circle cx="116" cy="62" r="16" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
            <circle cx="116" cy="62" r="12" fill={`url(#${ids.goggleLensGrad})`} filter={`url(#${ids.glowFilter})`} />
            <path d="M110 54 L114 70" stroke="#ffffff" strokeWidth="2" strokeOpacity=".6" strokeLinecap="round" />

            {/* Ponte Central dos Goggles */}
            <rect x="132" y="58" width="16" height="6" rx="2" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />

            {/* Lente e Armação Direita */}
            <circle cx="164" cy="62" r="16" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
            <circle cx="164" cy="62" r="12" fill={`url(#${ids.goggleLensGrad})`} filter={`url(#${ids.glowFilter})`} />
            <path d="M158 54 L162 70" stroke="#ffffff" strokeWidth="2" strokeOpacity=".6" strokeLinecap="round" />
          </g>

          {/* SOBRANCELHAS EXPRESSIVAS E VIVAS */}
          <g className="pixel-eyebrows">
            {isAngryOrCrazy ? (
              <>
                <path d="M104 88 L126 97" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                <path d="M105 88 L125 96" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M176 88 L154 97" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                <path d="M175 88 L155 96" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M102 87 Q116 80 128 85" stroke="#0f172a" strokeWidth="3.6" fill="none" strokeLinecap="round" />
                <path d="M103 87 Q116 81 127 85" stroke="#38bdf8" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M178 87 Q164 80 152 85" stroke="#0f172a" strokeWidth="3.6" fill="none" strokeLinecap="round" />
                <path d="M177 87 Q164 81 153 85" stroke="#38bdf8" strokeWidth="2" fill="none" strokeLinecap="round" />
              </>
            )}
          </g>

          {/* OLHOS COMIC GRANDES, VIVOS E EXPRESSIVOS COM PARALLAX */}
          <g className="pixel-eyes">
            {/* Olho Esquerdo */}
            <g className="pixel-eye pixel-eye-left">
              <ellipse cx="116" cy="103" rx="12" ry="14" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="116" cy="103" r="7.5" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="116" cy="103" r="4.2" fill="#090d16" />
                {/* Brilhos especulares duplos marcantes */}
                <circle cx="113.5" cy="100.5" r="2.2" fill="#ffffff" />
                <circle cx="118.5" cy="105.5" r="1.1" fill="#ffffff" />
              </g>
              {/* Delineado e cílio superior expressivo */}
              <path d="M103 98 C108 91 124 91 129 98" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            </g>

            {/* Olho Direito */}
            <g className="pixel-eye pixel-eye-right">
              <ellipse cx="164" cy="103" rx="12" ry="14" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="164" cy="103" r="7.5" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="164" cy="103" r="4.2" fill="#090d16" />
                {/* Brilhos especulares duplos marcantes */}
                <circle cx="161.5" cy="100.5" r="2.2" fill="#ffffff" />
                <circle cx="166.5" cy="105.5" r="1.1" fill="#ffffff" />
              </g>
              {/* Delineado e cílio superior expressivo */}
              <path d="M151 98 C156 91 172 91 177 98" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            </g>

            {/* Pálpebras de Piscar Natural */}
            <path
              className="pixel-eyelid-blink"
              d="M102 103 C108 108 124 108 130 103 M150 103 C156 108 172 108 178 103"
              stroke="#ea580c"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* ========================================================
              SINCRONIA LABIAL EXPRESSIVA DE 5 VISEMAS (pixel-mouth)
              ======================================================== */}
          <g className="pixel-mouth" data-viseme={mouth}>
            {/* 0. Visema ABERTA (A, O) - Grande e Engraçada */}
            {mouth === 0 && (
              <g className="viseme-open">
                <path d="M128 130 C128 126 152 126 152 130 C154 144 150 148 140 148 C130 148 126 144 128 130 Z" fill="#1e1b4b" stroke="#0f172a" strokeWidth="1.8" />
                {/* Dentes Superiores Brancos */}
                <path d="M131 129 H149 V134 H131 Z" fill="#ffffff" />
                <line x1="137" y1="129" x2="137" y2="134" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="143" y1="129" x2="143" y2="134" stroke="#cbd5e1" strokeWidth="1" />
                {/* Língua Rosa Animada */}
                <ellipse cx="140" cy="144" rx="6" ry="3.5" fill="#f43f5e" />
              </g>
            )}

            {/* 1. Visema ESTICADA (E, I) - Grande Sorriso com Dentes */}
            {mouth === 1 && (
              <g className="viseme-wide">
                <path d="M126 132 C132 128 148 128 154 132 C156 141 150 144 140 144 C130 144 124 141 126 132 Z" fill="#1e1b4b" stroke="#0f172a" strokeWidth="1.8" />
                <path d="M129 131 H151 V136 H129 Z" fill="#ffffff" />
                <line x1="135" y1="131" x2="135" y2="136" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="140" y1="131" x2="140" y2="136" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="145" y1="131" x2="145" y2="136" stroke="#cbd5e1" strokeWidth="1" />
                <path d="M126 132 Q140 128 154 132" stroke="#f43f5e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* 2. Visema REDONDA (O, U, W) */}
            {mouth === 2 && (
              <g className="viseme-round">
                <ellipse cx="140" cy="136" rx="7.5" ry="6.5" fill="#1e1b4b" stroke="#0f172a" strokeWidth="2" />
                <ellipse cx="140" cy="135" rx="4" ry="2.8" fill="#f43f5e" />
                <circle cx="140" cy="136" r="2.5" fill="#090d16" />
              </g>
            )}

            {/* 3. Visema FECHANDO (Consoantes) */}
            {mouth === 3 && (
              <g className="viseme-close">
                <path d="M130 135 Q140 132 150 135" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                <path d="M131 135.2 Q140 136.5 149 135.2" stroke="#f43f5e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* 4. Visema REPOUSO / PHONEME-REST-LIVE (Sorriso Maroto de Professor) */}
            {mouth === 4 && (
              <g className="viseme-rest phoneme-rest-live">
                <path d="M131 134 Q140 131 149 134" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M132 134.8 Q140 136.2 148 134.8" stroke="#f43f5e" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                {/* Covinha expressiva no canto da boca */}
                <circle cx="150" cy="133.5" r="1.2" fill="#ea580c" />
                {/* Brilho de estrela no dente */}
                <circle cx="146" cy="133" r="1.2" fill="#ffffff" filter={`url(#${ids.glowFilter})`} />
              </g>
            )}
          </g>

          {/* ========================================================
              CABELO FRONTAL & FRANJA FLAMEJANTE ELÉTRICA (ZERO CALVÍCIE)
              ======================================================== */}
          <g className="pixel-hair-front">
            {/* Camada 1: Cúpula Densa de Cabelo Cobrindo Toda a Cabeça */}
            <path
              d="M68 62 C70 28 100 8 140 8 C180 8 210 28 212 62 C210 74 204 86 198 96 C192 80 186 70 174 62 C160 52 148 58 140 62 C132 58 120 52 106 62 C94 70 88 80 82 96 C76 86 70 74 68 62 Z"
              fill="#0f172a"
            />
            {/* Camada 2: Volume Ciano Elétrico Principal */}
            <path
              d="M66 60 C68 24 98 4 140 4 C182 4 212 24 214 60 C212 74 206 88 200 100 C194 82 188 70 176 62 C162 50 148 56 140 60 C132 56 118 50 104 62 C92 70 86 82 80 100 C74 88 68 74 66 60 Z"
              fill={`url(#${ids.hairNeonGrad})`}
            />

            {/* FRANJA ELÉTRICA QUE CAI SOBRE A TESTA E ENTRE OS OLHOS */}
            {/* Mecha Central Longa que desce até o nariz */}
            <path
              d="M134 42 C138 58 136 74 140 90 C144 74 142 58 146 42 Z"
              fill="#0891b2"
            />
            <path
              d="M135 44 C139 58 137 72 140 88 C143 72 141 58 145 44 Z"
              fill={`url(#${ids.hairGleamGrad})`}
              filter={`url(#${ids.glowFilter})`}
            />

            {/* Mecha Franja Esquerda */}
            <path
              d="M114 44 C116 60 118 72 124 84 C126 70 126 58 124 44 Z"
              fill="#0891b2"
            />
            <path
              d="M115 46 C117 60 119 70 124 82 C125 70 125 58 123 46 Z"
              fill={`url(#${ids.hairGleamGrad})`}
            />

            {/* Mecha Franja Direita */}
            <path
              d="M166 44 C164 60 162 72 156 84 C154 70 154 58 156 44 Z"
              fill="#0891b2"
            />
            <path
              d="M165 46 C163 60 161 70 156 82 C155 70 155 58 157 46 Z"
              fill={`url(#${ids.hairGleamGrad})`}
            />

            {/* Cachos / Mechas Laterais descendo pelas bochechas */}
            <path
              d="M78 70 C72 88 70 112 76 128 C80 114 84 100 88 86 Z"
              fill={`url(#${ids.hairNeonGrad})`}
            />
            <path d="M78 74 Q74 104 78 124" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            <path
              d="M202 70 C208 88 210 112 204 128 C200 114 196 100 192 86 Z"
              fill={`url(#${ids.hairNeonGrad})`}
            />
            <path d="M202 74 Q206 104 202 124" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* TOPETE ELÉTRICO SUPERIOR (EXPLOSÃO DE ENERGIA) */}
            <path
              d="M116 32 C126 12 136 0 140 -4 C144 0 154 12 164 32 C152 26 140 24 128 28 Z"
              fill={`url(#${ids.hairGleamGrad})`}
              filter={`url(#${ids.glowFilter})`}
            />
            <path d="M134 20 L140 -2 L146 20" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}
