"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { LEARNING_MODULES, type LearningModule } from "@/lib/modules";
import { MapHeaderWidgets } from "@/components/map/MapHeaderWidgets";
import { MapTerrain } from "@/components/map/MapTerrain";
import { MapRoadPath } from "@/components/map/MapRoadPath";
import { StageCheckpoint, type StageStatus } from "@/components/map/StageCheckpoint";
import { StageDetailDrawer } from "@/components/map/StageDetailDrawer";
import { MapProgressFooter } from "@/components/map/MapProgressFooter";
import { MapControls } from "@/components/map/MapControls";
import { ModuleEvaluationModal } from "@/components/ModuleEvaluationModal";
import { ExamModal } from "@/components/exam/ExamModal";
import type { ModuleProgressItem, ModuleEvaluationItem } from "@/components/ModuleSelector";

interface LearningMapProps {
  activeModuleId: string;
  onSelectModule: (moduleId: string) => void;
  onClose?: () => void;
  userName?: string;
  streakDays?: number;
  xp?: number;
}

export function LearningMap({
  activeModuleId,
  onSelectModule,
  onClose,
  userName = "Aluno",
  streakDays = 7,
  xp = 630
}: LearningMapProps) {
  const [progressMap, setProgressMap] = useState<Record<string, ModuleProgressItem>>({});
  const [evaluationsMap, setEvaluationsMap] = useState<Record<string, ModuleEvaluationItem>>({});
  const [selectedDrawerModule, setSelectedDrawerModule] = useState<LearningModule | null>(null);
  const [activeModalEvaluation, setActiveModalEvaluation] = useState<ModuleEvaluationItem | null>(null);
  const [examModuleId, setExamModuleId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  const mapScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);

  // Carrega progresso e avaliações do Supabase / API local
  useEffect(() => {
    let isMounted = true;
    fetch("/api/modules/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.ok) return;

        if (Array.isArray(data.progress)) {
          const pMap: Record<string, ModuleProgressItem> = {};
          for (const item of data.progress) {
            if (item?.module_id) pMap[item.module_id] = item;
          }
          setProgressMap(pMap);
        }

        if (Array.isArray(data.evaluations)) {
          const eMap: Record<string, ModuleEvaluationItem> = {};
          for (const item of data.evaluations) {
            if (item?.module_id && !eMap[item.module_id]) {
              eMap[item.module_id] = item;
            }
          }
          setEvaluationsMap(eMap);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Determina o módulo ativo atualmente
  const currentActiveModule =
    LEARNING_MODULES.find((m) => m.id === activeModuleId) || LEARNING_MODULES[0];

  const currentStageNumber = currentActiveModule.stageNumber;

  // Conta etapas concluídas
  const completedStagesCount = Object.values(progressMap).filter(
    (p) => p.status === "completed" || p.progress_percent >= 100
  ).length;

  // Centraliza o scroll do mapa na etapa ativa
  const centerOnStage = useCallback((stageNum: number) => {
    const container = mapScrollRef.current;
    if (!container) return;

    const targetModule =
      LEARNING_MODULES.find((m) => m.stageNumber === stageNum) || currentActiveModule;

    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const targetX = (targetModule.mapCoords.xPct / 100) * scrollWidth;

    container.scrollTo({
      left: Math.max(0, targetX - clientWidth / 2),
      behavior: "smooth"
    });
  }, [currentActiveModule]);

  // Centralização automática ao carregar a página
  useEffect(() => {
    const timer = setTimeout(() => {
      centerOnStage(currentStageNumber);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentStageNumber, centerOnStage]);

  // Handlers para arrastar com o mouse (Pan / Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Evita drag se clicou em um checkpoint ou botão
    if ((e.target as HTMLElement).closest(".map-checkpoint-node, button")) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - (mapScrollRef.current?.offsetLeft || 0);
    scrollLeftRef.current = mapScrollRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !mapScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (mapScrollRef.current.offsetLeft || 0);
    const walk = (x - startXRef.current) * 1.3;
    mapScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Controles de zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(1.6, prev + 0.15));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.75, prev - 0.15));
  const handleResetZoom = () => setZoom(1);

  // Determina o status de cada etapa (locked, current, completed, available)
  const getStageStatus = (module: LearningModule): StageStatus => {
    const prog = progressMap[module.id];
    const isCompleted = prog?.status === "completed" || (prog?.progress_percent ?? 0) >= 100;
    if (isCompleted) return "completed";

    if (module.id === activeModuleId || module.stageNumber === currentStageNumber) {
      return "current";
    }

    // Se a etapa anterior foi concluída ou se é a etapa 1, ela está liberada
    if (module.stageNumber === 1 || completedStagesCount >= module.stageNumber - 1) {
      return "available";
    }

    return "locked";
  };

  return (
    <div className="learning-map-page-view animate-fade-in">
      {/* 1. Header com Título, Indicadores e Balão do Mr. Crazy */}
      <MapHeaderWidgets
        completedCount={completedStagesCount}
        totalStages={LEARNING_MODULES.length}
        streakDays={streakDays}
        xp={xp}
        currentStageTitle={currentActiveModule.cleanTitle}
      />

      {/* 2. Área do Cenário Panorâmico Horizontal com Rolagem / Arraste */}
      <div className="map-scroll-outer-viewport">
        <div
          ref={mapScrollRef}
          className="map-scroll-viewport horizontal-drag-area"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="map-canvas-stage"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          >
            <MapTerrain>
              {/* Rota Sinuosa Iluminada em SVG */}
              <MapRoadPath
                currentStageNumber={currentStageNumber}
                completedStagesCount={completedStagesCount}
              />

              {/* Checkpoints Interativos (1 a 7) */}
              {LEARNING_MODULES.map((module) => {
                const status = getStageStatus(module);
                const prog = progressMap[module.id];
                const progressPct = prog?.progress_percent ?? (status === "completed" ? 100 : 0);

                return (
                  <StageCheckpoint
                    key={module.id}
                    module={module}
                    status={status}
                    progressPercent={progressPct}
                    isActiveSelection={selectedDrawerModule?.id === module.id}
                    onSelect={(mod) => setSelectedDrawerModule(mod)}
                  />
                );
              })}
            </MapTerrain>
          </div>
        </div>

        {/* Controles Flutuantes de Navegação e Zoom */}
        <MapControls
          onCenterActiveStage={() => centerOnStage(currentStageNumber)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          currentZoom={zoom}
        />
      </div>

      {/* 3. Footer com os 3 cards da referência (Conselho, Stepper Geral e Baú) */}
      <MapProgressFooter
        currentStageNumber={currentStageNumber}
        completedStagesCount={completedStagesCount}
        totalStages={LEARNING_MODULES.length}
        onSelectStageNumber={(stageNum) => {
          const mod = LEARNING_MODULES.find((m) => m.stageNumber === stageNum);
          if (mod) setSelectedDrawerModule(mod);
        }}
      />

      {/* Modal/Drawer de Detalhes da Etapa e Conceitos */}
      {selectedDrawerModule && (
        <StageDetailDrawer
          module={selectedDrawerModule}
          progress={progressMap[selectedDrawerModule.id]}
          evaluation={evaluationsMap[selectedDrawerModule.id]}
          isCurrent={selectedDrawerModule.id === activeModuleId}
          isCompleted={
            progressMap[selectedDrawerModule.id]?.status === "completed" ||
            (progressMap[selectedDrawerModule.id]?.progress_percent ?? 0) >= 100
          }
          onClose={() => setSelectedDrawerModule(null)}
          onEnterStage={(moduleId) => {
            onSelectModule(moduleId);
            if (onClose) onClose();
          }}
          onViewEvaluation={(evalItem) => {
            setActiveModalEvaluation(evalItem);
          }}
          onStartExam={(moduleId) => {
            setExamModuleId(moduleId);
          }}
        />
      )}

      {/* Modal Detalhado de Avaliação do Mr. Crazy */}
      <ModuleEvaluationModal
        evaluation={activeModalEvaluation}
        onClose={() => setActiveModalEvaluation(null)}
        onActionAgain={(moduleId) => {
          onSelectModule(moduleId);
          setActiveModalEvaluation(null);
          if (onClose) onClose();
        }}
      />

      {/* Modal de Prova Prática com o Avatar Pixelado Nativo */}
      <ExamModal
        isOpen={Boolean(examModuleId)}
        moduleId={examModuleId || "greetings"}
        onClose={() => setExamModuleId(null)}
        onSuccessApproved={(evalItem) => {
          if (examModuleId) {
            setProgressMap((prev) => ({
              ...prev,
              [examModuleId]: {
                module_id: examModuleId,
                status: "completed",
                progress_percent: 100,
                total_turns: (prev[examModuleId]?.total_turns ?? 0) + 4,
                completed_missions: ["Prova da Etapa Aprovada"],
                last_practiced_at: new Date().toISOString()
              }
            }));
            setEvaluationsMap((prev) => ({
              ...prev,
              [examModuleId]: evalItem
            }));
          }
        }}
      />
    </div>
  );
}

