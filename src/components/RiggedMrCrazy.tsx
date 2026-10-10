"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";
import type { CharacterGesture } from "@/components/RpgCharacter";
import type { LiveAudioVisualizer } from "@/components/VoiceInputControl";
import {
  MR_CRAZY_MODEL_PATH,
  MR_CRAZY_TEXTURE_PATHS
} from "@/lib/character-assets";

type RiggedModelProps = {
  voiceState: VoiceState;
  gesture: CharacterGesture;
  emotion: Emotion;
  crazyLevel: number;
  isAwake: boolean;
  lookX: number;
  lookY: number;
  audioMetricsRef?: RefObject<LiveAudioVisualizer>;
  onReady?: () => void;
};

type BoneMap = Partial<Record<
  | "hips"
  | "spine"
  | "spine1"
  | "neck"
  | "head"
  | "leftArm"
  | "leftForeArm"
  | "rightArm"
  | "rightForeArm",
  THREE.Object3D
>>;

function findBones(root: THREE.Object3D): BoneMap {
  const bones: BoneMap = {};
  root.traverse((object) => {
    const name = object.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (name.endsWith("hips")) bones.hips = object;
    else if (name.endsWith("spine1")) bones.spine1 = object;
    else if (name.endsWith("spine")) bones.spine = object;
    else if (name.endsWith("neck")) bones.neck = object;
    else if (name.endsWith("head")) bones.head = object;
    else if (name.endsWith("leftarm")) bones.leftArm = object;
    else if (name.endsWith("leftforearm")) bones.leftForeArm = object;
    else if (name.endsWith("rightarm")) bones.rightArm = object;
    else if (name.endsWith("rightforearm")) bones.rightForeArm = object;
  });
  return bones;
}

