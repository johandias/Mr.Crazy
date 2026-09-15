"use client";

import React from "react";
import { Navigation, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface MapControlsProps {
  onCenterActiveStage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  currentZoom: number;
}

export function MapControls({
  onCenterActiveStage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  currentZoom
}: MapControlsProps) {
  return (
    <div className="map-floating-controls" aria-label="Controles de Navegação do Mapa">
      <button
        type="button"
        className="map-ctrl-btn btn-focus-stage"
        onClick={onCenterActiveStage}
        title="Centralizar na minha etapa atual"
      >
        <Navigation size={14} className="ctrl-nav-icon" />
        <span>Minha etapa</span>
      </button>

      <div className="map-zoom-buttons-group">
        <button
          type="button"
          className="map-ctrl-btn btn-zoom"
          onClick={onZoomIn}
          disabled={currentZoom >= 1.8}
          title="Aproximar mapa"
          aria-label="Aumentar zoom"
        >
          <ZoomIn size={14} />
        </button>

        <button
          type="button"
          className="map-ctrl-btn btn-zoom"
          onClick={onZoomOut}
          disabled={currentZoom <= 0.75}
          title="Afastar mapa"
          aria-label="Diminuir zoom"
        >
          <ZoomOut size={14} />
        </button>

        <button
          type="button"
          className="map-ctrl-btn btn-reset"
          onClick={onResetZoom}
          title="Redefinir visualização"
          aria-label="Redefinir zoom"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}
