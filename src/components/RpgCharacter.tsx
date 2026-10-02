"use client";

import Image from "next/image";
import { memo, useState, useEffect, useRef, type CSSProperties, type RefObject } from "react";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";
import type { LiveAudioVisualizer } from "@/components/VoiceInputControl";

export type CharacterGesture = "idle" | "finger" | "smoke" | "heart" | "thumbsup" | "watergun";

type EntranceStage = "hammock" | "alert" | "jumping" | "standing";

const sparkParticles = [
  [26, 30, 4.5],
  [134, 26, 4],
  [16, 70, 5],
  [144, 66, 4],
  [28, 114, 4.5],
  [132, 110, 5],
  [80, 16, 5]
] as const;

const REAL_AVATAR_POSE_PATHS = {
  idle: "/assets/character/mr_crazy_3d_idle.png",
  speaking: "/assets/character/mr_crazy_3d_gesturing.png",
  pointing: "/assets/character/mr_crazy_3d_pointing.png"
} as const;

function getRealAvatarPose(voiceState: VoiceState, gesture: CharacterGesture) {
  if (gesture === "finger" || gesture === "thumbsup" || gesture === "watergun") {
    return { name: "pointing", src: REAL_AVATAR_POSE_PATHS.pointing };
  }

  if (voiceState === "speaking") {
    return { name: "speaking", src: REAL_AVATAR_POSE_PATHS.speaking };
  }

  return { name: "idle", src: REAL_AVATAR_POSE_PATHS.idle };
}

