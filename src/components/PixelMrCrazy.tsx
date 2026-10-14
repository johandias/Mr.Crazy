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
 * Mr. Crazy: Avatar de Alta Definição em Micro-Pixel Art Arcade (32-Bit).
 * Construído 100% com código vetorial SVG puro, CSS e React.
 * Proporções anatômicas naturais, iluminação volumétrica por micro-pixels,
 * expressão facial viva com rastreamento de olhar, cabelo fluido em camadas,
 * vestimenta acadêmica vitoriana e sincronia labial orgânica com o áudio WebRTC.
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
    hairBackGrad: `${instanceId}-hair-back`,
    hairFrontGrad: `${instanceId}-hair-front`,
    hairTipGrad: `${instanceId}-hair-tip`,
    skinFaceGrad: `${instanceId}-skin-face`,
    skinCheekGrad: `${instanceId}-skin-cheek`,
    skinHandGrad: `${instanceId}-skin-hand`,
    coatGrad: `${instanceId}-coat`,
    coatLapelGrad: `${instanceId}-coat-lapel`,
    capeGrad: `${instanceId}-cape`,
    goldGrad: `${instanceId}-gold`,
    leatherGrad: `${instanceId}-leather`,
    lensGrad: `${instanceId}-lens`,
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
        {/* Aura de ambientação suave */}
        <radialGradient id={ids.aura} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#ef4444" : "#0d9488"} stopOpacity={isAngryOrCrazy ? ".25" : ".14"} />
          <stop offset="65%" stopColor={isAngryOrCrazy ? "#dc2626" : "#0f766e"} stopOpacity=".03" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão */}
        <radialGradient id={ids.floorShadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity=".65" />
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

        {/* Cabelo Traseiro Volumétrico */}
        <linearGradient id={ids.hairBackGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#220303" />
          <stop offset="28%" stopColor="#540a0a" />
          <stop offset="58%" stopColor="#8c1b09" />
          <stop offset="82%" stopColor="#c23616" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Cabelo Frontal com Mechas Vivas */}
        <linearGradient id={ids.hairFrontGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#540a0a" />
          <stop offset="30%" stopColor="#991b1b" />
          <stop offset="58%" stopColor="#c23616" />
          <stop offset="82%" stopColor="#ea580c" />
          <stop offset="94%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        {/* Pontas incandescentes */}
        <linearGradient id={ids.hairTipGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Pele Facial Realista */}
        <radialGradient id={ids.skinFaceGrad} cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#fff4ed" />
          <stop offset="35%" stopColor="#fde0cb" />
          <stop offset="70%" stopColor="#f8c29b" />
          <stop offset="90%" stopColor="#e39870" />
          <stop offset="100%" stopColor="#b44d28" />
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

        {/* Casaco de Veludo Esmeralda / Teal Profundo */}
        <linearGradient id={ids.coatGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#04231e" />
          <stop offset="25%" stopColor="#083c34" />
          <stop offset="55%" stopColor="#0d695d" />
          <stop offset="85%" stopColor="#109180" />
          <stop offset="100%" stopColor="#18b8a3" />
        </linearGradient>

        {/* Lapelas de Cetim */}
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

        {/* Lentes Cristalinas */}
        <linearGradient id={ids.lensGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity=".28" />
          <stop offset="50%" stopColor="#bae6fd" stopOpacity=".12" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity=".18" />
        </linearGradient>

        {/* Íris de Safira */}
        <radialGradient id={ids.eyeIrisGrad} cx="42%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="35%" stopColor="#0284c7" />
          <stop offset="70%" stopColor="#0369a1" />
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

      {/* Aura ambiental de fundo */}
      <ellipse className="pixel-aura" cx="140" cy="165" rx="118" ry="142" fill={`url(#${ids.aura})`} />

      {/* Sombra de chão sob as botas */}
      <g className="pixel-ground-shadow" aria-hidden="true">
        <ellipse cx="140" cy="326" rx="88" ry="10" fill={`url(#${ids.floorShadow})`} />
      </g>

      {/* ========================================================
          RIG HEROICO PRINCIPAL - DESIGN DE ALTA DENSIDADE MICRO-PIXEL
          ======================================================== */}
      <g className="pixel-rig">
        {/* 1. CAPA HEROICA CARMESIM COM CAIMENTO ELEGANTE */}
        <g className="pixel-cape-back">
          {/* Lado Esquerdo */}
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

          {/* Lado Direito */}
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

        {/* 2. MEMBROS INFERIORES: CALÇAS SOB MEDIDA E BOTAS DE COURO */}
        <g className="pixel-legs">
          {/* Perna Esquerda */}
          <path
            d="M106 252 C106 252 104 274 105 292 C113 294 127 294 134 292 C135 274 133 252 133 252 Z"
            fill="#0b111e"
          />
          <path
            d="M108 254 C108 254 106 274 107 290 C114 291 125 291 132 290 C133 274 131 254 131 254 Z"
            fill="#1e293b"
          />
          <line x1="120" y1="255" x2="120" y2="288" stroke="#334155" strokeWidth="1.4" />

          {/* Perna Direita */}
          <path
            d="M147 252 C147 252 145 274 146 292 C154 294 168 294 175 292 C176 274 174 252 174 252 Z"
            fill="#0b111e"
          />
          <path
            d="M149 254 C149 254 147 274 148 290 C155 291 166 291 173 290 C174 274 172 254 172 254 Z"
            fill="#1e293b"
          />
          <line x1="160" y1="255" x2="160" y2="288" stroke="#334155" strokeWidth="1.4" />

          {/* Bota Esquerda */}
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
            {/* Fivela dourada */}
            <rect x="110" y="299" width="18" height="11" rx="3.5" fill={`url(#${ids.goldGrad})`} />
            <rect x="113" y="301" width="12" height="7" rx="2" fill="#1c1917" />
            <circle cx="119" cy="304.5" r="1.4" fill="#fff3bf" />
          </g>

          {/* Bota Direita */}
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
            {/* Fivela dourada */}
            <rect x="152" y="299" width="18" height="11" rx="3.5" fill={`url(#${ids.goldGrad})`} />
            <rect x="155" y="301" width="12" height="7" rx="2" fill="#1c1917" />
            <circle cx="161" cy="304.5" r="1.4" fill="#fff3bf" />
          </g>
        </g>

        {/* 3. TRONCO, CASACO ESMERALDA TAILORED, CRAVAT E BROCHE */}
        <g className="pixel-body">
          {/* Base do tronco e casaco */}
          <path
            d="M86 158 C86 154 110 152 140 152 C170 152 194 154 194 158 C198 178 201 218 200 256 C162 258 118 258 80 256 C79 218 82 178 86 158 Z"
            fill="#04231e"
          />
          <path
            d="M90 159 C90 155 112 153 140 153 C168 153 190 155 190 159 C194 178 196 218 195 254 C160 256 120 256 85 254 C84 218 86 178 90 159 Z"
            fill="#083c34"
          />
          {/* Painel Central com degradê de veludo */}
          <path
            d="M94 160 C94 156 114 155 140 155 C166 155 186 156 186 160 C189 178 190 216 189 252 C158 254 122 254 91 252 C90 216 91 178 94 160 Z"
            fill={`url(#${ids.coatGrad})`}
          />

          {/* Lapelas Aristocráticas Dobradas */}
          <path
            d="M104 156 C110 174 124 204 128 218 C120 216 108 198 96 172 Z"
            fill={`url(#${ids.coatLapelGrad})`}
          />
          <path
            d="M176 156 C170 174 156 204 152 218 C160 216 172 198 184 172 Z"
            fill={`url(#${ids.coatLapelGrad})`}
          />
          {/* Debrum Dourado Bordado */}
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
          {/* Cravat de seda */}
          <path d="M130 158 C135 158 145 158 150 158 C147 174 144 188 140 194 C136 188 133 174 130 158 Z" fill={`url(#${ids.cravatGrad})`} />
          <path d="M134 162 C137 162 143 162 146 162 C144 173 142 183 140 189 C138 183 136 173 134 162 Z" fill="#9333ea" />

          {/* Broche de Rubi Lapidado com Ouro */}
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

        {/* 4. BRAÇOS E MÃOS ANATÔMICAS COM GESTOS */}
        <g className="pixel-arms">
          {/* Braço Esquerdo */}
          <g className="pixel-arm-left">
            {/* Manga do Casaco Esmeralda */}
            <path
              d="M86 160 C78 180 72 208 70 240 C76 242 88 242 94 240 C95 212 99 184 104 164 Z"
              fill="#04231e"
            />
            <path
              d="M88 162 C80 181 74 208 72 238 C77 240 86 240 92 238 C93 212 97 185 102 165 Z"
              fill={`url(#${ids.coatGrad})`}
            />
            {/* Punho Dourado da Manga */}
            <path d="M71 236 Q82 238 93 236 L94 240 Q82 242 70 240 Z" fill={`url(#${ids.goldGrad})`} />

            {/* Mão Esquerda Anatômica em Repouso */}
            <g className="pixel-hand-left">
              <path
                d="M72 240 C70 248 72 258 75 264 C80 266 88 266 91 264 C93 258 92 248 91 240 Z"
                fill="#b44d28"
              />
              <path
                d="M74 241 C72 248 73 257 76 262 C80 264 86 264 89 262 C91 257 91 248 89 241 Z"
                fill={`url(#${ids.skinHandGrad})`}
              />
              {/* Dedos Articulados */}
              <line x1="77" y1="250" x2="77" y2="260" stroke="#b44d28" strokeWidth="0.8" />
              <line x1="81" y1="250" x2="81" y2="261" stroke="#b44d28" strokeWidth="0.8" />
              <line x1="85" y1="250" x2="85" y2="260" stroke="#b44d28" strokeWidth="0.8" />
            </g>
          </g>

          {/* Braço Direito */}
          <g className="pixel-arm-right">
            {/* Manga do Casaco Esmeralda */}
            <path
              d="M194 160 C202 180 208 208 210 240 C204 242 192 242 186 240 C185 212 181 184 176 164 Z"
              fill="#04231e"
            />
            <path
              d="M192 162 C200 181 206 208 208 238 C203 240 194 240 188 238 C187 212 183 185 178 165 Z"
              fill={`url(#${ids.coatGrad})`}
            />
            {/* Punho Dourado da Manga */}
            <path d="M187 236 Q198 238 209 236 L210 240 Q198 242 186 240 Z" fill={`url(#${ids.goldGrad})`} />

            {/* Mão Direita Padrão */}
            <g className="pixel-hand-right">
              <path
                d="M189 240 C188 248 187 258 189 264 C192 266 200 266 205 264 C208 258 210 248 208 240 Z"
                fill="#b44d28"
              />
              <path
                d="M191 241 C189 248 189 257 191 262 C194 264 200 264 203 262 C206 257 207 248 206 241 Z"
                fill={`url(#${ids.skinHandGrad})`}
              />
              {/* Dedos Articulados */}
              <line x1="195" y1="250" x2="195" y2="260" stroke="#b44d28" strokeWidth="0.8" />
              <line x1="199" y1="250" x2="199" y2="261" stroke="#b44d28" strokeWidth="0.8" />
              <line x1="203" y1="250" x2="203" y2="260" stroke="#b44d28" strokeWidth="0.8" />
            </g>
          </g>
        </g>

        {/* 5. CAMADA DE GESTOS ESPECIAIS (THUMBSUP, HEART, WATERGUN, FINGER) */}
        <g className="pixel-gesture-layer">
          {/* Gesto Thumbsup (Positivo / Aprovação) */}
          <g className="pixel-gesture-thumbsup">
            <g transform="translate(186, 178)">
              {/* Punho e Polegar levantado com brilho */}
              <path
                d="M16 26 C12 26 8 20 8 14 C8 8 13 4 16 2 C18 0 22 2 22 6 C22 10 22 14 24 16 C26 18 28 18 28 22 C28 26 24 28 20 28 Z"
                fill="#b44d28"
              />
              <path
                d="M17 25 C14 25 10 20 10 14 C10 9 14 5 17 4 C18 3 20 4 20 7 C20 10 20 14 23 16 C25 18 26 19 26 22 C26 24 23 26 19 26 Z"
                fill={`url(#${ids.skinHandGrad})`}
              />
              {/* Linhas das articulações dos dedos fechados */}
              <line x1="20" y1="18" x2="25" y2="18" stroke="#b44d28" strokeWidth="1" />
              <line x1="20" y1="22" x2="25" y2="22" stroke="#b44d28" strokeWidth="1" />
              {/* Estrela / Sparkle de aprovação dourada */}
              <g className="pixel-sparkles">
                <circle cx="28" cy="2" r="3" fill="#fef08a" filter={`url(#${ids.glowFilter})`} />
                <path d="M28 -3 L28 7 M23 2 L33 2" stroke="#f59e0b" strokeWidth="1.2" />
              </g>
            </g>
          </g>

          {/* Gesto Heart (Incentivo / Carinho) */}
          <g className="pixel-gesture-heart">
            <g transform="translate(126, 166)">
              {/* Coração estilizado em micro-pixel sobre o peito */}
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

          {/* Gesto Watergun (Energético / Brincadeira) */}
          <g className="pixel-gesture-watergun">
            <g transform="translate(186, 182)">
              {/* Mão em forma de pistola / laser gun com energia */}
              <path
                d="M8 18 H32 V24 H22 V30 H12 V24 H8 Z"
                fill="#b44d28"
              />
              <path
                d="M10 19 H30 V22 H20 V28 H14 V22 H10 Z"
                fill={`url(#${ids.skinHandGrad})`}
              />
              {/* Feixe de energia ciano pulsante saindo da ponta do dedo */}
              <line x1="33" y1="20" x2="65" y2="20" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
              <line x1="33" y1="20" x2="65" y2="20" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          </g>

          {/* Gesto Finger (Professor Explicando) */}
          <g className="pixel-gesture-finger">
            <g transform="translate(186, 164)">
              {/* Indicador apontado para cima com autoridade */}
              <path
                d="M16 4 H22 V28 H12 V20 H16 Z"
                fill="#b44d28"
              />
              <path
                d="M18 6 H20 V26 H14 V21 H18 Z"
                fill={`url(#${ids.skinHandGrad})`}
              />
            </g>
          </g>
        </g>

        {/* 6. CABEÇA, ROSTO EXPRESSIVO, CABELO FLUIDO E ÓCULOS */}
        <g className="pixel-head" transform={`translate(${faceX}, ${faceY})`}>
          {/* Cabelo Traseiro Volumétrico (Fios e Mechas em Camadas) */}
          <g className="pixel-hair-back">
            <path
              d="M74 136 C64 122 56 100 60 76 C64 52 82 32 108 24 C132 18 160 20 184 30 C206 40 220 62 222 86 C224 110 214 130 204 142 C208 116 206 86 196 66 C186 46 166 38 140 38 C114 38 94 48 84 68 C76 86 74 114 74 136 Z"
              fill="#220303"
            />
            <path
              d="M76 134 C66 122 58 100 62 78 C66 54 84 34 108 26 C132 20 160 22 182 32 C204 42 218 64 220 86 C222 108 212 128 202 138 C206 116 204 88 194 68 C184 48 164 40 140 40 C116 40 96 50 86 70 C78 88 76 114 76 134 Z"
              fill={`url(#${ids.hairBackGrad})`}
            />
          </g>

          {/* Pescoço com Sombra da Mandíbula */}
          <path d="M122 144 H158 V162 H122 Z" fill="#b44d28" />
          <path d="M125 146 H155 V160 H125 Z" fill={`url(#${ids.skinFaceGrad})`} />
          <path d="M122 144 Q140 152 158 144 Z" fill="#8c3315" />

          {/* Formato Anatômico da Cabeça e Queixo Esculpido */}
          <path
            d="M92 78 C90 106 94 130 114 148 C124 156 134 160 140 160 C146 160 156 156 166 148 C186 130 190 106 188 78 C186 54 172 44 140 44 C108 44 94 54 92 78 Z"
            fill="#b44d28"
          />
          <path
            d="M94 80 C92 106 96 128 115 146 C124 154 134 158 140 158 C146 158 156 154 165 146 C184 128 188 106 186 80 C184 56 170 46 140 46 C110 46 96 56 94 80 Z"
            fill={`url(#${ids.skinFaceGrad})`}
          />

          {/* Orelhas Anatômicas com Brincos Dourados */}
          <path d="M86 98 C84 90 92 84 94 88 V114 C92 118 84 112 86 104 Z" fill="#b44d28" />
          <path d="M88 99 C86 92 92 86 93 90 V112 C92 116 86 110 88 103 Z" fill={`url(#${ids.skinFaceGrad})`} />
          <circle cx="89" cy="113" r="2.2" fill={`url(#${ids.goldGrad})`} />

          <path d="M194 98 C196 90 188 84 186 88 V114 C188 118 196 112 194 104 Z" fill="#b44d28" />
          <path d="M192 99 C194 92 188 86 187 90 V112 C188 116 194 110 192 103 Z" fill={`url(#${ids.skinFaceGrad})`} />
          <circle cx="191" cy="113" r="2.2" fill={`url(#${ids.goldGrad})`} />

          {/* Vapor saindo das orelhas quando irritado/crazy */}
          {isAngryOrCrazy && (
            <g className="pixel-steam-burst">
              <path d="M82 102 C72 96 66 84 72 76 C76 70 82 74 78 82" fill="none" stroke="#fca5a5" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M198 102 C208 96 214 84 208 76 C204 70 198 74 202 82" fill="none" stroke="#fca5a5" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}

          {/* Rubor Suave nas Bochechas */}
          <ellipse cx="112" cy="118" rx="14" ry="7" fill={`url(#${ids.skinCheekGrad})`} />
          <ellipse cx="168" cy="118" rx="14" ry="7" fill={`url(#${ids.skinCheekGrad})`} />

          {/* Nariz Definido e Esculpido */}
          <path
            d="M138 98 L137 118 Q140 122 143 118 L142 98 Z"
            fill="#e39870"
          />
          <ellipse cx="137" cy="118" rx="1.6" ry="1.2" fill="#8c3315" />
          <ellipse cx="143" cy="118" rx="1.6" ry="1.2" fill="#8c3315" />
          <circle cx="139" cy="116" r="1.1" fill="#fff4ed" />

          {/* Sobrancelhas Expressivas Reativas */}
          <g className="pixel-eyebrows">
            {isAngryOrCrazy ? (
              <>
                {/* Sobrancelha Esquerda Inclinada Feroz */}
                <path d="M104 88 L126 95" stroke="#450a0a" strokeWidth="3.4" strokeLinecap="round" />
                <path d="M105 88 L125 94" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                {/* Sobrancelha Direita Inclinada Feroz */}
                <path d="M176 88 L154 95" stroke="#450a0a" strokeWidth="3.4" strokeLinecap="round" />
                <path d="M175 88 L155 94" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Sobrancelhas Curvas Confiantes / Intelectuais */}
                <path d="M104 90 Q116 86 128 89" stroke="#450a0a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M105 90 Q116 87 127 89" stroke="#ea580c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M176 90 Q164 86 152 89" stroke="#450a0a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M175 90 Q164 87 153 89" stroke="#ea580c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </>
            )}
          </g>

          {/* Olhos Humanos Expressivos com Parallax e Piscadas */}
          <g className="pixel-eyes">
            {/* Olho Esquerdo */}
            <g className="pixel-eye pixel-eye-left">
              {/* Esclera / Fundo Branco */}
              <ellipse cx="116" cy="104" rx="10" ry="7.5" fill="#f8fafc" />
              <path d="M106 102 Q116 99 126 102" stroke="#b44d28" strokeWidth="1" fill="none" />
              {/* Íris Safira e Pupila com Rastreamento */}
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="116" cy="104" r="5" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="116" cy="104" r="2.8" fill="#090d16" />
                {/* Ponto de Brilho Especular */}
                <circle cx="114.5" cy="102.5" r="1.4" fill="#ffffff" />
                <circle cx="117.5" cy="105.5" r="0.7" fill="#ffffff" />
              </g>
              {/* Delineado e Cílios */}
              <path d="M105 103 C108 97 124 97 127 103" stroke="#1c1917" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </g>

            {/* Olho Direito */}
            <g className="pixel-eye pixel-eye-right">
              {/* Esclera / Fundo Branco */}
              <ellipse cx="164" cy="104" rx="10" ry="7.5" fill="#f8fafc" />
              <path d="M154 102 Q164 99 174 102" stroke="#b44d28" strokeWidth="1" fill="none" />
              {/* Íris Safira e Pupila com Rastreamento */}
              <g transform={`translate(${pupilX}, ${pupilY})`}>
                <circle cx="164" cy="104" r="5" fill={`url(#${ids.eyeIrisGrad})`} />
                <circle cx="164" cy="104" r="2.8" fill="#090d16" />
                {/* Ponto de Brilho Especular */}
                <circle cx="162.5" cy="102.5" r="1.4" fill="#ffffff" />
                <circle cx="165.5" cy="105.5" r="0.7" fill="#ffffff" />
              </g>
              {/* Delineado e Cílios */}
              <path d="M153 103 C156 97 172 97 175 103" stroke="#1c1917" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </g>

            {/* Pálpebra de Piscar Natural (Ativada via CSS .pixel-blinking) */}
            <path
              className="pixel-eyelid-blink"
              d="M104 104 C108 107 124 107 128 104 M152 104 C156 107 172 107 176 104"
              stroke="#b44d28"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Óculos Intelectuais Dourados com Lentes Cristalinas */}
          <g className="pixel-glasses">
            {/* Lente e Aro Esquerdo */}
            <rect x="102" y="94" width="28" height="20" rx="6" fill={`url(#${ids.lensGrad})`} stroke={`url(#${ids.goldGrad})`} strokeWidth="1.8" />
            {/* Reflexo Diagonal no Vidro */}
            <line x1="106" y1="96" x2="114" y2="112" stroke="#ffffff" strokeWidth="1.2" strokeOpacity=".45" strokeLinecap="round" />

            {/* Ponte Central do Nariz */}
            <path d="M130 102 Q140 98 150 102" stroke={`url(#${ids.goldGrad})`} strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Lente e Aro Direito */}
            <rect x="150" y="94" width="28" height="20" rx="6" fill={`url(#${ids.lensGrad})`} stroke={`url(#${ids.goldGrad})`} strokeWidth="1.8" />
            {/* Reflexo Diagonal no Vidro */}
            <line x1="154" y1="96" x2="162" y2="112" stroke="#ffffff" strokeWidth="1.2" strokeOpacity=".45" strokeLinecap="round" />

            {/* Hastes Laterais para as Orelhas */}
            <path d="M102 100 L88 98" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M178 100 L192 98" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.6" strokeLinecap="round" />
          </g>

          {/* Sincronia Labial Expressiva de 5 Visemas (pixel-mouth) */}
          <g className="pixel-mouth" data-viseme={mouth}>
            {/* 0. Visema ABERTA (A, O) - Fala Enérgica */}
            {mouth === 0 && (
              <g className="viseme-open">
                <path d="M130 131 C130 128 150 128 150 131 C151 140 148 145 140 145 C132 145 129 140 130 131 Z" fill="#220309" stroke="#68131e" strokeWidth="1.2" />
                {/* Dentes Superiores */}
                <path d="M133 131 H147 V134 H133 Z" fill="#ffffff" />
                <line x1="137" y1="131" x2="137" y2="134" stroke="#cbd5e1" strokeWidth="0.6" />
                <line x1="140" y1="131" x2="140" y2="134" stroke="#cbd5e1" strokeWidth="0.6" />
                <line x1="143" y1="131" x2="143" y2="134" stroke="#cbd5e1" strokeWidth="0.6" />
                {/* Língua */}
                <ellipse cx="140" cy="142" rx="5" ry="2.5" fill="#f43f5e" />
              </g>
            )}

            {/* 1. Visema ESTICADA (E, I) - Sorriso Confiante */}
            {mouth === 1 && (
              <g className="viseme-wide">
                <path d="M128 132 C134 130 146 130 152 132 C154 138 148 142 140 142 C132 142 126 138 128 132 Z" fill="#220309" stroke="#68131e" strokeWidth="1.2" />
                {/* Fileira de dentes completa */}
                <path d="M131 133 H149 V136 H131 Z" fill="#ffffff" />
                <line x1="135" y1="133" x2="135" y2="136" stroke="#cbd5e1" strokeWidth="0.6" />
                <line x1="140" y1="133" x2="140" y2="136" stroke="#cbd5e1" strokeWidth="0.6" />
                <line x1="145" y1="133" x2="145" y2="136" stroke="#cbd5e1" strokeWidth="0.6" />
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

            {/* 3. Visema FECHANDO (M, B, P, Consoantes) */}
            {mouth === 3 && (
              <g className="viseme-close">
                <path d="M132 135 Q140 133 148 135" stroke="#220309" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M133 135.2 Q140 136.2 147 135.2" stroke="#f43f5e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* 4. Visema REPOUSO / PHONEME-REST-LIVE (Meio-sorriso confiante) */}
            {mouth === 4 && (
              <g className="viseme-rest phoneme-rest-live">
                {/* Lábio fechado com leve curva de sorriso inteligente */}
                <path d="M132 135 Q140 133 148 135" stroke="#450a0a" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M133 135.5 Q140 136.8 147 135.5" stroke="#f43f5e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                {/* Covinha sutil no canto do sorriso */}
                <circle cx="149" cy="134" r="0.8" fill="#b44d28" />
              </g>
            )}
          </g>

          {/* Cabelo Frontal com Mechas Flamejantes Vivas e Volume Tridimensional */}
          <g className="pixel-hair-front">
            {/* Base e Raízes Escuras */}
            <path
              d="M84 72 C92 48 112 36 140 36 C168 36 188 48 196 72 C184 66 172 68 160 62 C152 48 134 46 122 56 C110 52 96 58 84 72 Z"
              fill="#540a0a"
            />
            {/* Mechas Principais com Degradê de Fogo */}
            <path
              d="M82 74 C90 44 114 32 140 32 C166 32 190 44 198 74 C186 64 174 66 162 58 C150 44 132 42 120 54 C108 50 94 56 82 74 Z"
              fill={`url(#${ids.hairFrontGrad})`}
            />

            {/* Mecha Central Topete Flamejante Incandescente */}
            <path
              d="M120 54 C128 32 146 22 152 14 C154 28 162 38 160 56 C152 46 136 46 120 54 Z"
              fill={`url(#${ids.hairTipGrad})`}
            />
            <path
              d="M132 44 C138 28 148 20 152 14 C153 24 158 32 156 46 C150 40 140 40 132 44 Z"
              fill="#fef08a"
              opacity=".8"
            />

            {/* Mecha Lateral Esquerda Fluida */}
            <path
              d="M86 68 C76 82 78 104 80 118 C84 104 88 92 96 82 C94 74 90 70 86 68 Z"
              fill={`url(#${ids.hairFrontGrad})`}
            />

            {/* Mecha Lateral Direita Fluida */}
            <path
              d="M194 68 C204 82 202 104 200 118 C196 104 192 92 184 82 C186 74 190 70 194 68 Z"
              fill={`url(#${ids.hairFrontGrad})`}
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