function RiggedModel({
  voiceState,
  gesture,
  emotion,
  crazyLevel,
  isAwake,
  lookX,
  lookY,
  audioMetricsRef,
  onReady
}: RiggedModelProps) {
  const model = useLoader(FBXLoader, MR_CRAZY_MODEL_PATH);
  const [diffuseMap, metallicMap, normalMap, roughnessMap] = useLoader(
    THREE.TextureLoader,
    [...MR_CRAZY_TEXTURE_PATHS]
  );
  const modelRootRef = useRef<THREE.Group>(null);
  const previousOffsets = useRef(new Map<THREE.Object3D, THREE.Euler>());
  const bones = useMemo(() => findBones(model), [model]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);

  useEffect(() => {
    [diffuseMap, metallicMap, normalMap, roughnessMap].forEach((texture, index) => {
      texture.flipY = false;
      texture.needsUpdate = true;
      if (index === 0) texture.colorSpace = THREE.SRGBColorSpace;
    });

    model.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((entry) => {
        const material = entry as THREE.MeshStandardMaterial;
        material.map = diffuseMap;
        material.metalnessMap = metallicMap;
        material.normalMap = normalMap;
        material.roughnessMap = roughnessMap;
        material.metalness = 0.28;
        material.roughness = 0.68;
        material.needsUpdate = true;
      });
    });

    const clip = model.animations[0];
    const action = clip
      ? mixer.clipAction(clip).reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.35).play()
      : null;
    onReady?.();
    return () => {
      action?.fadeOut(0.2);
      mixer.stopAllAction();
      if (clip) mixer.uncacheAction(clip, model);
    };
  }, [diffuseMap, metallicMap, model, mixer, normalMap, onReady, roughnessMap]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = size.y > 0 ? 2.95 / size.y : 0.01;
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale - 1.18, -center.z * scale);
  }, [model]);

  useFrame((_, delta) => {
    const speaking = voiceState === "speaking";
    const listening = voiceState === "listening";
    // O clip do FBX precisa avançar desde o primeiro frame; bloquear o mixer
    // no estado idle deixava o personagem preso na pose T de bind.
    mixer.update(Math.min(delta, 0.05));

    const metrics = audioMetricsRef?.current;
    const audioLevel = metrics?.source === "crazy" ? metrics.level : 0;
    const energy = Math.min(1, Math.max(0, crazyLevel / 100));
    const time = performance.now() * 0.001;
    const talkPulse = speaking ? Math.sin(time * 8) * (0.025 + audioLevel * 0.05) : 0;
    const idleBreath = isAwake ? Math.sin(time * 1.65) * 0.018 : 0;
    const gestureLift = gesture === "heart" || gesture === "thumbsup" || gesture === "watergun" ? 0.16 : 0;
    const annoyedLean = emotion === "crazy" || emotion === "irritated" ? energy * 0.035 : 0;

    const offsets = new Map<THREE.Object3D, THREE.Euler>();
    const setOffset = (bone: THREE.Object3D | undefined, x = 0, y = 0, z = 0) => {
      if (!bone) return;
      const previous = previousOffsets.current.get(bone);
      if (previous) bone.rotation.set(
        bone.rotation.x - previous.x,
        bone.rotation.y - previous.y,
        bone.rotation.z - previous.z
      );
      const next = new THREE.Euler(x, y, z);
      bone.rotation.set(
        bone.rotation.x + next.x,
        bone.rotation.y + next.y,
        bone.rotation.z + next.z
      );
      offsets.set(bone, next);
    };

    setOffset(bones.hips, idleBreath * 0.35, lookX * 0.035, annoyedLean);
    setOffset(bones.spine, -idleBreath * 0.55 - talkPulse, 0, annoyedLean * 0.55);
    setOffset(bones.spine1, -idleBreath * 0.35 - talkPulse * 0.7, 0, 0);
    setOffset(bones.neck, lookY * 0.08 - talkPulse * 0.35, lookX * 0.12, 0);
    setOffset(bones.head, lookY * 0.14 - talkPulse * 0.5, lookX * 0.18, 0);

    const armWave = speaking ? Math.sin(time * 4.2) * 0.13 : 0;
    const leftGesture = gesture === "watergun" || gesture === "heart" ? -gestureLift : 0;
    const rightGesture = gesture === "thumbsup" || gesture === "watergun" ? gestureLift : 0;
    setOffset(bones.leftArm, -leftGesture + armWave, 0, speaking ? -0.1 : 0);
    setOffset(bones.rightArm, -rightGesture - armWave, 0, speaking ? 0.1 : 0);
    setOffset(bones.leftForeArm, leftGesture * 0.75, speaking ? armWave * 0.45 : 0, 0);
    setOffset(bones.rightForeArm, rightGesture * 0.75, speaking ? -armWave * 0.45 : 0, 0);
    previousOffsets.current = offsets;

    if (modelRootRef.current) {
      const targetLookX = isAwake ? lookX : 0;
      modelRootRef.current.rotation.y = THREE.MathUtils.lerp(modelRootRef.current.rotation.y, targetLookX * 0.12, 0.08);
      modelRootRef.current.position.y = THREE.MathUtils.lerp(modelRootRef.current.position.y, speaking ? -0.015 : 0, 0.08);
    }
  });

  return <group ref={modelRootRef}><primitive object={model} /></group>;
}

export function RiggedMrCrazy({
  fallbackSrc,
  ...props
}: RiggedModelProps & { fallbackSrc: string }) {
  const [isModelReady, setIsModelReady] = useState(false);
  const handleModelReady = useCallback(() => setIsModelReady(true), []);

  return (
    <div className="mr-crazy-rigged-canvas" aria-hidden="true">
      {!isModelReady && (
        <img src={fallbackSrc} alt="" className="mr-crazy-rigged-fallback" draggable={false} />
      )}
      <Canvas
        orthographic
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.28, 4.2], zoom: 116, near: 0.01, far: 100 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ camera }) => camera.lookAt(0, 1.28, 0)}
      >
        <ambientLight intensity={1.7} color="#fff4e5" />
        <directionalLight position={[2.5, 4, 3]} intensity={3.2} color="#fff7ed" castShadow />
        <directionalLight position={[-3, 2, 1]} intensity={1.4} color="#7dd3fc" />
        <Suspense fallback={null}>
          <RiggedModel {...props} onReady={handleModelReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
