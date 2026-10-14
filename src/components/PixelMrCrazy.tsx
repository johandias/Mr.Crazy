"use client";

import { useId, type CSSProperties } from "react";
import type { CharacterGesture } from "@/components/RpgCharacter";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";
import avatarData from "@/lib/mr-crazy-avatar.json";

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
 * Mr. Crazy: Avatar Vetorial de Alta Densidade e Realismo Anatômico Curvo.
 * Renderizado nativamente em SVG com anatomia facial orgânica, curvas suaves de Bézier,
 * iluminação volumétrica, gradientes de veludo/couro/ouro e sincronia labial expressiva.
 * Mr. Crazy: Avatar Vetorial de Alta Definição e Realismo Anatômico Orgânico.
 * Renderizado nativamente em SVG com curvas suaves de Bézier, mãos e dedos anatômicos,
 * mechas volumétricas de cabelo fluido, sombreamento rico e sincronia labial realista.
 * Mr. Crazy: Avatar de Alta Fidelidade Micro-Pixel / Arcade 32-Bit.
 * Proporções heroicas, anatomia expressiva, mechas flamejantes volumétricas,
 * trajes aristocráticos detalhados e sincronia labial orgânica com o áudio WebRTC.
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

  // Parallax natural suave do rosto e olhar
  const faceX = Math.round(lookX * 3);
  const faceY = Math.round(lookY * 2);
  const pupilX = Math.round(lookX * 2.2);
  const pupilY = Math.round(lookY * 1.5);
  const pupilX = Math.round(lookX * 2);
  const pupilY = Math.round(lookY * 1.4);
  // Parallax suave dos olhos e cabeça seguindo o cursor/toque
  const faceX = Math.round(lookX * 3.2);
  const faceY = Math.round(lookY * 2.2);
  const pupilX = Math.round(lookX * 2.8);
  const pupilY = Math.round(lookY * 1.8);

  const mouthLabels = ["aberta", "esticada", "redonda", "fechando", "repouso"] as const;
  const mouthLabel = mouthLabels[mouth] ?? "repouso";

  const isAngryOrCrazy = crazyLevel >= 45 || emotion === "irritated" || emotion === "crazy";
  const isHappyOrProud = crazyLevel < 20 && (emotion === "calm" || emotion === "proud" || emotion === "happy");
  const isAnalyzing = emotion === "analyzing" || voiceState === "listening";

  const { palette } = avatarData;

  const ids = {
    aura: `${instanceId}-aura`,
    shadow: `${instanceId}-shadow`,
    glow: `${instanceId}-glow`,
    hairBackGrad: `${instanceId}-hair-back-grad`,
    hairFrontGrad: `${instanceId}-hair-front-grad`,
    hairTipGrad: `${instanceId}-hair-tip-grad`,
    hairStrandGrad: `${instanceId}-hair-strand-grad`,
    skinFaceGrad: `${instanceId}-skin-face-grad`,
    skinCheekGrad: `${instanceId}-skin-cheek-grad`,
    skinHandGrad: `${instanceId}-skin-hand-grad`,
    coatGrad: `${instanceId}-coat-grad`,
    coatLapelGrad: `${instanceId}-coat-lapel-grad`,
    capeGrad: `${instanceId}-cape-grad`,
    goldGrad: `${instanceId}-gold-grad`,
    leatherGrad: `${instanceId}-leather-grad`,
    lensGrad: `${instanceId}-lens-grad`,
    eyeIrisGrad: `${instanceId}-eye-iris-grad`,
    rubyGrad: `${instanceId}-ruby-grad`
    auraGrad: `${instanceId}-aura-grad`,
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
      viewBox={avatarData.viewBox}
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
        {/* Aura suave de fundo sem poluição visual */}
        <radialGradient id={ids.aura} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#ef4444" : "#0d9488"} stopOpacity={isAngryOrCrazy ? ".28" : ".16"} />
          <stop offset="70%" stopColor={isAngryOrCrazy ? "#dc2626" : "#0f766e"} stopOpacity=".04" />
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#ef4444" : "#0d9488"} stopOpacity={isAngryOrCrazy ? ".22" : ".12"} />
          <stop offset="70%" stopColor={isAngryOrCrazy ? "#dc2626" : "#0f766e"} stopOpacity=".03" />
          <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
        {/* Aura de ambientação sutil */}
        <radialGradient id={ids.auraGrad} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#ef4444" : "#0d9488"} stopOpacity={isAngryOrCrazy ? ".25" : ".14"} />
          <stop offset="65%" stopColor={isAngryOrCrazy ? "#dc2626" : "#0f766e"} stopOpacity=".03" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão difusa e realista */}
        <radialGradient id={ids.shadow} cx="50%" cy="50%" r="50%">
        {/* Sombra de chão */}
        <radialGradient id={ids.floorShadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity=".7" />
          <stop offset="60%" stopColor="#000000" stopOpacity=".25" />
          <stop offset="0%" stopColor="#000000" stopOpacity=".65" />
          <stop offset="60%" stopColor="#000000" stopOpacity=".2" />
          <stop offset="55%" stopColor="#000000" stopOpacity=".25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Filtro sutil de brilho suave */}
        <filter id={ids.glow} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
        {/* Filtro de brilho sutil */}
        <filter id={ids.glowFilter} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradiente do cabelo traseiro com profundidade realista */}
        {/* Gradiente volumétrico do cabelo traseiro com profundidade realista */}
        {/* Cabelo Traseiro Volumétrico */}
        <linearGradient id={ids.hairBackGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#2b0505" />
          <stop offset="35%" stopColor="#691212" />
          <stop offset="65%" stopColor="#b43403" />
          <stop offset="85%" stopColor="#ea580c" />
          <stop offset="30%" stopColor="#581010" />
          <stop offset="60%" stopColor="#9a2c06" />
          <stop offset="85%" stopColor="#d94e08" />
          <stop offset="100%" stopColor="#f59e0b" />
          <stop offset="0%" stopColor="#220303" />
          <stop offset="28%" stopColor="#540a0a" />
          <stop offset="58%" stopColor="#8c1b09" />
          <stop offset="82%" stopColor="#c23616" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Gradiente do cabelo frontal orgânico */}
        {/* Gradiente do cabelo frontal rico e orgânico */}
        {/* Cabelo Frontal com Mechas Vivas */}
        <linearGradient id={ids.hairFrontGrad} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#7c1a1a" />
          <stop offset="40%" stopColor="#c2410c" />
          <stop offset="75%" stopColor="#ea580c" />
          <stop offset="90%" stopColor="#f59e0b" />
          <stop offset="0%" stopColor="#540a0a" />
          <stop offset="30%" stopColor="#991b1b" />
          <stop offset="58%" stopColor="#c23616" />
          <stop offset="82%" stopColor="#ea580c" />
          <stop offset="94%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fef08a" />
          <stop offset="0%" stopColor="#681515" />
          <stop offset="35%" stopColor="#ad3509" />
          <stop offset="70%" stopColor="#e0540d" />
          <stop offset="88%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fed7aa" />
        </linearGradient>

        {/* Gradiente de pontas de mecha incandescente */}
        <linearGradient id={ids.hairTipGrad} x1="0%" y1="0%" x2="100%" y2="100%">
        {/* Pontas incandescentes */}
        <linearGradient id={ids.hairTipGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Mechas individuais de brilho nos fios */}
        <linearGradient id={ids.hairStrandGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity=".8" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity=".6" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
        </linearGradient>

        {/* Gradiente anatômico suave de pele humana (sem manchas brancas na testa) */}
        <radialGradient id={ids.skinFaceGrad} cx="50%" cy="40%" r="62%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="48%" stopColor="#fed7aa" />
          <stop offset="82%" stopColor="#fdba74" />
          <stop offset="96%" stopColor="#fba471" />
          <stop offset="100%" stopColor="#ea580c" />
        {/* Pele Facial Realista */}
        <radialGradient id={ids.skinFaceGrad} cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#fff3e6" />
          <stop offset="42%" stopColor="#fed7aa" />
          <stop offset="78%" stopColor="#fbbd86" />
          <stop offset="94%" stopColor="#f1945c" />
          <stop offset="100%" stopColor="#d97736" />
          <stop offset="0%" stopColor="#fff4ed" />
          <stop offset="35%" stopColor="#fde0cb" />
          <stop offset="70%" stopColor="#f8c29b" />
          <stop offset="90%" stopColor="#e39870" />
          <stop offset="100%" stopColor="#b44d28" />
        </radialGradient>

        {/* Rubor suave difuso das bochechas */}
        {/* Rubor Suave nas Bochechas */}
        <radialGradient id={ids.skinCheekGrad} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity=".38" />
          <stop offset="70%" stopColor="#fb7185" stopOpacity=".12" />
          <stop offset="0%" stopColor="#fb7185" stopOpacity=".32" />
          <stop offset="70%" stopColor="#fb7185" stopOpacity=".08" />
          <stop offset="100%" stopColor="#fed7aa" stopOpacity="0" />
          <stop offset="0%" stopColor="#f43f5e" stopOpacity=".38" />
          <stop offset="65%" stopColor="#f43f5e" stopOpacity=".1" />
          <stop offset="100%" stopColor="#f8c29b" stopOpacity="0" />
        </radialGradient>

        {/* Gradiente suave para mãos e dedos anatômicos */}
        {/* Mãos Anatômicas */}
        <linearGradient id={ids.skinHandGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff3e6" />
          <stop offset="50%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#f59e68" />
          <stop offset="0%" stopColor="#fff4ed" />
          <stop offset="50%" stopColor="#f8c29b" />
          <stop offset="100%" stopColor="#c86742" />
        </linearGradient>

        {/* Casaco esmeralda elegante com caimento de veludo */}
        {/* Casaco de Veludo Esmeralda / Teal Profundo */}
        <linearGradient id={ids.coatGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#042f2e" />
          <stop offset="25%" stopColor="#0f766e" />
          <stop offset="60%" stopColor="#0d9488" />
          <stop offset="85%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#2dd4bf" />
          <stop offset="0%" stopColor="#04231e" />
          <stop offset="25%" stopColor="#083c34" />
          <stop offset="55%" stopColor="#0d695d" />
          <stop offset="85%" stopColor="#109180" />
          <stop offset="100%" stopColor="#18b8a3" />
        </linearGradient>

        {/* Lapelas de cetim bordadas */}
        {/* Lapelas de Cetim */}
        <linearGradient id={ids.coatLapelGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="45%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#042f2e" />
          <stop offset="0%" stopColor="#18b8a3" />
          <stop offset="40%" stopColor="#0d695d" />
          <stop offset="100%" stopColor="#052c26" />
        </linearGradient>

        {/* Capa carmesim com drapeado realista */}
        {/* Cravat de Seda Ametista */}
        <linearGradient id={ids.cravatGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="45%" stopColor="#7e22ce" />
          <stop offset="85%" stopColor="#581c87" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>

        {/* Capa Carmesim Heroica */}
        <linearGradient id={ids.capeGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#30030f" />
          <stop offset="30%" stopColor="#4c0519" />
          <stop offset="65%" stopColor="#881337" />
          <stop offset="85%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#e11d48" />
          <stop offset="0%" stopColor="#24040c" />
          <stop offset="25%" stopColor="#4a0618" />
          <stop offset="60%" stopColor="#820d2c" />
          <stop offset="85%" stopColor="#b81440" />
          <stop offset="100%" stopColor="#e0285a" />
        </linearGradient>

        {/* Ouro metálico polido */}
        {/* Ouro metálico polido nobre */}
        {/* Ouro Metálico Polido */}
        <linearGradient id={ids.goldGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="25%" stopColor="#b45309" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="80%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#fef9c3" />
          <stop offset="0%" stopColor="#5c2c05" />
          <stop offset="25%" stopColor="#96530a" />
          <stop offset="50%" stopColor="#d98218" />
          <stop offset="78%" stopColor="#fcc419" />
          <stop offset="100%" stopColor="#fff3bf" />
        </linearGradient>

        {/* Couro realista para botas e cinto */}
        {/* Couro Nobre */}
        <linearGradient id={ids.leatherGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1c1917" />
          <stop offset="40%" stopColor="#451a03" />
          <stop offset="35%" stopColor="#451a03" />
          <stop offset="70%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>

        {/* Lentes de vidro translúcidas suaves */}
        {/* Lentes de óculos translúcidas limpas e cristalinas */}
        {/* Lentes Cristalinas */}
        <linearGradient id={ids.lensGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity=".32" />
          <stop offset="50%" stopColor="#bae6fd" stopOpacity=".15" />
          <stop offset="45%" stopColor="#bae6fd" stopOpacity=".14" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity=".22" />
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity=".28" />
          <stop offset="50%" stopColor="#bae6fd" stopOpacity=".12" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity=".18" />
        </linearGradient>

        {/* Íris de safira com anel limbar realista */}
        {/* Íris de safira com anel limbar e profundidade */}
        <radialGradient id={ids.eyeIrisGrad} cx="45%" cy="40%" r="55%">
        {/* Íris de Safira */}
        <radialGradient id={ids.eyeIrisGrad} cx="42%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="35%" stopColor="#0284c7" />
          <stop offset="75%" stopColor="#0369a1" />
          <stop offset="70%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>

        {/* Rubi precioso lapidado */}
        {/* Broche Rubi Lapidado */}
        <radialGradient id={ids.rubyGrad} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="30%" stopColor="#f43f5e" />
          <stop offset="70%" stopColor="#be123c" />
          <stop offset="75%" stopColor="#9f1239" />
          <stop offset="100%" stopColor="#4c0519" />
        </radialGradient>
      </defs>

      {/* Aura discreta ao fundo */}
      <ellipse className="pixel-aura" cx="140" cy="165" rx="116" ry="140" fill={`url(#${ids.aura})`} />
      <ellipse className="pixel-aura" cx="140" cy="165" rx="114" ry="136" fill={`url(#${ids.aura})`} />
      {/* Aura ambiental de fundo */}
      <ellipse className="pixel-aura" cx="140" cy="165" rx="118" ry="142" fill={`url(#${ids.auraGrad})`} />

      {/* Sombra de chão difusa e orgânica */}
      {/* Sombra de chão difusa e orgânica sob as botas */}
      <g className="pixel-ground-shadow" aria-hidden="true" shapeRendering="geometricPrecision">
        <ellipse cx="140" cy="326" rx="90" ry="11" fill={`url(#${ids.shadow})`} />
        <ellipse cx="140" cy="326" rx="88" ry="10" fill={`url(#${ids.shadow})`} />
      {/* Sombra de chão */}
      <g className="pixel-ground-shadow" aria-hidden="true">
        <ellipse cx="140" cy="326" rx="88" ry="10" fill={`url(#${ids.floorShadow})`} />
      </g>

      {/* ========================================================
          RIG PRINCIPAL DO AVATAR - ALTA DEFINIÇÃO ANATÔMICA CURVA
          RIG PRINCIPAL DO AVATAR - REALISMO ANATÔMICO ORGÂNICO
          RIG HEROICO PRINCIPAL - DESIGN DE ALTA DENSIDADE MICRO-PIXEL
          ======================================================== */}
      <g className="pixel-rig" shapeRendering="geometricPrecision">
        {/* 1. CAPA HEROICA CARMESIM COM CAIMENTO CURVO */}
      <g className="pixel-rig">
        {/* 1. CAPA HEROICA CARMESIM COM CAIMENTO ELEGANTE */}
        <g className="pixel-cape pixel-cape-back">
          {/* Base profunda com curvas de drapeado fluido */}
          {/* Base sombreada profunda */}
          <path
            d="M74 154 C68 180 50 240 32 270 C24 284 20 304 22 318 C46 316 100 318 140 318 C180 318 234 316 258 318 C260 304 256 284 248 270 C230 240 212 180 206 154 Z"
            fill={palette.cape.deepest}
            d="M80 156 C74 182 54 246 36 274 C28 288 24 306 26 318 C48 316 98 318 140 318 C182 318 232 316 254 318 C256 306 252 288 244 274 C226 246 206 182 200 156 Z"
            fill="#24040c"
          />
          {/* Corpo com gradiente carmesim acetinado */}
          {/* Corpo acetinado carmesim */}
          <path
            d="M78 156 C72 182 56 242 40 270 C32 284 28 302 30 314 C52 312 100 314 140 314 C180 314 228 312 250 314 C252 302 248 284 240 270 C224 242 208 182 202 156 Z"
            d="M84 158 C78 184 60 248 44 274 C36 288 32 304 34 314 C54 312 98 314 140 314 C182 314 226 312 246 314 C248 304 244 288 236 274 C220 248 202 184 196 158 Z"
            fill={`url(#${ids.capeGrad})`}
          />
          {/* Pregas anatômicas de tecido */}
          {/* Pregas anatômicas de veludo carmesim */}
          {/* Pregas de veludo */}
          <path
            d="M82 158 C78 188 64 246 54 274 C46 294 40 310 42 313 C68 311 96 312 110 312 C102 284 94 220 88 160 Z"
            fill={palette.cape.shadow}
            opacity=".8"
            d="M88 160 C84 190 70 250 60 278 C52 298 46 311 48 313 C72 311 98 312 110 312 C104 284 96 220 92 162 Z"
            fill="#4a0618"
            opacity=".75"
          />
          <path
            d="M198 158 C202 188 216 246 226 274 C234 294 240 310 238 313 C212 311 184 312 170 312 C178 284 186 220 192 160 Z"
            fill={palette.cape.shadow}
            opacity=".8"
            d="M192 160 C196 190 210 250 220 278 C228 298 234 311 232 313 C208 311 182 312 170 312 C176 284 184 220 188 162 Z"
            fill="#4a0618"
            opacity=".75"
          />
          {/* Barra dourada bordada decorativa suave */}
          {/* Barra dourada bordada com curvatura elegante */}
          {/* Barra dourada decorativa da capa */}
          <path
            d="M30 314 C70 312 140 312 250 314 C248 317 180 317 140 317 C100 317 32 317 30 314 Z"
            d="M34 314 C74 312 140 312 246 314 C244 317 180 317 140 317 C100 317 36 317 34 314 Z"
            fill={`url(#${ids.goldGrad})`}
          />
        </g>

        {/* 2. PERNAS E BOTAS DE COURO COM CURVATURAS REAIS */}
        {/* 2. PERNAS E BOTAS DE COURO COM FIVELAS */}
        <g className="pixel-legs">
          {/* Calça de alfaiataria com contorno anatômico */}
          <path d="M109 254 C107 266 107 282 109 294 H137 C138 282 138 266 136 254 Z" fill={palette.pants.shadow} />
          <path d="M144 254 C142 266 142 282 144 294 H172 C174 282 174 266 172 254 Z" fill={palette.pants.shadow} />
          <path d="M112 257 C111 268 111 282 113 292 H133 C134 282 134 268 133 257 Z" fill={palette.pants.base} />
          <path d="M147 257 C146 268 146 282 148 292 H168 C169 282 169 268 168 257 Z" fill={palette.pants.base} />
          {/* Vinco do joelho curvado sutil */}
          <path d="M115 273 Q123 275 131 273" stroke={palette.pants.highlight} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M150 273 Q158 275 166 273" stroke={palette.pants.highlight} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M115 273 Q123 275 131 273" stroke={palette.pants.highlight} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M150 273 Q158 275 166 273" stroke={palette.pants.highlight} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Calça de alfaiataria grafite */}
          <path d="M110 254 C108 266 108 282 110 294 H136 C137 282 137 266 135 254 Z" fill="#0f172a" />
          <path d="M145 254 C143 266 143 282 145 294 H170 C172 282 172 266 170 254 Z" fill="#0f172a" />
          <path d="M113 257 C112 268 112 282 114 292 H132 C133 282 133 268 132 257 Z" fill="#1e293b" />
          <path d="M148 257 C147 268 147 282 149 292 H167 C168 282 168 268 167 257 Z" fill="#1e293b" />
          {/* Vinco vertical da calça */}
          <path d="M123 256 V292" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M157 256 V292" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />

          {/* Bota Esquerda Anatômica de Montaria */}
          {/* Bota Esquerda */}
          <g className="pixel-boot-left">
            <path
              d="M101 288 C100 294 98 306 94 316 C92 320 90 324 93 325 C102 326 128 326 137 325 C138 318 137 302 137 288 Z"
              fill={palette.leather.darkest}
              d="M102 288 C101 294 99 306 95 316 C93 320 91 324 94 325 C103 326 127 326 136 325 C137 318 136 302 136 288 Z"
              fill="#1c1917"
            />
            <path
              d="M103 290 C102 296 100 306 96 315 C95 318 94 322 96 323 C104 324 126 324 135 323 C136 316 135 302 135 290 Z"
              d="M104 290 C103 296 101 306 97 315 C96 318 95 322 97 323 C105 324 125 324 134 323 C135 316 134 302 134 290 Z"
              fill={`url(#${ids.leatherGrad})`}
            />
            <path d="M92 322 Q115 322 138 322 L137 326 Q115 326 91 326 Z" fill="#090d16" />
            {/* Fivela de Ouro Curvada */}
            <rect x="110" y="299" width="18" height="11" rx="4" fill={`url(#${ids.goldGrad})`} />
            <rect x="113" y="301" width="12" height="7" rx="2.5" fill={palette.leather.darkest} />
            <circle cx="119" cy="304.5" r="1.5" fill={palette.gold.gleam} />
            <path d="M93 322 Q114 322 137 322 L136 326 Q114 326 92 326 Z" fill="#090d16" />
            {/* Fivela dourada */}
            <rect x="110" y="299" width="18" height="11" rx="3.5" fill={`url(#${ids.goldGrad})`} />
            <rect x="113" y="301" width="12" height="7" rx="2" fill="#1c1917" />
            <circle cx="119" cy="304.5" r="1.4" fill="#fff3bf" />
          </g>

          {/* Bota Direita Anatômica de Montaria */}
          {/* Bota Direita */}
          <g className="pixel-boot-right">
            <path
              d="M143 288 C143 302 142 318 143 325 C152 326 178 326 187 325 C190 324 188 320 186 316 C182 306 180 294 179 288 Z"
              fill={palette.leather.darkest}
              d="M144 288 C144 302 143 318 144 325 C153 326 177 326 186 325 C189 324 187 320 185 316 C181 306 179 294 178 288 Z"
              fill="#1c1917"
            />
            <path
              d="M145 290 C145 302 144 316 145 323 C154 324 176 324 184 323 C186 322 185 318 184 315 C180 306 178 296 177 290 Z"
              d="M146 290 C146 302 145 316 146 323 C155 324 175 324 183 323 C185 322 184 318 183 315 C179 306 177 296 176 290 Z"
              fill={`url(#${ids.leatherGrad})`}
            />
            <path d="M142 322 Q165 322 188 322 L189 326 Q165 326 143 326 Z" fill="#090d16" />
            {/* Fivela de Ouro Curvada */}
            <rect x="152" y="299" width="18" height="11" rx="4" fill={`url(#${ids.goldGrad})`} />
            <rect x="155" y="301" width="12" height="7" rx="2.5" fill={palette.leather.darkest} />
            <circle cx="161" cy="304.5" r="1.5" fill={palette.gold.gleam} />
            <path d="M143 322 Q166 322 187 322 L188 326 Q166 326 144 326 Z" fill="#090d16" />
            {/* Fivela dourada */}
            <rect x="152" y="299" width="18" height="11" rx="3.5" fill={`url(#${ids.goldGrad})`} />
            <rect x="155" y="301" width="12" height="7" rx="2" fill="#1c1917" />
            <circle cx="161" cy="304.5" r="1.4" fill="#fff3bf" />
          </g>
        </g>

        {/* 3. TRONCO, CASACO ESMERALDA CURVO, CRAVAT E BROCHE */}
        {/* 3. TRONCO, CASACO ESMERALDA TAILORED, CRAVAT E BROCHE */}
        <g className="pixel-body">
          {/* Base e Sombra Anatômica do Casaco (Ombros caídos naturais, tronco em V) */}
          {/* Base do tronco e casaco */}
          <path
            d="M84 158 C84 154 110 152 140 152 C170 152 196 154 196 158 C200 178 203 218 202 256 C162 258 118 258 78 256 C77 218 80 178 84 158 Z"
            fill={palette.coat.deepest}
            d="M86 158 C86 154 110 152 140 152 C170 152 194 154 194 158 C198 178 201 218 200 256 C162 258 118 258 80 256 C79 218 82 178 86 158 Z"
            fill="#04231e"
          />
          <path
            d="M88 159 C88 155 112 153 140 153 C168 153 192 155 192 159 C196 178 198 218 197 254 C160 256 120 256 83 254 C82 218 84 178 88 159 Z"
            fill={palette.coat.shadow}
            d="M90 159 C90 155 112 153 140 153 C168 153 190 155 190 159 C194 178 196 218 195 254 C160 256 120 256 85 254 C84 218 86 178 90 159 Z"
            fill="#083c34"
          />
          {/* Painel Central com degradê de veludo */}
          <path
            d="M93 160 C93 156 114 155 140 155 C166 155 187 156 187 160 C190 178 191 216 190 252 C158 254 122 254 90 252 C89 216 90 178 93 160 Z"
            d="M94 160 C94 156 114 155 140 155 C166 155 186 156 186 160 C189 178 190 216 189 252 C158 254 122 254 91 252 C90 216 91 178 94 160 Z"
            fill={`url(#${ids.coatGrad})`}
          />

          {/* Lapelas Dobradas Elegantes com Curvas Suaves */}
          {/* Lapelas Dobradas Aristocráticas com Curvas Suaves */}
          {/* Lapelas Aristocráticas Dobradas */}
          <path
            d="M102 156 C108 174 124 204 128 218 C120 216 108 198 94 172 Z"
            d="M104 156 C110 174 124 204 128 218 C120 216 108 198 96 172 Z"
            fill={`url(#${ids.coatLapelGrad})`}
          />
          <path
            d="M178 156 C172 174 156 204 152 218 C160 216 172 198 186 172 Z"
            d="M176 156 C170 174 156 204 152 218 C160 216 172 198 184 172 Z"
            fill={`url(#${ids.coatLapelGrad})`}
          />
          {/* Debrum Dourado de Alta Costura nas Lapelas */}
          {/* Debrum Dourado Bordado */}
          <path
            d="M102 156 C108 174 124 204 128 218"
            d="M104 156 C110 174 124 204 128 218"
            stroke={`url(#${ids.goldGrad})`}
            strokeWidth="1.8"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M178 156 C172 174 156 204 152 218"
            d="M176 156 C170 174 156 204 152 218"
            stroke={`url(#${ids.goldGrad})`}
            strokeWidth="1.8"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />

          {/* Camisa de Linho Branca e Cravat de Seda Ametista Curvo */}
          {/* Camisa de Linho Branca e Cravat de Seda Ametista */}
          <path d="M124 154 H156 C152 170 148 184 140 190 C132 184 128 170 124 154 Z" fill="#ffffff" />
          <path d="M127 156 H153 C150 170 146 184 140 189 C134 184 130 170 127 156 Z" fill="#f1f5f9" />
          {/* Pregas fluidas do cravat roxo no peito */}
          <path d="M129 158 C135 158 145 158 151 158 C148 174 145 188 140 194 C135 188 132 174 129 158 Z" fill="#6d28d9" />
          <path d="M132 160 C136 160 144 160 148 160 C146 173 143 186 140 191 C137 186 134 173 132 160 Z" fill="#7c3aed" />
          <path d="M135 162 C138 162 142 162 145 162 C143 172 142 182 140 188 C138 182 137 172 135 162 Z" fill="#8b5cf6" />
          <path d="M125 154 H155 C151 170 147 184 140 190 C133 184 129 170 125 154 Z" fill="#ffffff" />
          <path d="M128 156 H152 C149 170 145 184 140 189 C135 184 131 170 128 156 Z" fill="#f1f5f9" />
          {/* Cravat de seda */}
          <path d="M130 158 C135 158 145 158 150 158 C147 174 144 188 140 194 C136 188 133 174 130 158 Z" fill={`url(#${ids.cravatGrad})`} />
          <path d="M134 162 C137 162 143 162 146 162 C144 173 142 183 140 189 C138 183 136 173 134 162 Z" fill="#9333ea" />

          {/* Broche de Rubi Lapidado com Engaste de Ouro */}
          <circle cx="140" cy="173" r="5" fill={`url(#${ids.goldGrad})`} />
          <circle cx="140" cy="173" r="3.5" fill={`url(#${ids.rubyGrad})`} />
          <circle cx="138.8" cy="171.8" r="1.1" fill="#ffffff" />
          {/* Broche de Rubi Lapidado com Engaste Dourado */}
          {/* Broche de Rubi Lapidado com Ouro */}
          <circle cx="140" cy="173" r="4.8" fill={`url(#${ids.goldGrad})`} />
          <circle cx="140" cy="173" r="3.4" fill={`url(#${ids.rubyGrad})`} />
          <circle cx="138.8" cy="171.8" r="1" fill="#ffffff" />

          {/* Botões Ornamentais Dourados em Curva Central */}
          {/* Botões Ornamentais Dourados */}
          <g className="pixel-coat-buttons">
            <circle cx="140" cy="201" r="3.5" fill={`url(#${ids.goldGrad})`} />
            <circle cx="140" cy="201" r="2.2" fill={palette.gold.bright} />
            <circle cx="139.2" cy="200.2" r="0.9" fill={palette.gold.gleam} />
            <circle cx="140" cy="201" r="3.4" fill={`url(#${ids.goldGrad})`} />
            <circle cx="140" cy="201" r="2.1" fill={palette.gold.bright} />
            <circle cx="139.2" cy="200.2" r="0.8" fill={palette.gold.gleam} />
            <circle cx="140" cy="201" r="2.1" fill="#f59e0b" />
            <circle cx="139.2" cy="200.2" r="0.8" fill="#fff3bf" />

            <circle cx="140" cy="221" r="3.5" fill={`url(#${ids.goldGrad})`} />
            <circle cx="140" cy="221" r="2.2" fill={palette.gold.bright} />
            <circle cx="139.2" cy="220.2" r="0.9" fill={palette.gold.gleam} />
            <circle cx="140" cy="221" r="3.4" fill={`url(#${ids.goldGrad})`} />
            <circle cx="140" cy="221" r="2.1" fill={palette.gold.bright} />
            <circle cx="139.2" cy="220.2" r="0.8" fill={palette.gold.gleam} />
            <circle cx="140" cy="221" r="2.1" fill="#f59e0b" />
            <circle cx="139.2" cy="220.2" r="0.8" fill="#fff3bf" />

            <circle cx="140" cy="239" r="3.5" fill={`url(#${ids.goldGrad})`} />
            <circle cx="140" cy="239" r="2.2" fill={palette.gold.bright} />
            <circle cx="139.2" cy="238.2" r="0.9" fill={palette.gold.gleam} />
            <circle cx="140" cy="239" r="3.4" fill={`url(#${ids.goldGrad})`} />
            <circle cx="140" cy="239" r="2.1" fill={palette.gold.bright} />
            <circle cx="139.2" cy="238.2" r="0.8" fill={palette.gold.gleam} />
            <circle cx="140" cy="239" r="2.1" fill="#f59e0b" />
            <circle cx="139.2" cy="238.2" r="0.8" fill="#fff3bf" />
          </g>

          {/* Cinto de Couro Curvado e Fivela de Ouro Nobre */}
          {/* Cinto de Couro e Fivela de Ouro */}
          <g className="pixel-belt">
            <path d="M83 248 C102 247 178 247 197 248 V261 C178 262 102 262 83 261 Z" fill={palette.leather.darkest} />
            <path d="M85 250 C104 249 176 249 195 250 V259 C176 260 104 260 85 259 Z" fill={`url(#${ids.leatherGrad})`} />
            {/* Costura dupla sofisticada */}
            <path d="M87 251.5 C105 250.5 175 250.5 193 251.5" stroke={palette.gold.shadow} strokeWidth="0.8" fill="none" opacity=".8" />
            <path d="M87 257.5 C105 256.5 175 256.5 193 257.5" stroke={palette.gold.shadow} strokeWidth="0.8" fill="none" opacity=".8" />
            {/* Fivela Central Arredondada */}
            <rect x="124" y="244" width="32" height="21" rx="5" fill={`url(#${ids.goldGrad})`} />
            <rect x="128" y="247.5" width="24" height="14" rx="3.5" fill={palette.leather.darkest} />
            <rect x="138" y="245.5" width="4" height="18" rx="1.5" fill={`url(#${ids.goldGrad})`} />
            <circle cx="140" cy="254.5" r="1.2" fill={palette.gold.gleam} />
            <path d="M84 248 C103 247 177 247 196 248 V261 C177 262 103 262 84 261 Z" fill="#1c1917" />
            <path d="M86 250 C105 249 175 249 194 250 V259 C175 260 105 260 86 259 Z" fill={`url(#${ids.leatherGrad})`} />
            {/* Fivela Central */}
            <rect x="125" y="244" width="30" height="21" rx="4.5" fill={`url(#${ids.goldGrad})`} />
            <rect x="129" y="247.5" width="22" height="14" rx="3" fill="#1c1917" />
            <rect x="138" y="245.5" width="4" height="18" rx="1.2" fill={`url(#${ids.goldGrad})`} />
            <circle cx="140" cy="254.5" r="1.2" fill="#fff3bf" />
          </g>
        </g>

        {/* 4. BRAÇOS E MÃOS ANATÔMICAS CURVAS */}
        {/* 4. BRAÇOS, MÃOS E DEDOS ANATÔMICOS REALISTAS (SEM BLOCOS QUADRICULADOS) */}
        {/* 4. BRAÇOS, MÃOS E DEDOS ANATÔMICOS */}
        <g className="pixel-arms">
          {/* Braço Esquerdo */}
          <g className="pixel-arm-left">
            <path
              d="M86 160 C78 174 68 200 58 226 C66 228 74 228 78 226 C84 204 88 180 88 162 Z"
              fill={palette.coat.base}
              d="M87 160 C79 174 69 200 59 226 C67 228 75 228 79 226 C85 204 89 180 89 162 Z"
              fill="#0d695d"
            />
            <path
              d="M80 164 C74 176 66 198 62 222 C67 223 71 223 73 222 C78 202 82 180 84 165 Z"
              fill={palette.coat.bright}
              opacity=".8"
              d="M81 164 C75 176 67 198 63 222 C68 223 72 223 74 222 C79 202 83 180 85 165 Z"
              fill="#14b8a6"
              opacity=".75"
            />
            {/* Punho de alfaiataria com debrum dourado */}
            <rect x="58" y="222" width="20" height="4" rx="2" fill={`url(#${ids.goldGrad})`} />
            {/* Mão Esquerda Anatômica */}
            <path
              d="M60 226 C58 232 58 240 62 244 C66 246 74 246 76 244 C78 240 78 232 76 226 Z"
              fill={palette.skin.base}
            />
            <path d="M62 238 Q68 242 74 238" stroke={palette.skin.shadow} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Punho de camisa branca e debrum dourado */}
            <path d="M57 222 C64 220 72 220 79 222 V225 C72 223 64 223 57 225 Z" fill="#ffffff" />
            <rect x="58" y="222" width="20" height="3" rx="1.5" fill={`url(#${ids.goldGrad})`} />
            {/* Punho de alfaiataria */}
            <path d="M58 222 C65 220 73 220 80 222 V225 C73 223 65 223 58 225 Z" fill="#ffffff" />
            <rect x="59" y="222" width="20" height="3" rx="1.5" fill={`url(#${ids.goldGrad})`} />

            {/* MÃO ESQUERDA ANATÔMICA COM DEDOS REAIS */}
            <g className="pixel-hand-left">
              {/* Palma da mão */}
              <path
                d="M60 225 C58 231 59 238 62 242 C67 245 74 244 76 239 C78 234 77 228 75 225 Z"
                fill={`url(#${ids.skinHandGrad})`}
              />
              {/* Polegar anatômico dobrado para o interior */}
              <path
                d="M74 226 C76 228 78 231 77 234 C76 236 73 236 72 233 Z"
                fill={palette.skin.base}
              />
              {/* Dedo Indicador */}
              <path
                d="M61 238 C60 241 61 247 63 247 C65 247 65 242 64 238 Z"
                fill={palette.skin.base}
              />
              {/* Dedo Médio (mais longo) */}
              <path
                d="M64 239 C64 243 65 249 67 249 C69 249 69 244 68 239 Z"
                fill={palette.skin.base}
              />
              {/* Dedo Anelar */}
              <path
                d="M68 238 C68 242 69 247 71 247 C72 247 72 242 71 237 Z"
                fill={palette.skin.base}
              />
              {/* Dedo Mínimo */}
              <path
                d="M71 235 C72 239 73 244 74 244 C75 244 75 240 73 234 Z"
                fill={palette.skin.base}
              />
              {/* Sombras anatômicas entre dedos e juntas */}
              <path d="M63 236 Q67 238 72 235" stroke={palette.skin.shadow} strokeWidth="1" fill="none" strokeLinecap="round" />
              {/* Polegar dobrado */}
              <path d="M74 226 C76 228 78 231 77 234 C76 236 73 236 72 233 Z" fill="#f8c29b" />
              {/* Dedos */}
              <path d="M61 238 C60 241 61 247 63 247 C65 247 65 242 64 238 Z" fill="#f8c29b" />
              <path d="M64 239 C64 243 65 249 67 249 C69 249 69 244 68 239 Z" fill="#f8c29b" />
              <path d="M68 238 C68 242 69 247 71 247 C72 247 72 242 71 237 Z" fill="#f8c29b" />
              <path d="M71 235 C72 239 73 244 74 244 C75 244 75 240 73 234 Z" fill="#f8c29b" />
              <path d="M63 236 Q67 238 72 235" stroke="#b44d28" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            </g>
          </g>

          {/* Braço Direito */}
          <g className="pixel-arm-right">
            <path
              d="M194 160 C202 174 212 200 222 226 C214 228 206 228 202 226 C196 204 192 180 192 162 Z"
              fill={palette.coat.base}
              d="M193 160 C201 174 211 200 221 226 C213 228 205 228 201 226 C195 204 191 180 191 162 Z"
              fill="#0d695d"
            />
            <path
              d="M200 164 C206 176 214 198 218 222 C213 223 209 223 207 222 C202 202 198 180 196 165 Z"
              fill={palette.coat.bright}
              opacity=".8"
              d="M199 164 C205 176 213 198 217 222 C212 223 208 223 206 222 C201 202 197 180 195 165 Z"
              fill="#14b8a6"
              opacity=".75"
            />
            {/* Punho de alfaiataria com debrum dourado */}
            <rect x="202" y="222" width="20" height="4" rx="2" fill={`url(#${ids.goldGrad})`} />
            {/* Mão Direita Anatômica */}
            <path
              d="M204 226 C202 232 202 240 206 244 C210 246 218 246 220 244 C222 240 222 232 220 226 Z"
              fill={palette.skin.base}
            />
            <path d="M206 238 Q212 242 218 238" stroke={palette.skin.shadow} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Punho de camisa branca e debrum dourado */}
            <path d="M201 222 C208 220 216 220 223 222 V225 C216 223 208 223 201 225 Z" fill="#ffffff" />
            <rect x="202" y="222" width="20" height="3" rx="1.5" fill={`url(#${ids.goldGrad})`} />
            {/* Punho de alfaiataria */}
            <path d="M200 222 C207 220 215 220 222 222 V225 C215 223 207 223 200 225 Z" fill="#ffffff" />
            <rect x="201" y="222" width="20" height="3" rx="1.5" fill={`url(#${ids.goldGrad})`} />

            {/* MÃO DIREITA ANATÔMICA COM DEDOS REAIS */}
            <g className="pixel-hand-right">
              {/* Palma da mão */}
              <path
                d="M220 225 C222 231 221 238 218 242 C213 245 206 244 204 239 C202 234 203 228 205 225 Z"
                fill={`url(#${ids.skinHandGrad})`}
              />
              {/* Polegar anatômico dobrado para o interior */}
              <path
                d="M206 226 C204 228 202 231 203 234 C204 236 207 236 208 233 Z"
                fill={palette.skin.base}
              />
              {/* Dedo Indicador */}
              <path
                d="M219 238 C220 241 219 247 217 247 C215 247 215 242 216 238 Z"
                fill={palette.skin.base}
              />
              {/* Dedo Médio (mais longo) */}
              <path
                d="M216 239 C216 243 215 249 213 249 C211 249 211 244 212 239 Z"
                fill={palette.skin.base}
              />
              {/* Dedo Anelar */}
              <path
                d="M212 238 C212 242 211 247 209 247 C208 247 208 242 209 237 Z"
                fill={palette.skin.base}
              />
              {/* Dedo Mínimo */}
              <path
                d="M209 235 C208 239 207 244 206 244 C205 244 205 240 207 234 Z"
                fill={palette.skin.base}
              />
              {/* Sombras anatômicas entre dedos e juntas */}
              <path d="M217 236 Q213 238 208 235" stroke={palette.skin.shadow} strokeWidth="1" fill="none" strokeLinecap="round" />
              {/* Polegar dobrado */}
              <path d="M206 226 C204 228 202 231 203 234 C204 236 207 236 208 233 Z" fill="#f8c29b" />
              {/* Dedos */}
              <path d="M219 238 C220 241 219 247 217 247 C215 247 215 242 216 238 Z" fill="#f8c29b" />
              <path d="M216 239 C216 243 215 249 213 249 C211 249 211 244 212 239 Z" fill="#f8c29b" />
              <path d="M212 238 C212 242 211 247 209 247 C208 247 208 242 209 237 Z" fill="#f8c29b" />
              <path d="M209 235 C208 239 207 244 206 244 C205 244 205 240 207 234 Z" fill="#f8c29b" />
              <path d="M217 236 Q213 238 208 235" stroke="#b44d28" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            </g>
          </g>
        </g>

        {/* 5. CABEÇA DO MR. CRAZY - ANATOMIA REALISTA, CURVAS SUAVES E ZERO BRILHO ESTRANHO */}
        {/* 5. CABEÇA DO MR. CRAZY - ANATOMIA REALISTA, CABELO FLUÍDO E ZERO POLUIÇÃO VISUAL */}
        {/* 5. CABEÇA DO MR. CRAZY - ANATOMIA REALISTA, CABELO FLUÍDO E ZERO POLUIÇÃO */}
        <g className="pixel-head" transform={`translate(${faceX} ${faceY})`}>
          {/* Cabelo Flamejante Traseiro com Curvas Fluídas Orgânicas */}
          {/* Cabelo Flamejante Traseiro Volumétrico com Mechas Orgânicas */}
          {/* Cabelo Flamejante Traseiro Volumétrico */}
          <g className="pixel-hair-back">
            {/* Silhueta contínua orgânica sem zigue-zague reto */}
            <path
              d="M68 122 C56 102 54 80 68 64 C60 48 72 32 88 34 C82 18 102 12 116 22 C126 8 154 8 164 22 C178 12 198 18 192 34 C208 32 220 48 212 64 C226 80 224 102 212 122 C194 106 140 100 68 122 Z"
              d="M72 120 C54 104 50 80 64 62 C58 46 70 30 86 32 C82 14 104 8 120 18 C132 4 158 4 168 18 C182 8 204 14 200 32 C216 30 228 46 222 62 C234 80 230 104 212 120 C188 104 140 98 72 120 Z"
              fill={palette.hair.darkest}
              fill="#220303"
            />
            <path
              d="M70 118 C60 100 58 82 70 68 C64 52 76 38 90 40 C86 24 104 18 116 26 C128 14 152 14 164 26 C176 18 194 24 190 40 C204 38 216 52 210 68 C222 82 220 100 210 118 C192 104 140 98 70 118 Z"
              d="M74 116 C58 102 54 82 66 66 C62 50 74 36 88 38 C86 20 106 14 120 22 C134 10 156 10 166 22 C180 14 198 20 196 38 C210 36 222 50 216 66 C228 82 224 102 210 116 C188 102 140 96 74 116 Z"
              fill={`url(#${ids.hairBackGrad})`}
            />
            {/* Mechas flamejantes secundárias de profundidade */}
            {/* Mechas volumétricas curvas secundárias */}
            {/* Mechas volumétricas de profundidade */}
            <path
              d="M82 72 Q98 52 106 64 Q122 38 134 60 Q146 40 158 60 Q174 48 182 70 Q196 74 198 72"
              d="M78 82 C86 64 98 52 110 56 M112 48 C122 32 138 28 144 42 M148 38 C160 28 174 34 178 50 M182 58 C196 64 206 78 206 94"
              stroke={palette.hair.bright}
              strokeWidth="2.8"
              stroke="#ea580c"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              opacity=".85"
            />
            <path
              d="M92 46 Q104 36 114 42 M152 40 Q164 34 172 44"
              stroke={palette.hair.highlight}
              stroke="#f59e0b"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Pescoço Anatômico Curvo com Sombra Natural */}
          <path
            d="M125 144 C123 152 120 160 116 166 H164 C160 160 157 152 155 144 Z"
            fill={palette.skin.darkest}
          />
          <path
            d="M127 146 C125 152 122 158 119 164 H161 C158 158 155 152 153 146 Z"
            fill={palette.skin.shadow}
          />
          <path
            d="M133 148 C132 154 130 158 128 162 H152 C150 158 148 154 147 148 Z"
            fill={palette.skin.base}
          />
          {/* Pescoço Anatômico */}
          <path d="M125 144 C123 152 120 160 116 166 H164 C160 160 157 152 155 144 Z" fill="#883015" />
          <path d="M127 146 C125 152 122 158 119 164 H161 C158 158 155 152 153 146 Z" fill="#b44d28" />
          <path d="M133 148 C132 154 130 158 128 162 H152 C150 158 148 154 147 148 Z" fill="#f8c29b" />

          {/* Formato Esculpido Anatômico da Cabeça, Mandíbula e Queixo (Zero ângulos retos) */}
          {/* Formato Esculpido Anatômico da Cabeça, Mandíbula e Queixo */}
          {/* Formato Esculpido do Rosto, Mandíbula e Queixo */}
          <path
            d="M100 80 C98 96 98 114 102 126 C105 138 114 150 128 158 C134 161 146 161 152 158 C166 150 175 138 178 126 C182 114 182 96 180 80 C162 76 118 76 100 80 Z"
            fill={palette.skin.shadow}
            fill="#b44d28"
          />
          <path
            d="M102 82 C100 96 100 114 104 125 C107 136 116 148 129 156 C135 159 145 159 151 156 C164 148 173 136 176 125 C180 114 180 96 178 82 C160 78 120 78 102 82 Z"
            fill={`url(#${ids.skinFaceGrad})`}
          />

          {/* Rubor Suave e Difuso nas Bochechas (Transição 100% natural, sem manchas duras) */}
          {/* Rubor Suave e Difuso nas Bochechas */}
          {/* Rubor Suave nas Bochechas */}
          <ellipse cx="118" cy="120" rx="12" ry="6" fill={`url(#${ids.skinCheekGrad})`} />
          <ellipse cx="162" cy="120" rx="12" ry="6" fill={`url(#${ids.skinCheekGrad})`} />

          {/* Orelhas Anatômicas com Cartilagem e Lóbulo Arredondados */}
          {/* Orelhas Anatômicas com Cartilagem */}
          <g className="pixel-ears">
            {/* Orelha Esquerda */}
            <path
              d="M101 101 C93 100 88 108 89 118 C90 126 96 129 101 127 C102 122 102 106 101 101 Z"
              fill={palette.skin.darkest}
            />
            <path
              d="M101 103 C95 102 91 109 92 117 C93 124 97 127 101 125 C102 120 102 107 101 103 Z"
              fill={palette.skin.base}
            />
            <path d="M96 108 C93 112 93 118 96 122" stroke={palette.skin.shadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M101 101 C93 100 88 108 89 118 C90 126 96 129 101 127 C102 122 102 106 101 101 Z" fill="#883015" />
            <path d="M101 103 C95 102 91 109 92 117 C93 124 97 127 101 125 C102 120 102 107 101 103 Z" fill="#f8c29b" />
            <path d="M96 108 C93 112 93 118 96 122" stroke="#b44d28" strokeWidth="1.6" fill="none" strokeLinecap="round" />

            {/* Orelha Direita */}
            <path
              d="M179 101 C187 100 192 108 191 118 C190 126 184 129 179 127 C178 122 178 106 179 101 Z"
              fill={palette.skin.darkest}
            />
            <path
              d="M179 103 C185 102 189 109 188 117 C187 124 183 127 179 125 C178 120 178 107 179 103 Z"
              fill={palette.skin.base}
            />
            <path d="M184 108 C187 112 187 118 184 122" stroke={palette.skin.shadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M179 101 C187 100 192 108 191 118 C190 126 184 129 179 127 C178 122 178 106 179 101 Z" fill="#883015" />
            <path d="M179 103 C185 102 189 109 188 117 C187 124 183 127 179 125 C178 120 178 107 179 103 Z" fill="#f8c29b" />
            <path d="M184 108 C187 112 187 118 184 122" stroke="#b44d28" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>

          {/* Cabelo Flamejante Frontal com Mechas Fluidas Curvas */}
          {/* Cabelo Flamejante Frontal com Mechas Fluidas e Franja Elegante */}
          {/* Cabelo Frontal com Mechas Fluidas e Franja Dinâmica */}
          <g className="pixel-hair-front">
            {/* Base da franja com caimento orgânico */}
            <path
              d="M94 74 Q108 44 116 66 Q132 34 144 66 Q160 42 168 68 Q184 74 174 86 Q156 82 140 86 Q124 82 106 86 Z"
              d="M92 76 C96 60 108 42 116 64 C122 48 134 32 144 62 C154 44 164 42 170 66 C176 56 186 68 184 80 C172 84 154 82 140 85 C126 82 108 84 92 76 Z"
              fill={`url(#${ids.hairFrontGrad})`}
            />
            {/* Mechas de destaque e iluminação volumétrica */}
            <path
              d="M98 70 Q110 48 118 64 Q132 40 142 64 Q156 46 166 66 Q180 72 168 80 Q152 76 140 78 Q128 76 112 80 Z"
              d="M96 72 C102 52 112 48 118 62 C126 44 136 36 142 60 C150 48 160 46 166 64 C174 68 178 76 172 80 C158 78 144 79 136 80 C124 78 110 80 96 72 Z"
              fill={palette.hair.bright}
              fill="#ea580c"
            />
            {/* Fios finos dourados sobre as mechas */}
            {/* Fios incandescentes */}
            <path
              d="M106 64 Q116 52 124 64 M128 56 Q136 44 142 58 M148 58 Q156 48 162 60"
              stroke={palette.hair.highlight}
              strokeWidth="2.4"
              d="M104 64 Q114 50 120 62 M128 54 Q136 42 142 56 M148 56 Q156 46 162 58"
              stroke={`url(#${ids.hairStrandGrad})`}
              stroke="#f59e0b"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <polygon points="110,42 114,40 112,48" fill={`url(#${ids.hairTipGrad})`} />
            <polygon points="132,32 136,30 135,38" fill={`url(#${ids.hairTipGrad})`} />
            <polygon points="160,40 164,38 162,46" fill={`url(#${ids.hairTipGrad})`} />
            {/* Pontas incandescentes sutis */}
            <path d="M114 44 Q116 40 118 48 Z" fill={`url(#${ids.hairTipGrad})`} />
            <path d="M132 34 Q134 30 136 38 Z" fill={`url(#${ids.hairTipGrad})`} />
            <path d="M160 42 Q162 38 164 46 Z" fill={`url(#${ids.hairTipGrad})`} />
          </g>

          {/* Nariz Esculpido com Dorso Suave e Asas Anatômicas */}
          {/* Nariz Esculpido com Asas e Sombra */}
          <g className="pixel-nose">
            <path d="M139 105 Q138 116 136 122 Q140 124 144 122 Q142 116 141 105 Z" fill={palette.skin.shadow} opacity=".75" />
            <ellipse cx="140" cy="122" rx="3.8" ry="2.2" fill={palette.skin.base} />
            <ellipse cx="136.5" cy="123" rx="1.2" ry="0.8" fill={palette.skin.darkest} />
            <ellipse cx="143.5" cy="123" rx="1.2" ry="0.8" fill={palette.skin.darkest} />
            <ellipse cx="140" cy="122" rx="3.6" ry="2" fill={palette.skin.base} />
            <ellipse cx="136.5" cy="123" rx="1.1" ry="0.7" fill={palette.skin.darkest} />
            <ellipse cx="143.5" cy="123" rx="1.1" ry="0.7" fill={palette.skin.darkest} />
            <path d="M139 105 Q138 116 136 122 Q140 124 144 122 Q142 116 141 105 Z" fill="#b44d28" opacity=".75" />
            <ellipse cx="140" cy="122" rx="3.6" ry="2" fill="#f8c29b" />
            <ellipse cx="136.5" cy="123" rx="1.1" ry="0.7" fill="#883015" />
            <ellipse cx="143.5" cy="123" rx="1.1" ry="0.7" fill="#883015" />
          </g>

          {/* Olhos Amolados Anatômicos com Íris e Pupilas Vivas */}
          {/* Olhos Vivos com Pupila e Reflexo */}
          <g className="pixel-eyes">
            {/* Olho Esquerdo */}
            <g className="pixel-eye pixel-eye-left">
              {isBlinking ? (
                <g className="pixel-eyelid-closed">
                  <path d="M112 104 Q123 108 134 104" stroke={palette.skin.darkest} strokeWidth="2.8" fill="none" strokeLinecap="round" />
                  <path d="M112 105 Q123 109 134 105" stroke="#090d16" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                  <path d="M112 104 Q123 108 134 104" stroke={palette.skin.darkest} strokeWidth="2.6" fill="none" strokeLinecap="round" />
                  <path d="M112 104 Q123 108 134 104" stroke="#883015" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                  <path d="M112 105 Q123 109 134 105" stroke="#090d16" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                <g className="pixel-eyeball">
                  {/* Esclera curva natural */}
                  <path d="M113 104 C113 97 123 96 133 98 C134 105 125 110 113 104 Z" fill={palette.eyes.sclera} />
                  <path d="M113 102 C118 98 126 97 133 99 C131 101 121 102 113 102 Z" fill={palette.eyes.scleraShadow} />
                  <path d="M113 104 C113 97 123 96 133 98 C134 105 125 110 113 104 Z" fill="#f1f5f9" />
                  <path d="M113 102 C118 98 126 97 133 99 C131 101 121 102 113 102 Z" fill="#cbd5e1" />
                  <g transform={`translate(${pupilX} ${pupilY})`}>
                    <circle cx="123" cy="104" r="5.2" fill={isAngryOrCrazy ? "#dc2626" : `url(#${ids.eyeIrisGrad})`} />
                    <circle cx="123" cy="104" r="2.8" fill={palette.eyes.pupil} />
                    <circle cx="121.5" cy="102" r="1.3" fill="#ffffff" />
                    <circle cx="123" cy="104" r="5" fill={isAngryOrCrazy ? "#dc2626" : `url(#${ids.eyeIrisGrad})`} />
                    <circle cx="123" cy="104" r="2.6" fill={palette.eyes.pupil} />
                    <circle cx="123" cy="104" r="2.6" fill="#08101e" />
                    <circle cx="121.5" cy="102" r="1.2" fill="#ffffff" />
                    <circle cx="124.5" cy="105.5" r="0.6" fill="#ffffff" opacity=".8" />
                  </g>
                </g>
              )}
            </g>

            {/* Olho Direito */}
            <g className="pixel-eye pixel-eye-right">
              {isBlinking ? (
                <g className="pixel-eyelid-closed">
                  <path d="M146 104 Q157 108 168 104" stroke={palette.skin.darkest} strokeWidth="2.8" fill="none" strokeLinecap="round" />
                  <path d="M146 105 Q157 109 168 105" stroke="#090d16" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                  <path d="M146 104 Q157 108 168 104" stroke={palette.skin.darkest} strokeWidth="2.6" fill="none" strokeLinecap="round" />
                  <path d="M146 104 Q157 108 168 104" stroke="#883015" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                  <path d="M146 105 Q157 109 168 105" stroke="#090d16" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                <g className="pixel-eyeball">
                  {/* Esclera curva natural */}
                  <path d="M167 104 C167 97 157 96 147 98 C146 105 155 110 167 104 Z" fill={palette.eyes.sclera} />
                  <path d="M167 102 C162 98 154 97 147 99 C149 101 159 102 167 102 Z" fill={palette.eyes.scleraShadow} />
                  <path d="M167 104 C167 97 157 96 147 98 C146 105 155 110 167 104 Z" fill="#f1f5f9" />
                  <path d="M167 102 C162 98 154 97 147 99 C149 101 159 102 167 102 Z" fill="#cbd5e1" />
                  <g transform={`translate(${pupilX} ${pupilY})`}>
                    <circle cx="157" cy="104" r="5.2" fill={isAngryOrCrazy ? "#dc2626" : `url(#${ids.eyeIrisGrad})`} />
                    <circle cx="157" cy="104" r="2.8" fill={palette.eyes.pupil} />
                    <circle cx="155.5" cy="102" r="1.3" fill="#ffffff" />
                    <circle cx="157" cy="104" r="5" fill={isAngryOrCrazy ? "#dc2626" : `url(#${ids.eyeIrisGrad})`} />
                    <circle cx="157" cy="104" r="2.6" fill={palette.eyes.pupil} />
                    <circle cx="157" cy="104" r="2.6" fill="#08101e" />
                    <circle cx="155.5" cy="102" r="1.2" fill="#ffffff" />
                    <circle cx="158.5" cy="105.5" r="0.6" fill="#ffffff" opacity=".8" />
                  </g>
                </g>
              )}
            </g>
          </g>

          {/* Óculos Intelectuais Dourados com Armações Redondas Elegantes */}
          {/* Óculos Intelectuais Dourados Limpos (Sem brilho piscando em cima) */}
          {/* Óculos Intelectuais Dourados Elegantes */}
          <g className="pixel-glasses">
            {/* Lente e Aro Esquerdo Redondo/Oval */}
            <ellipse cx="123" cy="104" rx="14" ry="12.5" fill={`url(#${ids.lensGrad})`} stroke={`url(#${ids.goldGrad})`} strokeWidth="2.2" />
            <path d="M113 97 Q123 93 133 97" stroke={palette.glasses.frameHighlight} strokeWidth="1.2" fill="none" />
            <path d="M113 97 Q123 93 133 97" stroke="#fef08a" strokeWidth="1.2" fill="none" />

            {/* Lente e Aro Direito Redondo/Oval */}
            <ellipse cx="157" cy="104" rx="14" ry="12.5" fill={`url(#${ids.lensGrad})`} stroke={`url(#${ids.goldGrad})`} strokeWidth="2.2" />
            <path d="M147 97 Q157 93 167 97" stroke={palette.glasses.frameHighlight} strokeWidth="1.2" fill="none" />
            <path d="M147 97 Q157 93 167 97" stroke="#fef08a" strokeWidth="1.2" fill="none" />

            {/* Ponte Central Curva Dourada */}
            <path d="M136 102 Q140 99 144 102" stroke={`url(#${ids.goldGrad})`} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            {/* Ponte Central Curva */}
            <path d="M136 102 Q140 99 144 102" stroke={`url(#${ids.goldGrad})`} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M136.5 101.5 Q140 99 143.5 101.5" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity=".8" strokeLinecap="round" />

            {/* Hastes Laterais Finas Curvas */}
            {/* Hastes Laterais */}
            <path d="M109 103 Q104 103 100 105" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M171 103 Q176 103 180 105" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Reflexos Cristalinos Sutis nas Lentes */}
            <path d="M116 97 Q124 100 128 108" stroke="#ffffff" strokeWidth="1.2" strokeOpacity=".45" fill="none" strokeLinecap="round" />
            <path d="M150 97 Q158 100 162 108" stroke="#ffffff" strokeWidth="1.2" strokeOpacity=".45" fill="none" strokeLinecap="round" />
            {/* Reflexos Cristalinos Sutis e Estáticos de Vidro nas Lentes */}
            {/* Reflexos Cristalinos nas Lentes */}
            <path d="M116 97 Q124 100 128 108" stroke="#ffffff" strokeWidth="1.1" strokeOpacity=".35" fill="none" strokeLinecap="round" />
            <path d="M150 97 Q158 100 162 108" stroke="#ffffff" strokeWidth="1.1" strokeOpacity=".35" fill="none" strokeLinecap="round" />
          </g>

          {/* Sobrancelhas Reativas Dinâmicas */}
          <g className="pixel-eyebrows">
            {isAngryOrCrazy ? (
              <g className="eyebrows-angry">
                <path d="M106 94 Q122 89 136 86" stroke={palette.hair.shadow} strokeWidth="3.4" fill="none" strokeLinecap="round" />
                <path d="M174 94 Q158 89 144 86" stroke={palette.hair.shadow} strokeWidth="3.4" fill="none" strokeLinecap="round" />
                {/* Rugas de tensão sutis */}
                <path d="M138 88 V93" stroke={palette.skin.darkest} strokeWidth="1.4" strokeLinecap="round" />
                <path d="M142 88 V93" stroke={palette.skin.darkest} strokeWidth="1.4" strokeLinecap="round" />
                <path d="M106 94 Q122 89 136 86" stroke="#7a1313" strokeWidth="3.4" fill="none" strokeLinecap="round" />
                <path d="M174 94 Q158 89 144 86" stroke="#7a1313" strokeWidth="3.4" fill="none" strokeLinecap="round" />
                <path d="M138 88 V93" stroke="#883015" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M142 88 V93" stroke="#883015" strokeWidth="1.4" strokeLinecap="round" />
              </g>
            ) : isHappyOrProud ? (
              <g className="eyebrows-happy">
                <path d="M108 86 Q122 80 136 86" stroke={palette.hair.shadow} strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M144 86 Q158 80 172 86" stroke={palette.hair.shadow} strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M108 86 Q122 80 136 86" stroke="#7a1313" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M144 86 Q158 80 172 86" stroke="#7a1313" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              </g>
            ) : isAnalyzing ? (
              <g className="eyebrows-analyzing">
                <path d="M106 85 Q122 81 136 81" stroke={palette.hair.shadow} strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M144 92 Q158 90 174 90" stroke={palette.hair.shadow} strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M106 85 Q122 81 136 81" stroke="#7a1313" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M144 92 Q158 90 174 90" stroke="#7a1313" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              </g>
            ) : (
              <g className="eyebrows-default">
                <path d="M108 89 Q122 87 135 88" stroke={palette.hair.shadow} strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M145 88 Q158 87 172 89" stroke={palette.hair.shadow} strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M108 89 Q122 87 135 88" stroke="#7a1313" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M145 88 Q158 87 172 89" stroke="#7a1313" strokeWidth="3" fill="none" strokeLinecap="round" />
              </g>
            )}
          </g>

          {/* Bigode Aristocrático com Curvas Fluídas */}
          {/* Bigode Aristocrático */}
          <g className="pixel-mustache">
            <path
              d="M131 127 C135 125 139 126 140 128 C141 126 145 125 149 127 C146 130 142 129 140 130 C138 129 134 130 131 127 Z"
              fill={palette.hair.shadow}
              fill="#7a1313"
            />
            <path
              d="M133 127.5 C136 126 139 127 140 128.5 C141 127 144 126 147 127.5"
              stroke={palette.hair.bright}
              stroke="#ea580c"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* ========================================================
              ARTICULAÇÃO LABIAL & VISEMAS ANATÔMICOS REALISTAS
              Proporções naturais de fala, sem boca gigante
              ARTICULAÇÃO LABIAL & VISEMAS ANATÔMICOS PROPORCIONAIS
              Escala natural, sem boca gigante
              ARTICULAÇÃO LABIAL & VISEMAS ANATÔMICOS EM TEMPO REAL
              ======================================================== */}
          <g className="pixel-mouth" data-phoneme={mouth} aria-label={`Boca ${mouthLabel}`}>
            {/* VISEMA 0: ABERTA NATURAL (A, O, Vogal cheia) */}
            {/* VISEMA 0: ABERTA NATURAL (A, O, Vogal cheia moderada) */}
            {mouth === 0 && (
              <g className="mouth-viseme mouth-viseme-open">
                <path
                  d="M132 132 C135 130 145 130 148 132 C149 138 131 138 132 132 Z"
                  d="M133 133 C135 131 145 131 147 133 C148 137 132 137 133 133 Z"
                  fill={palette.mouth.cavity}
                  stroke={palette.mouth.lipDark}
                  strokeWidth="1.4"
                  fill="#220309"
                  stroke="#68131e"
                  strokeWidth="1.2"
                />
                {/* Dentes alinhados naturais */}
                <rect x="134" y="131.5" width="12" height="2" rx="0.5" fill={palette.mouth.teeth} />
                <line x1="138" y1="131.5" x2="138" y2="133.5" stroke={palette.mouth.teethShadow} strokeWidth="0.7" />
                <line x1="142" y1="131.5" x2="142" y2="133.5" stroke={palette.mouth.teethShadow} strokeWidth="0.7" />
                {/* Língua sutil */}
                <ellipse cx="140" cy="136.5" rx="5" ry="1.8" fill={palette.mouth.tongueBase} />
                {/* Lábio inferior curvo */}
                <path d="M134 138 Q140 140 146 138" stroke={palette.mouth.lipHighlight} strokeWidth="1.4" fill="none" strokeLinecap="round" />
                <rect x="135" y="132" width="10" height="1.6" rx="0.5" fill={palette.mouth.teeth} />
                <ellipse cx="140" cy="136" rx="4" ry="1.4" fill={palette.mouth.tongueBase} />
                <path d="M135 137 Q140 138.5 145 137" stroke={palette.mouth.lipHighlight} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <rect x="135" y="132" width="10" height="1.6" rx="0.5" fill="#ffffff" />
                <ellipse cx="140" cy="136" rx="4" ry="1.4" fill="#e11d48" />
                <path d="M135 137 Q140 138.5 145 137" stroke="#f43f5e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* VISEMA 1: ESTICADA (E, I, Sorriso Didático) */}
            {mouth === 1 && (
              <g className="mouth-viseme mouth-viseme-wide">
                <path
                  d="M130 133 C135 131.5 145 131.5 150 133 C150 136 130 136 130 133 Z"
                  d="M131 133.5 C135 132 145 132 149 133.5 C149 136 131 136 131 133.5 Z"
                  fill={palette.mouth.cavity}
                  stroke={palette.mouth.lipDark}
                  strokeWidth="1.2"
                  fill="#220309"
                  stroke="#68131e"
                  strokeWidth="1.1"
                />
                <rect x="132" y="132.5" width="16" height="2.8" rx="0.5" fill={palette.mouth.teeth} />
                <line x1="136" y1="132.5" x2="136" y2="135.3" stroke={palette.mouth.teethShadow} strokeWidth="0.7" />
                <line x1="140" y1="132.5" x2="140" y2="135.3" stroke={palette.mouth.teethShadow} strokeWidth="0.7" />
                <line x1="144" y1="132.5" x2="144" y2="135.3" stroke={palette.mouth.teethShadow} strokeWidth="0.7" />
                <circle cx="129" cy="133" r="1.1" fill={palette.mouth.lipDark} />
                <circle cx="151" cy="133" r="1.1" fill={palette.mouth.lipDark} />
                <path d="M132 136 Q140 137.5 148 136" stroke={palette.mouth.lipHighlight} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <rect x="133" y="133" width="14" height="2.2" rx="0.5" fill={palette.mouth.teeth} />
                <line x1="137" y1="133" x2="137" y2="135.2" stroke={palette.mouth.teethShadow} strokeWidth="0.6" />
                <line x1="140" y1="133" x2="140" y2="135.2" stroke={palette.mouth.teethShadow} strokeWidth="0.6" />
                <line x1="143" y1="133" x2="143" y2="135.2" stroke={palette.mouth.teethShadow} strokeWidth="0.6" />
                <path d="M133 136 Q140 137.2 147 136" stroke={palette.mouth.lipHighlight} strokeWidth="1.1" fill="none" strokeLinecap="round" />
                <rect x="133" y="133" width="14" height="2.2" rx="0.5" fill="#ffffff" />
                <line x1="137" y1="133" x2="137" y2="135.2" stroke="#cbd5e1" strokeWidth="0.6" />
                <line x1="140" y1="133" x2="140" y2="135.2" stroke="#cbd5e1" strokeWidth="0.6" />
                <line x1="143" y1="133" x2="143" y2="135.2" stroke="#cbd5e1" strokeWidth="0.6" />
                <path d="M133 136 Q140 137.2 147 136" stroke="#f43f5e" strokeWidth="1.1" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* VISEMA 2: REDONDA (O, U, W, Bico Projetado) */}
            {/* VISEMA 2: REDONDA (O, U, W, Bico Projetado Sutil) */}
            {mouth === 2 && (
              <g className="mouth-viseme mouth-viseme-round">
                <ellipse cx="140" cy="134.5" rx="6" ry="4.2" fill={palette.mouth.cavity} stroke={palette.mouth.lipDark} strokeWidth="1.4" />
                <ellipse cx="140" cy="134" rx="3.8" ry="2.5" fill="#140206" />
                <ellipse cx="140" cy="136" rx="3" ry="1.2" fill={palette.mouth.tongueBase} />
                <path d="M137 131.5 Q140 130.5 143 131.5" stroke={palette.mouth.lipHighlight} strokeWidth="1.1" fill="none" strokeLinecap="round" />
                <path d="M137 138 Q140 139 143 138" stroke={palette.mouth.lipHighlight} strokeWidth="1.1" fill="none" strokeLinecap="round" />
                <ellipse cx="140" cy="134.5" rx="5" ry="3.6" fill={palette.mouth.cavity} stroke={palette.mouth.lipDark} strokeWidth="1.2" />
                <ellipse cx="140" cy="134.5" rx="5" ry="3.6" fill="#220309" stroke="#68131e" strokeWidth="1.2" />
                <ellipse cx="140" cy="134" rx="3.2" ry="2" fill="#140206" />
                <ellipse cx="140" cy="135.8" rx="2.4" ry="1" fill={palette.mouth.tongueBase} />
                <path d="M138 132 Q140 131 142 132" stroke={palette.mouth.lipHighlight} strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d="M138 137 Q140 138 142 137" stroke={palette.mouth.lipHighlight} strokeWidth="1" fill="none" strokeLinecap="round" />
                <ellipse cx="140" cy="135.8" rx="2.4" ry="1" fill="#e11d48" />
                <path d="M138 132 Q140 131 142 132" stroke="#f43f5e" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d="M138 137 Q140 138 142 137" stroke="#f43f5e" strokeWidth="1" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* VISEMA 3: FECHANDO / CONSOANTES (M, P, B, T) */}
            {mouth === 3 && (
              <g className="mouth-viseme mouth-viseme-close">
                <rect x="133" y="133" width="14" height="2.6" rx="1.2" fill={palette.mouth.lipDark} />
                <rect x="135" y="133.5" width="10" height="1.2" rx="0.5" fill={palette.mouth.teeth} />
                <path d="M134 135 Q140 136.2 146 135" stroke={palette.mouth.lipHighlight} strokeWidth="1.1" fill="none" strokeLinecap="round" />
                <rect x="134" y="133.5" width="12" height="2.2" rx="1" fill={palette.mouth.lipDark} />
                <rect x="136" y="134" width="8" height="1" rx="0.5" fill={palette.mouth.teeth} />
                <path d="M135 135.2 Q140 136.2 145 135.2" stroke={palette.mouth.lipHighlight} strokeWidth="1" fill="none" strokeLinecap="round" />
                <rect x="134" y="133.5" width="12" height="2.2" rx="1" fill="#68131e" />
                <rect x="136" y="134" width="8" height="1" rx="0.5" fill="#ffffff" />
                <path d="M135 135.2 Q140 136.2 145 135.2" stroke="#f43f5e" strokeWidth="1" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* VISEMA 4: REPOUSO NATURAL / SORRISO DE PROFESSOR (phoneme-rest-live) */}
            {mouth === 4 && (
              <g className="mouth-viseme mouth-viseme-rest phoneme-rest-live">
                <path
                  d="M132 134 Q140 136.5 148 134 L151 132.5"
                  fill="none"
                  stroke={palette.mouth.lipDark}
                  stroke="#68131e"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="151" cy="132.5" r="1.1" fill={palette.mouth.lipDark} />
                <circle cx="151" cy="132.5" r="1" fill={palette.mouth.lipDark} />
                <path d="M135 137 Q140 138.8 145 137" stroke={palette.skin.shadow} strokeWidth="1.4" fill="none" strokeLinecap="round" />
                <circle cx="151" cy="132.5" r="1" fill="#68131e" />
                <path d="M135 137 Q140 138.8 145 137" stroke="#b44d28" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </g>
            )}
          </g>

          {/* Cavanhaque Estilizado no Queixo */}
          <g className="pixel-goatee">
            <path
              d="M136 142 C137 148 143 148 144 142 C142 144 138 144 136 142 Z"
              fill={palette.hair.shadow}
              fill="#7a1313"
            />
            <ellipse cx="140" cy="151" rx="2.4" ry="1.1" fill={palette.skin.darkest} />
            <ellipse cx="140" cy="151" rx="2.4" ry="1.1" fill="#883015" />
          </g>
        </g>

        {/* 6. EFEITOS CÔMICOS EXPRESSIVOS SUTIS */}
        {/* 6. EFEITOS CÔMICOS EXPRESSIVOS SUTIS (SEM BRILHOS PISCANDO NOS ÓCULOS) */}
        {/* 6. EFEITOS CÔMICOS EXPRESSIVOS */}
        {isAngryOrCrazy && (
          <g className="mr-crazy-anger-fx" aria-hidden="true">
            <g className="mr-crazy-vein" transform="translate(186 64)">
              <path
                d="M-4 -2 C-2 -2 -1 0 -1 3 S-3 7 -6 7 M4 -2 C2 -2 1 0 1 3 S3 7 6 7 M-2 -4 C-2 -2 0 -1 3 -1 S7 1 7 4 M-2 4 C-2 2 0 1 3 1 S7 -1 7 -4"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
            <path className="mr-crazy-steam mr-crazy-steam-left" d="M90 106 C82 100 78 92 82 86 C86 80 92 82 90 88" fill="none" stroke="#fca5a5" strokeWidth="1.8" strokeLinecap="round" />
            <path className="mr-crazy-steam mr-crazy-steam-right" d="M190 106 C198 100 202 92 198 86 C194 80 188 82 190 88" fill="none" stroke="#fca5a5" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}

        {isHappyOrProud && (
          <g className="mr-crazy-happy-glint" aria-hidden="true">
            <path d="M168 92 L171 97 L176 100 L171 103 L168 108 L165 103 L160 100 L165 97 Z" fill="#fef08a" filter={`url(#${ids.glow})`} />
            <path d="M168 92 L171 97 L176 100 L171 103 L168 108 L165 103 L160 100 L165 97 Z" fill="#fef08a" filter={`url(#${ids.glowFilter})`} />
          </g>
        )}

        {/* 7. GESTOS INTERATIVOS DINÂMICOS COM TRAÇOS ANATÔMICOS REFINADOS */}
        {/* 7. GESTOS INTERATIVOS DINÂMICOS COM MÃOS E DEDOS ANATÔMICOS */}
        {/* 7. GESTOS INTERATIVOS DINÂMICOS COM MÃOS ANATÔMICAS */}
        {gesture === "finger" && (
          <g className="pixel-gesture-layer pixel-gesture-finger" aria-hidden="true">
            <path d="M205 200 C204 212 204 226 206 236 H214 C216 226 216 212 215 200 Z" fill={palette.skin.shadow} />
            <path d="M207 196 C206 208 206 224 208 234 H212 C214 224 214 208 213 196 Z" fill={palette.skin.base} />
            <circle cx="210" cy="192" r="7" fill="#f59e0b" filter={`url(#${ids.glow})`} opacity=".5" />
            {/* Braço levantado até a altura do peito */}
            <path d="M200 220 C204 206 208 196 212 186 C216 196 218 206 220 220 Z" fill={palette.coat.base} />
            <path d="M200 220 C204 206 208 196 212 186 C216 196 218 206 220 220 Z" fill="#0d695d" />
            <rect x="207" y="196" width="10" height="3" rx="1.5" fill={`url(#${ids.goldGrad})`} />
            {/* Mão fechada com indicador apontando realisticamente */}
            <path
              d="M207 196 C206 186 207 166 211 162 C214 162 215 174 214 196 Z"
              fill={palette.skin.base}
              fill="#f8c29b"
            />
            {/* Falange do indicador */}
            <path d="M208 174 Q211 176 214 174" stroke={palette.skin.shadow} strokeWidth="0.8" fill="none" />
            {/* Dedos médios, anelar e mínimo dobrados sobre a palma */}
            <ellipse cx="215" cy="190" rx="3.5" ry="5.5" fill={palette.skin.shadow} />
            <ellipse cx="215" cy="190" rx="3" ry="5" fill={palette.skin.base} />
            {/* Polegar dobrado sobre os dedos */}
            <path d="M210 188 C212 187 215 188 215 191 C214 193 211 193 210 191 Z" fill={palette.skin.highlight} />
            {/* Partícula sutil de ideia */}
            <circle cx="212" cy="158" r="4" fill="#f59e0b" filter={`url(#${ids.glow})`} opacity=".5" />
            <path d="M208 174 Q211 176 214 174" stroke="#b44d28" strokeWidth="0.8" fill="none" />
            <ellipse cx="215" cy="190" rx="3.5" ry="5.5" fill="#b44d28" />
            <ellipse cx="215" cy="190" rx="3" ry="5" fill="#f8c29b" />
            <path d="M210 188 C212 187 215 188 215 191 C214 193 211 193 210 191 Z" fill="#fde0cb" />
            <circle cx="212" cy="158" r="4" fill="#f59e0b" filter={`url(#${ids.glowFilter})`} opacity=".5" />
          </g>
        )}

        {gesture === "thumbsup" && (
          <g className="pixel-gesture-layer pixel-gesture-thumbsup" aria-hidden="true">
            <path d="M205 220 C205 224 216 224 217 220 V202 C217 199 210 199 210 202 V208 H205 Z" fill={palette.skin.shadow} />
            <path d="M207 222 C207 225 214 225 215 222 V204 C215 202 211 202 211 204 V210 H207 Z" fill={palette.skin.base} />
            <circle cx="212" cy="204" r="9" fill="#fbbf24" filter={`url(#${ids.glow})`} opacity=".45" />
            {/* Punho anatômico fechado com polegar erguido */}
            <path d="M204 218 C202 208 206 202 216 202 C222 202 224 210 222 218 C220 224 206 224 204 218 Z" fill={palette.skin.base} />
            {/* Dedos dobrados com juntas visíveis */}
            <path d="M206 208 Q214 208 218 208" stroke={palette.skin.shadow} strokeWidth="1.2" fill="none" />
            <path d="M206 213 Q214 213 218 213" stroke={palette.skin.shadow} strokeWidth="1.2" fill="none" />
            <path d="M206 218 Q214 218 218 218" stroke={palette.skin.shadow} strokeWidth="1.2" fill="none" />
            {/* Polegar erguido anatômico com falange e unha */}
            <path d="M204 218 C202 208 206 202 216 202 C222 202 224 210 222 218 C220 224 206 224 204 218 Z" fill="#f8c29b" />
            <path d="M206 208 Q214 208 218 208" stroke="#b44d28" strokeWidth="1.2" fill="none" />
            <path d="M206 213 Q214 213 218 213" stroke="#b44d28" strokeWidth="1.2" fill="none" />
            <path d="M206 218 Q214 218 218 218" stroke="#b44d28" strokeWidth="1.2" fill="none" />
            <path
              d="M207 205 C206 198 207 190 211 188 C215 188 215 198 214 205 Z"
              fill={palette.skin.base}
              fill="#f8c29b"
            />
            <path d="M208 196 Q211 198 214 196" stroke={palette.skin.shadow} strokeWidth="0.8" fill="none" />
            <ellipse cx="211" cy="191" rx="1.5" ry="1" fill={palette.skin.specular} opacity=".6" />
            <circle cx="211" cy="186" r="6" fill="#fbbf24" filter={`url(#${ids.glow})`} opacity=".4" />
            <path d="M208 196 Q211 198 214 196" stroke="#b44d28" strokeWidth="0.8" fill="none" />
            <ellipse cx="211" cy="191" rx="1.5" ry="1" fill="#fff4ed" opacity=".6" />
            <circle cx="211" cy="186" r="6" fill="#fbbf24" filter={`url(#${ids.glowFilter})`} opacity=".4" />
          </g>
        )}

        {gesture === "heart" && (
          <g className="pixel-gesture-layer pixel-gesture-heart" aria-hidden="true">
            {/* Duas mãos anatômicas unidas formando o coração */}
            <path
              d="M126 218 C116 206 102 216 112 228 L140 252 L168 228 C178 216 164 206 154 218 L140 232 Z"
              fill={`url(#${ids.rubyGrad})`}
              stroke="#881337"
              strokeWidth="2.2"
              filter={`url(#${ids.glow})`}
              filter={`url(#${ids.glowFilter})`}
            />
            {/* Dedos anatômicos contornando o coração */}
            <path d="M120 220 Q124 215 126 214 M160 220 Q156 215 154 214" stroke="#fecdd3" strokeWidth="1.8" strokeLinecap="round" />
            <ellipse cx="128" cy="225" rx="5" ry="8" fill={palette.skin.base} opacity=".9" />
            <ellipse cx="152" cy="225" rx="5" ry="8" fill={palette.skin.base} opacity=".9" />
            <ellipse cx="128" cy="225" rx="5" ry="8" fill="#f8c29b" opacity=".9" />
            <ellipse cx="152" cy="225" rx="5" ry="8" fill="#f8c29b" opacity=".9" />
          </g>
        )}

        {gesture === "watergun" && (
          <g className="pixel-gesture-layer pixel-gesture-watergun" aria-hidden="true">
            <path d="M204 220 C204 216 226 216 226 220 V228 C226 232 204 232 204 228 Z" fill={palette.skin.shadow} />
            <path d="M206 222 C206 218 224 218 224 222 V226 C224 230 206 230 206 226 Z" fill={palette.skin.base} />
            <rect x="226" y="222" width="18" height="6" rx="2.5" fill={`url(#${ids.goldGrad})`} stroke="#78350f" strokeWidth="1" />
            <path d="M244 225 H274" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" filter={`url(#${ids.glow})`} />
            {/* Mão em pistola com dedos indicador e médio estendidos */}
            <path d="M202 222 C204 216 212 216 216 218 L238 218 C242 218 242 225 238 225 L218 225 C216 232 204 232 202 222 Z" fill={palette.skin.base} />
            {/* Polegar levantado como cão da pistola */}
            <path d="M208 218 C207 212 209 206 212 206 C215 206 215 212 214 218 Z" fill={palette.skin.base} />
            {/* Anelar e mínimo dobrados */}
            <ellipse cx="209" cy="226" rx="4" ry="4" fill={palette.skin.shadow} />
            {/* Jato sutil de água de efeito lúdico */}
            <path d="M240 221 H272" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" filter={`url(#${ids.glow})`} />
            <path d="M202 222 C204 216 212 216 216 218 L238 218 C242 218 242 225 238 225 L218 225 C216 232 204 232 202 222 Z" fill="#f8c29b" />
            <path d="M208 218 C207 212 209 206 212 206 C215 206 215 212 214 218 Z" fill="#f8c29b" />
            <ellipse cx="209" cy="226" rx="4" ry="4" fill="#b44d28" />
            <path d="M240 221 H272" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" filter={`url(#${ids.glowFilter})`} />
          </g>
        )}
      </g>
    </svg>
  );
}
