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
};

const emotionColor: Record<Emotion, string> = {
  calm: "#6fb8c9",
  annoyed: "#c5a64e",
  irritated: "#d17338",
  crazy: "#d64d37"
};

function seeded(index: number) {
  const value = Math.sin(index * 999.91) * 10000;
  return value - Math.floor(value);
}

function makeSphereVoxels() {
  const voxels: Voxel[] = [];
  const radius = 2.05;
  let index = 0;

  for (let lat = -58; lat <= 58; lat += 14.5) {
    const y = Math.sin(THREE.MathUtils.degToRad(lat)) * radius;
    const rowRadius = Math.cos(THREE.MathUtils.degToRad(lat)) * radius;
    const columns = Math.max(10, Math.round(rowRadius * 15));

    for (let col = 0; col < columns; col += 1) {
      const angle = (col / columns) * Math.PI * 2;
      voxels.push({
        x: Math.cos(angle) * rowRadius,
        y,
        z: Math.sin(angle) * rowRadius,
        seed: seeded(index++)
      });
    }
  }

  return voxels;
}

function makeFaceVoxels(emotion: Emotion) {
  const mouthShape = emotion === "calm" ? [-0.55, -0.25, 0.05, 0.25, 0.55] : [-0.65, -0.3, 0, 0.3, 0.65];
  const browY = emotion === "crazy" ? 0.75 : emotion === "irritated" ? 0.68 : 0.62;
  const eyeY = emotion === "calm" ? 0.46 : 0.38;
  const mouthY = emotion === "calm" ? -0.55 : emotion === "annoyed" ? -0.62 : -0.7;
  const voxels: Voxel[] = [];

  [-0.62, -0.42, 0.42, 0.62].forEach((x, index) => voxels.push({ x, y: eyeY, z: 1.88, seed: seeded(500 + index) }));

  [-0.84, -0.62, 0.62, 0.84].forEach((x, index) => {
    const slant = x < 0 ? (emotion === "calm" ? 0 : 0.09) : emotion === "calm" ? 0 : -0.09;
    voxels.push({ x, y: browY + slant, z: 1.9, seed: seeded(600 + index) });
  });

  mouthShape.forEach((x, index) => {
    const curve = emotion === "calm" ? -Math.abs(x) * 0.14 : Math.abs(x) * 0.1;
    voxels.push({ x, y: mouthY + curve, z: 1.92, seed: seeded(700 + index) });
  });

  if (emotion === "crazy") {
    [-0.12, 0.15, 0.4].forEach((x, index) => voxels.push({ x, y: mouthY - 0.28, z: 1.96, seed: seeded(800 + index) }));
  }

  return voxels;
}

function InstancedVoxels({
  voxels,
  color,
  crazyLevel,
  voiceState,
  face = false
}: Readonly<{ voxels: Voxel[]; color: string; crazyLevel: number; voiceState: VoiceState; face?: boolean }>) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const materialColor = face ? "#090a0b" : baseColor.getStyle();
  const intensity = crazyLevel / 100;

  useFrame(({ clock }) => {
    if (!mesh.current) return;

    const time = clock.getElapsedTime();
    const listeningPulse = voiceState === "listening" ? Math.sin(time * 8) * 0.08 : 0;
    const speakingPulse = voiceState === "speaking" ? Math.sin(time * 11) * 0.06 : 0;

    voxels.forEach((voxel, index) => {
      const unstable = voxel.seed < intensity * (face ? 0.18 : 0.34);
      const jitter = unstable ? Math.sin(time * (8 + voxel.seed * 8) + voxel.seed * 20) * intensity * 0.18 : 0;
      const fall = unstable && !face ? Math.max(0, Math.sin(time * 0.8 + voxel.seed * 12)) * intensity * voxel.seed * 1.4 : 0;
      const push = unstable ? intensity * voxel.seed * 0.32 : 0;
      const scale = 0.23 + listeningPulse + speakingPulse + (unstable ? Math.sin(time * 13 + index) * 0.035 : 0);

      dummy.position.set(voxel.x + jitter + push, voxel.y - fall, voxel.z + jitter * 0.4);
      dummy.rotation.set(time * 0.2 + voxel.seed, time * 0.15, time * 0.1);
      dummy.scale.setScalar(Math.max(0.16, scale));
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, voxels.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={materialColor} roughness={0.42} metalness={0.08} />
    </instancedMesh>
  );
}

function CrazyScene({
  crazyLevel,
  emotion,
  voiceState
}: Readonly<{ crazyLevel: number; emotion: Emotion; voiceState: VoiceState }>) {
  const bodyVoxels = useMemo(() => makeSphereVoxels(), []);
  const faceVoxels = useMemo(() => makeFaceVoxels(emotion), [emotion]);
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.getElapsedTime();
    group.current.rotation.y = Math.sin(time * 0.42) * 0.16;
    group.current.rotation.x = Math.sin(time * 0.3) * 0.05;
    group.current.position.y = Math.sin(time * 1.2) * 0.07;
  });

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[3.5, 4, 5]} intensity={2.8} />
      <pointLight position={[-3, -2, 4]} intensity={2.2} color={emotionColor[emotion]} />
      <group ref={group}>
        <InstancedVoxels voxels={bodyVoxels} color={emotionColor[emotion]} crazyLevel={crazyLevel} voiceState={voiceState} />
        <InstancedVoxels voxels={faceVoxels} color="#090a0b" crazyLevel={crazyLevel} voiceState={voiceState} face />
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
        camera={{ position: [0, 0, 6.5], fov: 44 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <CrazyScene crazyLevel={crazyLevel} emotion={emotion} voiceState={voiceState} />
      </Canvas>
      <div className="character-glow" aria-hidden="true" />
    </div>
  );
}
