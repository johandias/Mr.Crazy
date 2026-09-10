"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
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

const emotionPalette: Record<Emotion, { base: string; hot: string; glow: string; eye: string; mouth: string }> = {
  calm: {
    base: "#76c8da",
    hot: "#d8fbff",
    glow: "#6fb8c9",
    eye: "#d9fbff",
    mouth: "#060809"
  },
  annoyed: {
    base: "#d95e3a",
    hot: "#ffc09b",
    glow: "#ef5937",
    eye: "#fff1bc",
    mouth: "#090704"
  },
  irritated: {
    base: "#df4833",
    hot: "#ffad8d",
    glow: "#ff4f36",
    eye: "#fff2c4",
    mouth: "#0d0604"
  },
  crazy: {
    base: "#d83a2f",
    hot: "#ff9b83",
    glow: "#ff3f2f",
    eye: "#fff0ba",
    mouth: "#120302"
  }
};

function seeded(index: number) {
  const value = Math.sin(index * 999.91) * 10000;
  return value - Math.floor(value);
}

function makeSphereVoxels() {
  const voxels: Voxel[] = [];
  const radius = 2.04;
  const count = 1180;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const seed = seeded(index);
    const y = 1 - (index / (count - 1)) * 2;
    const ringRadius = Math.sqrt(1 - y * y);
    const theta = index * goldenAngle;
    const surfaceNoise = 1 + (seed - 0.5) * 0.026;

    voxels.push({
      x: Math.cos(theta) * ringRadius * radius * surfaceNoise,
      y: y * radius * surfaceNoise,
      z: Math.sin(theta) * ringRadius * radius * surfaceNoise,
      seed,
      size: 0.165 + seed * 0.034
    });
  }

  return voxels;
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
      // Olhos amendoados, expressivos e carismáticos
      const cols = 5;
      const rows = 3;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if ((row === 0 || row === 2) && (col === 0 || col === cols - 1)) continue;
          const localX = col - (cols - 1) / 2;
          const x = s * 0.68 + localX * 0.095;
          const y = 0.48 - row * 0.096;
          const isCenter = row === 1 && col === 2;

          voxels.push({
            x,
            y,
            z: frontZ(x, y),
            seed: seeded(500 + index++),
            size: isCenter ? 0.165 : 0.145,
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
            z: frontZ(x, y),
            seed: seeded(500 + index++),
            size: 0.15,
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
            z: frontZ(x, y),
            seed: seeded(500 + index++),
            size: emotion === "crazy" ? 0.16 : 0.155,
            side: s
          });
        }
      }
    }
  });

  return voxels;
}

function makeBrowVoxels(emotion: Emotion) {
  const voxels: Voxel[] = [];
  let index = 0;

  [-1, 1].forEach((side) => {
    const s = side as -1 | 1;
    const count = 6;

    for (let col = 0; col < count; col += 1) {
      const localX = col - (count - 1) / 2;
      const x = s * 0.68 + localX * 0.098;
      let y = 0.69;

      if (emotion === "calm") {
        // Sobrancelhas suaves e carismáticas, levemente arqueadas
        const arch = -(localX * localX) * 0.014;
        y = 0.68 + arch;
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
        size: 0.125,
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
      const x = localX * 0.1;
      const curve = Math.abs(localX) ** 1.7 * 0.022;
      const y = -0.64 + curve;

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed: seeded(820 + index++),
        size: 0.12,
        part: "upper"
      });
    }

    // Lábio inferior (sorriso aberto e amigável)
    const lowerCols = 5;
    for (let col = 0; col < lowerCols; col += 1) {
      const localX = col - (lowerCols - 1) / 2;
      const x = localX * 0.1;
      const curve = Math.abs(localX) ** 1.7 * 0.016;
      const y = -0.74 + curve;

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed: seeded(820 + index++),
        size: 0.12,
        part: "lower"
      });
    }

    // Cantos do sorriso
    voxels.push({
      x: -0.36,
      y: -0.61,
      z: frontZ(-0.36, -0.61) + 0.03,
      seed: seeded(820 + index++),
      size: 0.115,
      part: "corner"
    });
    voxels.push({
      x: 0.36,
      y: -0.61,
      z: frontZ(0.36, -0.61) + 0.03,
      seed: seeded(820 + index++),
      size: 0.115,
      part: "corner"
    });

    return voxels;
  }

  if (emotion === "annoyed") {
    // Meio sorriso irônico / beiço de desdém assimétrico
    const cols = 8;
    for (let col = 0; col < cols; col += 1) {
      const localX = col - (cols - 1) / 2;
      const x = localX * 0.105;
      const curl = localX * 0.035 - Math.abs(localX) * 0.015;
      const y = -0.67 + curl;

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed: seeded(820 + index++),
        size: 0.125,
        part: localX < 0 ? "lower" : "upper"
      });
    }

    for (let col = 1; col < cols - 1; col += 1) {
      const localX = col - (cols - 1) / 2;
      const x = localX * 0.1;
      const curl = localX * 0.03;
      const y = -0.76 + curl;

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed: seeded(820 + index++),
        size: 0.12,
        part: "lower"
      });
    }

    return voxels;
  }

  // Irritated & Crazy: Boca ampla com dentes ou careta enérgica
  const rows = emotion === "irritated"
    ? [
        { y: -0.58, cols: 7, width: 0.76, part: "upper" as const },
        { y: -0.72, cols: 9, width: 0.96, part: "center" as const },
        { y: -0.86, cols: 7, width: 0.76, part: "lower" as const }
      ]
    : [
        { y: -0.52, cols: 8, width: 0.88, part: "upper" as const },
        { y: -0.68, cols: 11, width: 1.12, part: "center" as const },
        { y: -0.84, cols: 11, width: 1.12, part: "center" as const },
        { y: -0.98, cols: 9, width: 0.94, part: "lower" as const }
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
        size: 0.13 + seeded(index) * 0.02,
        part: rowConfig.part
      });
    }
  });

  return voxels;
}

