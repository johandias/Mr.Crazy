"use client";

import React from "react";

interface MapRoadPathProps {
  currentStageNumber: number; // 1 to 7
  completedStagesCount: number;
}

// Coordenadas das curvas sinuosas interligando os 7 checkpoints na proporção 1024x576
const ROAD_SEGMENTS = [
  {
    id: "seg-1-2",
    fromStage: 1,
    toStage: 2,
    // De 1 (128, 335) a 2 (272, 248)
    // De 1 (128, 336) Vila Inicial subindo até 2 (261, 199) Restaurante & Café
    d: "M 128 336 C 165 310, 205 235, 261 199",
  },
  {
    id: "seg-2-3",
    fromStage: 2,
    toStage: 3,
    // De 2 (272, 248) a 3 (404, 370) descendo pela ponte/colina
    // De 2 (261, 199) Café descendo em arco pela ponte até 3 (394, 348) Shopping
    d: "M 261 199 C 320 205, 335 340, 394 348",
  },
  {
    id: "seg-3-4",
    fromStage: 3,
    toStage: 4,
    // De 3 (404, 370) subindo até o aeroporto (488, 185)
    // De 3 (394, 348) Shopping subindo pelo viaduto até 4 (533, 184) Aeroporto
    d: "M 394 348 C 455 350, 475 195, 533 184",
  },
  {
    id: "seg-4-5",
    fromStage: 4,
    toStage: 5,
    // De 4 (488, 185) contornando até a praça/fonte (615, 362)
    // De 4 (533, 184) Aeroporto contornando até 5 (661, 348) Praça & Fonte
    d: "M 533 184 C 595 185, 605 345, 661 348",
  },
  {
    id: "seg-5-6",
    fromStage: 5,
    toStage: 6,
    // De 5 (615, 362) subindo para os prédios (722, 260)
    // De 5 (661, 348) Praça subindo até 6 (782, 196) Arranha-céus Metrópole
    d: "M 661 348 C 715 345, 725 200, 782 196",
  },
  {
    id: "seg-6-7",
    fromStage: 6,
    toStage: 7,
    // De 6 (722, 260) pela ponte até a Fortaleza (902, 310)
    // De 6 (782, 196) Metrópole pela ponte suspensa até 7 (906, 276) Cidadela
    d: "M 782 196 C 835 195, 855 270, 906 276",
  }
];

export function MapRoadPath({
  currentStageNumber,
  completedStagesCount
}: MapRoadPathProps) {
  return (
    <svg
      className="map-road-svg"
      viewBox="0 0 1024 576"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Filtro de Glow Dourado para o caminho ativo */}
        <filter id="roadGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradiente Dourado Âmbar */}
        <linearGradient id="activeRoadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Renderiza cada segmento de estrada */}
      {ROAD_SEGMENTS.map((seg) => {
        const isCompleted = completedStagesCount >= seg.toStage;
        const isActive =
          !isCompleted &&
          (currentStageNumber === seg.fromStage || completedStagesCount >= seg.fromStage);

        // Classe de estado da pista
        const statusClass = isCompleted
          ? "road-completed"
          : isActive
          ? "road-active"
          : "road-locked";

        return (
          <g key={seg.id} className={`road-segment-group ${statusClass}`}>
            {/* Pista base (asfalto escuro ou base iluminada) */}
            <path
              d={seg.d}
              className="road-base-path"
              fill="none"
              strokeWidth={isCompleted || isActive ? 10 : 8}
              stroke={
                isCompleted
                  ? "rgba(245, 158, 11, 0.4)"
                  : isActive
                  ? "rgba(245, 158, 11, 0.25)"
                  : "rgba(35, 42, 50, 0.6)"
              }
              strokeLinecap="round"
            />

            {/* Linha central da pista com traçado */}
            <path
              d={seg.d}
              className={`road-dash-path ${isActive ? "animate-road-pulse" : ""}`}
              fill="none"
              strokeWidth={2.5}
              stroke={
                isCompleted
                  ? "#FBBF24"
                  : isActive
                  ? "url(#activeRoadGrad)"
                  : "rgba(100, 115, 130, 0.35)"
              }
              strokeDasharray={isActive ? "6 6" : "5 5"}
              filter={isActive || isCompleted ? "url(#roadGlow)" : undefined}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}
