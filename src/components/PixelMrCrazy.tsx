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
 * Avatar Mr. Crazy: Esfera Viva Flutuante (The Sentient AI Orb).
 * 100% CÓDIGO NATIVO VETORIAL SVG + CSS + React (sem canvas, sem imagens raster).
 * Design original concebido com iluminação esférica 3D volumétrica, anel orbital com satélite em órbita contínua,
 * sobrancelhas masculinas dinâmicas, olhos expressivos com piscar senoidal e rastreamento de olhar,
 * boca proceduralmente articulada em sincronia com áudio WebRTC, aura pulsante e sombra de chão orgânica.
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

  // SVG Elements Refs para animações a 60fps sem re-renderizar o React
  const mouthRef = useRef<SVGPathElement>(null);
  const mclipRef = useRef<SVGPathElement>(null);
  const tongueRef = useRef<SVGEllipseElement>(null);
  const blRef = useRef<SVGPathElement>(null);
  const brRef = useRef<SVGPathElement>(null);
  const eyeLRef = useRef<SVGGElement>(null);
  const eyeRRef = useRef<SVGGElement>(null);
  const orbRef = useRef<SVGCircleElement>(null);
  const pupilLRef = useRef<SVGGElement>(null);
  const pupilRRef = useRef<SVGGElement>(null);

  // Estados mutáveis do loop de animação
  const openRef = useRef(0);
  const blinkRef = useRef(0);
  const nextBlinkRef = useRef(2);
  const pxRef = useRef(0);
  const pyRef = useRef(0);
  const t0Ref = useRef(0);

  // Sincronização do loop procedural de movimento (fala, órbita, piscar e olhar)
  useEffect(() => {
    t0Ref.current = performance.now();
    let rafId: number;

    const setMouth = (o: number) => {
      const clamped = Math.max(0, Math.min(1, o));
      const w = 36 - clamped * 9;
      const cx = 200;
      const cy = 270;
      const l = cx - w;
      const r = cx + w;
      const up = cy - 3 - clamped * 4;
      const lo = cy + 3 + clamped * 40;
      const sm = (1 - clamped) * 2;
      const d = `M${l} ${cy - sm}Q${cx} ${up} ${r} ${cy - sm}Q${cx + w * 0.5} ${lo} ${cx} ${lo}Q${cx - w * 0.5} ${lo} ${l} ${cy - sm}Z`;

      if (mouthRef.current) mouthRef.current.setAttribute("d", d);
      if (mclipRef.current) mclipRef.current.setAttribute("d", d);
      if (tongueRef.current) {
        tongueRef.current.setAttribute("cy", String(cy + clamped * 30));
        tongueRef.current.setAttribute("opacity", clamped > 0.25 ? String(Math.min(1, clamped * 1.2)) : "0");
      }
      const lift = clamped * 5;
      if (blRef.current) blRef.current.setAttribute("transform", `translate(0 ${-lift})`);
      if (brRef.current) brRef.current.setAttribute("transform", `translate(0 ${-lift})`);
    };

    const frame = (now: number) => {
      const t = now - t0Ref.current;
      const dt = 0.016;

      // 1. Modulação de abertura da boca pela fala
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
      open += (target - open) * (target > open ? 0.45 : 0.25);
      openRef.current = open;
      setMouth(open);

      // 2. Rastreamento e amortecimento suave das pupilas
      const tx = Math.max(-1, Math.min(1, lookX));
      const ty = Math.max(-1, Math.min(1, lookY));
      pxRef.current += (tx - pxRef.current) * 0.08;
      pyRef.current += (ty - pyRef.current) * 0.08;
      const ox = pxRef.current * 5;
      const oy = pyRef.current * 3.5;
      const pupilTransform = `translate(${ox.toFixed(2)} ${oy.toFixed(2)})`;
      if (pupilLRef.current) pupilLRef.current.setAttribute("transform", pupilTransform);
      if (pupilRRef.current) pupilRRef.current.setAttribute("transform", pupilTransform);

      // 3. Piscar de olhos procedural com curva senoidal suave
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

      if (eyeLRef.current) eyeLRef.current.setAttribute("transform", `translate(160 205) scale(1 ${sc.toFixed(3)})`);
      if (eyeRRef.current) eyeRRef.current.setAttribute("transform", `translate(240 205) scale(1 ${sc.toFixed(3)})`);

      // 4. Órbita contínua do satélite de luz sobre o anel
      const a = (t / 3200) * Math.PI * 2;
      if (orbRef.current) {
        orbRef.current.setAttribute("cx", (Math.cos(a) * 188).toFixed(2));
        orbRef.current.setAttribute("cy", (Math.sin(a) * 38).toFixed(2));
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
    heart: `${instanceId}-heart`
  };

  const initialMouthD = "M164 268Q200 267 236 268Q218 273 200 273Q182 273 164 268Z";

  return (
    <svg
      className={`pixel-mr-crazy-art pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""} ${isAwake ? "pixel-awake" : ""}`}
      viewBox="0 0 400 420"
      role="img"
      aria-label={`Mr. Crazy avatar esfera viva flutuante ${isSpeaking ? "falando" : "pronto"}`}
      shapeRendering="crispEdges"
      data-phoneme={phoneme}
      style={{
        "--pixel-energy": energy,
        "--look-x": lookX,
        "--look-y": lookY
      } as CSSProperties}
    >
      <defs>
        {/* Aura luminosa de fundo */}
        <radialGradient id={ids.aura} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2fb8ff" stopOpacity=".38" />
          <stop offset="42%" stopColor="#2fb8ff" stopOpacity=".12" />
          <stop offset="68%" stopColor="#2fb8ff" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de chão que pulsa em sincronia com a levitação */}
        <radialGradient id={ids.shadow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2fb8ff" stopOpacity=".35" />
          <stop offset="70%" stopColor="#2fb8ff" stopOpacity="0" />
        </radialGradient>

        {/* Esfera 3D Volumétrica com iluminação esférica realista */}
        <radialGradient id={ids.body} cx="36%" cy="26%" r="85%">
          <stop offset="0%" stopColor="#9aeaff" />
          <stop offset=".22" stopColor="#2aa6f0" />
          <stop offset=".6" stopColor="#0d4f9e" />
          <stop offset="1" stopColor="#050f2e" />
        </radialGradient>

        {/* Sombra de profundidade e oclusão na esfera */}
        <radialGradient id={ids.shade} cx="50%" cy="50%" r="50%">
          <stop offset=".7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".55" />
        </radialGradient>

        {/* Borda Iluminada (Rim Light) */}
        <linearGradient id={ids.rim} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d6f6ff" />
          <stop offset=".5" stopColor="#2fb8ff" />
          <stop offset="1" stopColor="#6a5cff" />
        </linearGradient>

        {/* Anel Orbital */}
        <linearGradient id={ids.ring} x1="0" x2="1">
          <stop offset="0" stopColor="#2fe0ff" />
          <stop offset=".6" stopColor="#7a6bff" />
          <stop offset="1" stopColor="#2fe0ff" />
        </linearGradient>

        {/* Íris Tecnológica com Profundidade */}
        <radialGradient id={ids.iris} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#bff3ff" />
          <stop offset=".5" stopColor="#1fa0ea" />
          <stop offset="1" stopColor="#06316b" />
        </radialGradient>

        {/* Filtro Glow de Energia Suave */}
        <filter id={ids.glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Máscara de corte esférico para latitude/longitude */}
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

      {/* Aura pulsante de fundo */}
      <circle cx="200" cy="200" r="190" fill={`url(#${ids.aura})`} className="pixel-orb-aura" />

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

        {/* Esfera Principal */}
        <circle cx="200" cy="200" r="122" fill={`url(#${ids.body})`} />

        {/* Linhas de latitude e longitude tecnológicas */}
        <g clipPath={`url(#${ids.sph})`} fill="none" stroke="#8fe3ff" strokeOpacity=".22" strokeWidth="1.5">
          <path d="M90 250Q200 310 310 250" />
          <path d="M100 120Q200 80 300 120" />
          <path d="M150 320Q200 290 250 320" />
        </g>

        {/* Sombra Esférica */}
        <circle cx="200" cy="200" r="122" fill={`url(#${ids.shade})`} />

        {/* Borda Iluminada com Glow */}
        <circle cx="200" cy="200" r="122" fill="none" stroke={`url(#${ids.rim})`} strokeWidth="3" filter={`url(#${ids.glow})`} />

        {/* Brilho Especular Superior Curvado */}
        <ellipse cx="158" cy="124" rx="40" ry="17" fill="#fff" opacity=".28" transform="rotate(-28 158 124)" />

        {/* Estrela de Brilho Reluzente */}
        <path d="M146 98l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#fff" opacity=".9" filter={`url(#${ids.glow})`} />

        {/* Sobrancelhas Masculinas Dinâmicas */}
        <g id="brows" fill="#04122e" stroke="#7fdcff" strokeOpacity=".5" strokeWidth="1">
          <path ref={blRef} id="bl" d="M132 166L184 176L184 186L134 176Z" />
          <path ref={brRef} id="br" d="M268 166L216 176L216 186L266 176Z" />
        </g>

        {/* Olhos Vivos com Rastreamento e Piscar Natural */}
        <g ref={eyeLRef} id="eyeL" transform="translate(160 205)" className="pixel-eye">
          <ellipse rx="19" ry="13" fill="#eaf8ff" stroke="#031433" strokeWidth="3" />
          <g ref={pupilLRef} className="pu">
            <circle r="9" fill={`url(#${ids.iris})`} />
            <circle r="4.2" fill="#020a1c" />
            <circle cx="-3" cy="-3.5" r="2.2" fill="#fff" />
          </g>
        </g>

        <g ref={eyeRRef} id="eyeR" transform="translate(240 205)" className="pixel-eye">
          <ellipse rx="19" ry="13" fill="#eaf8ff" stroke="#031433" strokeWidth="3" />
          <g ref={pupilRRef} className="pu">
            <circle r="9" fill={`url(#${ids.iris})`} />
            <circle r="4.2" fill="#020a1c" />
            <circle cx="-3" cy="-3.5" r="2.2" fill="#fff" />
          </g>
        </g>

        {/* Nariz Sutil */}
        <path d="M200 214Q194 236 202 240" fill="none" stroke="#7fdcff" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" />

        {/* Boca Procedural Articulada em Tempo Real */}
        <g className="pixel-mouth" data-phoneme={phoneme}>
          <path
            ref={mouthRef}
            id="mouth"
            d={initialMouthD}
            fill="#030b1f"
            stroke="#a8ecff"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <g clipPath={`url(#${ids.mc})`}>
            <ellipse ref={tongueRef} id="tongue" cx="200" cy="270" rx="16" ry="8" fill="#1c63c9" opacity="0" />
          </g>
          <path d="M170 296Q200 306 230 296" fill="none" stroke="#7fdcff" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Anel Frontal com Satélite em Órbita */}
        <g transform="rotate(-14 200 205)" filter={`url(#${ids.glow})`}>
          <path
            d="M12 205A188 38 0 0 0 388 205"
            fill="none"
            stroke={`url(#${ids.ring})`}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle ref={orbRef} id="orb" r="6" fill="#e6fbff" cx="188" cy="0" />
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
