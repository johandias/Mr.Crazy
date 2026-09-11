"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";

type Voxel = {
  x: number;
  y: number;
  z: number;
  seed: number;
  size: number;
  part?: "upper" | "lower" | "corner" | "center" | "brow";
  side?: -1 | 1;
};

const emotionPalette: Record<Emotion, { base: string; core: string; hot: string; glow: string; eye: string; mouth: string }> = {
  calm: {
    base: "#9be7ee",
    core: "#2f747c",
    hot: "#e1fcff",
    glow: "#91eef5",
    eye: "#f7fbff",
    mouth: "#143238"
  },
  annoyed: {
    base: "#e0a54f",
    core: "#3b2a12",
    hot: "#ffe3a0",
    glow: "#f2b84b",
    eye: "#fff6c9",
    mouth: "#15120d"
  },
  irritated: {
    base: "#e56e45",
    core: "#3f1b12",
    hot: "#ffd09a",
    glow: "#f29a3f",
    eye: "#fff0b8",
    mouth: "#17100b"
  },
  crazy: {
    base: "#d83a30",
    core: "#4c0d0a",
    hot: "#ff7658",
    glow: "#ff3527",
    eye: "#ffd66f",
    mouth: "#150302"
  }
};

function seeded(index: number) {
  const value = Math.sin(index * 999.91) * 10000;
  return value - Math.floor(value);
}

function makeSphereVoxels() {
  const voxels: Voxel[] = [];
  const radius = 2.04;
  const latitudeRings = 58;
  const equatorColumns = 122;
  let index = 0;

  for (let row = 0; row < latitudeRings; row += 1) {
    const phi = ((row + 0.5) / latitudeRings) * Math.PI;
    const ringRadius = Math.sin(phi);
    const columns = Math.max(8, Math.round(equatorColumns * ringRadius));
    const rowOffset = row % 2 === 0 ? 0 : Math.PI / columns;

    for (let column = 0; column < columns; column += 1) {
      const seed = seeded(index++);
      const theta = (column / columns) * Math.PI * 2 + rowOffset;
      const surfaceNoise = 1 + (seed - 0.5) * 0.012;
      const x = Math.cos(theta) * ringRadius * radius * surfaceNoise;
      const voxelY = Math.cos(phi) * radius * surfaceNoise;
      const z = Math.sin(theta) * ringRadius * radius * surfaceNoise;

      voxels.push({
        x,
        y: voxelY,
        z,
        seed,
        size: 0.1 + seed * 0.012
      });
    }
  }

  return voxels;
}

function makeEyeSocketVoxels() {
  const voxels: Voxel[] = [];
  let index = 0;

  [-1, 1].forEach((side) => {
    const s = side as -1 | 1;
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if ((row === 0 || row === 4) && (col < 2 || col > 6)) continue;
        const localX = col - 4;
        const x = s * 0.68 + localX * 0.088;
        const y = 0.66 - row * 0.096 + s * localX * 0.018;
        voxels.push({
          x,
          y,
          z: frontZ(x, y) + 0.015,
          seed: seeded(430 + index++),
          size: 0.092,
          side: s
        });
      }
    }
  });

  return voxels;
}

function makeMouthSocketVoxels() {
  const voxels: Voxel[] = [];
  const rows = [7, 11, 13, 11];
  let index = 0;

  rows.forEach((cols, row) => {
    for (let col = 0; col < cols; col += 1) {
      const localX = col - (cols - 1) / 2;
      const x = localX * 0.105;
      const y = -0.52 - row * 0.12 + Math.abs(localX) * 0.003;
      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.015,
        seed: seeded(760 + index++),
        size: 0.09,
        part: row < 2 ? "upper" : row > 2 ? "lower" : "center"
      });
    }
  });

  return voxels;
}

