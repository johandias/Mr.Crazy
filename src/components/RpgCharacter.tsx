"use client";

import { memo, useState, useEffect, useRef, type CSSProperties } from "react";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";

export type CharacterGesture = "idle" | "finger" | "smoke" | "heart" | "thumbsup" | "watergun";

type EntranceStage = "hammock" | "alert" | "jumping" | "standing";

const sparkPixels = [
  [28, 32],
  [132, 28],
  [18, 72],
  [142, 68],
  [30, 115],
  [130, 112],
  [79, 18]
] as const;

export const RpgCharacter = memo(function RpgCharacter({
  crazyLevel,
  emotion,
  voiceState,
  gesture = "idle",
  onTap
}: Readonly<{
  crazyLevel: number;
  emotion: Emotion;
  voiceState: VoiceState;
  gesture?: CharacterGesture;
  onTap?: () => void;
}>) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Parallax Pointer Tracking (olhos e cabeça seguem o cursor do usuário)
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  // Ciclo procedural de fonemas labiais realistas durante a fala
  const [animatedPhoneme, setPhoneme] = useState(0);
  const phoneme = voiceState === "speaking" ? animatedPhoneme : 0;
  // Animação inicial de entrada: na rede descansando -> vê gente -> pula pra posição normal
  const [entranceStage, setEntranceStage] = useState<EntranceStage>("hammock");

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

      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setLookOffset({ x: 0, y: 0 });
      }, 2400);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  // Articulação labial orgânica com cadência silábica realista durante a fala
  useEffect(() => {
    if (voiceState !== "speaking") {
      setPhoneme(0);
      return;
    }
    const phonemeCadence = [
      { phoneme: 1, duration: 140 },
      { phoneme: 0, duration: 170 },
      { phoneme: 3, duration: 90 },
      { phoneme: 2, duration: 160 },
      { phoneme: 0, duration: 130 },
      { phoneme: 1, duration: 110 },
      { phoneme: 3, duration: 80 }
    ];
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const nextPhoneme = () => {
      const current = phonemeCadence[step];
      setPhoneme(current.phoneme);
      step = (step + 1) % phonemeCadence.length;
      timer = setTimeout(nextPhoneme, current.duration);
    };

    nextPhoneme();
    return () => clearTimeout(timer);
  }, [voiceState]);

  useEffect(() => {
    // 1. Rede balançando por 1.8 segundos
    const alertTimer = setTimeout(() => {
      setEntranceStage("alert");
    }, 1800);

    // 2. Vê que tem gente e dá o pulo
    const jumpTimer = setTimeout(() => {
      setEntranceStage("jumping");
    }, 2400);

    // 3. Aterrissa de pé e fica pronto
    const standTimer = setTimeout(() => {
      setEntranceStage("standing");
    }, 3100);

    return () => {
      clearTimeout(alertTimer);
      clearTimeout(jumpTimer);
      clearTimeout(standTimer);
    };
  }, []);

  const handleStageClick = () => {
    // Se ainda estiver na rede ou pulando, clica para ficar de pé imediatamente
    if (entranceStage !== "standing") {
      setEntranceStage("standing");
      return;
    }
    onTap?.();
  };

  const activity = voiceState === "speaking" ? "speaking" : voiceState === "listening" ? "listening" : "idle";

  return (
    <div
      ref={containerRef}
      className={`character-stage rpg-character-stage ${emotion} ${activity} gesture-${gesture} stage-${entranceStage}`}
      style={{ "--rpg-energy": `${Math.max(0.25, crazyLevel / 100)}` } as CSSProperties}
      role="button"
      tabIndex={0}
      onClick={handleStageClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleStageClick();
      }}
      aria-label={`Mr.Crazy ${entranceStage === "hammock" ? "descansando na rede" : activity === "speaking" ? "falando" : "pronto"} - Gesto: ${gesture}. Toque para interagir.`}
      title={entranceStage === "standing" ? "Toque no Mr.Crazy para trocar de reação!" : "Mr.Crazy acordando para a aula!"}
    >
      <svg className="rpg-character" viewBox="0 0 160 160" shapeRendering="crispEdges" aria-hidden="true">
        {/* ================================================================= */}
        {/* CENA 1: REDE DE DESCANSO BALANÇANDO (ENTRADA) */}
        {/* ================================================================= */}
        {(entranceStage === "hammock" || entranceStage === "alert" || entranceStage === "jumping") && (
          <g className={`rpg-hammock-scene ${entranceStage === "jumping" ? "hammock-dropping" : ""}`}>
            {/* Cordas de sustentação nas extremidades */}
            <path className="hammock-rope" d="M 4 48 Q 40 92 80 102 Q 120 92 156 48" fill="none" stroke="#a07855" strokeWidth="2.5" />
            <path className="hammock-rope-shadow" d="M 4 50 Q 40 94 80 104 Q 120 94 156 50" fill="none" stroke="#684b32" strokeWidth="1.5" />

            {/* Sombra da rede no chão */}
            <ellipse className="hammock-ground-shadow" cx="80" cy="144" rx="48" ry="6" fill="rgba(0,0,0,0.3)" />

            {/* O conjunto da rede e o personagem deitado balançando */}
            <g className={`hammock-swinger ${entranceStage === "alert" ? "hammock-alert" : ""}`}>
              {/* Tecido da rede listrado em pixel art */}
              <g className="hammock-fabric">
                <path d="M 28 78 Q 80 120 132 78 Q 80 106 28 78 Z" fill="#d97706" />
                <path d="M 32 82 Q 80 122 128 82 Q 80 110 32 82 Z" fill="#b45309" />
                <path d="M 42 90 Q 80 123 118 90 Q 80 113 42 90 Z" fill="#92400e" />
                {/* Franjas da rede */}
                <rect x="46" y="112" width="4" height="6" fill="#fef3c7" />
                <rect x="58" y="115" width="4" height="7" fill="#fde68a" />
                <rect x="70" y="117" width="4" height="8" fill="#fef3c7" />
                <rect x="82" y="117" width="4" height="8" fill="#fde68a" />
                <rect x="94" y="115" width="4" height="7" fill="#fef3c7" />
                <rect x="106" y="112" width="4" height="6" fill="#fde68a" />
              </g>

              {/* Travesseiro */}
              <rect x="36" y="78" width="18" height="12" rx="3" fill="#e2e8f0" />
              <rect x="38" y="80" width="14" height="8" fill="#cbd5e1" />

              {/* Mr.Crazy Deitado Folgado */}
              <g className="mr-crazy-lying">
                {/* Corpo e Jaqueta */}
                <rect x="52" y="84" width="38" height="18" fill="#163d45" />
                <rect x="56" y="86" width="30" height="14" fill="#317b89" />
                {/* Pernas cruzadas balançando */}
                <rect x="86" y="86" width="22" height="9" fill="#202633" />
                <rect x="104" y="80" width="12" height="8" fill="#202633" />
                {/* Pés / Tênis com um pé balançando pra cima */}
                <rect x="106" y="88" width="14" height="6" fill="#7a2a1a" />
                <rect x="112" y="76" width="12" height="7" fill="#8f3220" />
                <rect x="118" y="77" width="5" height="4" fill="#ffffff" />
                {/* Cabeça relaxada no travesseiro */}
                <rect x="40" y="74" width="18" height="16" fill="#ef9a85" />
                {/* Cabelo espalhado no travesseiro */}
                <rect x="34" y="70" width="20" height="8" fill="#d85337" />
                <rect x="32" y="76" width="8" height="12" fill="#bf4228" />
                <rect x="42" y="67" width="12" height="6" fill="#ffb05f" />

                {/* Expressão: Dormindo (Zzz) vs Alerta (Olhos arregalados) */}
                {entranceStage === "hammock" ? (
                  <>
                    {/* Olhos fechados roncando tranquilo */}
                    <rect x="44" y="80" width="5" height="2" fill="#4a1a12" />
                    <rect x="51" y="80" width="5" height="2" fill="#4a1a12" />
                    {/* Zzz flutuante */}
                    <g className="hammock-zzz">
                      <text x="56" y="68" fill="#fde68a" fontSize="10" fontWeight="bold" fontFamily="monospace">z</text>
                      <text x="64" y="60" fill="#fde68a" fontSize="13" fontWeight="bold" fontFamily="monospace">Z</text>
                    </g>
                  </>
                ) : (
                  <>
                    {/* Olhos arregalados: VIU QUE TEM GENTE! */}
                    <rect x="43" y="77" width="6" height="6" fill="#ffffff" />
                    <rect x="50" y="77" width="6" height="6" fill="#ffffff" />
                    <rect x="45" y="79" width="3" height="3" fill="#1e293b" />
                    <rect x="52" y="79" width="3" height="3" fill="#1e293b" />
                    <rect x="46" y="84" width="5" height="3" fill="#7f1d1d" />
                    {/* Balão de susto "❗ OPA!" */}
                    <g className="alert-pop-bubble">
                      <rect x="58" y="44" width="64" height="20" rx="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
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
        {/* CENA 2: MR.CRAZY DE PÉ (ALTA DEFINIÇÃO DE PIXELS E ANIMAÇÃO VIVA) */}
        {/* ================================================================= */}
        {(entranceStage === "jumping" || entranceStage === "standing") && (
          <g className={`rpg-standing-group ${entranceStage === "jumping" ? "hero-landing-jump" : ""}`}>
            {/* Partículas de energia e magia */}
            <g className="rpg-sparks">
              {sparkPixels.map(([x, y], index) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" style={{ animationDelay: `${index * 120}ms` }} />
              ))}
            </g>

            {/* Sombra dinâmica nos pés */}
            <g className="rpg-shadow-pixels">
              <ellipse cx="80" cy="144" rx="38" ry="5" fill="rgba(0,0,0,0.4)" />
              <ellipse cx="80" cy="143" rx="26" ry="3" fill="rgba(0,0,0,0.25)" />
            </g>

            <g className="rpg-hero">
              {/* Capa com tecido e sombras multicamada */}
              <g className="rpg-cape">
                <rect x="46" y="80" width="68" height="48" fill="#4a121c" />
                <rect x="42" y="88" width="76" height="32" fill="#6d1b2a" />
                <rect x="48" y="118" width="64" height="14" fill="#882234" />
                <rect x="44" y="124" width="12" height="8" fill="#3c0e16" />
                <rect x="104" y="124" width="12" height="8" fill="#3c0e16" />
              </g>

              {/* Pernas, Calças e Botas com cadarços e solados */}
              <g className="rpg-legs">
                {/* Calça com dobra nos joelhos */}
                <rect className="rpg-trouser" x="57" y="117" width="18" height="22" fill="#1e2530" />
                <rect className="rpg-trouser" x="85" y="117" width="18" height="22" fill="#1e2530" />
                <rect x="59" y="125" width="14" height="3" fill="#2d3748" />
                <rect x="87" y="125" width="14" height="3" fill="#2d3748" />

                {/* Botas detalhadas com solado e fivelas */}
                <rect className="rpg-boot" x="52" y="134" width="25" height="9" fill="#521d13" />
                <rect className="rpg-boot" x="83" y="134" width="25" height="9" fill="#521d13" />
                <rect x="51" y="141" width="27" height="3" fill="#2d0e08" />
                <rect x="82" y="141" width="27" height="3" fill="#2d0e08" />
                <rect x="62" y="136" width="5" height="3" fill="#f6ad55" />
                <rect x="93" y="136" width="5" height="3" fill="#f6ad55" />
              </g>

              {/* Tronco, Jaqueta e Cinto */}
              <g className="rpg-body">
                <rect className="rpg-armor-dark" x="48" y="76" width="64" height="46" fill="#163d45" />
                <rect className="rpg-armor" x="54" y="80" width="52" height="38" fill="#317b89" />
                {/* Linha central do zíper / jaqueta */}
                <rect x="78" y="80" width="4" height="34" fill="#235c67" />
                <rect x="79" y="81" width="2" height="32" fill="#e2e8f0" />
                {/* Cinto com fivela brilhante */}
                <rect className="rpg-belt" x="50" y="108" width="60" height="8" fill="#3d2817" />
                <rect className="rpg-buckle" x="74" y="106" width="12" height="11" fill="#f59e0b" />
                <rect x="77" y="109" width="6" height="5" fill="#fef08a" />
                <rect className="rpg-collar" x="65" y="74" width="30" height="11" fill="#f1f5f9" />
                <rect className="rpg-emblem" x="75" y="88" width="10" height="10" fill="#e11d48" />
                <rect className="rpg-emblem-core" x="78" y="91" width="4" height="4" fill="#fecdd3" />
              </g>

              {/* Braço Esquerdo (Segurando grimório / livro de inglês) */}
              <g className={`rpg-arm rpg-arm-left ${gesture === "heart" ? "arm-heart-left" : ""}`}>
                <rect className="rpg-armor-dark" x="35" y="82" width="17" height="33" fill="#163d45" />
                <rect className="rpg-glove" x="32" y="107" width="18" height="14" fill="#3d2817" />
                {gesture !== "heart" ? (
                  <g className="rpg-english-book">
                    <rect x="20" y="110" width="32" height="22" rx="2" fill="#7c2d12" stroke="#451a03" strokeWidth="1" />
                    <rect x="23" y="113" width="11" height="16" fill="#fef3c7" />
                    <rect x="37" y="113" width="11" height="16" fill="#fef3c7" />
                    <text x="25" y="124" fill="#7c2d12" fontSize="8" fontWeight="bold" fontFamily="sans-serif">EN</text>
                    <rect x="39" y="117" width="7" height="2" fill="#92400e" />
                    <rect x="39" y="121" width="5" height="2" fill="#92400e" />
                  </g>
                ) : (
                  <g className="rpg-hand-heart-left">
                    <rect x="67" y="89" width="9" height="7" fill="#ef9a85" />
                  </g>
                )}
              </g>

              {/* Braço Direito: Idle (cajado de mentor) ou Gestos Especiais */}
              {gesture === "idle" && (
                <g className={`rpg-arm rpg-arm-right ${activity === "speaking" ? "arm-speaking-teaching" : ""}`}>
                  <rect className="rpg-armor-dark" x="108" y="82" width="17" height="33" fill="#163d45" />
                  <rect className="rpg-glove" x="110" y="107" width="18" height="14" fill="#3d2817" />
                  {/* Cajado do Professor Mr.Crazy */}
                  <rect x="130" y="52" width="7" height="88" fill="#78350f" />
                  <rect x="132" y="54" width="3" height="84" fill="#b45309" />
                  <rect x="124" y="40" width="19" height="19" rx="3" fill="#0284c7" />
                  <rect x="128" y="44" width="11" height="11" fill="#38bdf8" />
                  <rect x="131" y="47" width="5" height="5" fill="#ffffff" />
                </g>
              )}

              {/* GESTO 1: DAR O DEDO */}
              {gesture === "finger" && (
                <g className="rpg-gesture-finger">
                  <rect x="104" y="80" width="16" height="24" fill="#163d45" />
                  <rect x="102" y="70" width="18" height="16" fill="#317b89" />
                  <rect x="98" y="60" width="20" height="14" fill="#3d2817" />
                  <rect x="100" y="61" width="16" height="12" fill="#ef9a85" />
                  {/* Dedo do meio empinado */}
                  <rect x="104" y="40" width="8" height="22" fill="#ef9a85" stroke="#991b1b" strokeWidth="1" />
                  <rect x="106" y="42" width="4" height="18" fill="#fca5a5" />
                  {/* Faíscas vermelhas de fúria */}
                  <rect className="rpg-sparkle-fx" x="100" y="34" width="4" height="4" fill="#ef4444" />
                  <rect className="rpg-sparkle-fx" x="112" y="36" width="4" height="4" fill="#ef4444" />
                </g>
              )}

              {/* GESTO 2: FUMAR CIGARRO */}
              {gesture === "smoke" && (
                <g className="rpg-gesture-smoke">
                  <rect x="106" y="80" width="16" height="26" fill="#163d45" />
                  <rect x="92" y="70" width="17" height="12" fill="#ef9a85" />
                  <rect x="101" y="74" width="11" height="14" fill="#3d2817" />
                  <rect x="85" y="70" width="8" height="4" fill="#d97706" />
                  <rect x="71" y="70" width="14" height="4" fill="#ffffff" />
                  <rect className="smoke-ember-glow" x="67" y="70" width="4" height="4" fill="#ef4444" />
                  {/* Nuvens volumosas de fumaça subindo em espiral */}
                  <g className="rpg-smoke-plumes">
                    <circle className="rpg-smoke-p1" cx="64" cy="65" r="4" fill="rgba(226,232,240,0.7)" />
                    <circle className="rpg-smoke-p2" cx="58" cy="54" r="6" fill="rgba(203,213,225,0.5)" />
                    <circle className="rpg-smoke-p3" cx="52" cy="42" r="8" fill="rgba(148,163,184,0.3)" />
                  </g>
                </g>
              )}

              {/* GESTO 3: FAZER CORAÇÃO COM AS MÃOS */}
              {gesture === "heart" && (
                <g className="rpg-gesture-heart">
                  <rect x="108" y="82" width="16" height="28" fill="#163d45" />
                  <rect x="84" y="89" width="9" height="7" fill="#ef9a85" />
                  <g className="rpg-heart-pulse">
                    <path d="M 80 86 C 80 82, 74 82, 74 86 C 74 91, 80 95, 80 97 C 80 95, 86 91, 86 86 C 86 82, 80 82, 80 86 Z" fill="#f43f5e" />
                    <rect x="76" y="85" width="2" height="2" fill="#ffffff" />
                  </g>
                </g>
              )}

              {/* GESTO 4: JOINHA (THUMBS UP) */}
              {gesture === "thumbsup" && (
                <g className="rpg-gesture-thumbsup">
                  <rect x="106" y="80" width="16" height="28" fill="#163d45" />
                  <rect x="104" y="76" width="16" height="14" fill="#3d2817" />
                  <rect x="108" y="67" width="14" height="11" fill="#ef9a85" />
                  {/* Polegar pra cima firme */}
                  <rect x="111" y="52" width="8" height="17" fill="#ef9a85" stroke="#9a3412" strokeWidth="1" />
                  <rect x="113" y="53" width="4" height="15" fill="#fca5a5" />
                  {/* Estrela dourada de aprovação */}
                  <g className="rpg-thumb-sparkle">
                    <path d="M 125 54 L 127 48 L 129 54 L 135 56 L 129 58 L 127 64 L 125 58 L 119 56 Z" fill="#fbbf24" />
                    <circle cx="127" cy="56" r="2" fill="#ffffff" />
                  </g>
                </g>
              )}

              {/* GESTO 5: ARMINHA D'ÁGUA DE BRINQUEDO (WATERGUN) */}
              {gesture === "watergun" && (
                <g className="rpg-gesture-watergun">
                  <rect x="106" y="80" width="16" height="26" fill="#163d45" />
                  <rect x="104" y="74" width="16" height="14" fill="#3d2817" />
                  <rect x="94" y="66" width="18" height="12" fill="#ef9a85" />
                  {/* Pistola de água neon */}
                  <rect x="74" y="64" width="26" height="10" rx="2" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
                  <rect x="78" y="58" width="14" height="7" rx="3" fill="#38bdf8" opacity="0.85" />
                  <rect x="70" y="66" width="6" height="5" fill="#ea580c" />
                  <rect x="88" y="73" width="8" height="10" fill="#f97316" />
                  {/* Jatos de água espirrando em direção ao aluno */}
                  <g className="water-squirt-stream">
                    <circle cx="64" cy="68" r="3" fill="#0284c7" />
                    <circle cx="54" cy="67" r="3.5" fill="#38bdf8" />
                    <circle cx="42" cy="69" r="4" fill="#0ea5e9" />
                    <path d="M 68 68 Q 50 66 30 72" stroke="#38bdf8" strokeWidth="2.5" fill="none" strokeDasharray="4 2" />
                    <circle cx="34" cy="63" r="1.5" fill="#67e8f9" />
                    <circle cx="26" cy="74" r="2" fill="#67e8f9" />
                  </g>
                </g>
              )}

              {/* ============================================================= */}
              {/* CABEÇA E ROSTO HIPER-DETALHADO E VIVO */}
              {/* ============================================================= */}
              <g
                className="rpg-head"
                style={{
                  transform: `translate(${lookOffset.x * 2.8}px, ${lookOffset.y * 1.9}px) rotate(${lookOffset.x * 3.2}deg)`,
                  transition: "transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)"
                }}
              >
                {/* Camadas do Cabelo estilizado com iluminação */}
                <rect className="rpg-hair-dark" x="49" y="32" width="62" height="42" fill="#35140d" />
                <rect className="rpg-hair" x="44" y="40" width="16" height="32" fill="#d85337" />
                <rect className="rpg-hair" x="100" y="38" width="17" height="36" fill="#d85337" />
                <rect className="rpg-hair" x="55" y="26" width="49" height="15" fill="#d85337" />
                {/* Mechas iluminadas por cima */}
                <rect className="rpg-hair-hot" x="63" y="21" width="15" height="11" fill="#ffb05f" />
                <rect className="rpg-hair-hot" x="84" y="24" width="14" height="9" fill="#ffb05f" />
                <rect x="74" y="20" width="6" height="5" fill="#fed7aa" />

                {/* Pele do Rosto e Sombras de profundidade */}
                <rect className="rpg-skin" x="55" y="41" width="50" height="40" fill="#ef9a85" />
                <rect className="rpg-skin-shadow" x="55" y="69" width="50" height="12" fill="#df7c67" />
                {/* Orelhas com detalhe interno */}
                <rect className="rpg-ear" x="49" y="52" width="8" height="16" fill="#ef9a85" />
                <rect x="52" y="56" width="3" height="8" fill="#c25f4b" />
                <rect className="rpg-ear" x="103" y="52" width="8" height="16" fill="#ef9a85" />
                <rect x="105" y="56" width="3" height="8" fill="#c25f4b" />

                {/* Sobrancelhas expressivas com arco de raiva, simpatia ou escuta atenta */}
                <g className={`rpg-brows ${gesture === "finger" ? "brows-angry" : gesture === "heart" ? "brows-happy" : activity === "listening" ? "brows-listening" : activity === "speaking" ? "brows-speaking" : ""}`}>
                  <rect x="60" y="49" width="16" height="4" fill="#35140d" />
                  <rect x="84" y="49" width="16" height="4" fill="#35140d" />
                  <rect x="62" y="47" width="5" height="2" fill="#d85337" />
                  <rect x="93" y="47" width="5" height="2" fill="#d85337" />
                </g>

                {/* Olhos Vivos com Reflexo e Pupilas que Acompanham o Usuário */}
                <g className={`rpg-eyes ${activity === "listening" ? "eyes-listening" : gesture === "smoke" ? "eyes-chill" : gesture === "thumbsup" ? "eyes-wink" : ""}`}>
                  {/* Olho esquerdo */}
                  <rect className="rpg-eye-white" x="62" y="55" width="13" height="9" fill="#ffffff" />
                  <g
                    className="pupil-left-group"
                    style={{
                      transform: `translate(${lookOffset.x * 2.3}px, ${lookOffset.y * 1.5}px)`,
                      transition: "transform 0.08s cubic-bezier(0.2, 0.8, 0.2, 1)"
                    }}
                  >
                    <rect className="rpg-pupil" x="66" y="56" width="6" height="7" fill="#0284c7" />
                    <rect x="68" y="57" width="3" height="5" fill="#0f172a" />
                    <rect className="rpg-eye-shine" x="66" y="56" width="2" height="2" fill="#ffffff" />
                  </g>

                  {/* Olho direito */}
                  <rect className="rpg-eye-white" x="85" y="55" width="13" height="9" fill="#ffffff" />
                  <g
                    className="pupil-right-group"
                    style={{
                      transform: `translate(${lookOffset.x * 2.3}px, ${lookOffset.y * 1.5}px)`,
                      transition: "transform 0.08s cubic-bezier(0.2, 0.8, 0.2, 1)"
                    }}
                  >
                    <rect className="rpg-pupil" x="88" y="56" width="6" height="7" fill="#0284c7" />
                    <rect x="90" y="57" width="3" height="5" fill="#0f172a" />
                    <rect className="rpg-eye-shine" x="88" y="56" width="2" height="2" fill="#ffffff" />
                  </g>
                </g>

                {/* Nariz sombreado */}
                <rect className="rpg-nose" x="77" y="61" width="6" height="8" fill="#d06c57" />
                <rect x="79" y="63" width="2" height="5" fill="#f8b4a5" />

                {/* Boca Articulada Hiper-Realista: sincronia com múltiplos fonemas durante a fala */}
                <g className={`rpg-mouth ${activity === "speaking" ? "mouth-speaking-live" : gesture === "smoke" ? "mouth-smoke" : ""}`}>
                  {activity === "speaking" ? (
                    <g className="rpg-phonemes-active">
                      {phoneme === 0 && (
                        /* Fonema Aberto A/O: boca redonda aberta mostrando dentes superiores e língua */
                        <g className="phoneme-open-a">
                          <rect x="67" y="69" width="26" height="11" rx="3" fill="#3b0a12" />
                          <rect x="70" y="70" width="20" height="3" fill="#ffffff" />
                          <rect x="73" y="75" width="14" height="4" rx="1" fill="#f43f5e" />
                        </g>
                      )}
                      {phoneme === 1 && (
                        /* Fonema Sorriso E/I: boca larga mostrando dentes cerrados */
                        <g className="phoneme-wide-e">
                          <rect x="65" y="71" width="30" height="7" rx="2" fill="#3b0a12" />
                          <rect x="68" y="72" width="24" height="3" fill="#ffffff" />
                          <rect x="72" y="75" width="16" height="2" fill="#f43f5e" />
                        </g>
                      )}
                      {phoneme === 2 && (
                        /* Fonema Redondo U/O/W: boca arredondada estreita projetada */
                        <g className="phoneme-round-o">
                          <rect x="73" y="68" width="14" height="12" rx="4" fill="#3b0a12" />
                          <ellipse cx="80" cy="74" rx="4" ry="4" fill="#1c0508" />
                          <rect x="77" y="69" width="6" height="2" fill="#ffffff" />
                          <ellipse cx="80" cy="76" rx="2.5" ry="1.5" fill="#f43f5e" />
                        </g>
                      )}
                      {phoneme === 3 && (
                        /* Fonema Consoante M/P/T: lábios quase fechados */
                        <g className="phoneme-consonant">
                          <rect x="68" y="72" width="24" height="4" rx="2" fill="#3b0a12" />
                          <rect x="71" y="73" width="18" height="2" fill="#ffffff" />
                        </g>
                      )}
                    </g>
                  ) : (
                    <g className="rpg-mouth-rest">
                      <rect className="rpg-mouth-dark" x="69" y="71" width="22" height="5" rx="1" fill="#4a0e17" />
                      <rect className="rpg-mouth-glow" x="74" y="73" width="12" height="2" fill="#f43f5e" />
                    </g>
                  )}
                </g>
              </g>
            </g>
          </g>
        )}
      </svg>
      <div className="character-glow" aria-hidden="true" />
    </div>
  );
});
