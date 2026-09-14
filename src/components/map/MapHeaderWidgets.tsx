"use client";

import React from "react";
import { Compass, Flame, Star, Target } from "lucide-react";
import { MrCrazyCharacter } from "@/components/map/MrCrazyCharacter";

interface MapHeaderWidgetsProps {
  completedCount: number;
  totalStages?: number;
  streakDays: number;
  xp: number;
  currentStageTitle?: string;
}

export function MapHeaderWidgets({
  completedCount,
  totalStages = 7,
  streakDays,
  xp,
  currentStageTitle = "Greetings & Introductions"
}: MapHeaderWidgetsProps) {
  // Frases contextuais dinâmicas do Mr. Crazy de acordo com o progresso
  const getCrazyQuote = () => {
    if (completedCount === 0) {
      return "Pequenos passos também te levam longe. Bora destravar essa fala!";
    }
    if (completedCount <= 2) {
      return "Mandou bem na largada! O segredo é ritmo diário sem medo de errar.";
    }
    if (completedCount <= 5) {
      return "Olha aí! Você já fala sobre viagens e rotina. Agora é lapidar a fluência!";
    }
    return "Você tá no topo do mundo! A Cidadela do Mr. Crazy tá te esperando!";
  };

  return (
    <div className="map-header-container">
      {/* Top Banner & Subtitle */}
      <div className="map-header-center">
        <div className="map-hero-tag">
          <Compass size={14} className="tag-icon-compass" />
          <span>APRENDIZADO EM INGLÊS • SUA JORNADA, UM NÍVEL DE CADA VEZ</span>
        </div>

        <h1 className="map-hero-title">
          Mapa de Etapas do Mr. Crazy
        </h1>

        <p className="map-hero-subtitle">
          Explore o mapa, complete cada etapa, pratique no dia a dia e evolua no inglês com o Mr. Crazy!
        </p>

        {/* 3 Indicators Pills */}
        <div className="map-stats-bar">
          <div className="map-stat-chip">
            <Target size={15} className="stat-icon-target" />
            <span>
              Progresso no Mapa: <strong>{completedCount} de {totalStages} etapas</strong>
            </span>
          </div>

          <div className="map-stat-chip chip-streak">
            <Flame size={15} className="stat-icon-flame" />
            <span>
              Sequência: <strong>{streakDays} dias</strong>
            </span>
          </div>

          <div className="map-stat-chip chip-xp">
            <Star size={15} className="stat-icon-star" />
            <span>
              XP Acumulado: <strong>{xp} XP</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Mr. Crazy Quote Widget on Top Right */}
      <div className="map-quote-widget" title="Dica do Mr. Crazy">
        <div className="quote-avatar-col">
          <MrCrazyCharacter mode="avatar" size={38} animated={false} />
        </div>
        <div className="quote-text-col">
          <p className="quote-body">&ldquo;{getCrazyQuote()}&rdquo;</p>
          <span className="quote-author">— Mr. Crazy</span>
        </div>
      </div>
    </div>
  );
}