function makeTeethVoxels() {
  const positions = [
    [-0.36, -0.59, "upper"],
    [-0.24, -0.61, "upper"],
    [-0.12, -0.62, "upper"],
    [0, -0.63, "upper"],
    [0.12, -0.62, "upper"],
    [0.24, -0.61, "upper"],
    [0.36, -0.59, "upper"]
  ] as const;

  return positions.map(([x, y, part], index) => {
    return {
      x,
      y,
      z: frontZ(x, y) + 0.2,
      seed: seeded(940 + index),
      size: 0.068 + (index % 2) * 0.004,
      part
    };
  });
}

function makeMouthGlowVoxels() {
  return Array.from({ length: 5 }, (_, index) => {
    const x = (index - 2) * 0.11;
    const y = -0.82 - Math.abs(index - 2) * 0.012;
    return {
      x,
      y,
      z: frontZ(x, y) + 0.17,
      seed: seeded(980 + index),
      size: 0.064,
      part: "lower" as const
    };
  });
}

function frontZ(x: number, y: number) {
  return Math.sqrt(Math.max(0.3, 2.05 * 2.05 - x * x - y * y)) + 0.09;
}

function makeEyeVoxels(emotion: Emotion) {
  const voxels: Voxel[] = [];
  let index = 0;

  [-1, 1].forEach((side) => {
    const s = side as -1 | 1;
    if (emotion === "calm") {
      // Olhar alerta, mas mais amigável no estado calmo.
      const cols = 5;
      const rows = 3;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if ((row === 0 || row === 2) && (col === 0 || col === cols - 1)) continue;
          const localX = col - (cols - 1) / 2;
          const x = s * 0.68 + localX * 0.12;
          const y = 0.55 - row * 0.095;
          const isCenter = row === 1 && col === 2;

          voxels.push({
            x,
            y,
            z: frontZ(x, y) + 0.24,
            seed: seeded(500 + index++),
            size: isCenter ? 0.1 : 0.09,
            part: isCenter ? "center" : undefined,
            side: s
          });
        }
      }
    } else if (emotion === "annoyed") {
      // Olhar desconfiado e assimétrico (um olho mais semicerrado que o outro)
      const cols = 5;
      const rows = 3;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (s === -1 && row === 0) continue;
          if (row === 2 && (col === 0 || col === cols - 1)) continue;
          const localX = col - (cols - 1) / 2;
          const slant = s === -1 ? -localX * 0.035 : localX * 0.045;
          const x = s * 0.68 + localX * 0.098;
          const y = 0.47 - row * 0.095 + slant;

          voxels.push({
            x,
            y,
            z: frontZ(x, y) + 0.24,
            seed: seeded(500 + index++),
            size: 0.09,
            side: s
          });
        }
      }
    } else {
      // Irritated & Crazy: Olhar afunilado e penetrante com inclinação agressiva
      const cols = 5;
      const rows = 3;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (row === 2 && (col === 0 || col === cols - 1)) continue;
          const localX = col - (cols - 1) / 2;
          const angrySlant = s === -1 ? -localX * 0.058 : localX * 0.058;
          const x = s * 0.68 + localX * 0.1;
          const y = 0.48 - row * 0.105 + angrySlant;

          voxels.push({
            x,
            y,
            z: frontZ(x, y) + 0.24,
            seed: seeded(500 + index++),
            size: emotion === "crazy" ? 0.096 : 0.09,
            side: s
          });
        }
      }
    }
  });

  return voxels;
}

function makePupilVoxels(emotion: Emotion) {
  return [-1, 1].flatMap((side, sideIndex) => {
    const s = side as -1 | 1;
    const focusX = emotion === "annoyed" ? s * -0.025 : 0;
    const focusY = emotion === "crazy" ? 0.025 : 0;

    return [
      {
        x: s * 0.68 + focusX,
        y: 0.43 + focusY,
        z: frontZ(s * 0.68, 0.43) + 0.39,
        seed: seeded(610 + sideIndex * 3),
        size: 0.066,
        part: "center" as const,
        side: s
      },
      {
        x: s * 0.68 + focusX,
        y: 0.34 + focusY,
        z: frontZ(s * 0.68, 0.34) + 0.38,
        seed: seeded(611 + sideIndex * 3),
        size: 0.058,
        part: "center" as const,
        side: s
      }
    ];
  });
}