function makeDebrisVoxels() {
  return Array.from({ length: 52 }).map((_, index) => {
    const seed = seeded(1000 + index);
    const theta = seed * Math.PI * 2;
    const phi = seeded(1200 + index) * Math.PI;
    const radius = 2.45 + seeded(1400 + index) * 1.15;

    return {
      x: Math.cos(theta) * Math.sin(phi) * radius,
      y: Math.cos(phi) * radius * 0.82,
      z: Math.sin(theta) * Math.sin(phi) * radius,
      seed,
      size: 0.115 + seed * 0.1
    };
  });
}

function InstancedVoxels({
  voxels,
  color,
  emissive,
  emissiveIntensity = 0,
  crazyLevel,
  voiceState,
  variant = "body"
}: Readonly<{
  voxels: Voxel[];
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  crazyLevel: number;
  voiceState: VoiceState;
  variant?: "body" | "eye" | "mouth" | "brow" | "debris";
}>) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const intensity = crazyLevel / 100;

  useFrame(({ clock }) => {
    if (!mesh.current) return;

    const time = clock.getElapsedTime();
    const activeDebris = Math.max(0, (crazyLevel - 12) / 88);

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
      const unstable = variant === "body" && voxel.seed < intensity * 0.3;
      const faceTwitch = variant !== "body" && variant !== "debris" ? Math.sin(time * 12 + index) * intensity * 0.016 : 0;
      const jitter = unstable ? Math.sin(time * (10 + voxel.seed * 10) + voxel.seed * 20) * intensity * 0.11 : faceTwitch;
      const push = unstable ? intensity * voxel.seed * 0.18 : 0;

      if (variant === "debris") {
        const visible = voxel.seed < activeDebris;
        const orbit = time * (0.18 + voxel.seed * 0.26);
        const x = voxel.x * Math.cos(orbit) - voxel.z * Math.sin(orbit);
        const z = voxel.x * Math.sin(orbit) + voxel.z * Math.cos(orbit);
        const y = voxel.y + Math.sin(time * (1.2 + voxel.seed) + index) * 0.18;

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(visible ? voxel.size * (0.8 + activeDebris * 0.45) : 0.001);
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
        const scale = voxel.size * (1 + breath + (unstable ? Math.sin(time * 13 + index) * 0.08 : 0));
        dummy.position.set(voxel.x + jitter + push, voxel.y + jitter, voxel.z + jitter * 0.4);
        dummy.scale.setScalar(Math.max(0.08, scale));
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
    <instancedMesh ref={mesh} args={[undefined, undefined, voxels.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={variant === "mouth" ? 0.7 : 0.34}
        metalness={variant === "body" ? 0.16 : 0.08}
        emissive={emissive ?? color}
        emissiveIntensity={emissiveIntensity}
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
    const scale = 1 + crazyLevel / 420 + voicePulse;
    mesh.current.scale.setScalar(scale);
    mesh.current.rotation.y = time * 0.04;
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[2.18, 42, 42]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.09 + crazyLevel / 1200}
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
  const eyeVoxels = useMemo(() => makeEyeVoxels(emotion), [emotion]);
  const browVoxels = useMemo(() => makeBrowVoxels(emotion), [emotion]);
  const mouthVoxels = useMemo(() => makeMouthVoxels(emotion), [emotion]);
  const debrisVoxels = useMemo(() => makeDebrisVoxels(), []);
  const group = useRef<THREE.Group>(null);
  const palette = emotionPalette[emotion];

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
      <ambientLight intensity={0.74} />
      <spotLight position={[0, 3.8, 5.2]} angle={0.55} penumbra={0.7} intensity={5.2} color={palette.hot} />
      <directionalLight position={[4, 5, 5]} intensity={2.4} color="#ffffff" />
      <pointLight position={[-3.4, -1.8, 3.8]} intensity={3.2} color={palette.glow} />
      <pointLight position={[1.8, 0.4, 2.6]} intensity={crazyLevel > 45 ? 3.8 : 1.4} color={palette.eye} />
      <group ref={group}>
        <Aura color={palette.glow} crazyLevel={crazyLevel} voiceState={voiceState} />
        <InstancedVoxels
          voxels={bodyVoxels}
          color={palette.base}
          emissive={palette.glow}
          emissiveIntensity={0.1 + crazyLevel / 900}
          crazyLevel={crazyLevel}
          voiceState={voiceState}
        />
        <InstancedVoxels
          voxels={debrisVoxels}
          color={palette.base}
          emissive={palette.glow}
          emissiveIntensity={0.16 + crazyLevel / 520}
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="debris"
        />
        <InstancedVoxels
          voxels={eyeVoxels}
          color={palette.eye}
          emissive={palette.eye}
          emissiveIntensity={1.35 + crazyLevel / 85}
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="eye"
        />
        <InstancedVoxels
          voxels={browVoxels}
          color="#070809"
          emissive="#000000"
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="brow"
        />
        <InstancedVoxels
          voxels={mouthVoxels}
          color={palette.mouth}
          emissive={emotion === "calm" ? "#000000" : palette.glow}
          emissiveIntensity={emotion === "calm" ? 0 : 0.16}
          crazyLevel={crazyLevel}
          voiceState={voiceState}
          variant="mouth"
        />
      </group>
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
        camera={{ position: [0, 0, 7], fov: 39 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <CrazyScene crazyLevel={crazyLevel} emotion={emotion} voiceState={voiceState} />
      </Canvas>
      <div className="character-glow" aria-hidden="true" />
    </div>
  );
}
