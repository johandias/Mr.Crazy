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
 * Mr. Crazy: Professor de inglês moderno, cômico e expressivo.
 * Gerado 100% nativamente em código vetorial (HTML5, CSS3, SVG e JSON),
 * sem dependência de imagens estáticas (PNG/JPG) ou modelos pesados.
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
  const faceX = Math.round(lookX * 3.5);
  const faceY = Math.round(lookY * 2.5);
  const mouth = voiceState === "speaking" ? phoneme : 4;
  const energy = Math.max(0.25, crazyLevel / 100);
  const bodyLift = activity === "speaking" ? -4 : activity === "listening" ? 1 : 0;
  const mouthLabel = ["aberta", "esticada", "redonda", "fechando", "repouso"][mouth] ?? "repouso";
  const isAngryOrCrazy = crazyLevel >= 45 || emotion === "irritated" || emotion === "crazy";
  const isHappyOrProud = crazyLevel < 20 && emotion === "calm";

  const { palette, visemes } = avatarData;

  const ids = {
    skin: `${instanceId}-skin`,
    skinShadow: `${instanceId}-skin-shadow`,
    hairMain: `${instanceId}-hair-main`,
    hairTip: `${instanceId}-hair-tip`,
    hairBack: `${instanceId}-hair-back`,
    cape: `${instanceId}-cape`,
    capeShadow: `${instanceId}-cape-shadow`,
    coat: `${instanceId}-coat`,
    coatShadow: `${instanceId}-coat-shadow`,
    gold: `${instanceId}-gold`,
    leather: `${instanceId}-leather`,
    glass: `${instanceId}-glass`,
    aura: `${instanceId}-aura`,
    shadow: `${instanceId}-shadow`,
    glow: `${instanceId}-glow`,
    pupil: `${instanceId}-pupil`,
    mouthDepth: `${instanceId}-mouth-depth`,
    tongue: `${instanceId}-tongue`,
    teeth: `${instanceId}-teeth`
  };

  return (
    <svg
      className={`pixel-mr-crazy-art pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""} ${isAwake ? "pixel-awake" : ""}`}
      viewBox={avatarData.viewBox}
      role="img"
      aria-label={`Mr. Crazy, professor de inglês expressivo e cômico ${activity === "speaking" ? `falando com boca ${mouthLabel}` : "pronto"}`}
      shapeRendering="crispEdges"
      data-phoneme={mouth}
      style={{
        "--pixel-energy": energy,
        "--look-x": lookX,
        "--look-y": lookY
      } as CSSProperties}
    >
      <defs>
        {/* Aura de energia ao redor do tutor */}
        <radialGradient id={ids.aura} cx="50%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={isAngryOrCrazy ? ".38" : ".22"} />
          <stop offset="55%" stopColor={isAngryOrCrazy ? "#dc2626" : "#0d9488"} stopOpacity=".12" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão */}
        <radialGradient id={ids.shadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity=".65" />
          <stop offset="60%" stopColor="#000000" stopOpacity=".28" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Tom de pele e sombras de cel-shading */}
        <linearGradient id={ids.skin} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.skin.light} />
          <stop offset="55%" stopColor={palette.skin.base} />
          <stop offset="100%" stopColor={palette.skin.shadow} />
        </linearGradient>

        <linearGradient id={ids.skinShadow} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.skin.shadow} />
          <stop offset="100%" stopColor={palette.skin.darkShadow} />
        </linearGradient>

        {/* Cabelo Flamejante do Mr. Crazy */}
        <linearGradient id={ids.hairMain} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor={palette.hair.highlight} />
          <stop offset="25%" stopColor={palette.hair.amber} />
          <stop offset="65%" stopColor={palette.hair.crimson} />
          <stop offset="100%" stopColor={palette.hair.deepShadow} />
        </linearGradient>

        <linearGradient id={ids.hairTip} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.hair.highlight} />
          <stop offset="100%" stopColor={palette.hair.amber} />
        </linearGradient>

        <linearGradient id={ids.hairBack} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.hair.deepShadow} />
          <stop offset="100%" stopColor={palette.hair.contour} />
        </linearGradient>

        {/* Capa Vermelha Heroica */}
        <linearGradient id={ids.cape} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor={palette.cape.top} />
          <stop offset="40%" stopColor={palette.cape.base} />
          <stop offset="100%" stopColor={palette.cape.deep} />
        </linearGradient>

        <linearGradient id={ids.capeShadow} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.cape.shadow} />
          <stop offset="100%" stopColor={palette.cape.stroke} />
        </linearGradient>

        {/* Casaco de Professor Teal */}
        <linearGradient id={ids.coat} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor={palette.coat.highlight} />
          <stop offset="42%" stopColor={palette.coat.base} />
          <stop offset="100%" stopColor={palette.coat.deep} />
        </linearGradient>

        <linearGradient id={ids.coatShadow} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.coat.shadow} />
          <stop offset="100%" stopColor={palette.coat.deep} />
        </linearGradient>

        {/* Ouro e Fivelas */}
        <linearGradient id={ids.gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.gold.highlight} />
          <stop offset="35%" stopColor={palette.gold.base} />
          <stop offset="75%" stopColor={palette.gold.shadow} />
          <stop offset="100%" stopColor={palette.gold.stroke} />
        </linearGradient>

        {/* Couro e Botas */}
        <linearGradient id={ids.leather} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.leather.base} />
          <stop offset="60%" stopColor={palette.leather.shadow} />
          <stop offset="100%" stopColor={palette.leather.stroke} />
        </linearGradient>

        {/* Lentes dos Óculos */}
        <linearGradient id={ids.glass} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity=".75" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity=".22" />
        </linearGradient>

        {/* Pupilas Expressivas */}
        <radialGradient id={ids.pupil} cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor={isAngryOrCrazy ? "#ef4444" : "#f59e0b"} />
          <stop offset="60%" stopColor={isAngryOrCrazy ? "#991b1b" : "#b45309"} />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>

        {/* Boca, Dentes e Língua */}
        <linearGradient id={ids.mouthDepth} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.mouth.cavity} />
          <stop offset="100%" stopColor="#180208" />
        </linearGradient>

        <linearGradient id={ids.teeth} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>

        <linearGradient id={ids.tongue} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>

        {/* Filtro de Brilho */}
        <filter id={ids.glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Aura mágica / energética no fundo */}
      <ellipse className="pixel-aura" cx="160" cy="200" rx="145" ry="178" fill={`url(#${ids.aura})`} />
      <ellipse className="pixel-ground-shadow" cx="160" cy="398" rx="108" ry="15" fill={`url(#${ids.shadow})`} />

      {/* Explosão de impacto / acerto / estresse */}
      {burstKey > 0 && (
        <g key={burstKey} className="pixel-explosion-burst" aria-hidden="true">
          <circle className="pixel-explosion-ring" cx="160" cy="205" r="64" fill="none" stroke="#fbbf24" strokeWidth="5" opacity=".9" />
          <path className="pixel-explosion-star" d="M160 100l14 68 45-36-34 52 66 7-66 11 41 48-52-35 2 68-15-66-47 38 36-53-66-7 65-13-38-49 50 36z" fill="#fbbf24" opacity=".92" />
          <path className="pixel-explosion-core" d="M160 155l11 36 38 11-38 11-11 38-11-38-38-11 38-11z" fill="#fff7c2" filter={`url(#${ids.glow})`} />
          <circle className="pixel-explosion-spark spark-one" cx="72" cy="160" r="6" fill="#38bdf8" />
          <circle className="pixel-explosion-spark spark-two" cx="248" cy="150" r="5.5" fill="#f43f5e" />
          <circle className="pixel-explosion-spark spark-three" cx="80" cy="280" r="5" fill="#fbbf24" />
          <circle className="pixel-explosion-spark spark-four" cx="240" cy="285" r="6" fill="#ea580c" />
        </g>
      )}

      {/* Efeitos cômicos expressivos: Raiva / Estresse / Suor */}
      {isAngryOrCrazy && (
        <g className="mr-crazy-anger-fx" aria-hidden="true">
          {/* Símbolo de raiva anime (💢) pulsando na têmpora */}
          <g className="mr-crazy-vein" transform="translate(224 68)">
            <path d="M-6 -2c3 0 4 2 4 5s-2 5 -5 5M6 -2c-3 0 -4 2 -4 5s2 5 5 5M-2 -6c0 3 2 4 5 4s5 -2 5 -5M-2 6c0 -3 2 -4 5 -4s5 2 5 5" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          </g>
          {/* Vapor saindo do ouvido esquerdo */}
          <path className="mr-crazy-steam mr-crazy-steam-left" d="M96 122c-8-6-14-16-10-24 3-6 10-6 10-1" fill="none" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" opacity=".85" />
          {/* Vapor saindo do ouvido direito */}
          <path className="mr-crazy-steam mr-crazy-steam-right" d="M224 122c8-6 14-16 10-24-3-6-10-6-10-1" fill="none" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" opacity=".85" />
          {/* Gota de suor cômica (💧) escorrendo na testa */}
          <path className="mr-crazy-sweat" d="M94 92c0-4 6-12 6-12s6 8 6 12a6 6 0 11-12 0z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
        </g>
      )}

      {isHappyOrProud && (
        <g className="mr-crazy-happy-glint" aria-hidden="true">
          {/* Brilho estrela nos óculos (✨) */}
          <path d="M198 94l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fef08a" filter={`url(#${ids.glow})`} />
        </g>
      )}

      {/* Roteamento e Esqueleto do Personagem (Rig Vetorial) */}
      <g className="pixel-rig" transform={`translate(0 ${bodyLift})`}>
        {/* Capa Traseira Fluida */}
        <g className="pixel-cape pixel-cape-back">
          <path d="M96 174c-38 18-64 62-72 120-4 32 3 72 12 94 28 8 52 10 76 4l12-178z" fill={`url(#${ids.capeShadow})`} stroke="#1e050f" strokeWidth="4.5" />
          <path d="M224 174c38 18 64 62 72 120 4 32-3 72-12 94-28 8-52 10-76 4l-12-178z" fill={`url(#${ids.capeShadow})`} stroke="#1e050f" strokeWidth="4.5" />
          <path d="M90 186c-28 30-40 84-36 156 16 8 32 10 50 10" fill="none" stroke={`url(#${ids.cape})`} strokeWidth="5.5" />
          <path d="M230 186c28 30 40 84 36 156-16 8-32 10-50 10" fill="none" stroke={`url(#${ids.cape})`} strokeWidth="5.5" />
        </g>

        {/* Pernas e Botas de Aventureiro com Fivelas Douradas */}
        <g className="pixel-legs">
          <path d="M118 290h48l-3 78-12 25h-49l8-33z" fill="#1e293b" stroke="#0f172a" strokeWidth="4.5" />
          <path d="M154 290h48l8 70 8 33h-50l-12-25z" fill="#334155" stroke="#0f172a" strokeWidth="4.5" />
          <path d="M106 356h52v40H90c-9 0-14-10-8-18l15-14z" fill={`url(#${ids.leather})`} stroke="#1c1917" strokeWidth="4.5" />
          <path d="M162 356h52l18 18c6 8 1 18-8 18h-68z" fill={`url(#${ids.leather})`} stroke="#1c1917" strokeWidth="4.5" />
          {/* Fivelas de ouro */}
          <rect x="127" y="367" width="16" height="12" rx="3" fill={`url(#${ids.gold})`} stroke="#78350f" strokeWidth="2" />
          <rect x="187" y="367" width="16" height="12" rx="3" fill={`url(#${ids.gold})`} stroke="#78350f" strokeWidth="2" />
        </g>

        {/* Tronco, Casaco de Mago / Professor e Cinto */}
        <g className="pixel-body">
          {/* Camada do casaco */}
          <path d="M104 164c22-18 90-18 112 0l26 126c-20 18-46 28-82 28s-62-10-82-28z" fill={`url(#${ids.coatShadow})`} stroke="#022c22" strokeWidth="5" />
          <path d="M114 168c20-14 72-14 92 0l20 114c-20 12-42 18-66 18s-46-6-66-18z" fill={`url(#${ids.coat})`} />
          {/* Detalhe frontal de lapela e costura elegante */}
          <path d="M160 168v128" stroke="#5eead4" strokeOpacity=".45" strokeWidth="3" />
          <path d="M120 204h26M120 232h26M174 204h26M174 232h26" stroke="#5eead4" strokeOpacity=".4" strokeWidth="3.5" strokeLinecap="round" />
          {/* Cinto e Fivela Dourada */}
          <path d="M104 276c34 10 78 10 112 0" stroke={`url(#${ids.gold})`} strokeWidth="9" />
          <rect x="140" y="264" width="40" height="32" rx="7" fill={`url(#${ids.gold})`} stroke="#78350f" strokeWidth="3" />
          <rect x="149" y="271" width="22" height="18" rx="3" fill="#1c1917" />
          {/* Camisa e Gravata Borboleta / Lenço Vitoriano */}
          <path d="M144 166l16 18 16-18" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5" />
          <path d="M150 168l10 24 10-24" fill="#4c1d95" opacity=".95" />
          {/* Botões Mágicos Dourados */}
          <circle cx="110" cy="192" r="11" fill={`url(#${ids.gold})`} stroke="#78350f" strokeWidth="2.5" />
          <circle cx="210" cy="192" r="11" fill={`url(#${ids.gold})`} stroke="#78350f" strokeWidth="2.5" />
        </g>

        {/* Braço Esquerdo */}
        <g className="pixel-arms pixel-arm-left">
          <path d="M110 176c-22 9-36 38-39 72l29 9 29-68z" fill={`url(#${ids.coatShadow})`} stroke="#022c22" strokeWidth="4.5" />
          <path d="M78 234c-5 11-4 28 4 38l23-8-7-32z" fill={`url(#${ids.leather})`} stroke="#1c1917" strokeWidth="3.5" />
          <path d="M78 270c-3 13 6 25 21 27l16-15-11-17z" fill={`url(#${ids.skin})`} stroke="#991b1b" strokeWidth="3.5" />
        </g>

        {/* Braço Direito */}
        <g className="pixel-arms pixel-arm-right">
          <path d="M210 176c22 9 36 38 39 72l-29 9-29-68z" fill={`url(#${ids.coatShadow})`} stroke="#022c22" strokeWidth="4.5" />
          <path d="M242 234c5 11 4 28-4 38l-23-8 7-32z" fill={`url(#${ids.leather})`} stroke="#1c1917" strokeWidth="3.5" />
          <path d="M242 270c3 13-6 25-21 27l-16-15 11-17z" fill={`url(#${ids.skin})`} stroke="#991b1b" strokeWidth="3.5" />
        </g>

        {/* Cabeça do Mr. Crazy com Parallax Interativo */}
        <g className="pixel-head" transform={`translate(${faceX} ${faceY})`}>
          {/* Cabelo de Trás (Silhueta Flamejante Expansiva) */}
          <path
            d="M86 112c-20-22-18-62 6-86l22-16 24 16 22-26 24 26 28-16 16 24c24 24 22 62 8 84l-14-16-12-32-26 12-28-20-30 28-24 8z"
            fill={`url(#${ids.hairBack})`}
            stroke="#450a0a"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Rosto / Formato da Cabeça */}
          <path
            d="M102 96c0-38 24-64 58-64s58 26 58 64v56c0 28-24 50-58 50s-58-22-58-50z"
            fill={`url(#${ids.skin})`}
            stroke="#7f1d1d"
            strokeWidth="5"
          />

          {/* Orelhas Expressivas com Detalhe */}
          <path d="M100 122c-12 0-18 8-15 22 3 13 14 20 23 18" fill={`url(#${ids.skinShadow})`} stroke="#7f1d1d" strokeWidth="4" />
          <path d="M220 122c12 0 18 8 15 22-3 13-14 20-23 18" fill={`url(#${ids.skinShadow})`} stroke="#7f1d1d" strokeWidth="4" />

          {/* Cabelo Flamejante Frontal Principal */}
          <path
            d="M100 102c-16-24-10-58 10-76l14-16 18 14 18-24 20 24 24-14 12 26c18 24 16 56 6 74l-16-18-12-30-22 10-24-20-26 28-22 8z"
            fill={`url(#${ids.hairMain})`}
            stroke="#7f1d1d"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Mechas flamejantes douradas de destaque e reflexo */}
          <path d="M118 64c16-28 36-30 56-18M186 48c14 4 26 14 30 28M136 38l-10 32M172 34l-8 28M204 48l-6 24" fill="none" stroke={`url(#${ids.hairTip})`} strokeWidth="5.5" strokeLinecap="round" />

          {/* Óculos de Professor Intelectual & Maluco */}
          <g className="pixel-glasses" transform="translate(0 2)">
            {/* Lentes com Reflexo e Armação Dourada */}
            <rect x="115" y="100" width="40" height="28" rx="9" fill={`url(#${ids.glass})`} stroke={`url(#${ids.gold})`} strokeWidth="5" />
            <rect x="165" y="100" width="40" height="28" rx="9" fill={`url(#${ids.glass})`} stroke={`url(#${ids.gold})`} strokeWidth="5" />
            {/* Ponte Central dos Óculos */}
            <path d="M154 110h12" stroke={`url(#${ids.gold})`} strokeWidth="5" strokeLinecap="round" />
            {/* Reflexos Brancos Diagonais nos Óculos (Estilo Anime / Comic) */}
            <path d="M120 106l16 16M170 106l16 16" stroke="#ffffff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Olhos Cômicos & Expressivos */}
          <g className="pixel-eye pixel-eye-left">
            {isBlinking ? (
              <path d="M125 115q10 6 20 0" fill="none" stroke="#7f1d1d" strokeWidth="4" strokeLinecap="round" />
            ) : isHappyOrProud ? (
              <path d="M124 118c6-8 18-8 24 0" fill="none" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx="135" cy="114" rx="8" ry="9" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                <circle cx={135 + faceX / 2.5} cy={114 + faceY / 2.5} r={isAngryOrCrazy ? 3.2 : 4.8} fill={`url(#${ids.pupil})`} />
                <circle cx={134 + faceX / 2.5} cy={112 + faceY / 2.5} r={1.8} fill="#ffffff" />
              </>
            )}
          </g>

          <g className="pixel-eye pixel-eye-right">
            {isBlinking ? (
              <path d="M175 115q10 6 20 0" fill="none" stroke="#7f1d1d" strokeWidth="4" strokeLinecap="round" />
            ) : isHappyOrProud ? (
              <path d="M172 118c6-8 18-8 24 0" fill="none" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx="185" cy="114" rx="8" ry="9" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                <circle cx={185 + faceX / 2.5} cy={114 + faceY / 2.5} r={isAngryOrCrazy ? 3.2 : 4.8} fill={`url(#${ids.pupil})`} />
                <circle cx={184 + faceX / 2.5} cy={112 + faceY / 2.5} r={1.8} fill="#ffffff" />
              </>
            )}
          </g>

          {/* Sobrancelhas Cômicas (Reagem ao Nível de Loucura e Emoção) */}
          {isAngryOrCrazy ? (
            <path d="M120 98l24 7M196 98l-24 7" stroke="#7f1d1d" strokeWidth="6" strokeLinecap="round" />
          ) : isHappyOrProud ? (
            <path d="M122 94c8-6 18-6 24 0M174 94c8-6 18-6 24 0" stroke="#7f1d1d" strokeWidth="5.5" strokeLinecap="round" />
          ) : (
            <path d="M122 96c7-7 17-6 24 -1M174 94c8-5 18-4 24 2" stroke="#7f1d1d" strokeWidth="5.5" strokeLinecap="round" />
          )}

          {/* Nariz Cômico e Expressivo */}
          <path d="M158 116l-5 24 13 3" fill="none" stroke="#b91c1c" strokeWidth="3.5" strokeLinecap="round" />

          {/* Articulação Labial e Visemas de Fala (pixel-mouth) definidos em JSON */}
          <g className="pixel-mouth" data-phoneme={mouth} aria-label={`Boca ${mouthLabel}`}>
            {/* Visema 0: Aberta (Grito, A, O) */}
            {mouth === 0 && (
              <g className="mouth-viseme mouth-viseme-open">
                <path d={visemes.open.cavityPath} fill={`url(#${ids.mouthDepth})`} stroke={palette.mouth.lipStroke} strokeWidth="3.5" />
                <path d={visemes.open.teethPath} fill={`url(#${ids.teeth})`} />
                <path d={visemes.open.tonguePath} fill={`url(#${ids.tongue})`} />
              </g>
            )}

            {/* Visema 1: Esticada (E, I) */}
            {mouth === 1 && (
              <g className="mouth-viseme mouth-viseme-wide">
                <path d={visemes.wide.cavityPath} fill={`url(#${ids.mouthDepth})`} stroke={palette.mouth.lipStroke} strokeWidth="3.5" />
                <path d={visemes.wide.teethPath} fill={`url(#${ids.teeth})`} />
                <path d={visemes.wide.tonguePath} fill={`url(#${ids.tongue})`} />
              </g>
            )}

            {/* Visema 2: Redonda (O, U, W) */}
            {mouth === 2 && (
              <g className="mouth-viseme mouth-viseme-round">
                <ellipse cx={visemes.round.cx} cy={visemes.round.cy} rx={visemes.round.rx} ry={visemes.round.ry} fill={`url(#${ids.mouthDepth})`} stroke={palette.mouth.lipStroke} strokeWidth="3.5" />
                <ellipse cx={visemes.round.cx} cy={visemes.round.cy - 2} rx={visemes.round.innerRx} ry={visemes.round.innerRy} fill="#1b0308" />
                <ellipse cx={visemes.round.cx} cy={visemes.round.cy + 10} rx={visemes.round.tongueRx} ry={visemes.round.tongueRy} fill={`url(#${ids.tongue})`} />
              </g>
            )}

            {/* Visema 3: Consoantes e fechamento */}
            {mouth === 3 && (
              <g className="mouth-viseme mouth-viseme-close">
                <path d={visemes.consonant.cavityPath} fill={`url(#${ids.mouthDepth})`} stroke={palette.mouth.lipStroke} strokeWidth="3.5" />
                <path d={visemes.consonant.teethPath} fill={`url(#${ids.teeth})`} />
              </g>
            )}

            {/* Visema 4: Repouso natural / Sorriso sarcástico de professor */}
            {mouth === 4 && (
              <g className="mouth-viseme mouth-viseme-rest phoneme-rest-live">
                <path d={visemes.rest.lipPath} fill="none" stroke={palette.mouth.lipStroke} strokeWidth="4.5" strokeLinecap="round" />
                <path d={visemes.rest.dimplePath} fill="none" stroke={palette.mouth.lipStroke} strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
          </g>

          {/* Covinha do Queixo */}
          <path d="M142 180c10 7 26 7 36 0" fill="none" stroke="#b91c1c" strokeWidth="3.5" strokeLinecap="round" />
        </g>

        {/* Gestos Dinâmicos do Personagem */}
        {gesture === "finger" && (
          <g className="pixel-gesture-layer pixel-gesture-finger">
            <path d="M228 250h15v-58h13v68h-9v14h-19z" fill={`url(#${ids.skin})`} stroke="#7f1d1d" strokeWidth="4.5" />
            <path d="M241 192h14v14h-14z" fill="#fca5a5" />
            <circle cx="230" cy="245" r="14" fill="#f59e0b" filter={`url(#${ids.glow})`} opacity=".3" />
            <path d="M226 250h14v-46h12v54h-8v12h-18z" fill="#fed7aa" stroke="#7c2d12" strokeWidth="3.5" />
          </g>
        )}

        {gesture === "thumbsup" && (
          <g className="pixel-gesture-layer pixel-gesture-thumbsup">
            <path d="M226 272h16v-44h14v55h-9v14h-21z" fill={`url(#${ids.skin})`} stroke="#7f1d1d" strokeWidth="4.5" />
            <path d="M242 228h14v16h-14z" fill="#fca5a5" />
            <circle cx="232" cy="240" r="16" fill="#fbbf24" filter={`url(#${ids.glow})`} opacity=".4" />
            <path d="M224 260h15v-36h13v45h-8v12h-20z" fill="#fed7aa" stroke="#7c2d12" strokeWidth="3.5" />
          </g>
        )}

        {gesture === "heart" && (
          <g className="pixel-gesture-layer pixel-gesture-heart">
            <path d="M134 248c-18-20-45 5-24 25l48 44 48-44c21-20-6-45-24-25l-24 25z" fill="#f43f5e" stroke="#881337" strokeWidth="5.5" />
            <path d="M124 257l9-8M192 257l-9-8" stroke="#fecdd3" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M136 230c-16-18-40 4-21 22l45 40 45-40c19-18-5-40-21-22l-24 22z" fill="#f43f5e" stroke="#881337" strokeWidth="4.5" filter={`url(#${ids.glow})`} />
            <path d="M128 238l8-7M188 238l-8-7" stroke="#fecdd3" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {gesture === "watergun" && (
          <g className="pixel-gesture-layer pixel-gesture-watergun">
            <path d="M226 272h30v-18h22v15h-12v14h-40z" fill={`url(#${ids.skin})`} stroke="#7f1d1d" strokeWidth="4.5" />
            <path d="M278 254h20v13h-20z" fill={`url(#${ids.gold})`} stroke="#78350f" strokeWidth="2" />
            <path d="M298 256h26v8h-26z" fill="#38bdf8" filter={`url(#${ids.glow})`} />
            <path d="M224 255h28v-16h20v13h-11v12h-37z" fill="#fed7aa" stroke="#7c2d12" strokeWidth="3.5" />
            <rect x="270" y="240" width="18" height="11" rx="2" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
            <path d="M288 243h28v6h-28z" fill="#38bdf8" filter={`url(#${ids.glow})`} />
          </g>
        )}
      </g>

      {/* Partículas / Faíscas Mágicas flutuando */}
      <g className="pixel-sparkles" aria-hidden="true">
        <path d="M38 140h8v26h-8zM29 149h26v8H29z" fill="#fde047" />
        <path d="M272 96h7v22h-7zM264 103h23v7h-23z" fill="#38bdf8" />
        <circle cx="62" cy="284" r="5" fill="#f43f5e" />
        <circle cx="264" cy="318" r="5" fill="#fbbf24" />
      </g>

      {/* Anel de detecção de fala ativo ao redor do Mr. Crazy */}
      {isAwake && (
        <g className="pixel-input-ring" aria-hidden="true">
          <circle cx="160" cy="205" r="148" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="8 6" opacity=".6" />
          <circle cx="160" cy="205" r="132" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 8" opacity=".4" />
        </g>
      )}
    </svg>
  );
}