function makeEyeHighlightVoxels() {
  return [-1, 1].map((side, index) => {
    const s = side as -1 | 1;
    return {
      x: s * 0.68 - 0.025,
      y: 0.48,
      z: frontZ(s * 0.68, 0.48) + 0.48,
      seed: seeded(640 + index),
      size: 0.03,
      part: "center" as const,
      side: s
    };
  });
}

function makeBrowVoxels(emotion: Emotion) {
  const voxels: Voxel[] = [];
  let index = 0;

  [-1, 1].forEach((side) => {
    const s = side as -1 | 1;
    const count = 9;

    for (let col = 0; col < count; col += 1) {
      const localX = col - (count - 1) / 2;
      const x = s * 0.68 + localX * 0.066;
      let y = 0.69;

      if (emotion === "calm") {
        // Sobrancelhas suaves e carismáticas, levemente arqueadas.
        const arch = -(localX * localX) * 0.014;
        y = 0.74 + arch;
      } else if (emotion === "annoyed") {
        // Uma sobrancelha arqueada céptica (estilo The Rock), outra rebaixada
        if (s === 1) {
          y = 0.74 + localX * 0.03;
        } else {
          y = 0.64 - localX * 0.045;
        }
      } else if (emotion === "irritated") {
        // Franzidas para o centro em 'V' expressivo
        const innerSlant = s === -1 ? -localX * 0.06 : localX * 0.06;
        y = 0.66 + innerSlant;
      } else {
        // Crazy: Sobrancelhas super inclinadas e assimétricas
        const innerSlant = s === -1 ? -localX * 0.075 : localX * 0.075;
        y = 0.65 + innerSlant + (col % 2 === 0 ? 0.02 : -0.01);
      }

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.02,
        seed: seeded(650 + index++),
        size: 0.068,
        part: "brow",
        side: s
      });
    }
  });

  return voxels;
}

