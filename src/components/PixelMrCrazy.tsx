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
 * Mr. Crazy: Avatar de Alta Fidelidade em Micro-Pixel Art 32-Bit.
 * Estilo retro arcade moderno (estilo anime / Capcom CPS2 / Neo-Geo).
 * Cabelo flamejante denso e volumoso com franja estilizada (zero calvície),
 * olhar intelectual penetrante com óculos de fio de ouro,
 * traje vitoriano acadêmico detalhado e sincronia labial responsiva em tempo real.
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

  // Parallax natural dos olhos e cabeça seguindo o cursor ou toque
  const faceX = Math.round(lookX * 3.2);
  const faceY = Math.round(lookY * 2.2);
  const pupilX = Math.round(lookX * 2.8);
  const pupilY = Math.round(lookY * 1.8);

  const mouthLabels = ["aberta", "esticada", "redonda", "fechando", "repouso"] as const;
  const mouthLabel = mouthLabels[mouth] ?? "repouso";

  const isAngryOrCrazy = crazyLevel >= 45 || emotion === "irritated" || emotion === "crazy" || emotion === "annoyed";

  const ids = {
    aura: `${instanceId}-aura`,
    floorShadow: `${instanceId}-floor-shadow`,
    glowFilter: `${instanceId}-glow`,
    hairDeepGrad: `${instanceId}-hair-deep`,
    hairBodyGrad: `${instanceId}-hair-body`,
    hairTipGrad: `${instanceId}-hair-tip`,
    skinFaceGrad: `${instanceId}-skin-face`,
    skinCheekGrad: `${instanceId}-skin-cheek`,
    skinHandGrad: `${instanceId}-skin-hand`,
    coatGrad: `${instanceId}-coat`,
    coatLapelGrad: `${instanceId}-coat-lapel`,
    capeGrad: `${instanceId}-cape`,
    goldGrad: `${instanceId}-gold`,
    leatherGrad: `${instanceId}-leather`,
    eyeIrisGrad: `${instanceId}-eye-iris`,
    rubyGrad: `${instanceId}-ruby`,
    cravatGrad: `${instanceId}-cravat`
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
        {/* Aura de energia sutil */}
        <radialGradient id={ids.aura} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#ef4444" : "#0d9488"} stopOpacity={isAngryOrCrazy ? ".25" : ".14"} />
          <stop offset="65%" stopColor={isAngryOrCrazy ? "#dc2626" : "#0f766e"} stopOpacity=".03" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão sob as botas */}
        <radialGradient id={ids.floorShadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity=".7" />
          <stop offset="55%" stopColor="#000000" stopOpacity=".25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Filtro de brilho sutil */}
        <filter id={ids.glowFilter} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Cabelo Fundo: Profundidade Sombria */}
        <linearGradient id={ids.hairDeepGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#200303" />
          <stop offset="30%" stopColor="#480909" />
          <stop offset="65%" stopColor="#7c1a1a" />
          <stop offset="100%" stopColor="#b43403" />
        </linearGradient>

        {/* Cabelo Corpo: Laranja / Vermelho Flamejante */}
        <linearGradient id={ids.hairBodyGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#500707" />
          <stop offset="25%" stopColor="#991b1b" />
          <stop offset="55%" stopColor="#c2410c" />
          <stop offset="82%" stopColor="#ea580c" />
          <stop offset="96%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        {/* Cabelo Destaque: Mechas Douradas Incandescentes */}
        <linearGradient id={ids.hairTipGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        {/* Pele Facial: Tom Quente Anime Esculpido */}
        <radialGradient id={ids.skinFaceGrad} cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#fff5ee" />
          <stop offset="35%" stopColor="#fde0cb" />
          <stop offset="72%" stopColor="#f8c29b" />
          <stop offset="90%" stopColor="#e39870" />
          <stop offset="100%" stopColor="#b8532f" />
        </radialGradient>

        {/* Rubor Suave nas Bochechas */}
        <radialGradient id={ids.skinCheekGrad} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity=".38" />
          <stop offset="65%" stopColor="#f43f5e" stopOpacity=".1" />
          <stop offset="100%" stopColor="#f8c29b" stopOpacity="0" />
        </radialGradient>

        {/* Mãos Anatômicas */}
        <linearGradient id={ids.skinHandGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff4ed" />
          <stop offset="50%" stopColor="#f8c29b" />
          <stop offset="100%" stopColor="#c86742" />
        </linearGradient>

        {/* Casaco Esmeralda Nobre */}
        <linearGradient id={ids.coatGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#04231e" />
          <stop offset="25%" stopColor="#083c34" />
          <stop offset="55%" stopColor="#0d695d" />
          <stop offset="85%" stopColor="#109180" />
          <stop offset="100%" stopColor="#18b8a3" />
        </linearGradient>

        {/* Lapelas de Cetim Esmeralda */}
        <linearGradient id={ids.coatLapelGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#18b8a3" />
          <stop offset="40%" stopColor="#0d695d" />
          <stop offset="100%" stopColor="#052c26" />
        </linearGradient>

        {/* Cravat de Seda Ametista */}
        <linearGradient id={ids.cravatGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="45%" stopColor="#7e22ce" />
          <stop offset="85%" stopColor="#581c87" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>

        {/* Capa Carmesim Heroica */}
        <linearGradient id={ids.capeGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#24040c" />
          <stop offset="25%" stopColor="#4a0618" />
          <stop offset="60%" stopColor="#820d2c" />
          <stop offset="85%" stopColor="#b81440" />
          <stop offset="100%" stopColor="#e0285a" />
        </linearGradient>

        {/* Ouro Metálico Polido */}
        <linearGradient id={ids.goldGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5c2c05" />
          <stop offset="25%" stopColor="#96530a" />
          <stop offset="50%" stopColor="#d98218" />
          <stop offset="78%" stopColor="#fcc419" />
          <stop offset="100%" stopColor="#fff3bf" />
        </linearGradient>

        {/* Couro Nobre */}
        <linearGradient id={ids.leatherGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1c1917" />
          <stop offset="35%" stopColor="#451a03" />
          <stop offset="70%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>

        {/* Íris Safira / Cobalto com Brilho Profundo */}
        <radialGradient id={ids.eyeIrisGrad} cx="40%" cy="36%" r="60%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="35%" stopColor="#0284c7" />
          <stop offset="75%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>

        {/* Broche Rubi Lapidado */}
        <radialGradient id={ids.rubyGrad} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="30%" stopColor="#f43f5e" />
          <stop offset="75%" stopColor="#9f1239" />
          <stop offset="100%" stopColor="#4c0519" />
        </radialGradient>
      </defs>

      {/* Aura de ambientação no fundo */}
      <ellipse className="pixel-aura" cx="140" cy="165" rx="118" ry="142" fill={`url(#${ids.aura})`} />

      {/* Sombra de chão */}
      <g className="pixel-ground-shadow" aria-hidden="true">
        <ellipse cx="140" cy="326" rx="88" ry="10" fill={`url(#${ids.floorShadow})`} />
      </g>

      {/* ========================================================
          RIG HEROICO DO AVATAR - MICRO-PIXEL ART 32-BIT
          ======================================================== */}
      <g className="pixel-rig">
        {/* 1. CAPA HEROICA CARMESIM */}
        <g className="pixel-cape-back">
          {/* Aba Esquerda da Capa */}
          <path
            d="M96 160 C80 185 64 228 58 288 C66 294 92 292 104 286 C98 238 98 190 102 162 Z"
            fill="#180208"
          />
          <path
            d="M98 162 C84 186 68 226 62 284 C70 290 92 288 102 282 C98 238 98 190 104 164 Z"
            fill={`url(#${ids.capeGrad})`}
          />
          <path
            d="M62 284 C66 250 78 206 94 170"
            stroke="#f43f5e"
            strokeWidth="1.6"
            strokeOpacity=".6"
            fill="none"
          />

          {/* Aba Direita da Capa */}
          <path
            d="M184 160 C200 185 216 228 222 288 C214 294 188 292 176 286 C182 238 182 190 178 162 Z"
            fill="#180208"
          />
          <path
            d="M182 162 C196 186 212 226 218 284 C210 290 188 288 178 282 C182 238 182 190 176 164 Z"
            fill={`url(#${ids.capeGrad})`}
          />
          <path
            d="M218 284 C214 250 202 206 186 170"
            stroke="#f43f5e"
            strokeWidth="1.6"
            strokeOpacity=".6"
            fill="none"
          />
        </g>

        {/* 2. PERNAS E BOTAS DE COURO */}
        <g className="pixel-legs">
          {/* Perna Esquerda */}
          <path d="M106 252 H133 V292 H106 Z" fill="#0b111e" />
          <path d="M108 254 H131 V290 H108 Z" fill="#1e293b" />
          <line x1="120" y1="255" x2="120" y2="288" stroke="#334155" strokeWidth="1.4" />

          {/* Perna Direita */}
          <path d="M147 252 H174 V292 H147 Z" fill="#0b111e" />
          <path d="M149 254 H172 V290 H149 Z" fill="#1e293b" />
          <line x1="160" y1="255" x2="160" y2="288" stroke="#334155" strokeWidth="1.4" />

          {/* Bota Esquerda com Fivela Dourada */}
          <g className="pixel-boot-left">
            <path
              d="M102 288 C102 302 101 318 102 325 C111 326 135 326 144 325 C147 324 145 320 143 316 C139 306 137 294 136 288 Z"
              fill="#110d0a"
            />
            <path
              d="M104 290 C104 302 103 316 104 323 C113 324 133 324 141 323 C143 322 142 318 141 315 C137 306 135 296 134 290 Z"
              fill={`url(#${ids.leatherGrad})`}
            />
            <path d="M101 322 Q124 322 145 322 L146 326 Q124 326 102 326 Z" fill="#090d16" />
            <rect x="110" y="299" width="18" height="11" rx="3.5" fill={`url(#${ids.goldGrad})`} />
            <rect x="113" y="301" width="12" height="7" rx="2" fill="#1c1917" />
            <circle cx="119" cy="304.5" r="1.4" fill="#fff3bf" />
          </g>

          {/* Bota Direita com Fivela Dourada */}
          <g className="pixel-boot-right">
            <path
              d="M144 288 C144 302 143 318 144 325 C153 326 177 326 186 325 C189 324 187 320 185 316 C181 306 179 294 178 288 Z"
              fill="#110d0a"
            />
            <path
              d="M146 290 C146 302 145 316 146 323 C155 324 175 324 183 323 C185 322 184 318 183 315 C179 306 177 296 176 290 Z"
              fill={`url(#${ids.leatherGrad})`}
            />
            <path d="M143 322 Q166 322 187 322 L188 326 Q166 326 144 326 Z" fill="#090d16" />
            <rect x="152" y="299" width="18" height="11" rx="3.5" fill={`url(#${ids.goldGrad})`} />
            <rect x="155" y="301" width="12" height="7" rx="2" fill="#1c1917" />
            <circle cx="161" cy="304.5" r="1.4" fill="#fff3bf" />
          </g>
        </g>

        {/* 3. TRONCO, CASACO ESMERALDA TAILORED, CRAVAT E BROCHE */}
        <g className="pixel-body">
          {/* Base e Corte do Casaco */}
          <path
            d="M86 158 C86 154 110 152 140 152 C170 152 194 154 194 158 C198 178 201 218 200 256 C162 258 118 258 80 256 C79 218 82 178 86 158 Z"
            fill="#04231e"
          />
          <path
            d="M90 159 C90 155 112 153 140 153 C168 153 190 155 190 159 C194 178 196 218 195 254 C160 256 120 256 85 254 C84 218 86 178 90 159 Z"
            fill="#083c34"
          />
          <path
            d="M94 160 C94 156 114 155 140 155 C166 155 186 156 186 160 C189 178 190 216 189 252 C158 254 122 254 91 252 C90 216 91 178 94 160 Z"
            fill={`url(#${ids.coatGrad})`}
          />

          {/* Lapelas Peaked Elegantes */}
          <path
            d="M104 156 C110 174 124 204 128 218 C120 216 108 198 96 172 Z"
            fill={`url(#${ids.coatLapelGrad})`}
          />
          <path
            d="M176 156 C170 174 156 204 152 218 C160 216 172 198 184 172 Z"
            fill={`url(#${ids.coatLapelGrad})`}
          />
          {/* Debrum em Fio de Ouro */}
          <path
            d="M104 156 C110 174 124 204 128 218"
            stroke={`url(#${ids.goldGrad})`}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M176 156 C170 174 156 204 152 218"
            stroke={`url(#${ids.goldGrad})`}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />

          {/* Camisa de Linho Branca e Cravat de Seda Ametista */}
          <path d="M125 154 H155 C151 170 147 184 140 190 C133 184 129 170 125 154 Z" fill="#ffffff" />
          <path d="M128 156 H152 C149 170 145 184 140 189 C135 184 131 170 128 156 Z" fill="#f1f5f9" />
          {/* Pregas do Cravat */}
          <path d="M130 158 C135 158 145 158 150 158 C147 174 144 188 140 194 C136 188 133 174 130 158 Z" fill={`url(#${ids.cravatGrad})`} />
          <path d="M134 162 C137 162 143 162 146 162 C144 173 142 183 140 189 C138 183 136 173 134 162 Z" fill="#9333ea" />

          {/* Broche de Rubi com Aro de Ouro */}
          <circle cx="140" cy="173" r="4.8" fill={`url(#${ids.goldGrad})`} />
          <circle cx="140" cy="173" r="3.4" fill={`url(#${ids.rubyGrad})`} />
          <circle cx="138.9" cy="171.9" r="1.1" fill="#ffffff" />

          {/* Botões Duplos Metálicos Ornamentais */}
          <circle cx="132" cy="226" r="3.2" fill={`url(#${ids.goldGrad})`} />
          <circle cx="132" cy="226" r="2.2" fill="#ffd43b" />
          <circle cx="148" cy="226" r="3.2" fill={`url(#${ids.goldGrad})`} />
          <circle cx="148" cy="226" r="2.2" fill="#ffd43b" />

          <circle cx="133" cy="240" r="3.2" fill={`url(#${ids.goldGrad})`} />
          <circle cx="133" cy="240" r="2.2" fill="#ffd43b" />
          <circle cx="147" cy="240" r="3.2" fill={`url(#${ids.goldGrad})`} />
          <circle cx="147" cy="240" r="2.2" fill="#ffd43b" />

          {/* Cinto de Couro e Fivela Dourada */}
          <path d="M91 251 H189 V260 H91 Z" fill="#1c1917" />
          <path d="M93 252 H187 V258 H93 Z" fill={`url(#${ids.leatherGrad})`} />
          <rect x="131" y="249" width="18" height="12" rx="3.5" fill={`url(#${ids.goldGrad})`} />
          <rect x="134" y="251" width="12" height="8" rx="2" fill="#1c1917" />
          <rect x="138" y="251" width="4" height="8" fill={`url(#${ids.goldGrad})`} />
        </g>

        {/* 4. BRAÇOS E MÃOS ANATÔMICAS EM REPOUSO */}
        <g className="pixel-arms">
          {/* Braço Esquerdo */}
          <g className="pixel-arm-left">
            <path
              d="M86 160 C78 180 72 208 70 240 C76 242 88 242 94 240 C95 212 99 184 104 164 Z"
              fill="#04231e"
            />
            <path
              d="M88 162 C80 181 74 208 72 238 C77 240 86 240 92 238 C93 212 97 185 102 165 Z"
              fill={`url(#${ids.coatGrad})`}
            />
            <path d="M71 236 Q82 238 93 236 L94 240 Q82 242 70 240 Z" fill={`url(#${ids.goldGrad})`} />

            {/* Mão Esquerda Natural */}
            <g className="pixel-hand-left">
              <path
                d="M72 240 C70 248 72 258 75 264 C80 266 88 266 91 264 C93 258 92 248 91 240 Z"
                fill="#b44d28"
              />
              <path
                d="M74 241 C72 248 73 257 76 262 C80 264 86 264 89 262 C91 257 91 248 89 241 Z"
                fill={`url(#${ids.skinHandGrad})`}
              />
              <line x1="77" y1="250" x2="77" y2="260" stroke="#b44d28" strokeWidth="0.8" />
              <line x1="81" y1="250" x2="81" y2="261" stroke="#b44d28" strokeWidth="0.8" />
              <line x1="85" y1="250" x2="85" y2="260" stroke="#b44d28" strokeWidth="0.8" />
            </g>
          </g>

          {/* Braço Direito */}
          <g className="pixel-arm-right">
            <path
              d="M194 160 C202 180 208 208 210 240 C204 242 192 242 186 240 C185 212 181 184 176 164 Z"
              fill="#04231e"
            />
            <path
              d="M192 162 C200 181 206 208 208 238 C203 240 194 240 188 238 C187 212 183 185 178 165 Z"
              fill={`url(#${ids.coatGrad})`}
            />
            <path d="M187 236 Q198 238 209 236 L210 240 Q198 242 186 240 Z" fill={`url(#${ids.goldGrad})`} />

            {/* Mão Direita Natural */}
            <g className="pixel-hand-right">
              <path
                d="M189 240 C188 248 187 258 189 264 C192 266 200 266 205 264 C208 258 210 248 208 240 Z"
                fill="#b44d28"
              />
              <path
                d="M191 241 C189 248 189 257 191 262 C194 264 200 264 203 262 C206 257 207 248 206 241 Z"
                fill={`url(#${ids.skinHandGrad})`}
              />
              <line x1="195" y1="250" x2="195" y2="260" stroke="#b44d28" strokeWidth="0.8" />
              <line x1="199" y1="250" x2="199" y2="261" stroke="#b44d28" strokeWidth="0.8" />
              <line x1="203" y1="250" x2="203" y2="260" stroke="#b44d28" strokeWidth="0.8" />
            </g>
          </g>
        </g>

        {/* 5. GESTOS CONDICIONAIS (APARECEM APENAS QUANDO ATIVOS) */}
        <g className="pixel-gesture-layer">
          {gesture === "thumbsup" && (
            <g className="pixel-gesture-thumbsup">
              <g transform="translate(186, 178)">
                <path
                  d="M16 26 C12 26 8 20 8 14 C8 8 13 4 16 2 C18 0 22 2 22 6 C22 10 22 14 24 16 C26 18 28 18 28 22 C28 26 24 28 20 28 Z"
                  fill="#b44d28"
                />
                <path
                  d="M17 25 C14 25 10 20 10 14 C10 9 14 5 17 4 C18 3 20 4 20 7 C20 10 20 14 23 16 C25 18 26 19 26 22 C26 24 23 26 19 26 Z"
                  fill={`url(#${ids.skinHandGrad})`}
                />
                <line x1="20" y1="18" x2="25" y2="18" stroke="#b44d28" strokeWidth="1" />
                <line x1="20" y1="22" x2="25" y2="22" stroke="#b44d28" strokeWidth="1" />
                <g className="pixel-sparkles">
                  <circle cx="28" cy="2" r="3" fill="#fef08a" filter={`url(#${ids.glowFilter})`} />
                  <path d="M28 -3 L28 7 M23 2 L33 2" stroke="#f59e0b" strokeWidth="1.2" />
                </g>
              </g>
            </g>
          )}

          {gesture === "heart" && (
            <g className="pixel-gesture-heart">
              <g transform="translate(126, 166)">
                <path
                  d="M14 6 C10 0 2 2 2 8 C2 15 14 22 14 22 C14 22 26 15 26 8 C26 2 18 0 14 6 Z"
                  fill="#f43f5e"
                  filter={`url(#${ids.glowFilter})`}
                />
                <path
                  d="M14 8 C11 2 4 4 4 9 C4 14 14 20 14 20 C14 20 24 14 24 9 C24 4 17 2 14 8 Z"
                  fill="#fb7185"
                />
              </g>
            </g>
          )}

          {gesture === "watergun" && (
            <g className="pixel-gesture-watergun">
              <g transform="translate(186, 182)">
                <path d="M8 18 H32 V24 H22 V30 H12 V24 H8 Z" fill="#b44d28" />
                <path d="M10 19 H30 V22 H20 V28 H14 V22 H10 Z" fill={`url(#${ids.skinHandGrad})`} />
                <line x1="33" y1="20" x2="65" y2="20" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
                <line x1="33" y1="20" x2="65" y2="20" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
              </g>
            </g>
          )}

          {gesture === "finger" && (
            <g className="pixel-gesture-finger">
              <g transform="translate(186, 164)">
                <path d="M16 4 H22 V28 H12 V20 H16 Z" fill="#b44d28" />
                <path d="M18 6 H20 V26 H14 V21 H18 Z" fill={`url(#${ids.skinHandGrad})`} />
              </g>
            </g>
          )}
        </g>

        {/* 6. CABEÇA, ROSTO ANATÔMICO, CABELO DENSO (ZERO CALVÍCIE) E ÓCULOS */}
        <g className="pixel-head" transform={`translate(${faceX}, ${faceY})`}>
          {/* CABELO TRASEIRO VOLUMOSO (FUNDO DAS MECHAS) */}
          <g className="pixel-hair-back">
            {/* Camada de Silhueta Profunda Traseira com Pontas Pontiagudas de Fogo */}
            <path
              d="M54 136 C42 108 46 68 64 42 C82 16 112 8 140 8 C168 8 198 16 216 42 C234 68 238 108 226 136 C232 104 226 66 208 46 C190 26 166 20 140 20 C114 20 90 26 72 46 C54 66 48 104 54 136 Z"
              fill="#220303"
            />
            {/* Mechas volumosas de fogo saindo pelas laterais e topo */}
            <path
              d="M58 132 C48 106 52 68 70 44 C88 20 114 12 140 12 C166 12 192 20 210 44 C228 68 232 106 222 132 C228 100 220 62 202 44 C184 26 164 18 140 18 C116 18 96 26 78 44 C60 62 52 100 58 132 Z"
              fill={`url(#${ids.hairDeepGrad})`}
            />
            {/* Mechas exteriores que quebram o contorno da cabeça */}
            <path d="M48 94 L36 82 L52 74 L44 60 L62 52 L56 38 L78 30" fill="none" stroke={`url(#${ids.hairDeepGrad})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M232 94 L244 82 L228 74 L236 60 L218 52 L224 38 L202 30" fill="none" stroke={`url(#${ids.hairDeepGrad})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Pescoço com Sombra da Mandíbula */}
          <path d="M122 144 H158 V162 H122 Z" fill="#b44d28" />
          <path d="M125 146 H155 V160 H125 Z" fill={`url(#${ids.skinFaceGrad})`} />
          <path d="M122 144 Q140 152 158 144 Z" fill="#8c3315" />

          {/* Mandíbula e Rosto Proporcional (Tapered Anime Jaw) */}
          <path
            d="M96 76 C94 104 98 126 114 144 C124 152 134 156 140 156 C146 156 156 152 166 144 C182 126 186 104 184 76 C182 52 170 42 140 42 C110 42 98 52 96 76 Z"
            fill="#b44d28"
          />
          <path
            d="M98 78 C96 104 100 124 115 142 C124 150 134 154 140 154 C146 154 156 150 165 142 C180 124 184 104 182 78 C180 54 168 44 140 44 C112 44 100 54 98 78 Z"
            fill={`url(#${ids.skinFaceGrad})`}
          />

          {/* Orelhas com Brincos */}
          <path d="M90 98 C88 90 96 84 98 88 V114 C96 118 88 112 90 104 Z" fill="#b44d28" />
          <path d="M92 99 C90 92 96 86 97 90 V112 C96 116 90 110 92 103 Z" fill={`url(#${ids.skinFaceGrad})`} />
          <circle cx="93" cy="113" r="2.2" fill={`url(#${ids.goldGrad})`} />

          <path d="M190 98 C192 90 184 84 182 88 V114 C184 118 192 112 190 104 Z" fill="#b44d28" />
          <path d="M188 99 C190 92 184 86 183 90 V112 C184 116 190 110 188 103 Z" fill={`url(#${ids.skinFaceGrad})`} />
          <circle cx="187" cy="113" r="2.2" fill={`url(#${ids.goldGrad})`} />

          {/* Efeito de Fumaça/Vapor nas orelhas se irritado */}
          {isAngryOrCrazy && (
            <g className="pixel-steam-burst">
              <path d="M86 102 C76 96 70 84 76 76 C80 70 86 74 82 82" fill="none" stroke="#fca5a5" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M194 102 C204 96 210 84 204 76 C200 70 194 74 198 82" fill="none" stroke="#fca5a5" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}

          {/* Rubor Suave nas Bochechas */}
          <ellipse cx="112" cy="118" rx="14" ry="7" fill={`url(#${ids.skinCheekGrad})`} />
          <ellipse cx="168" cy="118" rx="14" ry="7" fill={`url(#${ids.skinCheekGrad})`} />

          {/* Nariz Esculpido Anime */}
          <path d="M138 98 L137 118 Q140 122 143 118 L142 98 Z" fill="#e39870" />
          <ellipse cx="137" cy="118" rx="1.6" ry="1.2" fill="#8c3315" />
          <ellipse cx="143" cy="118" rx="1.6" ry="1.2" fill="#8c3315" />
          <circle cx="139" cy="116" r="1.1" fill="#fff4ed" />

          {/* Sobrancelhas Confiantes e Expressivas */}
          <g className="pixel-eyebrows">
            {isAngryOrCrazy ? (
              <>
                <path d="M104 88 L126 95" stroke="#450a0a" strokeWidth="3.4" strokeLinecap="round" />
                <path d="M105 88 L125 94" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                <path d="M176 88 L154 95" stroke="#450a0a" strokeWidth="3.4" strokeLinecap="round" />
                <path d="M175 88 L155 94" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M104 89 Q116 84 128 88" stroke="#450a0a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M105 89 Q116 85 127 88" stroke="#ea580c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M176 89 Q164 84 152 88" stroke="#450a0a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M175 89 Q164 85 153 88" stroke="#ea580c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </>
            )}
          </g>

          {/* Olhos Anime Inteligentes e Vivos com Parallax */}
          <g className="pixel-eyes">
            {/* Olho Esquerdo */}
            <g className="pixel-eye pixel-eye-left">
              <ellipse cx="116" cy="103" rx="10" ry="7" fill="#ffffff" />
              <path d="M106 101 Q116 97 126 101" stroke="#b44d28" strokeWidth="1" fill="none" />
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="116" cy="103" r="5.2" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="116" cy="103" r="2.8" fill="#090d16" />
                {/* Brilhos especulares nos olhos */}
                <circle cx="114.5" cy="101.5" r="1.5" fill="#ffffff" />
                <circle cx="117.8" cy="104.5" r="0.8" fill="#ffffff" />
              </g>
              {/* Delineado superior anime marcante com cílio sutil */}
              <path d="M105 102 C108 96 123 96 127 101" stroke="#0f172a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </g>

            {/* Olho Direito */}
            <g className="pixel-eye pixel-eye-right">
              <ellipse cx="164" cy="103" rx="10" ry="7" fill="#ffffff" />
              <path d="M154 101 Q164 97 174 101" stroke="#b44d28" strokeWidth="1" fill="none" />
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="164" cy="103" r="5.2" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="164" cy="103" r="2.8" fill="#090d16" />
                {/* Brilhos especulares nos olhos */}
                <circle cx="162.5" cy="101.5" r="1.5" fill="#ffffff" />
                <circle cx="165.8" cy="104.5" r="0.8" fill="#ffffff" />
              </g>
              {/* Delineado superior anime marcante */}
              <path d="M153 101 C157 96 172 96 175 102" stroke="#0f172a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </g>

            {/* Pálpebra para piscar natural */}
            <path
              className="pixel-eyelid-blink"
              d="M104 103 C108 106 124 106 128 103 M152 103 C156 106 172 106 176 103"
              stroke="#b44d28"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Óculos Elegantes de Fio de Ouro (Armação fina que realça os olhos) */}
          <g className="pixel-glasses">
            {/* Lente e Aro Esquerdo */}
            <rect x="102" y="93" width="28" height="20" rx="5" fill="#38bdf8" fillOpacity="0.08" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.5" />
            <line x1="106" y1="95" x2="112" y2="109" stroke="#ffffff" strokeWidth="1.2" strokeOpacity=".35" strokeLinecap="round" />

            {/* Ponte do Nariz */}
            <path d="M130 101 Q140 98 150 101" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Lente e Aro Direito */}
            <rect x="150" y="93" width="28" height="20" rx="5" fill="#38bdf8" fillOpacity="0.08" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.5" />
            <line x1="154" y1="95" x2="160" y2="109" stroke="#ffffff" strokeWidth="1.2" strokeOpacity=".35" strokeLinecap="round" />

            {/* Hastes Laterais */}
            <path d="M102 99 L92 98" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M178 99 L188 98" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Sincronia Labial de 5 Visemas (pixel-mouth) */}
          <g className="pixel-mouth" data-viseme={mouth}>
            {/* 0. Visema ABERTA (A, O) */}
            {mouth === 0 && (
              <g className="viseme-open">
                <path d="M130 131 C130 128 150 128 150 131 C151 140 148 145 140 145 C132 145 129 140 130 131 Z" fill="#220309" stroke="#68131e" strokeWidth="1.2" />
                <path d="M133 131 H147 V134 H133 Z" fill="#ffffff" />
                <ellipse cx="140" cy="142" rx="5" ry="2.5" fill="#f43f5e" />
              </g>
            )}

            {/* 1. Visema ESTICADA (E, I) */}
            {mouth === 1 && (
              <g className="viseme-wide">
                <path d="M128 132 C134 130 146 130 152 132 C154 138 148 142 140 142 C132 142 126 138 128 132 Z" fill="#220309" stroke="#68131e" strokeWidth="1.2" />
                <path d="M131 133 H149 V136 H131 Z" fill="#ffffff" />
                <path d="M128 132 Q140 130 152 132" stroke="#f43f5e" strokeWidth="1.1" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* 2. Visema REDONDA (O, U, W) */}
            {mouth === 2 && (
              <g className="viseme-round">
                <ellipse cx="140" cy="136" rx="6.5" ry="5.5" fill="#220309" stroke="#68131e" strokeWidth="1.4" />
                <ellipse cx="140" cy="135" rx="3.5" ry="2.2" fill="#f43f5e" />
                <circle cx="140" cy="136" r="2" fill="#090d16" />
              </g>
            )}

            {/* 3. Visema FECHANDO (Consoantes) */}
            {mouth === 3 && (
              <g className="viseme-close">
                <path d="M132 135 Q140 133 148 135" stroke="#220309" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M133 135.2 Q140 136.2 147 135.2" stroke="#f43f5e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* 4. Visema REPOUSO / PHONEME-REST-LIVE (Sorriso Confiante) */}
            {mouth === 4 && (
              <g className="viseme-rest phoneme-rest-live">
                <path d="M133 134 Q140 133 147 135" stroke="#450a0a" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M134 134.5 Q140 135.5 146 134.5" stroke="#f43f5e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <circle cx="147.5" cy="134" r="0.9" fill="#b44d28" />
              </g>
            )}
          </g>

          {/* =============================================================
              CABELO FRONTAL & FRANJA FLAMEJANTE VOLUMOSA (ZERO CALVÍCIE)
              ============================================================= */}
          <g className="pixel-hair-front">
            {/* Camada 1: Cúpula Densa de Cabelo Cobrindo Toda a Testa Superior */}
            <path
              d="M74 68 C76 34 104 14 140 14 C176 14 204 34 206 68 C204 78 198 88 194 98 C188 82 184 74 172 66 C158 58 148 64 140 68 C132 64 122 58 108 66 C96 74 92 82 86 98 C82 88 76 78 74 68 Z"
              fill="#540a0a"
            />
            {/* Camada 2: Volume Flamejante Principal */}
            <path
              d="M72 66 C74 30 102 10 140 10 C178 10 206 30 208 66 C206 78 200 90 196 102 C190 84 186 74 174 66 C160 56 148 62 140 66 C132 62 120 56 106 66 C94 74 90 84 84 102 C80 90 74 78 72 66 Z"
              fill={`url(#${ids.hairBodyGrad})`}
            />

            {/* FRANJA CENTRAL QUE CAI SOBRE A TESTA (ELIMINA QUALQUER SENSÇÃO DE CALVICE) */}
            {/* Mecha Central Longa que desce até o meio das sobrancelhas */}
            <path
              d="M134 46 C138 60 136 74 140 88 C144 74 142 60 146 46 Z"
              fill="#7c1a1a"
            />
            <path
              d="M135 48 C139 60 137 72 140 86 C143 72 141 60 145 48 Z"
              fill={`url(#${ids.hairBodyGrad})`}
            />
            <path d="M139 52 L140 84" stroke={`url(#${ids.hairTipGrad})`} strokeWidth="1.8" strokeLinecap="round" />

            {/* Mecha Franja Esquerda */}
            <path
              d="M116 48 C118 62 120 74 125 84 C128 72 128 60 126 48 Z"
              fill="#7c1a1a"
            />
            <path
              d="M117 50 C119 62 121 72 125 82 C127 72 127 60 125 50 Z"
              fill={`url(#${ids.hairBodyGrad})`}
            />
            <path d="M123 54 L125 80" stroke={`url(#${ids.hairTipGrad})`} strokeWidth="1.6" strokeLinecap="round" />

            {/* Mecha Franja Direita */}
            <path
              d="M164 48 C162 62 160 74 155 84 C152 72 152 60 154 48 Z"
              fill="#7c1a1a"
            />
            <path
              d="M163 50 C161 62 159 72 155 82 C153 72 153 60 155 50 Z"
              fill={`url(#${ids.hairBodyGrad})`}
            />
            <path d="M157 54 L155 80" stroke={`url(#${ids.hairTipGrad})`} strokeWidth="1.6" strokeLinecap="round" />

            {/* Mecha Franja Externa Esquerda (cobre a têmpora esquerda) */}
            <path
              d="M98 56 C102 70 106 80 110 88 C112 76 110 66 106 56 Z"
              fill={`url(#${ids.hairBodyGrad})`}
            />
            <path d="M106 60 L109 86" stroke={`url(#${ids.hairTipGrad})`} strokeWidth="1.4" strokeLinecap="round" />

            {/* Mecha Franja Externa Direita (cobre a têmpora direita) */}
            <path
              d="M182 56 C178 70 174 80 170 88 C168 76 170 66 174 56 Z"
              fill={`url(#${ids.hairBodyGrad})`}
            />
            <path d="M174 60 L171 86" stroke={`url(#${ids.hairTipGrad})`} strokeWidth="1.4" strokeLinecap="round" />

            {/* Cachos / Mechas Laterais Longas descendo pelas bochechas */}
            <path
              d="M84 72 C78 90 76 112 82 128 C86 114 90 100 94 86 Z"
              fill={`url(#${ids.hairBodyGrad})`}
            />
            <path d="M84 76 Q80 104 84 124" stroke={`url(#${ids.hairTipGrad})`} strokeWidth="1.8" fill="none" strokeLinecap="round" />

            <path
              d="M196 72 C202 90 204 112 198 128 C194 114 190 100 186 86 Z"
              fill={`url(#${ids.hairBodyGrad})`}
            />
            <path d="M196 76 Q200 104 196 124" stroke={`url(#${ids.hairTipGrad})`} strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Topete Superior Dinâmico (Spikes incandescentes no topo) */}
            <path
              d="M118 36 C126 18 136 6 142 2 C146 14 154 24 162 36 C152 30 142 28 132 32 Z"
              fill={`url(#${ids.hairTipGrad})`}
            />
            <path d="M136 24 L142 4 L148 24" stroke="#fef08a" strokeWidth="1.6" fill="none" strokeLinecap="round" />

            {/* Mechas adicionais de chama no topo */}
            <path d="M102 24 C110 12 120 8 126 6 C124 16 126 24 124 30 Z" fill={`url(#${ids.hairTipGrad})`} />
            <path d="M178 24 C170 12 160 8 154 6 C156 16 154 24 156 30 Z" fill={`url(#${ids.hairTipGrad})`} />
          </g>
        </g>
      </g>
    </svg>
  );
}
