"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import {
  MR_CRAZY_MODEL_CACHE_KEY,
  MR_CRAZY_MODEL_PATH,
  MR_CRAZY_TEXTURE_PATHS
} from "@/lib/character-assets";

const LOADING_LINES = [
  "Acordando o Mr. Crazy...",
  "Mr. Crazy está tomando o antidepressivo para mais um dia de aulas...",
  "Mr. Crazy está escovando os dentes...",
  "Calibrando o ouvido para detectar seu inglês...",
  "Se prepare para ser xingado pelo Mr. Crazy."
];

type CharacterLoadingScreenProps = {
  onReady: () => void;
};

export function CharacterLoadingScreen({ onReady }: CharacterLoadingScreenProps) {
  const [progress, setProgress] = useState(4);
  const [loadingLine, setLoadingLine] = useState(LOADING_LINES[0]);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let finishTimer: number | undefined;
    let lineIndex = 0;
    const startedAt = performance.now();
    const modelLoader = new FBXLoader();

    try {
      if (window.localStorage.getItem(MR_CRAZY_MODEL_CACHE_KEY) === "ready") {
        onReady();
        return () => {
          cancelled = true;
        };
      }
    } catch {
      // O navegador pode bloquear storage; o pré-carregamento continua normalmente.
    }

    THREE.Cache.enabled = true;

    const phraseTimer = window.setInterval(() => {
      lineIndex = (lineIndex + 1) % LOADING_LINES.length;
      setLoadingLine(LOADING_LINES[lineIndex]);
    }, 1800);

    const complete = () => {
      if (cancelled) return;
      setIsIndeterminate(false);
      setProgress(100);
      const remaining = Math.max(0, 650 - (performance.now() - startedAt));
      finishTimer = window.setTimeout(() => {
        if (cancelled) return;
        try {
          window.localStorage.setItem(MR_CRAZY_MODEL_CACHE_KEY, "ready");
        } catch {
          // Sem storage, o navegador ainda aproveita o cache HTTP/Three.js.
        }
        onReady();
      }, remaining);
    };

    const textureLoader = new THREE.TextureLoader();
    const texturePromises = MR_CRAZY_TEXTURE_PATHS.map((path) => new Promise<void>((resolve, reject) => {
      textureLoader.load(path, () => resolve(), undefined, reject);
    }));

    modelLoader.load(
      MR_CRAZY_MODEL_PATH,
      () => Promise.all(texturePromises).then(complete).catch(() => complete()),
      (event) => {
        if (cancelled) return;
        if (event.lengthComputable && event.total > 0) {
          setIsIndeterminate(false);
          setProgress(Math.min(96, Math.max(5, Math.round((event.loaded / event.total) * 96))));
        } else {
          setIsIndeterminate(true);
        }
      },
      () => {
        if (cancelled) return;
        // Não prende o aluno se o arquivo 3D estiver indisponível: o palco ainda
        // possui o avatar de fallback e pode tentar novamente na próxima entrada.
        finishTimer = window.setTimeout(() => {
          if (!cancelled) onReady();
        }, 2200);
      }
    );

    return () => {
      cancelled = true;
      window.clearInterval(phraseTimer);
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
    };
  }, [onReady]);

  return (
    <main className="character-loading-screen" aria-label="Carregando pré-definições do Mr. Crazy">
      <div className="character-loading-card">
        <div className="character-loading-stage" aria-hidden="true">
          <div className="character-loading-aura" />
          <img
            src="/assets/character/mr_crazy_3d_gesturing.png"
            alt=""
            className="character-loading-avatar"
            draggable={false}
          />
        </div>
        <p className="character-loading-eyebrow">PRÉ-DEFINIÇÕES DO PERSONAGEM</p>
        <h1>Carregando o Mr. Crazy</h1>
        <p className="character-loading-line" aria-live="polite">{loadingLine}</p>
        <div className={`character-loading-progress ${isIndeterminate ? "is-indeterminate" : ""}`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="character-loading-meta">
          <span>{isIndeterminate ? "Preparando o palco..." : `${progress}% pronto`}</span>
          <span>Não feche a aula</span>
        </div>
      </div>
    </main>
  );
}
