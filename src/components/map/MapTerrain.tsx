"use client";

import React from "react";
import { ProgrammaticArchipelagoTerrain } from "@/components/map/ProgrammaticArchipelagoTerrain";

interface MapTerrainProps {
  children?: React.ReactNode;
}

export function MapTerrain({ children }: MapTerrainProps) {
  return (
    <div className="map-terrain-container" aria-label="Cenário do Mapa de Aprendizado">
      {/* Imagem do arquipélago base com ilhas e relevos em perspectiva isométrica */}
      {/* Cenário 100% programático com ilhas, relevos, oceano e animações vivas */}
      <div className="terrain-archipelago-base">
        <img
          src="/assets/map/archipelago_terrain_base.png"
          alt="Arquipélago Mr.Crazy"
          className="terrain-base-img"
          draggable={false}
        />
        <ProgrammaticArchipelagoTerrain />
      </div>

      {/* Camada de atmosfera, água e iluminação ambiental */}
      <div className="terrain-ocean-glow" />

      {/* Camada com filhos (rotas SVG, checkpoints, personagens e balões) */}
      <div className="terrain-interactive-layer">
        {children}
      </div>
    </div>
  );
}

