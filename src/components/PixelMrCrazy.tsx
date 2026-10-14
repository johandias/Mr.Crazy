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
 * Mr. Crazy: Avatar Pixel-Art de Alta Densidade (Micro-Pixel Deluxe).
 * Construído 100% nativamente em código vetorial SVG puro e CSS,
 * com detalhes anatômicos ricos, sombreamento multi-tom,
 * expressões faciais vivas e sincronia labial anatômica em tempo real.
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

  // Parallax do rosto e olhar
  const faceX = Math.round(lookX * 3.5);
  const faceY = Math.round(lookY * 2.5);
  const pupilX = Math.round(lookX * 2.5);
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
    hairBack: `${instanceId}-hair-back`,
    hairFront: `${instanceId}-hair-front`,
    cape: `${instanceId}-cape`,
    coat: `${instanceId}-coat`,
    gold: `${instanceId}-gold`
  };

  return (
    <svg
      className={`pixel-mr-crazy-art pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""} ${isAwake ? "pixel-awake" : ""}`}
      viewBox={avatarData.viewBox}
      role="img"
      aria-label={`Mr. Crazy micro-pixel avatar ${activity === "speaking" ? `falando com boca ${mouthLabel}` : "pronto"}`}
      shapeRendering="crispEdges"
      data-phoneme={mouth}
      style={{
        "--pixel-energy": energy,
        "--look-x": lookX,
        "--look-y": lookY
      } as CSSProperties}
    >
      <defs>
        {/* Aura de energia do tutor */}
        <radialGradient id={ids.aura} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#ef4444" : "#0d9488"} stopOpacity={isAngryOrCrazy ? ".35" : ".22"} />
          <stop offset="65%" stopColor={isAngryOrCrazy ? "#dc2626" : "#0f766e"} stopOpacity=".08" />
          <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão projetada */}
        <radialGradient id={ids.shadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity=".7" />
          <stop offset="65%" stopColor="#000000" stopOpacity=".25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Filtro de brilho mágico */}
        <filter id={ids.glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Aura mágica / energética ao fundo */}
      <ellipse className="pixel-aura" cx="140" cy="165" rx="120" ry="145" fill={`url(#${ids.aura})`} />

      {/* Sombra de chão ditherada em micro-pixels */}
      <g className="pixel-ground-shadow" aria-hidden="true">
        <ellipse cx="140" cy="326" rx="90" ry="12" fill={`url(#${ids.shadow})`} />
        {/* Bordas ditheradas de pixel */}
        <rect x="52" y="325" width="4" height="2" fill="#000000" opacity=".3" />
        <rect x="224" y="325" width="4" height="2" fill="#000000" opacity=".3" />
        <rect x="74" y="328" width="6" height="2" fill="#000000" opacity=".4" />
        <rect x="200" y="328" width="6" height="2" fill="#000000" opacity=".4" />
      </g>

      {/* Efeito de Impacto / Explosão ao mudar de estado */}
      {burstKey > 0 && (
        <g key={burstKey} className="pixel-explosion-burst" aria-hidden="true">
          <circle className="pixel-explosion-ring" cx="140" cy="170" r="54" fill="none" stroke="#fbbf24" strokeWidth="4" opacity=".85" />
          <path
            className="pixel-explosion-star"
            d="M140 85 l12 55 40-30 -30 42 55 6 -55 9 34 40 -44-30 2 56 -14-54 -40 32 30-44 -54-6 54-10 -32-40 42 28 z"
            fill="#fbbf24"
            opacity=".9"
          />
          <rect x="64" y="130" width="6" height="6" fill="#38bdf8" className="pixel-explosion-spark spark-one" />
          <rect x="210" y="120" width="5" height="5" fill="#f43f5e" className="pixel-explosion-spark spark-two" />
          <rect x="70" y="230" width="5" height="5" fill="#fbbf24" className="pixel-explosion-spark spark-three" />
          <rect x="205" y="235" width="6" height="6" fill="#ea580c" className="pixel-explosion-spark spark-four" />
        </g>
      )}

      {/* Partículas / Faíscas Mágicas flutuando */}
      <g className="pixel-sparkles" aria-hidden="true">
        <rect x="28" y="112" width="3" height="10" fill="#fde047" />
        <rect x="24" y="115" width="11" height="3" fill="#fde047" />
        <rect x="248" y="76" width="3" height="9" fill="#38bdf8" />
        <rect x="245" y="79" width="9" height="3" fill="#38bdf8" />
        <rect x="42" y="240" width="3" height="3" fill="#f43f5e" />
        <rect x="236" y="270" width="3" height="3" fill="#fbbf24" />
      </g>

      {/* Anel de escuta ativa (pulsante quando acordado) */}
      {isAwake && (
        <g className="pixel-input-ring" aria-hidden="true">
          <circle cx="140" cy="170" r="126" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" opacity=".6" />
          <circle cx="140" cy="170" r="114" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 6" opacity=".4" />
        </g>
      )}

      {/* ========================================================
          ESQUELETO DO AVATAR MICRO-PIXEL (RIG PRINCIPAL)
          ======================================================== */}
      <g className="pixel-rig">
        {/* 1. CAPA HEROICA CARMESIM TRASEIRA (Fluida, multicamadas) */}
        <g className="pixel-cape pixel-cape-back">
          {/* Sombra mais profunda da capa */}
          <path
            d="M74 154 H206 L244 260 L254 316 H26 L36 260 Z"
            fill={palette.cape.deepest}
          />
          {/* Corpo principal da capa */}
          <path
            d="M80 156 H200 L238 258 L246 312 H34 L42 258 Z"
            fill={palette.cape.shadow}
          />
          {/* Dobras de volume carmesim (asa esquerda) */}
          <path
            d="M82 158 H134 V284 L102 312 H38 L46 256 Z"
            fill={palette.cape.base}
          />
          {/* Dobras de volume carmesim (asa direita) */}
          <path
            d="M146 158 H198 L234 256 L242 312 H178 L146 284 Z"
            fill={palette.cape.base}
          />
          {/* Realces e vincos de tecido iluminados */}
          <path
            d="M86 160 H118 L96 282 L90 310 H74 L78 260 Z"
            fill={palette.cape.bright}
          />
          <path
            d="M162 160 H194 L202 260 L198 310 H182 L176 282 Z"
            fill={palette.cape.bright}
          />
          {/* Bordas e reflexos de seda nos cantos da capa */}
          <path
            d="M38 312 H52 L46 270 Z M228 312 H242 L234 270 Z"
            fill={palette.cape.highlight}
          />
        </g>

        {/* 2. PERNAS E BOTAS DE AVENTUREIRO COM FIVELAS */}
        <g className="pixel-legs">
          {/* Calças de alfaiataria em ardósia escura */}
          <rect x="108" y="258" width="28" height="42" fill={palette.pants.shadow} />
          <rect x="144" y="258" width="28" height="42" fill={palette.pants.shadow} />
          <rect x="112" y="262" width="20" height="34" fill={palette.pants.base} />
          <rect x="148" y="262" width="20" height="34" fill={palette.pants.base} />
          {/* Vincos de luz no joelho */}
          <rect x="114" y="278" width="16" height="3" fill={palette.pants.highlight} />
          <rect x="150" y="278" width="16" height="3" fill={palette.pants.highlight} />

          {/* Bota Esquerda de Couro */}
          <g className="pixel-boot-left">
            <path d="M102 292 H136 V324 H92 L96 312 H102 Z" fill={palette.leather.shadow} />
            <path d="M104 294 H134 V322 H96 L98 314 H104 Z" fill={palette.leather.base} />
            <rect x="106" y="294" width="24" height="4" fill={palette.leather.highlight} />
            <rect x="94" y="322" width="40" height="4" fill={palette.leather.darkest} />
            {/* Fivela Dourada da Bota Esquerda */}
            <rect x="112" y="302" width="16" height="10" fill={palette.gold.bright} />
            <rect x="115" y="304" width="10" height="6" fill={palette.leather.darkest} />
            <rect x="118" y="306" width="4" height="2" fill={palette.gold.gleam} />
          </g>

          {/* Bota Direita de Couro */}
          <g className="pixel-boot-right">
            <path d="M144 292 H178 V312 H184 L188 324 H144 Z" fill={palette.leather.shadow} />
            <path d="M146 294 H176 V314 H182 L184 322 H146 Z" fill={palette.leather.base} />
            <rect x="148" y="294" width="24" height="4" fill={palette.leather.highlight} />
            <rect x="144" y="322" width="42" height="4" fill={palette.leather.darkest} />
            {/* Fivela Dourada da Bota Direita */}
            <rect x="152" y="302" width="16" height="10" fill={palette.gold.bright} />
            <rect x="155" y="304" width="10" height="6" fill={palette.leather.darkest} />
            <rect x="158" y="306" width="4" height="2" fill={palette.gold.gleam} />
          </g>
        </g>

        {/* 3. TRONCO, CASACO DE PROFESSOR TEAL, CAMISA E CINTO */}
        <g className="pixel-body">
          {/* Base e Sombra do Casaco Teal */}
          <path
            d="M88 156 H192 L198 258 H82 Z"
            fill={palette.coat.deepest}
          />
          <path
            d="M92 158 H188 L194 256 H86 Z"
            fill={palette.coat.shadow}
          />
          {/* Painel Central do Casaco */}
          <path
            d="M98 160 H182 L186 254 H94 Z"
            fill={palette.coat.base}
          />
          {/* Realces de tecido esmeralda brilhante */}
          <path
            d="M102 162 H124 L120 252 H98 Z M156 162 H178 L182 252 H160 Z"
            fill={palette.coat.bright}
          />

          {/* Lapelas Dobradas Elegantes com Bordado Dourado */}
          <path
            d="M104 158 L126 216 H112 L96 172 Z"
            fill={palette.coat.highlight}
          />
          <path
            d="M176 158 L154 216 H168 L184 172 Z"
            fill={palette.coat.highlight}
          />
          {/* Borda dourada bordada nas lapelas */}
          <path
            d="M104 158 L126 216 H124 L102 160 Z M176 158 L154 216 H156 L178 160 Z"
            fill={palette.gold.bright}
          />

          {/* Camisa Branca e Gravata Vitoriana/Cravat Roxo */}
          <path d="M126 158 H154 L146 190 H134 Z" fill="#f8fafc" />
          <path d="M132 160 H148 L144 192 H136 Z" fill="#6d28d9" />
          <rect x="138" y="166" width="4" height="6" fill="#fef08a" />

          {/* Botões Ornamentais Dourados Centrais */}
          <g className="pixel-coat-buttons">
            <rect x="137" y="198" width="6" height="6" fill={palette.gold.bright} />
            <rect x="138" y="199" width="2" height="2" fill={palette.gold.gleam} />
            <rect x="137" y="218" width="6" height="6" fill={palette.gold.bright} />
            <rect x="138" y="219" width="2" height="2" fill={palette.gold.gleam} />
            <rect x="137" y="236" width="6" height="6" fill={palette.gold.bright} />
            <rect x="138" y="237" width="2" height="2" fill={palette.gold.gleam} />
          </g>

          {/* Cinto de Couro e Fivela Dourada Nobre */}
          <g className="pixel-belt">
            <rect x="86" y="250" width="108" height="12" fill={palette.leather.darkest} />
            <rect x="88" y="252" width="104" height="8" fill={palette.leather.shadow} />
            {/* Costura dourada do cinto */}
            <rect x="88" y="251" width="104" height="1" fill={palette.gold.shadow} />
            <rect x="88" y="260" width="104" height="1" fill={palette.gold.shadow} />
            {/* Fivela Central Dourada */}
            <rect x="126" y="246" width="28" height="20" fill={palette.gold.bright} />
            <rect x="130" y="250" width="20" height="12" fill={palette.leather.darkest} />
            <rect x="138" y="249" width="4" height="14" fill={palette.gold.gleam} />
          </g>
        </g>

        {/* 4. BRAÇO ESQUERDO E MÃO ARTICULADA */}
        <g className="pixel-arms pixel-arm-left">
          {/* Ombro e Manga Esquerda */}
          <path d="M88 160 H66 L56 226 H78 L86 182 Z" fill={palette.coat.deepest} />
          <path d="M86 162 H68 L58 224 H76 L84 180 Z" fill={palette.coat.base} />
          <path d="M78 164 H68 L60 220 H70 Z" fill={palette.coat.bright} />
          {/* Punho Dourado */}
          <rect x="58" y="222" width="20" height="4" fill={palette.gold.bright} />
          {/* Mão Esquerda (Articulada com micro-pixels nos dedos) */}
          <path d="M60 226 H76 V244 H72 V248 H64 V244 H60 Z" fill={palette.skin.shadow} />
          <path d="M62 228 H74 V242 H70 V246 H66 V242 H62 Z" fill={palette.skin.base} />
          {/* Realce dos nós dos dedos */}
          <rect x="64" y="234" width="6" height="2" fill={palette.skin.highlight} />
        </g>

        {/* 5. BRAÇO DIREITO E MÃO ARTICULADA */}
        <g className="pixel-arms pixel-arm-right">
          {/* Ombro e Manga Direita */}
          <path d="M192 160 H214 L224 226 H202 L194 182 Z" fill={palette.coat.deepest} />
          <path d="M194 162 H212 L222 224 H204 L196 180 Z" fill={palette.coat.base} />
          <path d="M202 164 H212 L220 220 H210 Z" fill={palette.coat.bright} />
          {/* Punho Dourado */}
          <rect x="202" y="222" width="20" height="4" fill={palette.gold.bright} />
          {/* Mão Direita (Articulada com micro-pixels nos dedos) */}
          <path d="M204 226 H220 V244 H216 V248 H208 V244 H204 Z" fill={palette.skin.shadow} />
          <path d="M206 228 H218 V242 H214 V246 H210 V242 H206 Z" fill={palette.skin.base} />
          {/* Realce dos nós dos dedos */}
          <rect x="210" y="234" width="6" height="2" fill={palette.skin.highlight} />
        </g>

        {/* 6. CABEÇA DO MR. CRAZY (Com Parallax do Olhar e Expressão Viva) */}
        <g className="pixel-head" transform={`translate(${faceX} ${faceY})`}>
          {/* Cabelo Flamejante de Trás (Silhueta Espetada Extensa) */}
          <g className="pixel-hair-back">
            <path
              d="M72 118 L60 84 L76 74 L64 48 L88 44 L80 18 L108 28 L116 10 L140 24 L164 10 L172 28 L200 18 L192 44 L216 48 L204 74 L220 84 L208 118 L192 108 L140 102 L88 108 Z"
              fill={palette.hair.darkest}
            />
            <path
              d="M74 116 L64 86 L78 76 L68 52 L90 48 L84 24 L110 32 L118 16 L140 28 L162 16 L170 32 L196 24 L190 48 L212 52 L202 76 L216 86 L206 116 L190 106 L140 100 L90 106 Z"
              fill={palette.hair.shadow}
            />
          </g>

          {/* Pescoço com pomo de adão e sombra anatômica */}
          <rect x="126" y="146" width="28" height="18" fill={palette.skin.darkest} />
          <rect x="128" y="148" width="24" height="14" fill={palette.skin.shadow} />
          <rect x="136" y="152" width="8" height="8" fill={palette.skin.base} />

          {/* Formato Esculpido da Cabeça e Mandíbula */}
          <path
            d="M102 78 H178 V126 L170 148 L148 158 H132 L110 148 L102 126 Z"
            fill={palette.skin.shadow}
          />
          <path
            d="M104 80 H176 V124 L168 146 L146 156 H134 L112 146 L104 124 Z"
            fill={palette.skin.base}
          />
          {/* Realce no queixo e bochechas */}
          <rect x="134" y="148" width="12" height="4" fill={palette.skin.highlight} />
          <rect x="108" y="104" width="14" height="14" fill={palette.skin.highlight} />
          <rect x="158" y="104" width="14" height="14" fill={palette.skin.highlight} />
          {/* Rubor/Blush nas Bochechas */}
          <rect x="110" y="118" width="14" height="4" fill={palette.skin.blush} opacity=".5" />
          <rect x="156" y="118" width="14" height="4" fill={palette.skin.blush} opacity=".5" />

          {/* Orelhas com Cartilagem e Sombras */}
          {/* Orelha Esquerda */}
          <rect x="94" y="104" width="10" height="22" fill={palette.skin.darkest} />
          <rect x="96" y="106" width="8" height="18" fill={palette.skin.base} />
          <rect x="98" y="110" width="4" height="10" fill={palette.skin.shadow} />
          {/* Orelha Direita */}
          <rect x="176" y="104" width="10" height="22" fill={palette.skin.darkest} />
          <rect x="176" y="106" width="8" height="18" fill={palette.skin.base} />
          <rect x="178" y="110" width="4" height="10" fill={palette.skin.shadow} />

          {/* Cabelo Flamejante Frontal (Franja Espetada Viva) */}
          <g className="pixel-hair-front">
            {/* Camada base de fogo */}
            <path
              d="M96 74 L110 46 L118 64 L134 36 L146 64 L162 44 L170 66 L184 74 L174 86 L156 82 L140 88 L124 82 L106 86 Z"
              fill={palette.hair.base}
            />
            {/* Mechas flamejantes laranjas */}
            <path
              d="M100 70 L112 48 L120 62 L134 40 L144 62 L158 48 L168 64 L180 72 L168 80 L152 76 L140 80 L128 76 L112 80 Z"
              fill={palette.hair.bright}
            />
            {/* Realces dourados no topo do fogo */}
            <path
              d="M108 58 L114 48 L122 60 M130 50 L136 40 L142 52 M152 54 L160 46 L164 56"
              stroke={palette.hair.highlight}
              strokeWidth="2.5"
              fill="none"
            />
            {/* Pontas incandescentes brancas/amarelas */}
            <rect x="113" y="46" width="3" height="3" fill={palette.hair.tip} />
            <rect x="135" y="38" width="3" height="3" fill={palette.hair.tip} />
            <rect x="159" y="44" width="3" height="3" fill={palette.hair.tip} />
          </g>

          {/* Nariz de Professor com Ponto de Luz */}
          <g className="pixel-nose">
            <rect x="138" y="108" width="4" height="16" fill={palette.skin.shadow} />
            <rect x="136" y="120" width="8" height="4" fill={palette.skin.base} />
            <rect x="138" y="120" width="4" height="2" fill={palette.skin.specular} />
            <rect x="134" y="122" width="3" height="2" fill={palette.skin.darkest} />
            <rect x="143" y="122" width="3" height="2" fill={palette.skin.darkest} />
          </g>

          {/* Olhos Expressivos com Rastreamento de Pupilas e Piscar */}
          <g className="pixel-eyes">
            {/* Olho Esquerdo */}
            <g className="pixel-eye pixel-eye-left">
              {isBlinking ? (
                /* Pálpebra Fechada (Micro-Pixels de Pestana) */
                <g className="pixel-eyelid-closed">
                  <rect x="114" y="104" width="18" height="4" fill={palette.skin.darkest} />
                  <rect x="114" y="106" width="18" height="2" fill="#090d16" />
                </g>
              ) : (
                /* Olho Aberto com Pupila Móvel */
                <g className="pixel-eyeball">
                  {/* Esclera (Branco do Olho com Sombra Superior) */}
                  <rect x="114" y="98" width="18" height="12" fill={palette.eyes.sclera} />
                  <rect x="114" y="98" width="18" height="2" fill={palette.eyes.scleraShadow} />
                  {/* Pupila + Íris Móvel seguindo o Cursor */}
                  <g transform={`translate(${pupilX} ${pupilY})`}>
                    <rect x="118" y="100" width="9" height="9" fill={isAngryOrCrazy ? "#dc2626" : palette.eyes.irisBase} />
                    <rect x="120" y="102" width="5" height="5" fill={palette.eyes.pupil} />
                    {/* Brilho da Pupila (Catchlight) */}
                    <rect x="119" y="100" width="2" height="2" fill={palette.eyes.glint} />
                    <rect x="124" y="105" width="1" height="1" fill={palette.eyes.glint} />
                  </g>
                </g>
              )}
            </g>

            {/* Olho Direito */}
            <g className="pixel-eye pixel-eye-right">
              {isBlinking ? (
                /* Pálpebra Fechada (Micro-Pixels de Pestana) */
                <g className="pixel-eyelid-closed">
                  <rect x="148" y="104" width="18" height="4" fill={palette.skin.darkest} />
                  <rect x="148" y="106" width="18" height="2" fill="#090d16" />
                </g>
              ) : (
                /* Olho Aberto com Pupila Móvel */
                <g className="pixel-eyeball">
                  {/* Esclera (Branco do Olho com Sombra Superior) */}
                  <rect x="148" y="98" width="18" height="12" fill={palette.eyes.sclera} />
                  <rect x="148" y="98" width="18" height="2" fill={palette.eyes.scleraShadow} />
                  {/* Pupila + Íris Móvel seguindo o Cursor */}
                  <g transform={`translate(${pupilX} ${pupilY})`}>
                    <rect x="152" y="100" width="9" height="9" fill={isAngryOrCrazy ? "#dc2626" : palette.eyes.irisBase} />
                    <rect x="154" y="102" width="5" height="5" fill={palette.eyes.pupil} />
                    {/* Brilho da Pupila (Catchlight) */}
                    <rect x="153" y="100" width="2" height="2" fill={palette.eyes.glint} />
                    <rect x="158" y="105" width="1" height="1" fill={palette.eyes.glint} />
                  </g>
                </g>
              )}
            </g>
          </g>

          {/* Óculos de Professor Intelectual com Armação Dourada e Reflexos */}
          <g className="pixel-glasses">
            {/* Lente e Armação Esquerda */}
            <rect x="110" y="94" width="26" height="20" fill={palette.glasses.lensFill} stroke={palette.glasses.frameBase} strokeWidth="2.5" />
            <rect x="110" y="94" width="26" height="2" fill={palette.glasses.frameHighlight} />
            {/* Lente e Armação Direita */}
            <rect x="144" y="94" width="26" height="20" fill={palette.glasses.lensFill} stroke={palette.glasses.frameBase} strokeWidth="2.5" />
            <rect x="144" y="94" width="26" height="2" fill={palette.glasses.frameHighlight} />
            {/* Ponte Central dos Óculos */}
            <rect x="134" y="100" width="12" height="3" fill={palette.glasses.frameBase} />
            <rect x="134" y="100" width="12" height="1" fill={palette.glasses.frameHighlight} />
            {/* Reflexos Diagonais de Vidro nos Óculos */}
            <path d="M114 98 L126 110 M118 98 L128 108" stroke="#ffffff" strokeWidth="1.8" strokeOpacity=".7" />
            <path d="M148 98 L160 110 M152 98 L162 108" stroke="#ffffff" strokeWidth="1.8" strokeOpacity=".7" />
          </g>

          {/* Sobrancelhas Reativas Dinâmicas (Emotivas segundo o Estado) */}
          <g className="pixel-eyebrows">
            {isAngryOrCrazy ? (
              /* Sobrancelhas Furiosas / Malucas (Anguladas para dentro) */
              <g className="eyebrows-angry">
                <polygon points="108,94 136,88 136,92 110,98" fill={palette.hair.shadow} />
                <polygon points="172,94 144,88 144,92 170,98" fill={palette.hair.shadow} />
              </g>
            ) : isHappyOrProud ? (
              /* Sobrancelhas Confiantes / Sorridentes (Arqueadas altas) */
              <g className="eyebrows-happy">
                <path d="M110 88 Q122 82 134 88" stroke={palette.hair.shadow} strokeWidth="3.5" fill="none" strokeLinecap="square" />
                <path d="M146 88 Q158 82 170 88" stroke={palette.hair.shadow} strokeWidth="3.5" fill="none" strokeLinecap="square" />
              </g>
            ) : isAnalyzing ? (
              /* Sobrancelha Esquerda Erguida com Curiosidade Didática */
              <g className="eyebrows-analyzing">
                <polygon points="108,86 134,82 134,86 110,90" fill={palette.hair.shadow} />
                <polygon points="146,92 172,90 172,94 148,96" fill={palette.hair.shadow} />
              </g>
            ) : (
              /* Sobrancelhas Padrão de Professor Atento */
              <g className="eyebrows-default">
                <polygon points="110,90 134,88 134,92 112,94" fill={palette.hair.shadow} />
                <polygon points="146,88 170,90 168,94 146,92" fill={palette.hair.shadow} />
              </g>
            )}
          </g>

          {/* ========================================================
              ARTICULAÇÃO LABIAL & VISEMAS (100% SINCRONIA COM A VOZ)
              ======================================================== */}
          <g className="pixel-mouth" data-phoneme={mouth} aria-label={`Boca ${mouthLabel}`}>
            {/* VISEMA 0: ABERTA (A, O, Ênfase, Grito) */}
            {mouth === 0 && (
              <g className="mouth-viseme mouth-viseme-open">
                {/* Cavidade Oral Escura */}
                <path
                  d="M124 130 H156 V142 H152 V148 H128 V142 H124 Z"
                  fill={palette.mouth.cavity}
                  stroke={palette.mouth.lipDark}
                  strokeWidth="2"
                />
                {/* Arcada Dentária Superior com Divisórias */}
                <rect x="128" y="130" width="24" height="4" fill={palette.mouth.teeth} />
                <rect x="132" y="130" width="1" height="4" fill={palette.mouth.teethShadow} />
                <rect x="136" y="130" width="1" height="4" fill={palette.mouth.teethShadow} />
                <rect x="140" y="130" width="1" height="4" fill={palette.mouth.teethShadow} />
                <rect x="144" y="130" width="1" height="4" fill={palette.mouth.teethShadow} />
                <rect x="148" y="130" width="1" height="4" fill={palette.mouth.teethShadow} />
                {/* Língua com Realce de Volume */}
                <rect x="132" y="140" width="16" height="6" rx="2" fill={palette.mouth.tongueBase} />
                <rect x="136" y="141" width="8" height="2" fill={palette.mouth.tongueHighlight} />
                {/* Contorno do Lábio Inferior */}
                <rect x="130" y="148" width="20" height="2" fill={palette.mouth.lipHighlight} />
              </g>
            )}

            {/* VISEMA 1: ESTICADA (E, I, Sorriso Didático) */}
            {mouth === 1 && (
              <g className="mouth-viseme mouth-viseme-wide">
                {/* Cavidade Oral Esticada */}
                <path
                  d="M120 132 H160 V140 H156 V144 H124 V140 H120 Z"
                  fill={palette.mouth.cavity}
                  stroke={palette.mouth.lipDark}
                  strokeWidth="2"
                />
                {/* Dentes Superiores e Inferiores em Exibição */}
                <rect x="124" y="132" width="32" height="4" fill={palette.mouth.teeth} />
                <rect x="126" y="139" width="28" height="3" fill={palette.mouth.teeth} />
                {/* Divisórias dos Dentes */}
                <rect x="130" y="132" width="1" height="10" fill={palette.mouth.teethShadow} />
                <rect x="136" y="132" width="1" height="10" fill={palette.mouth.teethShadow} />
                <rect x="140" y="132" width="1" height="10" fill={palette.mouth.teethShadow} />
                <rect x="144" y="132" width="1" height="10" fill={palette.mouth.teethShadow} />
                <rect x="150" y="132" width="1" height="10" fill={palette.mouth.teethShadow} />
                {/* Covinhas de Sorriso nos Cantos */}
                <rect x="118" y="131" width="2" height="4" fill={palette.mouth.lipDark} />
                <rect x="160" y="131" width="2" height="4" fill={palette.mouth.lipDark} />
              </g>
            )}

            {/* VISEMA 2: REDONDA (O, U, W, Bico/Surpresa) */}
            {mouth === 2 && (
              <g className="mouth-viseme mouth-viseme-round">
                {/* Cavidade Oral Arredondada */}
                <ellipse cx="140" cy="138" rx="10" ry="11" fill={palette.mouth.cavity} stroke={palette.mouth.lipDark} strokeWidth="2.5" />
                <ellipse cx="140" cy="137" rx="6" ry="6" fill="#090d16" />
                {/* Ponta da Língua */}
                <ellipse cx="140" cy="144" rx="5" ry="3" fill={palette.mouth.tongueBase} />
                {/* Realce nos Lábios Arredondados */}
                <rect x="137" y="127" width="6" height="2" fill={palette.mouth.lipHighlight} />
                <rect x="137" y="148" width="6" height="2" fill={palette.mouth.lipHighlight} />
              </g>
            )}

            {/* VISEMA 3: FECHANDO / CONSOANTES (M, P, B, T, Transição) */}
            {mouth === 3 && (
              <g className="mouth-viseme mouth-viseme-close">
                {/* Lábios Quase Fechados com Linha de Pressão */}
                <rect x="126" y="135" width="28" height="5" fill={palette.mouth.lipDark} />
                <rect x="130" y="136" width="20" height="2" fill={palette.mouth.teeth} />
                <rect x="128" y="139" width="24" height="2" fill={palette.mouth.lipHighlight} />
              </g>
            )}

            {/* VISEMA 4: REPOUSO NATURAL / SORRISO DE PROFESSOR (phoneme-rest-live) */}
            {mouth === 4 && (
              <g className="mouth-viseme mouth-viseme-rest phoneme-rest-live">
                {/* Linha de Lábio em Repouso com Leve Assimetria de Confiança */}
                <path
                  d="M128 138 Q138 141 148 138 L152 135"
                  fill="none"
                  stroke={palette.mouth.lipDark}
                  strokeWidth="3.5"
                  strokeLinecap="square"
                />
                {/* Covinha do Canto Direito */}
                <rect x="152" y="133" width="2" height="3" fill={palette.mouth.lipDark} />
                {/* Volume de Sombra do Lábio Inferior */}
                <rect x="134" y="142" width="12" height="2" fill={palette.skin.shadow} />
              </g>
            )}
          </g>

          {/* Covinha do Queixo */}
          <rect x="138" y="152" width="4" height="2" fill={palette.skin.darkest} />
        </g>

        {/* 7. EFEITOS CÔMICOS EXPRESSIVOS (Veia de Raiva, Vapor, Suor, Brilho) */}
        {isAngryOrCrazy && (
          <g className="mr-crazy-anger-fx" aria-hidden="true">
            {/* Veia de Raiva Estilo Anime (💢) na têmpora direita */}
            <g className="mr-crazy-vein" transform="translate(186 64)">
              <path
                d="M-4 -2 C-2 -2 -1 0 -1 3 S-3 7 -6 7 M4 -2 C2 -2 1 0 1 3 S3 7 6 7 M-2 -4 C-2 -2 0 -1 3 -1 S7 1 7 4 M-2 4 C-2 2 0 1 3 1 S7 -1 7 -4"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="square"
              />
            </g>
            {/* Vapor saindo das orelhas (💨) */}
            <path className="mr-crazy-steam mr-crazy-steam-left" d="M90 106 C82 100 78 92 82 86 C86 80 92 82 90 88" fill="none" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="square" />
            <path className="mr-crazy-steam mr-crazy-steam-right" d="M190 106 C198 100 202 92 198 86 C194 80 188 82 190 88" fill="none" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="square" />
            {/* Gota de Suor Cômica (💧) na testa */}
            <path className="mr-crazy-sweat" d="M92 84 C92 80 96 74 96 74 S100 80 100 84 A4 4 0 1 1 92 84 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />
          </g>
        )}

        {isHappyOrProud && (
          <g className="mr-crazy-happy-glint" aria-hidden="true">
            {/* Brilho Estrela nos Óculos (✨) */}
            <path d="M168 92 L171 97 L176 100 L171 103 L168 108 L165 103 L160 100 L165 97 Z" fill="#fef08a" filter={`url(#${ids.glow})`} />
          </g>
        )}

        {/* 8. GESTOS INTERATIVOS DINÂMICOS DO PERSONAGEM */}
        {gesture === "finger" && (
          <g className="pixel-gesture-layer pixel-gesture-finger" aria-hidden="true">
            {/* Dedo em Riste Didático apontando para cima */}
            <rect x="204" y="200" width="12" height="38" fill={palette.skin.shadow} />
            <rect x="206" y="196" width="8" height="40" fill={palette.skin.base} />
            <rect x="208" y="196" width="4" height="12" fill={palette.skin.highlight} />
            <circle cx="210" cy="194" r="8" fill="#f59e0b" filter={`url(#${ids.glow})`} opacity=".5" />
          </g>
        )}

        {gesture === "thumbsup" && (
          <g className="pixel-gesture-layer pixel-gesture-thumbsup" aria-hidden="true">
            {/* Polegar de Aprovação para cima */}
            <path d="M204 220 H218 V200 H210 V206 H204 Z" fill={palette.skin.shadow} />
            <path d="M206 222 H216 V202 H212 V208 H206 Z" fill={palette.skin.base} />
            <rect x="210" y="200" width="4" height="4" fill={palette.skin.highlight} />
            <circle cx="212" cy="204" r="12" fill="#fbbf24" filter={`url(#${ids.glow})`} opacity=".45" />
          </g>
        )}

        {gesture === "heart" && (
          <g className="pixel-gesture-layer pixel-gesture-heart" aria-hidden="true">
            {/* Coração formado com as mãos no peito */}
            <path
              d="M126 218 C116 206 102 216 112 228 L140 252 L168 228 C178 216 164 206 154 218 L140 232 Z"
              fill="#f43f5e"
              stroke="#881337"
              strokeWidth="3"
              filter={`url(#${ids.glow})`}
            />
            <path d="M120 220 L126 214 M160 220 L154 214" stroke="#fecdd3" strokeWidth="2.5" strokeLinecap="square" />
          </g>
        )}

        {gesture === "watergun" && (
          <g className="pixel-gesture-layer pixel-gesture-watergun" aria-hidden="true">
            {/* Pistola d'água / Feixe mágico apontado para frente */}
            <rect x="204" y="218" width="24" height="14" fill={palette.skin.shadow} />
            <rect x="206" y="220" width="20" height="10" fill={palette.skin.base} />
            <rect x="228" y="222" width="18" height="6" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
            <path d="M246 224 H276" stroke="#38bdf8" strokeWidth="4" strokeLinecap="square" filter={`url(#${ids.glow})`} />
          </g>
        )}
      </g>
    </svg>
  );
}