export const RpgCharacter = memo(function RpgCharacter({
  crazyLevel,
  emotion,
  voiceState,
  gesture = "idle",
  isAwake = false,
  audioMetricsRef,
  onAwaken,
  onTap
}: Readonly<{
  crazyLevel: number;
  emotion: Emotion;
  voiceState: VoiceState;
  gesture?: CharacterGesture;
  isAwake?: boolean;
  audioMetricsRef?: RefObject<LiveAudioVisualizer>;
  onAwaken?: () => void;
  onTap?: () => void;
}>) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Parallax Pointer Tracking (olhos e cabeça seguem o cursor do usuário)
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  // Ciclo procedural de fonemas labiais realistas durante a fala
  const [animatedPhoneme, setPhoneme] = useState(0);
  const phoneme = voiceState === "speaking" ? animatedPhoneme : 0;
  // Animação de entrada: na rede descansando -> acorda quando o aluno falar -> pula pra posição de pé
  const [entranceStage, setEntranceStage] = useState<EntranceStage>(() => isAwake ? "standing" : "hammock");
  const wakingUpRef = useRef(false);

  // Piscar de olhos procedural realista (intervalo de 3s a 5.5s com micro double-blinks)
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    let timeoutId: number;
    let innerTimeout: number;
    const scheduleNextBlink = () => {
      const delay = 3000 + Math.random() * 2500;
      timeoutId = window.setTimeout(() => {
        setIsBlinking(true);
        innerTimeout = window.setTimeout(() => {
          setIsBlinking(false);
          if (Math.random() < 0.25) {
            window.setTimeout(() => {
              setIsBlinking(true);
              window.setTimeout(() => {
                setIsBlinking(false);
                scheduleNextBlink();
              }, 110);
            }, 80);
          } else {
            scheduleNextBlink();
          }
        }, 130);
      }, delay);
    };
    scheduleNextBlink();
    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(innerTimeout);
    };
  }, []);

  // Rastreamento natural do mouse/toque com amortecimento e retorno suave
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timeoutId: number | null = null;
    let lastMove = 0;
    const handlePointerMove = (e: PointerEvent) => {
      if (document.visibilityState === "hidden" || performance.now() - lastMove < 50) return;
      lastMove = performance.now();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.42;
      const dx = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth * 0.35)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight * 0.35)));
      setLookOffset({ x: dx, y: dy });
      containerRef.current.style.setProperty("--look-x", dx.toFixed(3));
      containerRef.current.style.setProperty("--look-y", dy.toFixed(3));

      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setLookOffset({ x: 0, y: 0 });
        if (containerRef.current) {
          containerRef.current.style.setProperty("--look-x", "0");
          containerRef.current.style.setProperty("--look-y", "0");
        }
      }, 2400);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  // Articulação labial e movimento reativo ao som durante a fala do professor
  useEffect(() => {
    if (voiceState !== "speaking") {
      setPhoneme(0);
      if (containerRef.current) {
        containerRef.current.style.setProperty("--live-level", "0");
        containerRef.current.style.setProperty("--live-head-bob", "0px");
      }
      return;
    }

    let rafId: number;
    let lastSwitchTime = 0;
    let fallbackIndex = 0;
    const phonemeSequence = [0, 1, 0, 2, 1, 3, 0, 2];

    const tick = (now: number) => {
      const metrics = audioMetricsRef?.current;
      const isCrazyAudio = metrics?.source === "crazy";
      const level = metrics?.level ?? 0;
      const bass = metrics?.bass ?? 0;
      const bands = metrics?.bands ?? [];

      if (isCrazyAudio && (level > 0.02 || bass > 0.02)) {
        // ÁUDIO REAL WebRTC: Boca e cabeça acompanham diretamente o som e as frequências
        const smoothBob = Math.min(3.2, level * 4.8 + bass * 2.2);
        if (containerRef.current) {
          containerRef.current.style.setProperty("--live-level", String(level));
          containerRef.current.style.setProperty("--live-head-bob", `${smoothBob.toFixed(1)}px`);
        }

        // Troca de fonema de acordo com o espectro e intensidade da fala a cada ~75ms
        if (now - lastSwitchTime > 75) {
          lastSwitchTime = now;

          if (level < 0.028) {
            // Pausa entre palavras: lábios relaxam em repouso natural
            setPhoneme(4);
          } else {
            const highBands = (bands[6] ?? 0) + (bands[7] ?? 0) + (bands[8] ?? 0);
            const lowBands = (bands[0] ?? 0) + (bands[1] ?? 0) + bass;

            if (lowBands > 0.48) {
              // Vogal redonda (O, U, W)
              setPhoneme(2);
            } else if (highBands > 0.4) {
              // Vogal aberta esticada (E, I)
              setPhoneme(1);
            } else if (level > 0.16) {
              // Vogal aberta cheia (A, O)
              setPhoneme(0);
            } else {
              // Consoante ou transição articulada
              setPhoneme(3);
            }
          }
        }
      } else {
        // Fallback procedural suave quando em áudio sintetizado ou sem métricas WebRTC
        if (now - lastSwitchTime > 115) {
          lastSwitchTime = now;
          fallbackIndex = (fallbackIndex + 1) % phonemeSequence.length;
          setPhoneme(phonemeSequence[fallbackIndex]);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      if (containerRef.current) {
        containerRef.current.style.setProperty("--live-level", "0");
        containerRef.current.style.setProperty("--live-head-bob", "0px");
      }
    };
  }, [voiceState, audioMetricsRef]);

  // Se o aluno começou a falar (isAwake) ou Mr. Crazy começou a falar, sai da rede e fica de pé imediatamente
  useEffect(() => {
    if (isAwake || voiceState === "speaking" || voiceState === "analyzing" || voiceState === "listening") {
      setEntranceStage("standing");
      wakingUpRef.current = false;
      onAwaken?.();
    }
  }, [isAwake, voiceState, onAwaken]);

  const handleStageClick = () => {
    // Se ainda estiver na rede ou pulando, acorda e fica de pé imediatamente
    if (entranceStage !== "standing") {
      setEntranceStage("standing");
      wakingUpRef.current = false;
      onAwaken?.();
      return;
    }
    onTap?.();
  };

  const activity = voiceState === "speaking" ? "speaking" : voiceState === "listening" ? "listening" : "idle";
  const characterViewBox = (entranceStage === "hammock" || entranceStage === "alert") ? "0 0 160 160" : "14 18 132 130";
  const shouldUseRealAvatar = entranceStage === "standing" || entranceStage === "jumping";
  const legacyEntranceStage = entranceStage as EntranceStage;
  const realAvatarPose = getRealAvatarPose(voiceState, gesture);

  return (
    <div
      ref={containerRef}
      className={`character-stage rpg-character-stage ${emotion} ${activity} gesture-${gesture} stage-${entranceStage} ${shouldUseRealAvatar ? "has-real-avatar" : ""} pose-${realAvatarPose.name}`}
      style={{
        "--rpg-energy": `${Math.max(0.25, crazyLevel / 100)}`,
        "--look-x": lookOffset.x,
        "--look-y": lookOffset.y,
      } as CSSProperties}
      role="button"
      tabIndex={0}
      onClick={handleStageClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleStageClick();
      }}
      aria-label={`Mr.Crazy 3D NPC ${entranceStage === "hammock" ? "descansando na rede" : activity === "speaking" ? "falando" : "pronto"} - Gesto: ${gesture}. Toque para interagir.`}
      title={entranceStage === "standing" ? "Toque no Mr.Crazy para interagir!" : "Mr.Crazy acordando para a aula!"}
    >
      {shouldUseRealAvatar && (
        <div className="mr-crazy-preview-layer" aria-hidden="true">
          <Image
            src={realAvatarPose.src}
            alt=""
            fill
            className="mr-crazy-preview-img"
            sizes="(max-width: 768px) 72vw, (max-width: 1200px) 46vw, 560px"
            priority
            draggable={false}
          />
        </div>
      )}
      {!shouldUseRealAvatar && (
      <svg
        className="rpg-character"
        viewBox={characterViewBox}
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        <defs>
          {/* Gradientes Volumétricos 3D com Iluminação & Subsurface Scatter */}
          <radialGradient id="npc-head-volume" cx="42%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#fff2eb" />
            <stop offset="48%" stopColor="#f8bfa8" />
            <stop offset="85%" stopColor="#e2876e" />
            <stop offset="100%" stopColor="#c86952" />
          </radialGradient>

          <linearGradient id="npc-skin-3d" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#ffeedd" />
            <stop offset="45%" stopColor="#f8bfa8" />
            <stop offset="100%" stopColor="#d9755d" />
          </linearGradient>

          <linearGradient id="npc-hair-3d" x1="25%" y1="0%" x2="75%" y2="100%">
            <stop offset="0%" stopColor="#ffb05f" />
            <stop offset="30%" stopColor="#f97316" />
            <stop offset="75%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>

          <linearGradient id="npc-hair-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="npc-beard-3d" x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="45%" stopColor="#ea580c" />
            <stop offset="85%" stopColor="#9a3412" />
            <stop offset="100%" stopColor="#631b08" />
          </linearGradient>

          <linearGradient id="npc-tunic-3d" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="28%" stopColor="#14b8a6" />
            <stop offset="75%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#115e59" />
          </linearGradient>

          <linearGradient id="npc-tunic-dark-3d" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#134e4a" />
            <stop offset="60%" stopColor="#0f3c39" />
            <stop offset="100%" stopColor="#0a2523" />
          </linearGradient>

          <linearGradient id="npc-cape-3d" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="35%" stopColor="#be123c" />
            <stop offset="80%" stopColor="#881337" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>

          <linearGradient id="npc-gold-3d" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#a16207" />
            <stop offset="100%" stopColor="#65350c" />
          </linearGradient>

          <linearGradient id="npc-leather-3d" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#9a3412" />
            <stop offset="55%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#3d1704" />
          </linearGradient>

          <linearGradient id="npc-trouser-3d" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <radialGradient id="npc-iris-3d" cx="38%" cy="38%" r="56%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="55%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>

          <radialGradient id="npc-crystal-staff" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#67e8f9" />
            <stop offset="70%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#082f49" />
          </radialGradient>

          <radialGradient id="npc-shadow-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.65)" />
            <stop offset="55%" stopColor="rgba(0,0,0,0.35)" />
            <stop offset="85%" stopColor="rgba(0,0,0,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <filter id="npc-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ================================================================= */}
        {/* CENA 1: REDE DE DESCANSO BALANÇANDO (ENTRADA)                     */}
        {/* ================================================================= */}
        {(legacyEntranceStage === "hammock" || legacyEntranceStage === "alert" || legacyEntranceStage === "jumping") && (
          <g className={`rpg-hammock-scene ${legacyEntranceStage === "jumping" ? "hammock-dropping" : ""}`}>
            {/* Cordas de sustentação nas extremidades com curvas suaves */}
            <path className="hammock-rope" d="M 4 48 Q 40 92 80 102 Q 120 92 156 48" fill="none" stroke="#a07855" strokeWidth="2.5" strokeLinecap="round" />
            <path className="hammock-rope-shadow" d="M 4 50 Q 40 94 80 104 Q 120 94 156 50" fill="none" stroke="#684b32" strokeWidth="1.5" strokeLinecap="round" />

            {/* Sombra da rede no chão */}
            <ellipse className="hammock-ground-shadow" cx="80" cy="144" rx="48" ry="6" fill="url(#npc-shadow-radial)" />

            <g className="hammock-sway-group">
              {/* Tecido da rede com caimento arredondado e sombra */}
              <path
                className="hammock-cloth-back"
                d="M 28 66 Q 80 114 132 66 Q 80 106 28 66 Z"
                fill="#0f3c39"
              />
              <path
                className="hammock-cloth"
                d="M 26 68 Q 80 118 134 68 Q 80 104 26 68 Z"
                fill="url(#npc-tunic-3d)"
              />

              {/* Travesseiro com cantos arredondados */}
              <rect x="36" y="78" width="18" height="12" rx="5" fill="#f1f5f9" />
              <rect x="38" y="80" width="14" height="8" rx="3.5" fill="#cbd5e1" />

              {/* Mr.Crazy Deitado Folgado */}
              <g className="mr-crazy-lying">
                {/* Corpo e Jaqueta arredondados */}
                <rect x="52" y="84" width="38" height="18" rx="6" fill="url(#npc-tunic-dark-3d)" />
                <rect x="56" y="86" width="30" height="14" rx="5" fill="url(#npc-tunic-3d)" />
                {/* Pernas cruzadas balançando */}
                <rect x="86" y="86" width="22" height="9" rx="4" fill="url(#npc-trouser-3d)" />
                <rect x="104" y="80" width="12" height="8" rx="4" fill="url(#npc-trouser-3d)" />
                {/* Pés / Botas arredondadas */}
                <rect x="106" y="88" width="14" height="6" rx="3" fill="url(#npc-leather-3d)" />
                <rect x="112" y="76" width="12" height="7" rx="3" fill="url(#npc-leather-3d)" />
                <circle cx="120" cy="79" r="2" fill="#ffffff" />
                {/* Cabeça relaxada no travesseiro */}
                <rect x="40" y="74" width="18" height="16" rx="8" fill="url(#npc-head-volume)" />
                {/* Cabelo espalhado no travesseiro */}
                <path d="M 34 70 C 32 66 40 64 54 68 C 50 74 38 78 34 70 Z" fill="url(#npc-hair-3d)" />

                {/* Expressão: Dormindo (Zzz) vs Alerta (Olhos arregalados) */}
                {legacyEntranceStage === "hammock" ? (
                  <>
                    <path d="M 44 80 Q 46.5 83 49 80" stroke="#4a1a12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    <path d="M 51 80 Q 53.5 83 56 80" stroke="#4a1a12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    <g className="hammock-zzz">
                      <text x="56" y="68" fill="#fde68a" fontSize="10" fontWeight="bold" fontFamily="monospace">z</text>
                      <text x="64" y="60" fill="#fde68a" fontSize="13" fontWeight="bold" fontFamily="monospace">Z</text>
                    </g>
                  </>
                ) : (
                  <>
                    <ellipse cx="46" cy="80" rx="3.5" ry="3.5" fill="#ffffff" />
                    <ellipse cx="53" cy="80" rx="3.5" ry="3.5" fill="#ffffff" />
                    <circle cx="46.5" cy="80" r="1.8" fill="#0f172a" />
                    <circle cx="53.5" cy="80" r="1.8" fill="#0f172a" />
                    <ellipse cx="49.5" cy="85" rx="3" ry="1.8" fill="#7f1d1d" />
                    <g className="alert-pop-bubble">
                      <rect x="58" y="44" width="64" height="20" rx="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="63" y="58" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                        ❗ OPA! ALUNO!
                      </text>
                    </g>
                  </>
                )}
              </g>
            </g>
          </g>
        )}

        {/* ================================================================= */}
        {/* CENA 2: MR.CRAZY DE PÉ — AVATAR 3D NPC ARREDONDADO & REALISTA      */}
        {/* ================================================================= */}
        {(legacyEntranceStage === "jumping" || legacyEntranceStage === "standing") && (
          <g className={`rpg-standing-group ${legacyEntranceStage === "jumping" ? "hero-landing-jump" : ""}`}>
            {/* Partículas de energia e magia arredondadas */}
            <g className="rpg-sparks">
              {sparkParticles.map(([x, y, r], index) => (
                <circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r={r * 0.45}
                  fill="url(#npc-gold-3d)"
                  filter="url(#npc-soft-glow)"
                  style={{ animationDelay: `${index * 140}ms` }}
                />
              ))}
            </g>

            {/* Sombra dinâmica nos pés (reage à respiração) */}
            <g className="rpg-shadow-pixels">
              <ellipse cx="80" cy="144" rx="38" ry="5.5" fill="url(#npc-shadow-radial)" />
              <ellipse cx="80" cy="143" rx="24" ry="3" fill="rgba(0,0,0,0.35)" />
            </g>

            <g className="rpg-hero">
              {/* Capa Vermelha Carmesim Fluida com Curvas e Dobras Reais */}
              <g className={`rpg-cape ${activity === "speaking" ? "cape-speaking" : ""}`}>
                {/* Camada traseira escura de profundidade */}
                <path
                  d="M 44 76 C 36 94 32 118 36 136 C 54 139 106 139 124 136 C 128 118 124 94 116 76 Z"
                  fill="#3c0a15"
                />
                {/* Camada principal de veludo carmesim com dobras suaves */}
                <path
                  d="M 46 78 C 38 98 36 122 40 134 C 52 131 72 133 80 131 C 88 133 108 131 120 134 C 124 122 122 98 114 78 Z"
                  fill="url(#npc-cape-3d)"
                />
                {/* Dobras de destaque e luz nas bordas */}
                <path
                  d="M 46 80 C 44 98 42 118 46 132"
                  stroke="#fb7185"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.6"
                />
                <path
                  d="M 114 80 C 116 98 118 118 114 132"
                  stroke="#fb7185"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.6"
                />
              </g>

              {/* Pernas, Calças e Botas de Aventureiro Esculpidas */}
              <g className={`rpg-legs ${activity === "speaking" ? "legs-speaking" : ""}`}>
                {/* Calça com dobra nos joelhos */}
                <path
                  className="rpg-trouser"
                  d="M 57 116 C 56 124 55 132 55 136 C 70 136 72 136 72 116 Z"
                  fill="url(#npc-trouser-3d)"
                />
                <path
                  className="rpg-trouser"
                  d="M 88 116 C 88 136 90 136 105 136 C 105 132 104 124 103 116 Z"
                  fill="url(#npc-trouser-3d)"
                />
                {/* Rugas da calça */}
                <path d="M 58 126 Q 64 128 70 126" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M 90 126 Q 96 128 102 126" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />

                {/* Botas de Aventureiro com Cano Dobrado e Fivelas Douradas */}
                {/* Bota esquerda */}
                <g className="rpg-boot">
                  <path
                    d="M 50 133 C 50 128 73 128 73 133 L 75 143 C 75 145 48 145 48 143 Z"
                    fill="url(#npc-leather-3d)"
                  />
                  {/* Cano dobrado da bota */}
                  <rect x="49" y="130" width="25" height="5.5" rx="2.5" fill="#9a3412" stroke="#541c08" strokeWidth="0.8" />
                  {/* Fivela dourada na bota */}
                  <rect x="58" y="136" width="6.5" height="4.5" rx="1.8" fill="url(#npc-gold-3d)" stroke="#713f12" strokeWidth="0.8" />
                  {/* Solado grosso de trilha */}
                  <rect x="47" y="142.5" width="28" height="3" rx="1.5" fill="#1e1b18" />
                </g>

                {/* Bota direita */}
                <g className="rpg-boot">
                  <path
                    d="M 87 133 C 87 128 110 128 110 133 L 112 143 C 112 145 85 145 85 143 Z"
                    fill="url(#npc-leather-3d)"
                  />
                  {/* Cano dobrado da bota */}
                  <rect x="86" y="130" width="25" height="5.5" rx="2.5" fill="#9a3412" stroke="#541c08" strokeWidth="0.8" />
                  {/* Fivela dourada na bota */}
                  <rect x="95" y="136" width="6.5" height="4.5" rx="1.8" fill="url(#npc-gold-3d)" stroke="#713f12" strokeWidth="0.8" />
                  {/* Solado grosso de trilha */}
                  <rect x="85" y="142.5" width="28" height="3" rx="1.5" fill="#1e1b18" />
                </g>
              </g>

              {/* Tronco, Túnica Azul-Petróleo e Cinto de Couro com Ouro */}
              <g className={`rpg-body ${activity === "speaking" ? "body-speaking" : ""}`}>
                {/* Túnica base azul-petróleo com corte arredondado */}
                <path
                  className="rpg-armor-dark"
                  d="M 48 76 C 46 88 44 104 46 114 C 46 116 114 116 114 114 C 116 104 114 88 112 76 C 96 73 64 73 48 76 Z"
                  fill="url(#npc-tunic-dark-3d)"
                />
                <path
                  className="rpg-armor"
                  d="M 52 78 C 50 89 48 102 50 112 C 60 114 100 114 110 112 C 112 102 110 89 108 78 C 94 75 66 75 52 78 Z"
                  fill="url(#npc-tunic-3d)"
                />

                {/* Linha central vertical com debrum dourado */}
                <rect x="79" y="78" width="2" height="33" rx="1" fill="url(#npc-gold-3d)" />

                {/* 3 Fivelas / Placas Douradas Quadradas Verticais (Conforme Mockup do Usuário) */}
                <g className="rpg-gold-plates">
                  {/* Placa 1 */}
                  <rect x="74" y="80" width="12" height="7.5" rx="2.5" fill="url(#npc-gold-3d)" stroke="#78350f" strokeWidth="0.8" />
                  <rect x="76.5" y="82" width="7" height="3.5" rx="1.2" fill="#542304" opacity="0.6" />
                  <circle cx="75.5" cy="83.8" r="0.8" fill="#ffffff" />

                  {/* Placa 2 */}
                  <rect x="74" y="90" width="12" height="7.5" rx="2.5" fill="url(#npc-gold-3d)" stroke="#78350f" strokeWidth="0.8" />
                  <rect x="76.5" y="92" width="7" height="3.5" rx="1.2" fill="#542304" opacity="0.6" />
                  <circle cx="75.5" cy="93.8" r="0.8" fill="#ffffff" />

                  {/* Placa 3 */}
                  <rect x="74" y="100" width="12" height="7.5" rx="2.5" fill="url(#npc-gold-3d)" stroke="#78350f" strokeWidth="0.8" />
                  <rect x="76.5" y="102" width="7" height="3.5" rx="1.2" fill="#542304" opacity="0.6" />
                  <circle cx="75.5" cy="103.8" r="0.8" fill="#ffffff" />
                </g>

                {/* Cinto de Couro com Grande Fivela Dourada */}
                <rect className="rpg-belt" x="48" y="108" width="64" height="8.5" rx="2.5" fill="url(#npc-leather-3d)" stroke="#3d1704" strokeWidth="0.8" />
                <rect className="rpg-buckle" x="73" y="105.5" width="14" height="13.5" rx="3.5" fill="url(#npc-gold-3d)" stroke="#65350c" strokeWidth="1.2" />
                <rect x="76" y="108.5" width="8" height="7.5" rx="2" fill="#451a03" />
                <rect x="79.5" y="107" width="2" height="10" rx="1" fill="url(#npc-gold-3d)" />

                {/* Gola da camisa branca sob a túnica */}
                <path className="rpg-collar" d="M 66 73 C 66 71 73 69 80 69 C 87 69 94 71 94 73 C 94 77 66 77 66 73 Z" fill="#f8fafc" />

                {/* Broche / Emblema no peito */}
                <rect className="rpg-emblem" x="61" y="85" width="7" height="7" rx="2" fill="#e11d48" stroke="#881337" strokeWidth="0.8" />
                <circle className="rpg-emblem-core" cx="64.5" cy="88.5" r="1.5" fill="#fecdd3" />
              </g>

              {/* Braço Esquerdo (Segurando grimório / livro de inglês encantado) */}
              <g className={`rpg-arm rpg-arm-left ${gesture === "heart" ? "arm-heart-left" : ""} ${activity === "speaking" ? "arm-speaking-support" : ""}`}>
                <path
                  className="rpg-armor-dark"
                  d="M 48 78 C 40 82 34 94 33 108 L 47 108 C 47 98 50 88 56 82 Z"
                  fill="url(#npc-tunic-3d)"
                />
                {/* Braçadeira de couro com rebites de metal */}
                <rect className="rpg-glove" x="30" y="106" width="18" height="14" rx="3" fill="url(#npc-leather-3d)" stroke="#3d1704" strokeWidth="0.8" />
                <circle cx="34" cy="113" r="1" fill="url(#npc-gold-3d)" />
                <circle cx="44" cy="113" r="1" fill="url(#npc-gold-3d)" />

                {gesture !== "heart" ? (
                  <g className="rpg-english-book">
                    {/* Capa de couro do grimório */}
                    <rect x="18" y="108" width="32" height="24" rx="4" fill="url(#npc-leather-3d)" stroke="#381303" strokeWidth="1.2" />
                    {/* Cantoneiras douradas de proteção */}
                    <path d="M 18 114 L 24 108 L 18 108 Z" fill="url(#npc-gold-3d)" />
                    <path d="M 18 126 L 24 132 L 18 132 Z" fill="url(#npc-gold-3d)" />
                    {/* Páginas do livro */}
                    <rect x="22" y="111" width="11" height="18" rx="2" fill="#fef3c7" />
                    <rect x="35" y="111" width="12" height="18" rx="2" fill="#fef3c7" />
                    {/* Fita marcadora dourada ("EN") */}
                    <path d="M 32 108 L 32 133 L 34.5 130 L 37 133 L 37 108 Z" fill="url(#npc-gold-3d)" />
                    {/* Letras EN estilizadas */}
                    <text x="23" y="122" fill="#78350f" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">EN</text>
                    {/* Mão segurando o livro com dedos arredondados */}
                    <path d="M 42 118 C 45 118 47 122 47 125 C 47 128 44 130 40 130 Z" fill="url(#npc-skin-3d)" />
                  </g>
                ) : (
                  <g className="rpg-hand-heart-left">
                    <rect x="67" y="89" width="9" height="7" rx="3.5" fill="url(#npc-skin-3d)" />
                  </g>
                )}
              </g>

              {/* Braço Direito: Idle (cajado mágico de mentor) ou Gestos Expressivos */}
              {gesture === "idle" && (
                <g className={`rpg-arm rpg-arm-right ${activity === "speaking" ? "arm-speaking-teaching" : ""}`}>
                  <path
                    className="rpg-armor-dark"
                    d="M 112 78 C 120 82 126 94 127 108 L 113 108 C 113 98 110 88 104 82 Z"
                    fill="url(#npc-tunic-3d)"
                  />
                  {/* Braçadeira de couro */}
                  <rect className="rpg-glove" x="112" y="106" width="18" height="14" rx="3" fill="url(#npc-leather-3d)" stroke="#3d1704" strokeWidth="0.8" />
                  <circle cx="116" cy="113" r="1" fill="url(#npc-gold-3d)" />
                  <circle cx="126" cy="113" r="1" fill="url(#npc-gold-3d)" />

                  {/* Mão segurando o cajado com dedos arredondados */}
                  <path d="M 118 116 C 122 116 124 120 124 124 C 124 127 120 129 116 129 Z" fill="url(#npc-skin-3d)" />

                  {/* Cajado do Professor Mr.Crazy com Cristal Mágico Arredondado */}
                  <g className={activity === "speaking" ? "rpg-staff-speaking" : ""}>
                    {/* Haste de madeira esculpida */}
                    <rect x="130" y="52" width="6.5" height="88" rx="3.25" fill="url(#npc-leather-3d)" stroke="#451a03" strokeWidth="0.8" />
                    <rect x="132" y="54" width="2.5" height="84" rx="1.25" fill="#b45309" />
                    {/* Engaste de ouro no topo */}
                    <path d="M 125 54 C 125 50 141 50 141 54 L 138 58 L 128 58 Z" fill="url(#npc-gold-3d)" stroke="#78350f" strokeWidth="0.8" />
                    {/* Cristal Mágico Cyan Radiante */}
                    <circle cx="133.25" cy="46" r="8.5" fill="url(#npc-crystal-staff)" filter="url(#npc-soft-glow)" />
                    <circle cx="131" cy="43.5" r="2.8" fill="#ffffff" />
                  </g>
                </g>
              )}

              {/* GESTO 1: APONTAR COM DEDO ("Manda bala! Agora é você!") */}
              {gesture === "finger" && (
                <g className="rpg-gesture-finger">
                  <path d="M 110 80 C 118 78 126 84 128 96 L 114 98 Z" fill="url(#npc-tunic-3d)" />
                  <rect x="102" y="70" width="18" height="16" rx="4" fill="url(#npc-leather-3d)" />
                  {/* Mão apontando pra frente com dedo indicador bem definido */}
                  <path
                    d="M 106 62 C 106 52 110 40 114 38 C 118 40 118 52 116 62 Z"
                    fill="url(#npc-skin-3d)"
                    stroke="#9a3412"
                    strokeWidth="1"
                  />
                  <rect x="110" y="42" width="4" height="16" rx="2" fill="#ffeedd" />
                  {/* Faíscas de energia no dedo */}
                  <circle className="rpg-sparkle-fx" cx="114" cy="34" r="2.5" fill="#ef4444" filter="url(#npc-soft-glow)" />
                </g>
              )}

              {/* GESTO 2: FUMAR CIGARRO (Comédia / Desespero) */}
              {gesture === "smoke" && (
                <g className="rpg-gesture-smoke">
                  <path d="M 110 80 C 116 78 122 84 124 96 L 112 98 Z" fill="url(#npc-tunic-3d)" />
                  <rect x="100" y="72" width="14" height="16" rx="4" fill="url(#npc-leather-3d)" />
                  <rect x="88" y="70" width="14" height="6" rx="3" fill="url(#npc-skin-3d)" />
                  <rect x="74" y="70" width="14" height="3.5" rx="1.5" fill="#ffffff" />
                  <rect className="smoke-ember-glow" x="70" y="70" width="4" height="3.5" rx="1.5" fill="#ef4444" filter="url(#npc-soft-glow)" />
                  <g className="rpg-smoke-plumes">
                    <circle className="rpg-smoke-p1" cx="64" cy="65" r="4.5" fill="rgba(226,232,240,0.7)" />
                    <circle className="rpg-smoke-p2" cx="58" cy="54" r="6.5" fill="rgba(203,213,225,0.5)" />
                    <circle className="rpg-smoke-p3" cx="52" cy="42" r="8.5" fill="rgba(148,163,184,0.3)" />
                  </g>
                </g>
              )}

              {/* GESTO 3: CORAÇÃO COM AS MÃOS */}
              {gesture === "heart" && (
                <g className="rpg-gesture-heart">
                  <path d="M 110 82 C 114 84 116 92 116 98 L 104 98 Z" fill="url(#npc-tunic-3d)" />
                  <rect x="84" y="89" width="9" height="7" rx="3.5" fill="url(#npc-skin-3d)" />
                  <g className="rpg-heart-pulse">
                    <path d="M 80 86 C 80 82, 74 82, 74 86 C 74 91, 80 95, 80 97 C 80 95, 86 91, 86 86 C 86 82, 80 82, 80 86 Z" fill="#f43f5e" filter="url(#npc-soft-glow)" />
                    <circle cx="77" cy="85" r="1.5" fill="#ffffff" />
                  </g>
                </g>
              )}

              {/* GESTO 4: JOINHA (THUMBS UP) */}
              {gesture === "thumbsup" && (
                <g className="rpg-gesture-thumbsup">
                  <path d="M 110 80 C 118 78 124 84 126 96 L 112 98 Z" fill="url(#npc-tunic-3d)" />
                  <rect x="104" y="74" width="16" height="14" rx="4" fill="url(#npc-leather-3d)" />
                  {/* Polegar pra cima arredondado e firme */}
                  <path
                    d="M 112 68 C 110 58 114 48 118 47 C 122 48 124 58 122 68 Z"
                    fill="url(#npc-skin-3d)"
                    stroke="#9a3412"
                    strokeWidth="1"
                  />
                  <rect x="115" y="50" width="4" height="15" rx="2" fill="#ffeedd" />
                  {/* Estrela dourada de aprovação */}
                  <g className="rpg-thumb-sparkle">
                    <path d="M 126 50 L 128 44 L 130 50 L 136 52 L 130 54 L 128 60 L 126 54 L 120 52 Z" fill="url(#npc-gold-3d)" filter="url(#npc-soft-glow)" />
                    <circle cx="128" cy="52" r="2" fill="#ffffff" />
                  </g>
                </g>
              )}

              {/* GESTO 5: ARMINHA D'ÁGUA DE BRINQUEDO (WATERGUN) */}
              {gesture === "watergun" && (
                <g className="rpg-gesture-watergun">
                  <path d="M 110 80 C 118 78 124 84 126 96 L 112 98 Z" fill="url(#npc-tunic-3d)" />
                  <rect x="102" y="74" width="16" height="14" rx="4" fill="url(#npc-leather-3d)" />
                  {/* Pistola de água neon arredondada */}
                  <rect x="74" y="64" width="28" height="11" rx="4" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
                  <rect x="78" y="57" width="16" height="8" rx="4" fill="#38bdf8" opacity="0.9" />
                  <rect x="70" y="66" width="6" height="5" rx="2" fill="#ea580c" />
                  <rect x="88" y="73" width="8" height="10" rx="3" fill="#f97316" />
                  {/* Jatos de água espirrando */}
                  <g className="water-squirt-stream">
                    <circle cx="64" cy="68" r="3.5" fill="#0284c7" />
                    <circle cx="53" cy="67" r="4" fill="#38bdf8" />
                    <circle cx="41" cy="69" r="4.5" fill="#0ea5e9" />
                    <path d="M 68 68 Q 50 66 30 72" stroke="#38bdf8" strokeWidth="2.5" fill="none" strokeDasharray="4 2" strokeLinecap="round" />
                  </g>
                </g>
              )}

              {/* ============================================================= */}
              {/* CABEÇA E ROSTO ARREDONDADO, REALISTA & VOLUMÉTRICO            */}
              {/* ============================================================= */}
              <g
                className="rpg-head"
                style={{
                  transform: `translate(${lookOffset.x * 3.2}px, calc(${lookOffset.y * 2.1}px + var(--live-head-bob, 0px))) rotate(${lookOffset.x * 3.8}deg)`,
                  transition: "transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)"
                }}
              >
                {/* Cabelo Traseiro / Base estilizada */}
                <path
                  className="rpg-hair-dark"
                  d="M 44 38 C 42 26 56 20 80 20 C 104 20 118 26 116 38 C 118 52 114 66 112 74 C 108 72 108 65 106 58 C 106 42 100 34 80 34 C 60 34 54 42 54 58 C 52 65 52 72 48 74 C 46 66 42 52 44 38 Z"
                  fill="url(#npc-hair-3d)"
                />

                {/* Crânio e Pele do Rosto Arredondado */}
                <path
                  className="rpg-skin"
                  d="M 54 44 C 54 36 64 34 80 34 C 96 34 106 36 106 44 C 106 60 102 74 80 78 C 58 74 54 60 54 44 Z"
                  fill="url(#npc-head-volume)"
                />

                {/* Sombra de profundidade sob o queixo */}
                <path
                  className="rpg-skin-shadow"
                  d="M 58 68 C 66 74 74 76 80 76 C 86 76 94 74 102 68 C 98 75 90 78 80 78 C 70 78 62 75 58 68 Z"
                  fill="#c86952"
                  opacity="0.7"
                />

                {/* Orelhas Arredondadas com Detalhe Interno */}
                <g className="rpg-ear">
                  <path d="M 49 52 C 46 52 45 56 45 61 C 45 65 48 68 53 68 Z" fill="url(#npc-skin-3d)" />
                  <path d="M 50 56 C 48 57 48 61 50 63" stroke="#b2533e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </g>
                <g className="rpg-ear">
                  <path d="M 111 52 C 114 52 115 56 115 61 C 115 65 112 68 107 68 Z" fill="url(#npc-skin-3d)" />
                  <path d="M 110 56 C 112 57 112 61 110 63" stroke="#b2533e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </g>

                {/* Barba Arredondada e Encorpada (Estilo Turnaround do NPC) */}
                <g className="rpg-beard">
                  {/* Barba que contorna a mandíbula até o queixo */}
                  <path
                    d="M 54 56 C 52 68 56 80 68 86 C 74 89 86 89 92 86 C 104 80 108 68 106 56 C 102 67 96 78 88 81 C 82 83 78 83 72 81 C 64 78 58 67 54 56 Z"
                    fill="url(#npc-beard-3d)"
                  />
                  {/* Bigode arredondado conectado acima dos lábios */}
                  <path
                    d="M 68 66 C 72 65 77 67 80 69 C 83 67 88 65 92 66 C 96 68 98 72 94 74 C 88 74 83 71 80 72 C 77 71 72 74 66 74 C 62 72 64 68 68 66 Z"
                    fill="url(#npc-beard-3d)"
                  />
                </g>

                {/* Mechas de Cabelo Volumosas e Arredondadas (Topo e Franja) */}
                <g className="rpg-hair-hot">
                  {/* Tufo central para cima */}
                  <path d="M 72 26 C 68 16 78 14 84 20 C 84 26 78 30 72 26 Z" fill="url(#npc-hair-highlight)" />
                  <path d="M 80 24 C 84 14 96 16 92 26 C 88 28 84 28 80 24 Z" fill="url(#npc-hair-highlight)" />
                  {/* Mecha lateral esquerda */}
                  <path d="M 52 38 C 44 26 56 22 66 26 C 62 34 56 38 52 38 Z" fill="url(#npc-hair-3d)" />
                  {/* Mecha lateral direita */}
                  <path d="M 108 38 C 116 26 104 22 94 26 C 98 34 104 38 108 38 Z" fill="url(#npc-hair-3d)" />
                  {/* Brilho suave no topo do cabelo */}
                  <path d="M 68 22 Q 80 18 92 22" stroke="#fed7aa" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
                </g>

                {/* Sobrancelhas Arqueadas Expressivas */}
                <g className={`rpg-brows ${gesture === "finger" ? "brows-angry" : gesture === "heart" ? "brows-happy" : activity === "listening" ? "brows-listening" : activity === "speaking" ? "brows-speaking" : ""}`}>
                  <path d="M 58 49 C 63 46 72 47 75 50 C 73 51.5 64 49.5 59 51.5 Z" fill="#631b08" />
                  <path d="M 102 49 C 97 46 88 47 85 50 C 87 51.5 96 49.5 101 51.5 Z" fill="#631b08" />
                </g>

                {/* Olhos Vivos Arredondados com Pupilas e Reflexos Vivos */}
                <g className={`rpg-eyes ${activity === "listening" ? "eyes-listening" : gesture === "smoke" ? "eyes-chill" : gesture === "thumbsup" ? "eyes-wink" : ""}`}>
                  {/* Olho esquerdo */}
                  <rect className="rpg-eye-white" x="61" y="52" width="14" height="10.5" rx="5.25" fill="#ffffff" />
                  <g
                    className="pupil-left-group"
                    style={{
                      transform: `translate(${lookOffset.x * 2.4}px, ${lookOffset.y * 1.6}px)`,
                      transition: "transform 0.08s cubic-bezier(0.2, 0.8, 0.2, 1)"
                    }}
                  >
                    <circle className="rpg-pupil" cx="67.5" cy="57" r="4.2" fill="url(#npc-iris-3d)" />
                    <circle cx="67.5" cy="57" r="2.2" fill="#0f172a" />
                    <circle className="rpg-eye-shine" cx="66" cy="55.5" r="1.3" fill="#ffffff" />
                    <circle cx="69" cy="58.2" r="0.7" fill="#ffffff" />
                  </g>
                  {/* Pálpebra esquerda (Piscar procedural) */}
                  <rect
                    x="60.5"
                    y="51.5"
                    width="15"
                    height="11.5"
                    rx="5.5"
                    fill="url(#npc-head-volume)"
                    style={{
                      transformOrigin: "67.5px 52px",
                      transform: isBlinking ? "scaleY(1)" : "scaleY(0)",
                      transition: "transform 0.07s ease-in-out"
                    }}
                  />

                  {/* Olho direito */}
                  <rect className="rpg-eye-white" x="85" y="52" width="14" height="10.5" rx="5.25" fill="#ffffff" />
                  <g
                    className="pupil-right-group"
                    style={{
                      transform: `translate(${lookOffset.x * 2.4}px, ${lookOffset.y * 1.6}px)`,
                      transition: "transform 0.08s cubic-bezier(0.2, 0.8, 0.2, 1)"
                    }}
                  >
                    <circle className="rpg-pupil" cx="92.5" cy="57" r="4.2" fill="url(#npc-iris-3d)" />
                    <circle cx="92.5" cy="57" r="2.2" fill="#0f172a" />
                    <circle className="rpg-eye-shine" cx="91" cy="55.5" r="1.3" fill="#ffffff" />
                    <circle cx="94" cy="58.2" r="0.7" fill="#ffffff" />
                  </g>
                  {/* Pálpebra direita (Piscar procedural) */}
                  <rect
                    x="84.5"
                    y="51.5"
                    width="15"
                    height="11.5"
                    rx="5.5"
                    fill="url(#npc-head-volume)"
                    style={{
                      transformOrigin: "92.5px 52px",
                      transform: isBlinking ? "scaleY(1)" : "scaleY(0)",
                      transition: "transform 0.07s ease-in-out"
                    }}
                  />
                </g>

                {/* Nariz Arredondado com Sombra Suave e Brilho */}
                <g className="rpg-nose">
                  <path d="M 77 55 C 77 52 83 52 83 55 C 84 61 86 63 80 63 C 74 63 76 61 77 55 Z" fill="#d9755d" />
                  <circle cx="80" cy="61.5" r="1.5" fill="#ffeedd" />
                </g>

                {/* Boca Articulada Hiper-Realista: Sincronia Fonética WebRTC com Curvas Suaves */}
                <g className={`rpg-mouth ${activity === "speaking" ? "mouth-speaking-live" : gesture === "smoke" ? "mouth-smoke" : ""}`}>
                  {activity === "speaking" ? (
                    <g className="rpg-phonemes-active">
                      {phoneme === 0 && (
                        /* Fonema Aberto A/O: boca redonda aberta mostrando dentes superiores e língua */
                        <g className="phoneme-open-a">
                          <path d="M 68 68 C 68 65 92 65 92 68 C 92 80 68 80 68 68 Z" fill="#3b0a12" />
                          <path d="M 71 67 Q 80 69 89 67 L 88 70 Q 80 72 72 70 Z" fill="#ffffff" />
                          <ellipse cx="80" cy="76" rx="6.5" ry="3.5" fill="#f43f5e" />
                        </g>
                      )}
                      {phoneme === 1 && (
                        /* Fonema Sorriso E/I: boca larga mostrando dentes cerrados */
                        <g className="phoneme-wide-e">
                          <path d="M 66 70 C 66 67 94 67 94 70 C 94 77 66 77 66 70 Z" fill="#3b0a12" />
                          <path d="M 69 69 Q 80 71 91 69 L 90 73 Q 80 75 70 73 Z" fill="#ffffff" />
                          <path d="M 73 74 Q 80 76 87 74" stroke="#f43f5e" strokeWidth="1.5" fill="none" />
                        </g>
                      )}
                      {phoneme === 2 && (
                        /* Fonema Redondo U/O/W: boca arredondada estreita projetada */
                        <g className="phoneme-round-o">
                          <ellipse cx="80" cy="73" rx="7" ry="6.5" fill="#3b0a12" />
                          <ellipse cx="80" cy="73" rx="4.5" ry="4" fill="#1c0508" />
                          <path d="M 76 70 Q 80 71 84 70" stroke="#ffffff" strokeWidth="1.2" fill="none" />
                          <circle cx="80" cy="75.5" r="2.2" fill="#f43f5e" />
                        </g>
                      )}
                      {phoneme === 3 && (
                        /* Fonema Consoante M/P/T: lábios quase fechados */
                        <g className="phoneme-consonant">
                          <rect x="68" y="71" width="24" height="4.5" rx="2.25" fill="#3b0a12" />
                          <rect x="71" y="72" width="18" height="2.5" rx="1.2" fill="#ffffff" />
                        </g>
                      )}
                      {phoneme === 4 && (
                        /* Fonema Pausa Natural: lábios em repouso durante silêncio entre palavras */
                        <g className="phoneme-rest-live">
                          <rect x="70" y="71.5" width="20" height="4" rx="2" fill="#3b0a12" />
                          <path d="M 72 73.5 Q 80 75 88 73.5" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                        </g>
                      )}
                    </g>
                  ) : (
                    <g className="rpg-mouth-rest">
                      <rect className="rpg-mouth-dark" x="70" y="71" width="20" height="4.5" rx="2.25" fill="#4a0e17" />
                      <path className="rpg-mouth-glow" d="M 73 73 Q 80 75.5 87 73" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    </g>
                  )}
                </g>
              </g>
            </g>
          </g>
        )}
      </svg>
      )}
      <div className="character-glow" aria-hidden="true" />
    </div>
  );
});
