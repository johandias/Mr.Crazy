"use client";

import { useId, useEffect, useRef, type CSSProperties } from "react";
import type { CharacterGesture } from "@/components/RpgCharacter";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";

type PixelMrCrazyProps = Readonly<{
  voiceState: VoiceState;
  gesture?: CharacterGesture;
  emotion?: Emotion;
  crazyLevel?: number;
  lookX?: number;
  lookY?: number;
  phoneme?: number;
  isBlinking?: boolean;
  burstKey?: number;
  isAwake?: boolean;
}>;

/**
 * Avatar Mr. Crazy: Esfera Viva Flutuante Digital & Cartoon.
 * 100% CÓDIGO NATIVO VETORIAL SVG + CSS + React (sem canvas, sem imagens raster).
 * Olhos digitais expressivos estilo anime/desenho animado (sem traços humanos),
 * boca cartunesca neon articulada em tempo real com áudio WebRTC,
 * reflexos de luz dinâmicos na curvatura da esfera que reagem à flutuação,
 * aura de fundo com brilhos cósmicos que mudam de cor e levitação viva.
 */
export function PixelMrCrazy({
  voiceState = "idle",
  gesture = "idle",
  emotion = "calm",
  crazyLevel = 0,
  lookX = 0,
  lookY = 0,
  phoneme = 4,
  isBlinking = false,
  isAwake = false
}: PixelMrCrazyProps) {
  const instanceId = useId().replace(/:/gu, "");
  const isSpeaking = voiceState === "speaking";
  const activity = isSpeaking ? "speaking" : voiceState === "listening" ? "listening" : "idle";
  const energy = Math.max(0.25, (crazyLevel ?? 0) / 100);

  // SVG Elements Refs para animações diretas a 60fps
  const mouthRef = useRef<SVGPathElement>(null);
  const mclipRef = useRef<SVGPathElement>(null);
  const tongueRef = useRef<SVGEllipseElement>(null);
  const teethRef = useRef<SVGPathElement>(null);
  const blRef = useRef<SVGPathElement>(null);
  const brRef = useRef<SVGPathElement>(null);
  const eyeLRef = useRef<SVGGElement>(null);
  const eyeRRef = useRef<SVGGElement>(null);
  const orbRef = useRef<SVGCircleElement>(null);
  const orb2Ref = useRef<SVGCircleElement>(null);
  const pupilLRef = useRef<SVGGElement>(null);
  const pupilRRef = useRef<SVGGElement>(null);
  const gleamRef = useRef<SVGEllipseElement>(null);
  const gleamArcRef = useRef<SVGPathElement>(null);

  // Estados mutáveis do loop de animação
  const openRef = useRef(0);
  const blinkRef = useRef(0);
  const nextBlinkRef = useRef(2);
  const pxRef = useRef(0);
  const pyRef = useRef(0);
  const t0Ref = useRef(0);

  useEffect(() => {
    t0Ref.current = performance.now();
    let rafId: number;

    const setMouth = (o: number) => {
      const clamped = Math.max(0, Math.min(1, o));
      // Geometria de boca cartunesca digital expressiva
      const w = 34 - clamped * 7;
      const cx = 200;
      const cy = 268;
      const l = cx - w;
      const r = cx + w;
      const up = cy - 4 - clamped * 5;
      const lo = cy + 4 + clamped * 38;
      const sm = (1 - clamped) * 3;
      const d = `M${l} ${cy - sm}Q${cx} ${up} ${r} ${cy - sm}Q${cx + w * 0.55} ${lo} ${cx} ${lo}Q${cx - w * 0.55} ${lo} ${l} ${cy - sm}Z`;

      if (mouthRef.current) mouthRef.current.setAttribute("d", d);
      if (mclipRef.current) mclipRef.current.setAttribute("d", d);

      // Barra de dentes cartunescos digitais no topo da boca
      if (teethRef.current) {
        const tw = w - 4;
        const teethD = `M${cx - tw} ${cy - sm + 1} Q${cx} ${up + 1} ${cx + tw} ${cy - sm + 1} L${cx + tw * 0.9} ${cy - sm + 7 + clamped * 2} Q${cx} ${up + 8 + clamped * 2} ${cx - tw * 0.9} ${cy - sm + 7 + clamped * 2} Z`;
        teethRef.current.setAttribute("d", teethD);
        teethRef.current.setAttribute("opacity", clamped > 0.08 ? "0.95" : "0.5");
      }

      // Língua cartunesca com brilho neon
      if (tongueRef.current) {
        tongueRef.current.setAttribute("cy", String(cy + clamped * 28));
        tongueRef.current.setAttribute("opacity", clamped > 0.2 ? String(Math.min(1, clamped * 1.3)) : "0");
      }

      // Sobrancelhas holográficas levantando com expressividade
      const lift = clamped * 6.5;
      if (blRef.current) blRef.current.setAttribute("transform", `translate(0 ${-lift})`);
      if (brRef.current) brRef.current.setAttribute("transform", `translate(0 ${-lift})`);
    };

    const frame = (now: number) => {
      const t = now - t0Ref.current;
      const dt = 0.016;

      // 1. Modulação de fala cartunesca rítmica e expressiva
      let target = 0;
      if (voiceState === "speaking") {
        const s = t / 1000;
        const syl = Math.abs(Math.sin(s * 9.5)) * (0.55 + 0.45 * Math.sin(s * 2.3));
        const word = Math.sin(s * 1.7) > -0.55 ? 1 : 0.05;
        const rhythmic = Math.min(1, syl * word * 1.05 + 0.04 * Math.sin(s * 23));
        const phonemeWeight = [0.95, 0.48, 0.75, 0.22, 0.05][phoneme] ?? 0.5;
        target = Math.max(rhythmic * 0.75 + phonemeWeight * 0.25, rhythmic * 0.35);
      }

      let open = openRef.current;
      open += (target - open) * (target > open ? 0.48 : 0.26);
      openRef.current = open;
      setMouth(open);

      // 2. Rastreamento e amortecimento suave das pupilas cartunescas
      const tx = Math.max(-1, Math.min(1, lookX));
      const ty = Math.max(-1, Math.min(1, lookY));
      pxRef.current += (tx - pxRef.current) * 0.08;
      pyRef.current += (ty - pyRef.current) * 0.08;
      const ox = pxRef.current * 5.5;
      const oy = pyRef.current * 4.2;
      const pupilTransform = `translate(${ox.toFixed(2)} ${oy.toFixed(2)})`;
      if (pupilLRef.current) pupilLRef.current.setAttribute("transform", pupilTransform);
      if (pupilRRef.current) pupilRRef.current.setAttribute("transform", pupilTransform);

      // 3. Piscar cartunesco suave com curva senoidal
      let blink = blinkRef.current;
      let nextBlink = nextBlinkRef.current;
      nextBlink -= dt;

      if (isBlinking && blink <= 0) {
        blink = 1;
      } else if (nextBlink < 0) {
        blink = 1;
        nextBlink = 2.2 + Math.random() * 3.8;
      }
      nextBlinkRef.current = nextBlink;

      let sc = 1;
      if (blink > 0) {
        sc = Math.abs(Math.cos((1 - blink) * Math.PI));
        blink -= 0.09;
        if (blink <= 0) blink = 0;
      }
      blinkRef.current = blink;
      sc = Math.max(0.08, sc);

      if (eyeLRef.current) eyeLRef.current.setAttribute("transform", `translate(156 198) scale(1 ${sc.toFixed(3)})`);
      if (eyeRRef.current) eyeRRef.current.setAttribute("transform", `translate(244 198) scale(1 ${sc.toFixed(3)})`);

      // 4. Reflexos de luz dinâmicos na curvatura da esfera reagindo à flutuação
      const floatAngle = (t / 1400) * Math.PI * 2;
      const gleamShiftX = 158 + Math.sin(floatAngle) * 9 - pxRef.current * 6;
      const gleamShiftY = 122 + Math.cos(floatAngle) * 7 - pyRef.current * 5;
      const gleamRot = -26 + Math.sin(floatAngle) * 6;
      if (gleamRef.current) {
        gleamRef.current.setAttribute("cx", gleamShiftX.toFixed(2));
        gleamRef.current.setAttribute("cy", gleamShiftY.toFixed(2));
        gleamRef.current.setAttribute("transform", `rotate(${gleamRot.toFixed(1)} ${gleamShiftX.toFixed(1)} ${gleamShiftY.toFixed(1)})`);
      }

      // Arco de luz especular que desliza pela borda superior da esfera
      if (gleamArcRef.current) {
        const arcY = 148 + Math.sin(floatAngle * 0.7) * 8;
        gleamArcRef.current.setAttribute("d", `M 112 ${arcY} Q 158 ${arcY - 42} 248 ${arcY + 12}`);
      }

      // 5. Órbita contínua do satélite de luz sobre o anel
      const a = (t / 3000) * Math.PI * 2;
      if (orbRef.current) {
        orbRef.current.setAttribute("cx", (Math.cos(a) * 188).toFixed(2));
        orbRef.current.setAttribute("cy", (Math.sin(a) * 38).toFixed(2));
      }
      if (orb2Ref.current) {
        orb2Ref.current.setAttribute("cx", (Math.cos(a + Math.PI) * 188).toFixed(2));
        orb2Ref.current.setAttribute("cy", (Math.sin(a + Math.PI) * 38).toFixed(2));
      }

      rafId = requestAnimationFrame(frame);
    };

    setMouth(0);
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [voiceState, phoneme, lookX, lookY, isBlinking]);

  const ids = {
    body: `${instanceId}-body`,
    shade: `${instanceId}-shade`,
    rim: `${instanceId}-rim`,
    ring: `${instanceId}-ring`,
    iris: `${instanceId}-iris`,
    glow: `${instanceId}-glow`,
    sph: `${instanceId}-sph`,
    mc: `${instanceId}-mc`,
    aura: `${instanceId}-aura`,
    shadow: `${instanceId}-shadow`,
    heart: `${instanceId}-heart`,
    mouthGrad: `${instanceId}-mouth-grad`,
    teethGrad: `${instanceId}-teeth-grad`,
    tongueGrad: `${instanceId}-tongue-grad`,
    gleamGrad: `${instanceId}-gleam-grad`
  };

  const initialMouthD = "M166 265Q200 264 234 265Q219 271 200 271Q181 271 166 265Z";

  return (
    <svg
      className={`pixel-mr-crazy-art pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""} ${isAwake ? "pixel-awake" : ""}`}
      viewBox="0 0 400 420"
      role="img"
      aria-label={`Mr. Crazy avatar esfera viva flutuante cartoon ${isSpeaking ? "falando" : "pronto"}`}
      shapeRendering="crispEdges"
      data-phoneme={phoneme}
      style={{
        "--pixel-energy": energy,
        "--look-x": lookX,
        "--look-y": lookY
      } as CSSProperties}
    >
      <defs>
        {/* Aura luminosa de fundo com mudança de cores dinâmica */}
        <radialGradient id={ids.aura} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity=".45" />
          <stop offset="38%" stopColor="#818cf8" stopOpacity=".22" />
          <stop offset="68%" stopColor="#c084fc" stopOpacity=".08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão que pulsa em sincronia com a levitação */}
        <radialGradient id={ids.shadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2fb8ff" stopOpacity=".38" />
          <stop offset="70%" stopColor="#2fb8ff" stopOpacity="0" />
        </radialGradient>

        {/* Esfera 3D Volumétrica com iluminação esférica e profundidade viva */}
        <radialGradient id={ids.body} cx="34%" cy="24%" r="86%">
          <stop offset="0%" stopColor="#bbf2ff" />
          <stop offset=".2" stopColor="#38bdf8" />
          <stop offset=".55" stopColor="#0ea5e9" />
          <stop offset=".8" stopColor="#075985" />
          <stop offset="1" stopColor="#031738" />
        </radialGradient>

        {/* Sombra de profundidade e oclusão na esfera */}
        <radialGradient id={ids.shade} cx="50%" cy="50%" r="50%">
          <stop offset=".68" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".58" />
        </radialGradient>

        {/* Borda Iluminada (Rim Light) Ciano/Violeta */}
        <linearGradient id={ids.rim} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset=".4" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>

        {/* Anel Orbital Iluminado */}
        <linearGradient id={ids.ring} x1="0" x2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset=".5" stopColor="#818cf8" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>

        {/* Íris Cartunesca Digital com Brilho Neon */}
        <radialGradient id={ids.iris} cx="42%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset=".28" stopColor="#67e8f9" />
          <stop offset=".65" stopColor="#0284c7" />
          <stop offset="1" stopColor="#082f49" />
        </radialGradient>

        {/* Brilho Especular em Vidro Curvado da Esfera */}
        <linearGradient id={ids.gleamGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity=".65" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity=".2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Cavidade Oral Cartunesca com Luz de Energia */}
        <radialGradient id={ids.mouthGrad} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset=".45" stopColor="#034574" />
          <stop offset="1" stopColor="#020e24" />
        </radialGradient>

        {/* Dentes Cartunescos Brilhantes */}
        <linearGradient id={ids.teethGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Língua Neon Rosada Cartunesca */}
        <linearGradient id={ids.tongueGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset=".6" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>

        {/* Filtro Glow de Energia Suave */}
        <filter id={ids.glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Máscara de corte esférico para latitude/longitude e reflexos */}
        <clipPath id={ids.sph}>
          <circle cx="200" cy="200" r="122" />
        </clipPath>

        {/* Máscara dinâmica da cavidade bucal */}
        <clipPath id={ids.mc}>
          <path ref={mclipRef} id="mclip" d={initialMouthD} />
        </clipPath>

        {/* Gradiente para coração holográfico */}
        <linearGradient id={ids.heart} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {/* ========================================================
          BRILHOS E PARTÍCULAS MUDANDO DE COR NO FUNDO
          ======================================================== */}
      {/* Aura pulsante de fundo que muda de cor suavemente */}
      <circle cx="200" cy="200" r="190" fill={`url(#${ids.aura})`} className="pixel-orb-aura pixel-color-shift" />

      {/* Constelação de estrelas e brilhos coloridos cintilando no fundo */}
      <g className="pixel-bg-sparkles" aria-hidden="true">
        {/* Brilho estrela 1 (topo esquerdo) */}
        <path
          className="pixel-sparkle-star pixel-sparkle-1"
          d="M 72 84 L 75 92 L 83 95 L 75 98 L 72 106 L 69 98 L 61 95 L 69 92 Z"
          fill="#38bdf8"
          filter={`url(#${ids.glow})`}
        />
        {/* Brilho diamante 2 (topo direito) */}
        <path
          className="pixel-sparkle-star pixel-sparkle-2"
          d="M 324 78 L 328 88 L 338 92 L 328 96 L 324 106 L 320 96 L 310 92 L 320 88 Z"
          fill="#a855f7"
          filter={`url(#${ids.glow})`}
        />
        {/* Brilho estrela 3 (lateral esquerda) */}
        <path
          className="pixel-sparkle-star pixel-sparkle-3"
          d="M 44 218 L 47 225 L 54 228 L 47 231 L 44 238 L 41 231 L 34 228 L 41 225 Z"
          fill="#ec4899"
          filter={`url(#${ids.glow})`}
        />
        {/* Brilho diamante 4 (lateral direita) */}
        <path
          className="pixel-sparkle-star pixel-sparkle-4"
          d="M 356 210 L 359 217 L 366 220 L 359 223 L 356 230 L 353 223 L 346 220 L 353 217 Z"
          fill="#facc15"
          filter={`url(#${ids.glow})`}
        />
        {/* Partícula sutil 5 (inferior esquerda) */}
        <circle cx="86" cy="310" r="3.2" fill="#2dd4bf" className="pixel-sparkle-star pixel-sparkle-5" filter={`url(#${ids.glow})`} />
        {/* Partícula sutil 6 (inferior direita) */}
        <circle cx="316" cy="304" r="3.2" fill="#38bdf8" className="pixel-sparkle-star pixel-sparkle-6" filter={`url(#${ids.glow})`} />
      </g>

      {/* Sombra de chão orgânica sincronizada com a flutuação */}
      <ellipse cx="200" cy="385" rx="90" ry="12" fill={`url(#${ids.shadow})`} className="pixel-ground-shadow" />

      {/* ========================================================
          CORPO DA ESFERA FLUTUANTE (THE SENTIENT AI ORB)
          ======================================================== */}
      <g className="pixel-rig pixel-body pixel-float">
        {/* Anel Traseiro (Efeito 3D de Órbita) */}
        <g transform="rotate(-14 200 205)" filter={`url(#${ids.glow})`}>
          <path
            d="M12 205A188 38 0 0 1 388 205"
            fill="none"
            stroke={`url(#${ids.ring})`}
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".85"
          />
        </g>

        {/* Esfera Principal 3D */}
        <circle cx="200" cy="200" r="122" fill={`url(#${ids.body})`} />

        {/* Linhas de latitude e longitude tecnológicas com suavidade */}
        <g clipPath={`url(#${ids.sph})`} fill="none" stroke="#67e8f9" strokeOpacity=".25" strokeWidth="1.6">
          <path d="M90 250Q200 310 310 250" />
          <path d="M100 120Q200 80 300 120" />
          <path d="M150 320Q200 290 250 320" />
        </g>

        {/* ========================================================
            REFLEXOS DE LUZ NA SUPERFÍCIE (REAGEM À FLUTUAÇÃO)
            ======================================================== */}
        <g clipPath={`url(#${ids.sph})`}>
          {/* Reflexo Especular Elíptico Curvado (move em tempo real oposto ao tilt) */}
          <ellipse
            ref={gleamRef}
            cx="158"
            cy="124"
            rx="42"
            ry="18"
            fill={`url(#${ids.gleamGrad})`}
            transform="rotate(-26 158 124)"
          />

          {/* Arco de luz superior especular que reflete a luz ambiente */}
          <path
            ref={gleamArcRef}
            d="M 112 148 Q 158 106 248 160"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeOpacity=".45"
            strokeLinecap="round"
            filter={`url(#${ids.glow})`}
          />

          {/* Brilho de fresnel inferior que reflete o solo e a aura */}
          <path
            d="M 108 260 C 138 316 262 316 292 260 C 262 300 138 300 108 260 Z"
            fill="#38bdf8"
            fillOpacity=".26"
            filter={`url(#${ids.glow})`}
          />
        </g>

        {/* Sombra Esférica de Oclusão */}
        <circle cx="200" cy="200" r="122" fill={`url(#${ids.shade})`} />

        {/* Borda Iluminada Rim Light com Glow */}
        <circle cx="200" cy="200" r="122" fill="none" stroke={`url(#${ids.rim})`} strokeWidth="3" filter={`url(#${ids.glow})`} />

        {/* Estrela de Brilho Reluzente Superior */}
        <path
          d="M146 98l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"
          fill="#fff"
          opacity=".95"
          filter={`url(#${ids.glow})`}
          className="pixel-star-glint"
        />

        {/* ========================================================
            OLHOS DIGITAIS CARTUNESCOS (ANIME / DIGITAL EXPRESSIVO)
            Sem traços humanos: grandes, brilhantes e vivos
            ======================================================== */}
        {/* Sobrancelhas Holográficas Dinâmicas (Arcos de Energia Neon) */}
        <g id="brows" filter={`url(#${ids.glow})`}>
          <path
            ref={blRef}
            id="bl"
            d="M 134 158 Q 156 148 178 156"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <path
            ref={brRef}
            id="br"
            d="M 266 158 Q 244 148 222 156"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        </g>

        {/* Olho Esquerdo Cartunesco */}
        <g ref={eyeLRef} id="eyeL" transform="translate(156 198)" className="pixel-eye">
          {/* Cápsula externa do olho digital */}
          <ellipse rx="19" ry="24" fill="#03152e" stroke="#38bdf8" strokeWidth="2.8" filter={`url(#${ids.glow})`} />
          <ellipse rx="17" ry="22" fill="#020d1e" />

          {/* Pupila / Íris Digital com Parallax */}
          <g ref={pupilLRef} className="pu">
            <ellipse rx="13" ry="17" fill={`url(#${ids.iris})`} filter={`url(#${ids.glow})`} />
            <ellipse rx="7" ry="10" fill="#020712" />

            {/* Brilhos especulares cartunescos estilo anime */}
            <circle cx="-4.5" cy="-6.5" r="4.2" fill="#ffffff" />
            <circle cx="4" cy="5" r="2.2" fill="#67e8f9" />
            <circle cx="-2" cy="7" r="1.4" fill="#ffffff" />
          </g>
        </g>

        {/* Olho Direito Cartunesco */}
        <g ref={eyeRRef} id="eyeR" transform="translate(244 198)" className="pixel-eye">
          {/* Cápsula externa do olho digital */}
          <ellipse rx="19" ry="24" fill="#03152e" stroke="#38bdf8" strokeWidth="2.8" filter={`url(#${ids.glow})`} />
          <ellipse rx="17" ry="22" fill="#020d1e" />

          {/* Pupila / Íris Digital com Parallax */}
          <g ref={pupilRRef} className="pu">
            <ellipse rx="13" ry="17" fill={`url(#${ids.iris})`} filter={`url(#${ids.glow})`} />
            <ellipse rx="7" ry="10" fill="#020712" />

            {/* Brilhos especulares cartunescos estilo anime */}
            <circle cx="-4.5" cy="-6.5" r="4.2" fill="#ffffff" />
            <circle cx="4" cy="5" r="2.2" fill="#67e8f9" />
            <circle cx="-2" cy="7" r="1.4" fill="#ffffff" />
          </g>
        </g>

        {/* ========================================================
            BOCA DIGITAL CARTUNESCA (SEM TRAÇOS HUMANOS)
            Borda neon ciano, dentes energéticos e língua cartoon
            ======================================================== */}
        <g className="pixel-mouth" data-phoneme={phoneme}>
          {/* Cavidade Oral Cartunesca */}
          <path
            ref={mouthRef}
            id="mouth"
            d={initialMouthD}
            fill={`url(#${ids.mouthGrad})`}
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinejoin="round"
            filter={`url(#${ids.glow})`}
          />

          {/* Elementos internos recortados pela cavidade */}
          <g clipPath={`url(#${ids.mc})`}>
            {/* Dentes cartunescos digitais (barra de sorriso luminoso) */}
            <path
              ref={teethRef}
              id="teeth"
              d="M172 265 Q200 264 228 265 L226 272 Q200 271 174 272 Z"
              fill={`url(#${ids.teethGrad})`}
            />

            {/* Língua neon cartunesca rosada */}
            <ellipse
              ref={tongueRef}
              id="tongue"
              cx="200"
              cy="268"
              rx="15"
              ry="9"
              fill={`url(#${ids.tongueGrad})`}
              opacity="0"
            />
          </g>
        </g>

        {/* Anel Frontal com Satélites em Órbita */}
        <g transform="rotate(-14 200 205)" filter={`url(#${ids.glow})`}>
          <path
            d="M12 205A188 38 0 0 0 388 205"
            fill="none"
            stroke={`url(#${ids.ring})`}
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Satélite principal */}
          <circle ref={orbRef} id="orb" r="6.5" fill="#f0fdff" cx="188" cy="0" />
          {/* Satélite secundário em contra-fase */}
          <circle ref={orb2Ref} id="orb2" r="4.2" fill="#a855f7" cx="-188" cy="0" opacity=".8" />
        </g>

        {/* Gestos Holográficos Flutuantes */}
        <g className="pixel-gesture-layer">
          {gesture === "thumbsup" && (
            <g className="pixel-gesture-thumbsup" transform="translate(320, 150)">
              <circle cx="16" cy="16" r="22" fill="#050f2e" fillOpacity=".88" stroke="#2fe0ff" strokeWidth="2" filter={`url(#${ids.glow})`} />
              <path d="M14 24 C11 24 8 20 8 16 C8 12 11 8 14 6 C16 4 20 5 20 8 C20 11 20 14 23 16 C25 18 26 19 26 21 C26 23 24 24 21 24 Z" fill="#9aeaff" filter={`url(#${ids.glow})`} />
              <circle cx="24" cy="6" r="3.5" fill="#fff" />
            </g>
          )}

          {gesture === "heart" && (
            <g className="pixel-gesture-heart" transform="translate(200, 60)">
              <circle cx="0" cy="0" r="22" fill="#050f2e" fillOpacity=".88" stroke="#ec4899" strokeWidth="2" filter={`url(#${ids.glow})`} />
              <path d="M0 -6 C-5 -14 -16 -12 -16 -4 C-16 5 0 14 0 14 C0 14 16 5 16 -4 C16 -12 5 -14 0 -6 Z" fill={`url(#${ids.heart})`} filter={`url(#${ids.glow})`} />
            </g>
          )}

          {gesture === "watergun" && (
            <g className="pixel-gesture-watergun" transform="translate(320, 220)">
              <circle cx="16" cy="16" r="20" fill="#050f2e" fillOpacity=".88" stroke="#2fb8ff" strokeWidth="2" filter={`url(#${ids.glow})`} />
              <line x1="8" y1="16" x2="44" y2="16" stroke="#2fe0ff" strokeWidth="4" strokeLinecap="round" filter={`url(#${ids.glow})`} />
              <line x1="8" y1="16" x2="44" y2="16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
