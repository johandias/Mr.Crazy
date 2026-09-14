"use client";

import React, { useState, useEffect } from "react";
import type { NpcAvatarType } from "@/lib/modules";

export type NpcExpression = "neutral" | "listening" | "speaking" | "confused" | "pleased";

interface PixelNpcCharacterProps {
  avatarType: NpcAvatarType;
  expression: NpcExpression;
  name?: string;
  roleTitle?: string;
  size?: number; // size in px, defaults to 160
  className?: string;
}

export function PixelNpcCharacter({
  avatarType,
  expression,
  name,
  roleTitle,
  size = 180,
  className = ""
}: PixelNpcCharacterProps) {
  // Ciclo procedural de fonemas quando estiver falando
  const [phoneme, setPhoneme] = useState(0);

  useEffect(() => {
    if (expression !== "speaking") {
      setPhoneme(0);
      return;
    }
    const interval = setInterval(() => {
      setPhoneme((prev) => (prev + 1) % 4);
    }, 125);
    return () => clearInterval(interval);
  }, [expression]);

  // Paleta de cores por arquétipo/profissão
  const rolePalette = {
    waiter: {
      jacket: "#18181b",
      shirt: "#ffffff",
      accent: "#ef4444", // gravata borboleta vermelha
      skin: "#fbd38d",
      hair: "#4a2810"
    },
    neighbor: {
      jacket: "#3b82f6", // jaqueta azul casual
      shirt: "#e2e8f0",
      accent: "#f59e0b",
      skin: "#fcd34d",
      hair: "#b45309"
    },
    cashier: {
      jacket: "#059669", // polo verde de loja
      shirt: "#10b981",
      accent: "#fbbf24", // crachá dourado
      skin: "#fbcfe8",
      hair: "#1e1b4b"
    },
    receptionist: {
      jacket: "#1e3a8a", // blazer de piloto/oficial azul marinho
      shirt: "#ffffff",
      accent: "#f59e0b", // dragonas e gravata
      skin: "#fed7aa",
      hair: "#1c1917"
    },
    coworker: {
      jacket: "#475569", // camisa slate de escritório
      shirt: "#94a3b8",
      accent: "#38bdf8",
      skin: "#fbd38d",
      hair: "#78350f"
    },
    executive: {
      jacket: "#0f172a", // blazer executivo chumbo
      shirt: "#f8fafc",
      accent: "#a855f7",
      skin: "#fde68a",
      hair: "#172554"
    },
    examiner: {
      jacket: "#3f2e1e", // terno professor marrom/tweed
      shirt: "#fef3c7",
      accent: "#b91c1c", // gravata bordô formal
      skin: "#fcd34d",
      hair: "#9ca3af" // grisalho respeitável
    }
  }[avatarType] || {
    jacket: "#18181b",
    shirt: "#ffffff",
    accent: "#ef4444",
    skin: "#fbd38d",
    hair: "#4a2810"
  };

  const isConfused = expression === "confused";
  const isSpeaking = expression === "speaking";
  const isListening = expression === "listening";
  const isPleased = expression === "pleased";

  return (
    <div
      className={`pixel-npc-wrapper expression-${expression} role-${avatarType} ${className}`}
      style={{ width: size, height: size + 40 }}
      title={`${name || "Examinador"} (${roleTitle || "Avaliador"})`}
    >
      {/* Balão flutuante de reação de confusão quando não entender */}
      {isConfused && (
        <div className="npc-confusion-bubble animate-bounce-subtle">
          <span className="confusion-icon">🤔❓</span>
          <span className="confusion-text">Excuse me? What?</span>
        </div>
      )}

      {/* Indicador de status de áudio */}
      {isListening && (
        <div className="npc-listening-indicator animate-pulse">
          <span className="listening-dot" />
          <span>Listening...</span>
        </div>
      )}

      <svg
        className="pixel-npc-svg"
        viewBox="0 0 160 160"
        shapeRendering="crispEdges"
        aria-hidden="true"
        style={{ width: size, height: size }}
      >
        {/* Sombra no chão */}
        <ellipse cx="80" cy="146" rx="34" ry="6" fill="rgba(0,0,0,0.35)" />

        {/* ============================================================= */}
        {/* CORPO / UNIFORME DO NPC */}
        {/* ============================================================= */}
        <g className="npc-body">
          {/* Calça / Parte inferior */}
          <rect x="62" y="120" width="16" height="24" fill="#18181b" />
          <rect x="82" y="120" width="16" height="24" fill="#18181b" />
          {/* Sapatos sociais */}
          <rect x="58" y="141" width="20" height="6" fill="#09090b" />
          <rect x="82" y="141" width="20" height="6" fill="#09090b" />

          {/* Tronco / Jaqueta / Camisa */}
          <rect x="52" y="78" width="56" height="44" fill={rolePalette.jacket} />
          {/* Peitoral / camisa interior */}
          <rect x="68" y="78" width="24" height="28" fill={rolePalette.shirt} />

          {/* Detalhes específicos de cada profissão */}
          {avatarType === "waiter" && (
            <g className="npc-waiter-acc">
              {/* Avental */}
              <rect x="60" y="104" width="40" height="18" fill="#f8fafc" opacity="0.9" />
              {/* Gravata borboleta */}
              <rect x="74" y="80" width="12" height="6" fill="#dc2626" />
              <rect x="78" y="81" width="4" height="4" fill="#7f1d1d" />
            </g>
          )}

          {avatarType === "receptionist" && (
            <g className="npc-receptionist-acc">
              {/* Gravata azul/dourada */}
              <rect x="77" y="82" width="6" height="22" fill="#d97706" />
              {/* Dragonas / Insígnia nos ombros */}
              <rect x="52" y="80" width="8" height="3" fill="#f59e0b" />
              <rect x="100" y="80" width="8" height="3" fill="#f59e0b" />
            </g>
          )}

          {avatarType === "cashier" && (
            <g className="npc-cashier-acc">
              {/* Crachá no peito */}
              <rect x="56" y="88" width="10" height="8" rx="1" fill="#ffffff" />
              <rect x="58" y="90" width="6" height="4" fill="#059669" />
            </g>
          )}

          {avatarType === "examiner" && (
            <g className="npc-examiner-acc">
              {/* Gravata bordô */}
              <rect x="77" y="82" width="6" height="20" fill="#991b1b" />
              {/* Lenço no bolso */}
              <rect x="58" y="88" width="8" height="3" fill="#ffffff" />
            </g>
          )}

          {/* Braços */}
          <rect x="42" y="82" width="12" height="36" fill={rolePalette.jacket} />
          <rect x="106" y="82" width="12" height="36" fill={rolePalette.jacket} />
          {/* Mãos */}
          <rect x="42" y="115" width="12" height="8" fill={rolePalette.skin} />
          <rect x="106" y="115" width="12" height="8" fill={rolePalette.skin} />

          {/* Objeto na mão dependendo do papel */}
          {avatarType === "waiter" && (
            /* Bloco de notas do garçom */
            <g className="npc-waiter-notepad">
              <rect x="36" y="108" width="14" height="20" rx="1" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
              <rect x="39" y="112" width="8" height="2" fill="#78350f" />
              <rect x="39" y="116" width="8" height="2" fill="#78350f" />
              <rect x="39" y="120" width="6" height="2" fill="#78350f" />
            </g>
          )}

          {avatarType === "coworker" && (
            /* Caneca de café */
            <g className="npc-coffee-mug">
              <rect x="112" y="112" width="12" height="14" rx="2" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
              <rect x="122" y="115" width="4" height="8" fill="none" stroke="#64748b" strokeWidth="1.5" />
              <rect x="114" y="110" width="8" height="3" fill="#78350f" />
            </g>
          )}

          {avatarType === "examiner" && (
            /* Prancheta de avaliação */
            <g className="npc-clipboard">
              <rect x="34" y="106" width="16" height="22" rx="1" fill="#78350f" stroke="#451a03" strokeWidth="1" />
              <rect x="37" y="109" width="10" height="16" fill="#fef9c3" />
              <rect x="39" y="105" width="6" height="3" fill="#94a3b8" />
              <rect x="39" y="113" width="6" height="2" fill="#ef4444" />
              <rect x="39" y="117" width="6" height="2" fill="#1e293b" />
            </g>
          )}
        </g>

        {/* ============================================================= */}
        {/* CABEÇA E ROSTO HIPER-EXPRESSIVO */}
        {/* ============================================================= */}
        <g
          className={`npc-head ${isConfused ? "head-tilted-confused" : ""}`}
          style={{
            transformOrigin: "80px 65px",
            transform: isConfused ? "rotate(-4deg) translateY(-2px)" : undefined,
            transition: "transform 0.25s ease"
          }}
        >
          {/* Cabelo base */}
          <rect x="52" y="32" width="56" height="36" fill={rolePalette.hair} />

          {/* Rosto / Pele */}
          <rect x="56" y="44" width="48" height="36" fill={rolePalette.skin} />
          {/* Orelhas */}
          <rect x="50" y="52" width="6" height="12" fill={rolePalette.skin} />
          <rect x="104" y="52" width="6" height="12" fill={rolePalette.skin} />

          {/* Detalhe de Cabelo / Franja */}
          <rect x="52" y="30" width="56" height="16" fill={rolePalette.hair} />
          <rect x="52" y="42" width="12" height="10" fill={rolePalette.hair} />
          <rect x="96" y="42" width="12" height="10" fill={rolePalette.hair} />

          {/* Óculos se for o Examiner Arthur */}
          {avatarType === "examiner" && (
            <g className="npc-glasses">
              <rect x="62" y="54" width="14" height="10" fill="none" stroke="#d97706" strokeWidth="2" />
              <rect x="84" y="54" width="14" height="10" fill="none" stroke="#d97706" strokeWidth="2" />
              <rect x="76" y="58" width="8" height="2" fill="#d97706" />
            </g>
          )}

          {/* =========================================================== */}
          {/* SOBRANCELHAS EXPRESSIVAS */}
          {/* =========================================================== */}
          {isConfused ? (
            /* Sobrancelha de Confusão: Uma levantada de espanto e a outra franzida */
            <g className="npc-brows-confused">
              {/* Esquerda: Levantada em choque/dúvida */}
              <rect x="62" y="48" width="14" height="4" fill="#262626" />
              <rect x="62" y="46" width="6" height="3" fill="#262626" />
              {/* Direita: Franzida para baixo */}
              <rect x="84" y="53" width="14" height="4" fill="#262626" />
              <rect x="92" y="55" width="6" height="3" fill="#262626" />
            </g>
          ) : isPleased ? (
            /* Sobrancelhas de contente / aprovação */
            <g className="npc-brows-pleased">
              <rect x="62" y="50" width="14" height="3" fill="#262626" />
              <rect x="84" y="50" width="14" height="3" fill="#262626" />
            </g>
          ) : (
            /* Sobrancelhas normais */
            <g className="npc-brows-neutral">
              <rect x="62" y="52" width="14" height="3" fill="#262626" />
              <rect x="84" y="52" width="14" height="3" fill="#262626" />
            </g>
          )}

          {/* =========================================================== */}
          {/* OLHOS VIVOS & REATIVOS */}
          {/* =========================================================== */}
          {isConfused ? (
            /* Olhos arregalados e apertados de quem NÃO ENTENDEU NADA */
            <g className="npc-eyes-confused">
              {/* Olho esquerdo arregalado */}
              <rect x="64" y="56" width="12" height="9" fill="#ffffff" />
              <rect x="68" y="58" width="5" height="5" fill="#1e293b" />
              <rect x="69" y="59" width="2" height="2" fill="#ffffff" />

              {/* Olho direito estreito / semicerrado de dúvida */}
              <rect x="84" y="58" width="12" height="6" fill="#ffffff" />
              <rect x="87" y="59" width="5" height="4" fill="#1e293b" />
            </g>
          ) : isPleased ? (
            /* Olhos fechados sorrindo (^ ^) */
            <g className="npc-eyes-happy">
              <rect x="64" y="58" width="12" height="3" fill="#18181b" />
              <rect x="64" y="56" width="3" height="3" fill="#18181b" />
              <rect x="73" y="56" width="3" height="3" fill="#18181b" />

              <rect x="84" y="58" width="12" height="3" fill="#18181b" />
              <rect x="84" y="56" width="3" height="3" fill="#18181b" />
              <rect x="93" y="56" width="3" height="3" fill="#18181b" />
            </g>
          ) : (
            /* Olhos normais atentos */
            <g className="npc-eyes-neutral">
              <rect x="64" y="56" width="10" height="8" fill="#ffffff" />
              <rect x="67" y="58" width="5" height="5" fill="#1e293b" />
              <rect x="68" y="59" width="2" height="2" fill="#ffffff" />

              <rect x="86" y="56" width="10" height="8" fill="#ffffff" />
              <rect x="88" y="58" width="5" height="5" fill="#1e293b" />
              <rect x="89" y="59" width="2" height="2" fill="#ffffff" />
            </g>
          )}

          {/* Nariz */}
          <rect x="78" y="62" width="4" height="5" fill="#d97706" opacity="0.6" />

          {/* =========================================================== */}
          {/* BOCA / ARTICULAÇÃO */}
          {/* =========================================================== */}
          {isConfused ? (
            /* Boca torta de dúvida / "Huh?" */
            <g className="npc-mouth-confused">
              <rect x="73" y="70" width="16" height="5" rx="1" fill="#450a0a" />
              <rect x="75" y="70" width="8" height="2" fill="#ffffff" />
              <rect x="85" y="69" width="5" height="4" fill="#450a0a" />
            </g>
          ) : isSpeaking ? (
            /* Boca falando procedural em inglês */
            <g className="npc-mouth-speaking">
              {phoneme === 0 && (
                <rect x="74" y="69" width="12" height="8" rx="2" fill="#450a0a" />
              )}
              {phoneme === 1 && (
                <g>
                  <rect x="72" y="70" width="16" height="5" rx="1" fill="#450a0a" />
                  <rect x="74" y="71" width="12" height="2" fill="#ffffff" />
                </g>
              )}
              {phoneme === 2 && (
                <rect x="76" y="69" width="8" height="7" rx="3" fill="#450a0a" />
              )}
              {phoneme === 3 && (
                <rect x="74" y="71" width="12" height="3" fill="#450a0a" />
              )}
            </g>
          ) : isPleased ? (
            /* Sorriso satisfeito */
            <g className="npc-mouth-pleased">
              <rect x="72" y="70" width="16" height="5" rx="2" fill="#450a0a" />
              <rect x="74" y="71" width="12" height="2" fill="#ffffff" />
            </g>
          ) : (
            /* Boca neutra relaxada */
            <rect x="74" y="71" width="12" height="3" fill="#713f12" />
          )}
        </g>
      </svg>

      {/* Legenda com o Nome e Papel do NPC */}
      {name && (
        <div className="npc-nametag">
          <span className="npc-name">{name}</span>
          {roleTitle && <span className="npc-role">{roleTitle}</span>}
        </div>
      )}
    </div>
  );
}