function makeMouthVoxels(emotion: Emotion) {
  const voxels: Voxel[] = [];
  let index = 0;

  if (emotion === "calm") {
    // Sorriso confiante e carismático com cantos levemente elevados
    // Lábio superior
    const upperCols = 7;
    for (let col = 0; col < upperCols; col += 1) {
      const localX = col - (upperCols - 1) / 2;
      const x = localX * 0.085;
      const curve = Math.abs(localX) ** 1.7 * 0.022;
      const y = -0.64 + curve;

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed: seeded(820 + index++),
        size: 0.064,
        part: "upper"
      });
    }

    // Lábio inferior (sorriso aberto e amigável)
    const lowerCols = 5;
    for (let col = 0; col < lowerCols; col += 1) {
      const localX = col - (lowerCols - 1) / 2;
      const x = localX * 0.085;
      const curve = Math.abs(localX) ** 1.7 * 0.016;
      const y = -0.74 + curve;

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed: seeded(820 + index++),
        size: 0.064,
        part: "lower"
      });
    }

    // Cantos do sorriso
    voxels.push({
      x: -0.3,
      y: -0.61,
      z: frontZ(-0.36, -0.61) + 0.03,
      seed: seeded(820 + index++),
      size: 0.062,
      part: "corner"
    });
    voxels.push({
      x: 0.3,
      y: -0.61,
      z: frontZ(0.36, -0.61) + 0.03,
      seed: seeded(820 + index++),
      size: 0.062,
      part: "corner"
    });

    return voxels;
  }

  if (emotion === "annoyed") {
    // Meio sorriso irônico / beiço de desdém assimétrico
    const cols = 8;
    for (let col = 0; col < cols; col += 1) {
      const localX = col - (cols - 1) / 2;
      const x = localX * 0.085;
      const curl = localX * 0.035 - Math.abs(localX) * 0.015;
      const y = -0.67 + curl;

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed: seeded(820 + index++),
        size: 0.066,
        part: localX < 0 ? "lower" : "upper"
      });
    }

    for (let col = 1; col < cols - 1; col += 1) {
      const localX = col - (cols - 1) / 2;
      const x = localX * 0.082;
      const curl = localX * 0.03;
      const y = -0.76 + curl;

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed: seeded(820 + index++),
        size: 0.064,
        part: "lower"
      });
    }

    return voxels;
  }

  // Irritated & Crazy: Boca ampla com dentes ou careta enérgica
  const rows = emotion === "irritated"
    ? [
        { y: -0.58, cols: 9, width: 0.64, part: "upper" as const },
        { y: -0.72, cols: 11, width: 0.78, part: "center" as const },
        { y: -0.86, cols: 9, width: 0.64, part: "lower" as const }
      ]
    : [
        { y: -0.54, cols: 9, width: 0.72, part: "upper" as const },
        { y: -0.68, cols: 13, width: 0.88, part: "center" as const },
        { y: -0.82, cols: 13, width: 0.88, part: "center" as const },
        { y: -0.94, cols: 9, width: 0.7, part: "lower" as const }
      ];

  rows.forEach((rowConfig, row) => {
    for (let col = 0; col < rowConfig.cols; col += 1) {
      const skipCorner =
        (row === 0 || row === rows.length - 1) &&
        (col === 0 || col === rowConfig.cols - 1) &&
        seeded(900 + row * 20 + col) > 0.38;
      if (skipCorner) continue;

      const localX = col - (rowConfig.cols - 1) / 2;
      const x = (localX / Math.max(1, rowConfig.cols - 1)) * rowConfig.width * 2;
      const y = rowConfig.y + Math.sin(localX * 1.4) * 0.012;

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed: seeded(820 + index++),
        size: 0.064 + seeded(index) * 0.01,
        part: rowConfig.part
      });
    }
  });

  return voxels;
}

function makeDebrisVoxels() {
  return Array.from({ length: 24 }).map((_, index) => {
    const seed = seeded(1000 + index);
    const theta = seed * Math.PI * 2;
    const phi = seeded(1200 + index) * Math.PI;
    const radius = 2.55 + seeded(1400 + index) * 0.9;

    return {
      x: Math.cos(theta) * Math.sin(phi) * radius,
      y: Math.cos(phi) * radius * 0.82,
      z: Math.sin(theta) * Math.sin(phi) * radius,
      seed,
      size: 0.052 + seed * 0.045
    };
  });
}

