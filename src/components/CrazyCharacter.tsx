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
  const rows = emotion === "calm" ? 2 : 3;
  const cols = 5;
  let index = 0;

  [-1, 1].forEach((side) => {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (emotion !== "calm" && row === 2 && (col === 0 || col === cols - 1)) continue;
        const localX = col - (cols - 1) / 2;
        const x = side * 0.68 + localX * 0.1;
        const angrySlant = side === -1 ? -localX * 0.052 : localX * 0.052;
        const y = 0.48 - row * 0.105 + (emotion === "calm" ? 0 : angrySlant);
        const seed = seeded(500 + index++);

        voxels.push({
          x,
          y,
          z: frontZ(x, y),
          seed,
          size: 0.155
        });
      }
    }
  });

  return voxels;
}

function makeBrowVoxels(emotion: Emotion) {
  if (emotion === "calm") return [];

  const voxels: Voxel[] = [];
  let index = 0;

  [-1, 1].forEach((side) => {
    for (let col = 0; col < 6; col += 1) {
      const localX = col - 2.5;
      const x = side * 0.69 + localX * 0.105;
      const y = 0.71 + (side === -1 ? -localX * 0.058 : localX * 0.058);
      const seed = seeded(650 + index++);

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.015,
        seed,
        size: 0.13
      });
    }
  });

  return voxels;
}

function makeMouthVoxels(emotion: Emotion) {
  const voxels: Voxel[] = [];
  let index = 0;

  if (emotion === "calm") {
    for (let col = 0; col < 5; col += 1) {
      const localX = col - 2;
      const x = localX * 0.13;
      const y = -0.66 - Math.abs(localX) * 0.025;
      const seed = seeded(820 + index++);

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed,
        size: 0.12
      });
    }

    return voxels;
  }

  const rows = emotion === "annoyed"
    ? [
        { y: -0.6, cols: 6, width: 0.68 },
        { y: -0.75, cols: 8, width: 0.88 },
        { y: -0.9, cols: 6, width: 0.68 }
      ]
    : [
        { y: -0.52, cols: 7, width: 0.78 },
        { y: -0.68, cols: 10, width: 1.06 },
        { y: -0.84, cols: 10, width: 1.08 },
        { y: -1, cols: 8, width: 0.86 }
      ];

  rows.forEach((rowConfig, row) => {
    for (let col = 0; col < rowConfig.cols; col += 1) {
      const skipCorner =
        (row === 0 || row === rows.length - 1) &&
        (col === 0 || col === rowConfig.cols - 1) &&
        seeded(900 + row * 20 + col) > 0.34;
      if (skipCorner) continue;

      const localX = col - (rowConfig.cols - 1) / 2;
      const x = (localX / Math.max(1, rowConfig.cols - 1)) * rowConfig.width * 2;
      const y = rowConfig.y + Math.sin(localX * 1.4) * 0.012;
      const seed = seeded(820 + index++);

      voxels.push({
        x,
        y,
        z: frontZ(x, y) + 0.03,
        seed,
        size: 0.13 + seed * 0.025
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
    const listeningPulse = voiceState === "listening" ? Math.sin(time * 8) * 0.05 : 0;
    const speakingPulse = voiceState === "speaking" ? Math.sin(time * 11) * 0.05 : 0;
    const activeDebris = Math.max(0, (crazyLevel - 12) / 88);

    voxels.forEach((voxel, index) => {
      const unstable = variant === "body" && voxel.seed < intensity * 0.3;
      const faceTwitch = variant !== "body" && variant !== "debris" ? Math.sin(time * 12 + index) * intensity * 0.018 : 0;
      const jitter = unstable ? Math.sin(time * (10 + voxel.seed * 10) + voxel.seed * 20) * intensity * 0.11 : faceTwitch;
      const push = unstable ? intensity * voxel.seed * 0.18 : 0;
      const scalePulse = 1 + listeningPulse + speakingPulse + (unstable ? Math.sin(time * 13 + index) * 0.08 : 0);
      const scale = voxel.size * scalePulse;

      if (variant === "debris") {
        const visible = voxel.seed < activeDebris;
        const orbit = time * (0.18 + voxel.seed * 0.26);
        const x = voxel.x * Math.cos(orbit) - voxel.z * Math.sin(orbit);
        const z = voxel.x * Math.sin(orbit) + voxel.z * Math.cos(orbit);
        const y = voxel.y + Math.sin(time * (1.2 + voxel.seed) + index) * 0.18;

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(visible ? scale * (0.8 + activeDebris * 0.45) : 0.001);
      } else {
        dummy.position.set(voxel.x + jitter + push, voxel.y + jitter, voxel.z + jitter * 0.4);
        dummy.scale.setScalar(Math.max(0.08, scale));
      }

      if (variant === "body") {
        dummy.rotation.set(
          Math.sin(time * 0.72 + voxel.seed * 8) * 0.045,
          Math.cos(time * 0.56 + voxel.seed * 6) * 0.045,
          Math.sin(time * 0.48 + voxel.seed * 5) * 0.035
        );
      } else if (variant === "debris") {
        dummy.rotation.set(time * (0.22 + voxel.seed * 0.28) + voxel.seed, time * 0.2, time * 0.14);
      } else {
        dummy.rotation.set(0, 0, 0);
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

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.getElapsedTime();
    const stressShake = crazyLevel > 60 ? Math.sin(time * 24) * 0.012 : 0;
    group.current.rotation.y = Math.sin(time * 0.36) * 0.045;
    group.current.rotation.x = Math.sin(time * 0.3) * 0.026;
    group.current.position.y = Math.sin(time * 1.15) * 0.06 + stressShake;
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