function InstancedVoxels({
  voxels,
  color,
  emissive,
  emissiveIntensity = 0,
  colorVariation = 0.04,
  crazyLevel,
  voiceState,
  variant = "body"
}: Readonly<{
  voxels: Voxel[];
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  colorVariation?: number;
  crazyLevel: number;
  voiceState: VoiceState;
  variant?: "body" | "eye" | "mouth" | "brow" | "debris";
}>) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const intensity = crazyLevel / 100;

  useEffect(() => {
    if (!mesh.current) return;

    voxels.forEach((voxel, index) => {
      const instanceColor = new THREE.Color(color);
      instanceColor.offsetHSL((voxel.seed - 0.5) * 0.018, -voxel.seed * 0.025, (voxel.seed - 0.5) * colorVariation);
      mesh.current?.setColorAt(index, instanceColor);
    });
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [color, colorVariation, voxels]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;

    const time = clock.getElapsedTime();
    const activeDebris = Math.max(0, Math.min(1, (crazyLevel - 34) / 72));

    // Ciclo de piscada natural dos olhos (a cada ~3.8 segundos com piscadas duplas ocasionais)
    const blinkCycle = time % 3.8;
    let blink = 0;
    if (blinkCycle < 0.14) {
      blink = Math.sin((blinkCycle / 0.14) * Math.PI);
    } else if (blinkCycle > 0.28 && blinkCycle < 0.42) {
      blink = Math.sin(((blinkCycle - 0.28) / 0.14) * Math.PI) * 0.85;
    }

    // Modulação rítmica de articulação da fala ao pronunciar palavras
    const isSpeaking = voiceState === "speaking";
    const speechViseme = isSpeaking
      ? Math.abs(Math.sin(time * 12)) * 0.46 +
        Math.abs(Math.sin(time * 19)) * 0.32 +
        Math.abs(Math.sin(time * 7.5)) * 0.22
      : 0;

    // Elevação expressiva das sobrancelhas ao escutar atenciosamente
    const isListening = voiceState === "listening";
    const browLift = isListening ? 0.045 : isSpeaking ? Math.sin(time * 8) * 0.018 : 0;

    // Ajuste de foco ocular ao pensar / escutar
    const isAnalyzing = voiceState === "analyzing";
    const eyeAnalyzeSquint = isAnalyzing ? 0.38 : 0;
    const eyeListenWiden = isListening ? -0.12 : 0;
    const totalEyeClose = Math.max(0, Math.min(1, blink + eyeAnalyzeSquint + eyeListenWiden));

    // Direção do olhar (gaze tracking e micro-sacadas humanas)
    let gazeX = 0;
    let gazeY = 0;
    if (isAnalyzing) {
      // Olhando para cima e para o lado (pose pensativa)
      gazeX = 0.036;
      gazeY = 0.032;
    } else if (isListening) {
      // Olhar focado direto no usuário
      gazeX = 0;
      gazeY = -0.01;
    } else {
      // Micro-sacadas naturais de quem está vivo e presente
      const gazeCycle = Math.floor(time * 0.7);
      gazeX = (seeded(gazeCycle * 17) - 0.5) * 0.032;
      gazeY = (seeded(gazeCycle * 23) - 0.5) * 0.022;
    }

    voxels.forEach((voxel, index) => {
      const unstable = variant === "body" && intensity > 0.48 && voxel.seed < (intensity - 0.42) * 0.24;
      const faceTwitch = variant !== "body" && variant !== "debris" ? Math.sin(time * 12 + index) * intensity * 0.016 : 0;
      const jitter = unstable ? Math.sin(time * (10 + voxel.seed * 10) + voxel.seed * 20) * intensity * 0.028 : faceTwitch;
      const push = unstable ? intensity * voxel.seed * 0.045 : 0;

      if (variant === "debris") {
        const visible = voxel.seed < activeDebris;
        const orbit = time * (0.18 + voxel.seed * 0.26);
        const x = voxel.x * Math.cos(orbit) - voxel.z * Math.sin(orbit);
        const z = voxel.x * Math.sin(orbit) + voxel.z * Math.cos(orbit);
        const y = voxel.y + Math.sin(time * (1.2 + voxel.seed) + index) * 0.18;

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(visible ? voxel.size * (0.75 + activeDebris * 0.38) : 0.001);
        dummy.rotation.set(time * (0.22 + voxel.seed * 0.28) + voxel.seed, time * 0.2, time * 0.14);
      } else if (variant === "eye") {
        // Animação de piscada, foco e micro-sacadas humanas
        const scaleY = Math.max(0.08, 1 - totalEyeClose * 0.92);
        const blinkYOffset = -totalEyeClose * 0.02;
        const eyeGazeX = voxel.part === "center" ? gazeX * 1.5 : gazeX;
        const eyeGazeY = voxel.part === "center" ? gazeY * 1.5 : gazeY;

        dummy.position.set(
          voxel.x + jitter + eyeGazeX,
          voxel.y + jitter + blinkYOffset + eyeGazeY,
          voxel.z + jitter * 0.3
        );
        dummy.scale.set(voxel.size, voxel.size * scaleY, voxel.size);
        dummy.rotation.set(0, 0, 0);
      } else if (variant === "brow") {
        // Sobrancelha expressiva que reage ao áudio e escuta
        const browYOffset = browLift + (isAnalyzing ? -0.02 : 0);
        dummy.position.set(voxel.x + jitter, voxel.y + jitter + browYOffset, voxel.z + jitter * 0.3);
        dummy.scale.setScalar(voxel.size);
        dummy.rotation.set(0, 0, 0);
      } else if (variant === "mouth") {
        // Articulação realista de boca abrindo e fechando na fala
        let mouthYOffset = 0;
        if (voxel.part === "upper") {
          mouthYOffset = speechViseme * 0.05;
        } else if (voxel.part === "lower") {
          mouthYOffset = -speechViseme * 0.17;
        } else if (voxel.part === "corner") {
          mouthYOffset = -speechViseme * 0.04 + (isSpeaking ? Math.sin(time * 10) * 0.01 : 0);
        } else {
          mouthYOffset = voxel.y < -0.68 ? -speechViseme * 0.15 : speechViseme * 0.04;
        }

        const reactDrop = voiceState === "reacting" && crazyLevel > 50 ? -0.06 : 0;
        const mouthWidthScale = 1 + (isSpeaking ? Math.sin(time * 15) * 0.08 : 0);
        dummy.position.set(
          voxel.x * mouthWidthScale + jitter,
          voxel.y + jitter + mouthYOffset + (voxel.part === "lower" ? reactDrop : 0),
          voxel.z + jitter * 0.3
        );
        dummy.scale.set(voxel.size, voxel.size * (1 + speechViseme * 0.22), voxel.size);
        dummy.rotation.set(0, 0, 0);
      } else {
        // Corpo voxelizado com respiração sutil
        const breath = Math.sin(time * 2) * 0.015;
        const scale = voxel.size * (1 + breath + (unstable ? Math.sin(time * 13 + index) * 0.045 : 0));
        dummy.position.set(voxel.x + jitter + push, voxel.y + jitter, voxel.z + jitter * 0.35);
        dummy.scale.setScalar(Math.max(0.06, scale));
        dummy.rotation.set(
          Math.sin(time * 0.72 + voxel.seed * 8) * 0.045,
          Math.cos(time * 0.56 + voxel.seed * 6) * 0.045,
          Math.sin(time * 0.48 + voxel.seed * 5) * 0.035
        );
      }

      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, voxels.length]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={variant === "mouth" ? 0.68 : 0.42}
        metalness={variant === "body" ? 0.1 : 0.05}
        emissive={emissive ?? color}
        emissiveIntensity={emissiveIntensity}
        vertexColors
      />
    </instancedMesh>
  );
}

function Aura({ color, crazyLevel, voiceState }: Readonly<{ color: string; crazyLevel: number; voiceState: VoiceState }>) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const time = clock.getElapsedTime();
    const voicePulse = voiceState === "speaking" || voiceState === "listening" ? Math.sin(time * 7) * 0.08 : 0;
    const scale = 0.94 + crazyLevel / 620 + voicePulse;
    mesh.current.scale.setScalar(scale);
    mesh.current.rotation.y = time * 0.04;
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[2.08, 42, 42]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.014 + crazyLevel / 3600}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function CrazyScene({
  crazyLevel,
  emotion,
  voiceState
}: Readonly<{ crazyLevel: number; emotion: Emotion; voiceState: VoiceState }>) {
  const bodyVoxels = useMemo(() => makeSphereVoxels(), []);
  const eyeSocketVoxels = useMemo(() => makeEyeSocketVoxels(), []);
  const eyeVoxels = useMemo(() => makeEyeVoxels(emotion), [emotion]);
  const pupilVoxels = useMemo(() => makePupilVoxels(emotion), [emotion]);
  const eyeHighlightVoxels = useMemo(() => makeEyeHighlightVoxels(), []);
  const browVoxels = useMemo(() => makeBrowVoxels(emotion), [emotion]);
  const mouthSocketVoxels = useMemo(() => makeMouthSocketVoxels(), []);
  const mouthVoxels = useMemo(() => makeMouthVoxels(emotion), [emotion]);
  const teethVoxels = useMemo(() => makeTeethVoxels(), []);
  const mouthGlowVoxels = useMemo(() => makeMouthGlowVoxels(), []);
  const debrisVoxels = useMemo(() => makeDebrisVoxels(), []);
  const group = useRef<THREE.Group>(null);
  const palette = emotionPalette[emotion];
  const isVeryStressed = emotion === "crazy";
  const heat = isVeryStressed ? crazyLevel / 100 : 0;
  const calmGlow = emotion === "calm" ? 0.16 : emotion === "annoyed" ? 0.11 : emotion === "irritated" ? 0.08 : 0;
  const showOpenMouth = emotion === "irritated" || emotion === "crazy" || voiceState === "speaking";
  const showMouthGlow = emotion === "crazy" || (emotion === "irritated" && voiceState === "speaking");

  // Postura dinâmica e suave da cabeça
  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.getElapsedTime();
    const stressShake = crazyLevel > 60 ? Math.sin(time * 24) * 0.012 : 0;

    let targetRotX = Math.sin(time * 0.3) * 0.024;
    let targetRotY = Math.sin(time * 0.36) * 0.042;
    let targetRotZ = 0;

    if (voiceState === "listening") {
      // Inclinação atenta para escutar o usuário
      targetRotZ = -0.065;
      targetRotY = 0.075;
      targetRotX = 0.045;
    } else if (voiceState === "analyzing") {
      // Olhar inclinado em postura de raciocínio crítico
      targetRotZ = 0.045;
      targetRotY = -0.13;
      targetRotX = -0.065;
    } else if (voiceState === "speaking") {
      // Gestual de fala: acenos rítmicos afirmativos acompanhando a locução
      targetRotX = Math.sin(time * 8.5) * 0.045 + 0.02;
      targetRotY = Math.sin(time * 3.2) * 0.038;
      targetRotZ = Math.sin(time * 2.4) * 0.02;
    } else if (voiceState === "reacting") {
      // Reação imediata ao resultado: aprovação relaxada ou espanto cômico
      if (emotion === "calm") {
        targetRotX = Math.sin(time * 5) * 0.035 - 0.02;
        targetRotZ = 0.03;
        targetRotY = 0.02;
      } else {
        targetRotX = -0.07;
        targetRotZ = -0.055;
        targetRotY = 0.06;
      }
    }

    // Interpolação suave para movimentos orgânicos sem trancos
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetRotX, 0.09);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotY, 0.09);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, targetRotZ, 0.09);
    group.current.position.y = Math.sin(time * 1.15) * 0.05 + stressShake;
  });

  return (
    <>
      <ambientLight intensity={0.78} />
      <spotLight castShadow position={[-2.8, 4.6, 5.8]} angle={0.48} penumbra={0.78} intensity={5.1 + heat * 2.2} color={palette.hot} />
      <directionalLight position={[4.5, 3.2, 4.8]} intensity={2.9} color="#f6fbff" />
      <pointLight position={[0, 1.1, 5.4]} intensity={1.9} color="#e7fdff" distance={6.4} />
      <pointLight position={[-3.5, -1.5, 3.6]} intensity={1.9 + heat * 1.55} color={palette.glow} />
      <pointLight position={[2.2, 0.4, 3.7]} intensity={0.72 + heat * 1.9} color={palette.eye} distance={5.5} />
      <group ref={group}>
        <Aura color={palette.glow} crazyLevel={crazyLevel} voiceState={voiceState} />
        <mesh castShadow>
          <sphereGeometry args={[1.94, 48, 48]} />
          <meshStandardMaterial color={palette.core} roughness={0.78} metalness={0.02} />
        </mesh>
        <InstancedVoxels
          voxels={bodyVoxels}
          color={palette.base}
          emissive={palette.glow}
          emissiveIntensity={calmGlow + heat * 0.18}
          colorVariation={0.22}
          crazyLevel={crazyLevel}
          voiceState={voiceState}
        />
        <InstancedVoxels
          voxels={eyeSocketVoxels}
          color={emotion === "calm" ? "#2f7a84" : isVeryStressed ? "#090202" : "#263640"}
          emissive="#000000"
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="eye"
        />
        <InstancedVoxels
          voxels={debrisVoxels}
          color={palette.base}
          emissive={palette.glow}
          emissiveIntensity={0.04 + heat * 0.34}
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="debris"
        />
        <InstancedVoxels
          voxels={eyeVoxels}
          color={palette.eye}
          emissive={palette.eye}
          emissiveIntensity={0.22 + heat * 0.92}
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="eye"
        />
        <InstancedVoxels
          voxels={pupilVoxels}
          color="#071013"
          emissive="#000000"
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="eye"
        />
        <InstancedVoxels
          voxels={eyeHighlightVoxels}
          color="#fff8d7"
          emissive="#fff2b5"
          emissiveIntensity={0.9}
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="eye"
        />
        <InstancedVoxels
          voxels={browVoxels}
          color={emotion === "calm" ? "#285760" : "#070809"}
          emissive="#000000"
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="brow"
        />
        {showOpenMouth ? (
          <InstancedVoxels
            voxels={mouthSocketVoxels}
            color={palette.mouth}
            emissive={isVeryStressed ? "#260402" : "#000000"}
            emissiveIntensity={isVeryStressed ? 0.16 : 0.02}
            crazyLevel={crazyLevel}
            voiceState={voiceState}
            variant="mouth"
          />
        ) : null}
        <InstancedVoxels
          voxels={mouthVoxels}
          color={isVeryStressed ? "#7d160f" : emotion === "annoyed" ? "#5d4321" : "#326a72"}
          emissive={palette.glow}
          emissiveIntensity={0.02 + heat * 0.2}
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="mouth"
        />
        {showOpenMouth ? (
          <InstancedVoxels
            voxels={teethVoxels}
            color="#f8f0d7"
            emissive={isVeryStressed ? "#ffb35a" : "#e7fbff"}
            emissiveIntensity={0.12 + heat * 0.58}
            crazyLevel={crazyLevel}
            voiceState={voiceState}
            variant="mouth"
          />
        ) : null}
        {showMouthGlow ? (
          <InstancedVoxels
            voxels={mouthGlowVoxels}
            color={palette.hot}
            emissive={palette.glow}
            emissiveIntensity={isVeryStressed ? 0.72 + crazyLevel / 150 : 0.06}
            crazyLevel={crazyLevel}
            voiceState={voiceState}
            variant="mouth"
          />
        ) : null}
      </group>
      <mesh position={[0, -2.2, -0.15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.2, 64]} />
        <shadowMaterial transparent opacity={0.42} />
      </mesh>
    </>
  );
}

export function CrazyCharacter({
  crazyLevel,
  emotion,
  voiceState
}: Readonly<{ crazyLevel: number; emotion: Emotion; voiceState: VoiceState }>) {
  return (
    <div className={`character-stage ${emotion}`}>
      <Canvas
        camera={{ position: [0, 0.04, 8.35], fov: 39 }}
        dpr={[1, 1.75]}
        shadows="basic"
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.18;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <CrazyScene crazyLevel={crazyLevel} emotion={emotion} voiceState={voiceState} />
      </Canvas>
      <div className="character-glow" aria-hidden="true" />
    </div>
  );
}
