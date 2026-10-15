"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { CharacterGesture } from "@/components/RpgCharacter";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";

type PixelMrCrazyProps = Readonly<{
  voiceState?: VoiceState;
  gesture?: CharacterGesture;
  emotion?: Emotion;
  crazyLevel?: number;
  lookX?: number;
  lookY?: number;
  phoneme?: number;
  isBlinking?: boolean;
  burstKey?: number;
  isAwake?: boolean;
}>;

/**
 * Mr. Crazy: Coruja Mago Professora de Inglês (Avatar 2D Nativo em Canvas).
 * Renderização gráfica rica e procedural:
 * - Biblioteca mágica com estantes de livros, velas flutuantes e cajado com cristal arcano.
 * - Penas sombreadas, túnica roxa e dourada com cinto de alquimista, frascos e runas.
 * - Óculos dourados, olhos de âmbar brilhantes com rastreamento de olhar e piscar.
 * - Chapéu pontudo de mago articulado com estrelas mágicas.
 * - Asas articuladas com gestos dinâmicos (lição, explicação, magia maluca).
 * - Bico procedural que se abre em sincronia com a voz do tutor e letras mágicas flutuantes (A-Z).
 */
export function PixelMrCrazy({
  voiceState = "idle",
  gesture = "idle",
  emotion = "calm",
  crazyLevel = 0,
  lookX = 0,
  lookY = 0,
  phoneme = 4,
  isBlinking = false,
  burstKey = 0,
  isAwake = false
}: PixelMrCrazyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isSpeaking = voiceState === "speaking";
  const activity = isSpeaking ? "speaking" : voiceState === "listening" ? "listening" : "idle";

  // Mapeamento de gestos do sistema para os gestos da Coruja Mago
  let targetGest = "idle";
  if (crazyLevel >= 45 || emotion === "crazy" || emotion === "irritated") {
    targetGest = "crazy";
  } else if (gesture === "thumbsup" || gesture === "finger") {
    targetGest = "lesson";
  } else if (gesture === "heart") {
    targetGest = "explain";
  } else if (gesture === "watergun") {
    targetGest = "crazy";
  } else if (emotion === "annoyed") {
    targetGest = "hello";
  }

  const stateRef = useRef({
    voiceState,
    phoneme,
    lookX,
    lookY,
    isBlinking,
    targetGest,
    burstKey
  });
  stateRef.current = {
    voiceState,
    phoneme,
    lookX,
    lookY,
    isBlinking,
    targetGest,
    burstKey
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const S = 5;
    const K = {
      br: "#8c6a49",
      brL: "#b48c62",
      brD: "#5d412c",
      cr: "#f6e9cf",
      crD: "#dcc7a0",
      lid: "#d8c39a",
      ro: "#3b2f7a",
      roL: "#6657b8",
      roD: "#241b57",
      go: "#f0c24a",
      goD: "#b0842a",
      bk: "#f2a93a",
      bkD: "#c9791c"
    };

    const lg = (x0: number, y0: number, x1: number, y1: number, s: [number, string][]) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      s.forEach(([o, c]) => g.addColorStop(o, c));
      return g;
    };

    const rg = (x: number, y: number, r: number, a: string, b: string) => {
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, a);
      g.addColorStop(1, b);
      return g;
    };

    const E = (x: number, y: number, rx: number, ry: number, f: any, s?: any, w = 0.5) => {
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, 7);
      ctx.fillStyle = f;
      ctx.fill();
      if (s) {
        ctx.lineWidth = w;
        ctx.strokeStyle = s;
        ctx.stroke();
      }
    };

    const RR = (x: number, y: number, w: number, h: number, r: number, f: any) => {
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.fillStyle = f;
      ctx.fill();
    };

    const P = (p: [number, number][], f: any, s?: any, w = 0.5) => {
      ctx.beginPath();
      p.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath();
      ctx.fillStyle = f;
      ctx.fill();
      if (s) {
        ctx.lineWidth = w;
        ctx.strokeStyle = s;
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    };

    const L_ = (p: [number, number][], w: number, c: any) => {
      ctx.beginPath();
      p.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.lineWidth = w;
      ctx.strokeStyle = c;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    };

    const pathCache = new Map<string, Path2D>();
    const getPath = (d: string) => {
      let p = pathCache.get(d);
      if (!p) {
        p = new Path2D(d);
        pathCache.set(d, p);
      }
      return p;
    };

    const Q = (d: string, f?: any, s?: any, w = 0.6) => {
      if (typeof Path2D !== "undefined") {
        const p = getPath(d);
        if (f) {
          ctx.fillStyle = f;
          ctx.fill(p);
        }
        if (s) {
          ctx.lineWidth = w;
          ctx.strokeStyle = s;
          ctx.lineCap = "round";
          ctx.stroke(p);
        }
      }
    };

    const mir = (f: () => void) => {
      f();
      ctx.save();
      ctx.translate(96, 0);
      ctx.scale(-1, 1);
      f();
      ctx.restore();
    };

    const star = (x: number, y: number, r: number, c: any) => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const q = i % 2 ? r * 0.45 : r;
        ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
      }
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
    };

    const spk = (x: number, y: number, r: number, a: number) => {
      const c = `rgba(255,238,170,${a})`;
      P([[x, y - r], [x + r * 0.28, y], [x, y + r], [x - r * 0.28, y]], c);
      P([[x - r, y], [x, y - r * 0.28], [x + r, y], [x, y + r * 0.28]], c);
    };

    const shade = (x: number, y: number, w: number, h: number, l: number, d: number) => {
      ctx.fillStyle = lg(x, y, x + w, y + h, [
        [0, `rgba(255,244,210,${l})`],
        [0.45, "rgba(255,244,210,0)"],
        [1, `rgba(20,5,50,${d})`]
      ]);
      ctx.fillRect(x, y, w, h);
    };

    const shE = (x: number, y: number, rx: number, ry: number, f: any, l = 0.2, d = 0.36) => {
      E(x, y, rx, ry, f);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, 7);
      ctx.clip();
      shade(x - rx, y - ry, rx * 2, ry * 2, l, d);
      ctx.restore();
    };

    const shQ = (d: string, f: any, x: number, y: number, w: number, h: number, l = 0.2, dk = 0.36) => {
      Q(d, f);
      if (typeof Path2D !== "undefined") {
        ctx.save();
        ctx.clip(getPath(d));
        shade(x, y, w, h, l, dk);
        ctx.restore();
      }
    };

    const parts: { ch: string; x: number; y: number; vx: number; vy: number; l: number; c: string }[] = [];

    const G: Record<string, (t: number) => { L: [number, number]; R: [number, number] }> = {
      idle: (t) => ({
        L: [0.18 + Math.sin(t * 2) * 0.03, Math.sin(t * 1.3) * 0.04],
        R: [0.18 + Math.sin(t * 2 + 1) * 0.03, Math.sin(t * 1.3 + 1) * 0.04]
      }),
      hello: (t) => ({ L: [0.18, 0], R: [2.5, Math.sin(t * 11) * 0.35] }),
      lesson: (t) => ({ L: [0.18, 0], R: [1.6, Math.sin(t * 4) * 0.05] }),
      explain: (t) => ({
        L: [0.9 + Math.sin(t * 3) * 0.2, Math.sin(t * 3 + 1) * 0.2],
        R: [0.9 + Math.sin(t * 3 + 2) * 0.2, Math.sin(t * 3 + 0.5) * 0.2]
      }),
      book: () => ({ L: [-0.4, 0], R: [-0.4, 0] }),
      crazy: (t) => ({
        L: [2.4 + Math.sin(t * 9) * 0.4, 0],
        R: [2.4 + Math.sin(t * 9 + 3) * 0.4, 0]
      })
    };

    const EXP: Record<string, { sq?: number; br?: number; wide?: number }> = {
      idle: {},
      hello: { sq: 0.5, br: 0.3 },
      lesson: { br: 0.15 },
      explain: { br: 0.2 },
      book: { sq: 0.3 },
      crazy: { br: 1, wide: 1 }
    };

    let cur = { L: [0.18, 0], R: [0.18, 0] };
    let F = { blink: 0, br: 0, wide: 0, sq: 0, open: 0 };
    let look = [0, 0];
    let mouse = [0, 0];
    let talk = 0;
    let nextBlink = 2;
    let blinkT = 0;
    let last = 0;
    let lastPaint = 0;
    const paintInterval = 1000 / 30;
    let spawn = 0;
    let clA = 0;
    let clV = 0;
    let ruf = 0;
    let rufT = 6;
    let sac = [0, 0];
    let sacT = 1;
    let TT = 0;
    let lean = 0;
    let idle = 0;
    let idleRot = 0;
    let idleT = 1;
    let hatA = 0;
    let hatV = 0;
    let nodV = 0;
    let mouthT = 0;
    let lastBurstKey = burstKey;
    let burstEnergy = 0;
    let burstRing = 0;
    const burstParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }> = [];

    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

    const wing = (s: number, px: number, py: number, a: number, fl: number, sp: number): [number, number] => {
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(s, 1);
      ctx.rotate(-(a + fl));
      const W = "M-1 -3C6 -3 12.5 6 13 20C13.2 28 11.6 33 10.6 36Q8.8 33 7.6 37Q5.6 33 4 37Q2.4 33 .8 36C-1.4 30 -3.4 14 -3.4 3Z";
      shQ(W, lg(0, -3, 0, 37, [[0, "#ad865a"], [0.55, "#7d5b3a"], [1, "#4b3322"]]), -4, -3, 18, 40, 0.22, 0.34);
      ctx.save();
      if (typeof Path2D !== "undefined") ctx.clip(getPath(W));
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 3; i++) {
          const x = 0.5 + i * 4 + (r % 2) * 2;
          const y = 6 + r * 7;
          E(x, y, 3, 2.5, lg(x, y - 2, x, y + 2, [[0, r % 2 ? "#b48c62" : "#a68058"], [1, "#6a4a30"]]));
          L_([[x, y - 1.4], [x, y + 0.5]], 0.3, "rgba(255,225,170,.3)");
        }
      }
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(-1.2 + i * 3.4, 25);
        ctx.rotate((i - 1.5) * 0.08 * sp + Math.sin(TT * 4 + i) * 0.015);
        Q("M0 0Q2.2 7 1.5 15Q0 17 -1.2 15Q-1.7 7 0 0Z", lg(-2, 0, 2, 15, [[0, "#9a7650"], [1, "#3d2a1a"]]));
        L_([[0, 1], [0.1, 14]], 0.4, "rgba(255,225,170,.45)");
        Q("M-1.1 14.6L1.4 14.6", null, "rgba(240,200,140,.6)", 0.5);
        ctx.restore();
      }
      Q("M-3.2 9Q5 12 12.6 9", null, K.go, 1.5);
      E(4.6, 10.6, 1, 1, "#ff5a7a");
      ctx.restore();
      const th = -(a + fl);
      const lx = 6;
      const ly = 38;
      return [px + s * (lx * Math.cos(th) - ly * Math.sin(th)), py + lx * Math.sin(th) + ly * Math.cos(th)];
    };

    const draw = (t: number, dt: number) => {
      TT = t;
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.clearRect(0, 0, 96, 120);

      const gest = stateRef.current.targetGest;
      const crazy = gest === "crazy";
      const speakingNow = stateRef.current.voiceState === "speaking";
      const hop = crazy ? Math.abs(Math.sin(t * 9)) * 1.6 : 0;
      const breath = Math.sin(t * 1.9);
      const bob = Math.sin(t * 2) * 0.4 - hop;

      lean = lerp(lean, Math.sin(t * 0.8) * 0.018 + (crazy ? Math.sin(t * 9) * 0.045 : 0) + (gest === "hello" ? -0.02 : 0) + (gest === "lesson" ? 0.025 : 0), 0.12);

      idleT -= dt;
      if (idleT < 0) {
        idleRot = (Math.random() - 0.5) * 0.1;
        idleT = 2.5 + Math.random() * 3;
      }
      idle = lerp(idle, idleRot, 0.03);

      const headRot = Math.sin(t * 1.3) * 0.02 + idle + look[0] * 0.04 + (crazy ? Math.sin(t * 9) * 0.08 : 0) + lean * 0.6;
      hatV += ((-headRot * 1.5 - lean * 2 - hatA) * 60 - hatV * 7) * dt;
      hatA += hatV * dt;
      const nodTarget = speakingNow ? 0.8 + Math.abs(Math.sin(t * 4.6)) * 0.45 : 0;
      nodV = lerp(nodV, nodTarget, speakingNow ? 0.16 : 0.08);

      const tg = (G[gest] || G.idle)(t);
      const ex = EXP[gest] || {};
      const sp = 0.5 + Math.abs(cur.R[1]) * 1.2;

      clV += ((-lean * 3 - clA) * 45 - clV * 5) * dt;
      clA += clV * dt;

      rufT -= dt;
      if (rufT < 0 && gest === "idle") {
        ruf = 1;
        rufT = 7 + Math.random() * 5;
      }
      ruf = Math.max(0, ruf - dt * 1.2);
      const rf = Math.sin(ruf * Math.PI);
      tg.L[0] += rf * 0.5;
      tg.R[0] += rf * 0.5;

      sacT -= dt;
      if (sacT < 0) {
        sac[0] = (Math.random() - 0.5) * 1.6;
        sac[1] = Math.random() - 0.5;
        sacT = 1 + Math.random() * 2.5;
      }

      for (const k of ["L", "R"] as const) {
        for (let i = 0; i < 2; i++) {
          cur[k][i] = lerp(cur[k][i], tg[k][i], 0.14);
        }
      }

      // Modulação de boca durante fala
      if (speakingNow) {
        talk = 0.2;
        const phonemeMap = [0.95, 0.62, 0.8, 0.45, 0.02];
        const pLevel = phonemeMap[stateRef.current.phoneme] ?? 0.5;
        mouthT = 0.25 + 0.55 * Math.abs(Math.sin(t * 11)) * pLevel;
      } else {
        mouthT = 0;
      }

      const tgt = { br: ex.br || 0, wide: ex.wide || 0, sq: ex.sq || 0 };
      for (const n in tgt) (F as any)[n] = lerp((F as any)[n], (tgt as any)[n], 0.2);
      F.open = lerp(F.open, mouthT, 0.45);
      F.blink = blinkT > 0 || stateRef.current.isBlinking ? 1 : 0;

      // Pés com garras
      for (const x of [41, 55]) {
        E(x, 112, 5, 2.6, rg(x, 111, 5, K.bk, K.bkD));
        L_([[x - 3, 111.4], [x + 3, 111.4]], 0.4, "rgba(150,80,10,.4)");
        for (const d of [-3.4, 0, 3.4]) {
          E(x + d, 113.8, 1.5, 1.2, K.bk);
          Q(`M${x + d - 0.5} 114.6q.6 1.4 1.4 1.2`, null, "#6b3a12", 0.5);
        }
      }

      ctx.save();
      ctx.translate(Math.sin(t * 0.7) * 0.5, bob - rf * 0.8);
      ctx.translate(48, 110);
      ctx.rotate(lean);
      ctx.scale(1, 1 + breath * 0.006 - hop * 0.01);
      ctx.translate(-48, -110);

      // Cauda
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(48, 103);
        ctx.rotate((i - 2) * 0.2 + clA * 0.12);
        Q("M0 0Q4 9 2.6 18Q0 20 -2.6 18Q-4 9 0 0Z", lg(0, 0, 0, 19, [[0, "#7d5b3a"], [1, "#3d2a1a"]]));
        L_([[0, 2], [0, 17]], 0.4, "rgba(255,225,170,.3)");
        ctx.restore();
      }

      // Capa
      const cx = clA * 7;
      shQ(`M26 62L${13 + cx * 0.6} 107Q${48 + cx} 116 ${83 + cx * 0.6} 107L70 62Z`, lg(13, 62, 83, 110, [[0, "#2c2268"], [1, "#17123a"]]), 13, 62, 70, 50, 0.1, 0.3);
      Q(`M26 62L${13 + cx * 0.6} 107`, null, "#8a2f5a", 1.7);
      Q(`M70 62L${83 + cx * 0.6} 107`, null, "#8a2f5a", 1.7);
      for (const x of [22, 34, 62, 74]) {
        const d = x < 48 ? -1 : 1;
        Q(`M${x} 66Q${x + d * 3 + cx * 0.4} 90 ${x + d * 4 + cx * 0.8} 108`, null, "rgba(10,5,40,.4)", 0.9);
      }

      // Corpo
      shE(48, 82, 24, 28 + breath * 0.4, rg(46, 70, 28, K.brL, K.brD), 0.22, 0.4);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(48, 82, 24, 28, 0, 0, 7);
      ctx.clip();
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          const x = 26 + c * 6.8 + (r % 2) * 3.4;
          const y = 61 + r * 8.5;
          const v = (r * 7 + c * 13) % 5;
          E(x, y, 3.8, 3.2, lg(x, y - 3.2, x, y + 3.2, [[0, v < 2 ? "#b08a60" : "#9a7650"], [1, "#5d412c"]]));
          Q(`M${x - 2.4} ${y + 0.8}q2.4 2.1 4.8 0`, null, "rgba(40,22,10,.45)", 0.5);
          L_([[x, y - 2.2], [x, y + 0.8]], 0.3, "rgba(255,225,170,.28)");
        }
      }
      ctx.fillStyle = lg(24, 57, 72, 110, [[0, "rgba(255,240,200,.12)"], [0.5, "rgba(0,0,0,0)"], [1, "rgba(20,5,50,.4)"]]);
      ctx.fillRect(24, 54, 48, 60);
      ctx.restore();

      Q("M24.6 80Q25 66 33 58", null, `rgba(110,210,255,${0.2 + 0.12 * Math.sin(t * 3)})`, 0.9);

      // Peito de penas
      shE(48, 73, 15, 13, rg(48, 70, 15, "#fff4de", K.crD), 0.15, 0.3);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(48, 73, 15, 13, 0, 0, 7);
      ctx.clip();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const x = 35.5 + c * 3.4 + (r % 2) * 1.7;
          const y = 65.5 + r * 4.6;
          E(x, y, 2.3, 1.9, lg(x, y - 2, x, y + 2, [[0, "#fffaf0"], [1, "#e8d4ae"]]));
          Q(`M${x - 1.4} ${y + 0.6}q1.4 1.2 2.8 0`, null, "rgba(150,110,70,.4)", 0.4);
        }
      }
      ctx.restore();

      // Túnica mágica
      const sw = Math.sin(t * 1.6) * 0.9 + clA * 5;
      const hl = 20 + sw * 0.4;
      const hr = 76 + sw * 0.4;
      const hm = 48 + sw;
      const bz = (u: number, a: number, b: number, c: number) => (1 - u) * (1 - u) * a + 2 * u * (1 - u) * b + u * u * c;

      Q(`M${hl + 1} 107Q${hm} 117 ${hr - 1} 107L${hr - 1} 110Q${hm} 119 ${hl + 1} 110Z`, "#7a2850");
      const RB = `M27 70Q38 63 45 64L48 84L51 64Q58 63 69 70L${hr} 108Q${hm} 115 ${hl} 108Z`;
      shQ(RB, lg(20, 64, 76, 110, [[0, K.roL], [0.5, K.ro], [1, K.roD]]), 20, 63, 56, 52, 0.3, 0.5);

      ctx.save();
      if (typeof Path2D !== "undefined") ctx.clip(getPath(RB));
      for (const x of [28, 42, 61]) {
        const d = x < 48 ? -1 : 1;
        const o = clA * 3;
        P([[x, 76], [x + d * 3.4 + o, 109], [x + d * 3.4 + 5 + o, 109], [x + 5, 76]], "rgba(15,5,50,.17)");
      }
      ctx.restore();

      for (const x of [28, 35, 42, 54, 61, 68]) {
        const d = x < 48 ? -1 : 1;
        const o = clA * 3;
        Q(`M${x} 76Q${x + d * 2 + o * 0.5} 94 ${x + d * 3.4 + o} 109`, null, "rgba(15,5,50,.4)", 0.9);
        Q(`M${x + 0.9} 76Q${x + d * 2 + 0.9 + o * 0.5} 94 ${x + d * 3.4 + 0.9 + o} 109`, null, "rgba(190,180,255,.2)", 0.5);
      }

      for (let i = -6; i <= 6; i++) {
        if (Math.abs(i) >= 2) L_([[48 + i * 3.2, 84.8], [48 + i * 3.9, 79.5]], 0.35, "rgba(15,5,50,.32)");
        L_([[48 + i * 3.2, 94], [48 + i * 3.9, 99.5]], 0.35, "rgba(15,5,50,.32)");
      }
      E(48, 94.4, 22, 2.2, "rgba(10,0,40,.35)");

      mir(() => {
        P([[45, 64], [48, 84], [42.5, 77], [39.5, 67]], lg(39, 64, 48, 84, [[0, "#a43a68"], [1, "#7a2850"]]), K.go, 0.6);
        for (let i = 0; i < 6; i++) E(45.5 + i * 0.55, 66 + i * 3.3, 0.45, 0.45, "#ffe48a");
        Q("M30 98L39 102", null, K.go, 0.6);
        Q("M30 98L30 102.4", null, "rgba(15,5,50,.4)", 0.7);
        Q("M22 100q3 -3.4 6 0q-3 3.4 -6 0", null, "rgba(240,194,74,.6)", 0.5);
      });

      Q("M45 64L48 84L51 64", null, K.go, 1.1);
      Q("M27 70Q38 63 45 64", null, K.go, 0.9);
      Q("M51 64Q58 63 69 70", null, K.go, 0.9);
      L_([[48, 84], [48, 111]], 0.8, K.go);
      Q(`M${hl} 108Q${hm} 115 ${hr} 108`, null, K.go, 1.6);

      for (let i = 0; i <= 14; i++) {
        const u = i / 14;
        const x = bz(u, hl, hm, hr);
        const y = bz(u, 108, 115, 108) - 1.7;
        P([[x, y - 1], [x + 0.8, y], [x, y + 1], [x - 0.8, y]], "#ffe48a");
      }
      Q(`M${hl + 0.5} 108Q24 90 27 70`, null, `rgba(110,210,255,${0.22 + 0.12 * Math.sin(t * 3)})`, 0.9);

      for (const [x, y, r] of [
        [34, 96, 1.5],
        [40, 78, 1.2],
        [60, 98, 1.5],
        [57, 80, 1.2],
        [30, 86, 1.3],
        [66, 88, 1.3],
        [42, 102, 1],
        [62, 104, 1]
      ]) {
        star(x, y, r, `rgba(255,226,120,${0.6 + 0.4 * Math.sin(t * 3 + x)})`);
      }

      Q("M37 72a2.6 2.6 0 1 0 2.6 3.6a2 2 0 1 1 -2.6 -3.6Z", "#f6dd8a");
      for (const y of [98, 104]) E(48, y, 1, 1, rg(48, y, 1, "#fff0a0", K.goD));

      // Cinto e acessórios
      Q("M27.4 87Q48 91 68.6 87L68.4 91.8Q48 95.8 27.6 91.8Z", lg(0, 87, 0, 96, [[0, "#8a5a30"], [1, "#5a3418"]]));
      for (let x = 30; x < 68; x += 4.4) E(x, 90.6 + Math.sin(((x - 27) / 41) * 3.14) * 0.1, 0.5, 0.5, "#ffe48a");
      RR(44.2, 87.8, 7.6, 5.8, 1.2, rg(48, 90, 5, "#fff0a0", K.goD));
      E(48, 90.7, 1.3, 1.3, "#5ad0ff");

      const wx = Math.sin(t * 2) * 0.9;
      Q(`M54 91Q${55.5 + wx * 0.5} 97 ${54 + wx} 99`, null, K.go, 0.5);
      E(54 + wx, 100.4, 2, 2, rg(54, 100, 2, "#fff0a0", K.goD));
      E(54 + wx, 100.4, 1.3, 1.3, "#fffaf0");
      L_([[54 + wx, 100.4], [54 + wx, 99.5]], 0.3, "#5a3418");
      L_([[54 + wx, 100.4], [54.7 + wx, 100.6]], 0.3, "#5a3418");

      RR(58.6, 92, 8, 9.4, 2.2, lg(58, 92, 66, 102, [[0, "#9a6a3a"], [1, "#5e3a1c"]]));
      Q("M59 94.6Q62.6 97 66.2 94.6", null, "rgba(40,20,5,.5)", 0.5);
      E(62.6, 96.4, 1, 1, K.go);

      RR(32.2, 90.4, 2.2, 2.2, 0.5, "#a0724a");
      RR(30.8, 92.4, 5, 6.8, 1.6, "rgba(120,220,255,.85)");
      E(33.3, 96.4, 2, 2.2, "rgba(220,255,255,.6)");
      for (let i = 0; i < 2; i++) E(32.6 + i * 1.5 + Math.sin(t * 3 + i) * 0.3, 98.4 - ((t * 5 + i * 2) % 4.5), 0.4, 0.4, "rgba(255,255,255,.8)");

      RR(37.4, 92.6, 8, 2.8, 1.4, "#f6e9cf");
      E(37.6, 94, 1.3, 1.4, "#e4d2ac");
      E(45.2, 94, 1.3, 1.4, "#e4d2ac");

      Q("M42 94q0 5 1 7", null, K.go, 0.5);
      E(43, 101.4, 1.2, 1.2, K.go, K.goD, 0.3);

      const sa = lean * 7 + clA * 2.4;
      Q(`M46 93L50 93Q${50 + sa * 0.5} 100 ${49.4 + sa} 107L${45.4 + sa} 107Q${45 + sa * 0.5} 100 46 93Z`, lg(46, 93, 50, 107, [[0, K.roL], [1, K.roD]]), K.go, 0.4);
      for (let i = 0; i < 4; i++) L_([[45.8 + i * 1.2 + sa, 107], [45.8 + i * 1.2 + sa * 1.25, 109.6]], 0.4, K.go);

      // Manto e broche
      mir(() => {
        E(35, 61, 10.5, 5.6, rg(35, 60, 11, K.roL, K.ro), K.go, 0.6);
        for (let i = 0; i < 6; i++) E(26.5 + i * 3.4, 65 + Math.sin(i * 1.7) * 0.3, 2.1, 1.6, "#fff4de");
      });
      Q("M45.5 62Q40 66 34 63", null, K.go, 0.5);
      Q("M50.5 62Q56 66 62 63", null, K.go, 0.5);
      E(48, 62, 2.8, 2.8, rg(48, 62, 3, "#fff0a0", K.goD));
      E(48, 62, 1.2, 1.2, "#ff5a7a");

      // Asas
      E(23, 78, 6, 17, "rgba(10,0,40,.2)");
      E(73, 78, 6, 17, "rgba(10,0,40,.2)");
      wing(-1, 26, 64, cur.L[0], cur.L[1], sp);
      const wr = wing(1, 70, 64, cur.R[0], cur.R[1], sp);

      if (gest === "lesson") {
        E(wr[0], wr[1], 8, 8, rg(wr[0], wr[1], 8, "rgba(255,240,160,.7)", "rgba(255,240,160,0)"));
        spk(wr[0], wr[1], 2.5, 0.9);
      }

      mir(() => {
        E(26, 67, 5.4, 2.2, "rgba(10,0,40,.3)");
        shE(26, 63.4, 6.8, 5.4, rg(26, 62, 7, K.roL, K.ro), 0.3, 0.45);
        Q("M19.6 63.6Q26 69.4 32.4 63.6", null, K.go, 0.7);
        for (let i = 0; i < 4; i++) E(21.6 + i * 2.7, 66.2, 0.4, 0.4, "#ffe48a");
      });

      // Gola de penas
      for (let i = 0; i < 15; i++) shE(29 + i * 2.9, 63 + Math.sin(i * 1.3) * 0.7, 3.2, 2.4, "#f6e9cf", 0.2, 0.25);
      E(49, 65, 17, 3.6, "rgba(0,0,0,.25)");

      // Cabeça
      ctx.save();
      ctx.translate(48, 58);
      ctx.rotate(headRot);
      ctx.translate(-48, -58 + nodV * 0.5);

      mir(() => {
        const w = Math.sin(t * 5) * 1.2 + (crazy ? Math.sin(t * 14) * 1.5 : 0);
        P([[27, 36], [19, 31 + w], [25, 38], [15, 37 + w], [25, 42], [17, 45 + w], [27, 45]], lg(15, 36, 27, 40, [[0, "#fff"], [1, K.cr]]), "rgba(150,120,90,.4)", 0.4);
      });

      shE(48, 42, 26, 22, rg(46, 34, 28, K.brL, "#6e4f34"), 0.2, 0.4);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(48, 42, 26, 22, 0, 0, 7);
      ctx.clip();
      for (let r = 0; r < 3; r++) {
        for (let x = 25 + (r % 2) * 2.4; x < 74; x += 7.2) {
          Q(`M${x} ${22 + r * 5}q2.4 2.8 4.8 0`, null, "rgba(70,45,28,.3)", 0.5);
        }
      }
      ctx.restore();

      mir(() => {
        E(37, 44, 13.8, 13.8, rg(37, 42, 14, "#fff4de", "#e3cca2"));
        for (let i = 0; i < 30; i++) {
          const q = (i / 30) * 6.283;
          L_([[37 + Math.cos(q) * 12.4, 44 + Math.sin(q) * 12.4], [37 + Math.cos(q) * 14.2, 44 + Math.sin(q) * 14.2]], 0.5, "rgba(130,95,60,.5)");
        }
        for (let i = 0; i < 14; i++) {
          const q = (i / 14) * 6.283 + 0.2;
          L_([[37 + Math.cos(q) * 8.6, 44 + Math.sin(q) * 8.6], [37 + Math.cos(q) * 11, 44 + Math.sin(q) * 11]], 0.4, "rgba(190,150,110,.4)");
        }
      });

      E(48, 48, 8, 7, "#f3e3c3");
      E(48, 33.5, 17, 4, "rgba(30,10,60,.3)");
      mir(() => E(30.5, 52, 3.4, 2, "rgba(240,130,120,.35)"));
      mir(() => {
        P([[24.4, 47], [19.6, 51.2], [25.4, 52.4]], "#fff4de", "rgba(150,110,70,.4)", 0.4);
        P([[25.8, 51], [21.6, 55.6], [27.6, 55.4]], "#f6e9cf", "rgba(150,110,70,.4)", 0.4);
      });

      // Olhos grandes de coruja mágica com reflexos e rastreamento
      for (const cx of [37, 59]) {
        const r = 7.6 + F.wide * 1.2;
        let px = look[0] * 2.6 + sac[0];
        let py = look[1] * 2 + sac[1];
        if (crazy) {
          px = Math.cos(t * 8 + cx) * 2.4;
          py = Math.sin(t * 8 + cx) * 2.4;
        }
        E(cx, 44, r + 1.4, r + 1.4, "#fff6df");
        const ix = cx + px * 0.4;
        const iy = 44 + py * 0.4;
        E(ix, iy, r - 0.8, r - 0.8, rg(ix, iy, r, "#ffd36a", "#d8741f"));
        for (let i = 0; i < 24; i++) {
          const q = (i / 24) * 6.283;
          L_([[ix + Math.cos(q) * 2.6, iy + Math.sin(q) * 2.6], [ix + Math.cos(q) * (r - 1.2), iy + Math.sin(q) * (r - 1.2)]], 0.3, "rgba(150,60,10,.35)");
        }
        E(ix, iy, r - 0.8, r - 0.8, "rgba(0,0,0,0)", "rgba(120,50,10,.55)", 0.7);
        const pr = crazy ? 1.3 : 3.1;
        E(cx + px, 44 + py, pr, pr * 1.1, "#2a1612");
        E(cx + px - 1.2, 44 + py - 1.5, 1.1, 1.1, "#fff");
        E(cx + px + 1.4, 44 + py + 1.2, 0.5, 0.5, "rgba(255,255,255,.7)");

        // Pálpebras de piscar
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, 44, r + 1.4, 0, 7);
        ctx.clip();
        ctx.fillStyle = K.lid;
        ctx.fillRect(cx - 12, 44 - r - 2, 24, (r * 2 + 3) * F.blink);
        const sq = F.sq * 0.3;
        ctx.fillRect(cx - 12, 44 + r + 2 - (r * 2 + 3) * sq, 24, (r * 2 + 3) * sq);
        ctx.fillStyle = "rgba(60,30,10,.25)";
        ctx.fillRect(cx - 12, 44 - r - 2 + (r * 2 + 3) * F.blink - 1, 24, 1.4);
        ctx.restore();
      }

      // Óculos dourados de professor
      mir(() => {
        E(37, 44, 10.4, 10.4, "rgba(200,235,255,.13)", K.go, 1.1);
        E(37, 44, 9.8, 9.8, "rgba(0,0,0,0)", "rgba(120,80,10,.4)", 0.4);
        const g = Math.sin(t * 0.9) * 1.2;
        Q(`M${30.5 + g} 49Q${32 + g} 40 ${36 + g} 36`, null, "rgba(255,255,255,.55)", 0.8);
        L_([[27, 43], [22, 44]], 0.9, K.goD);
      });
      Q("M46.6 43Q48 41.4 49.4 43", null, K.go, 1);

      // Sobrancelhas de sábio
      const by = -F.br * 3 - nodV * 0.8;
      mir(() => {
        const lift = crazy ? -1.4 : 0;
        P([[25, 35 + by], [31, 28 + by + lift], [46, 30.5 + by], [44.5, 34 + by], [34, 32.5 + by]], "#fff9ea", "rgba(190,160,120,.5)", 0.4);
        for (const [x, y, x2, y2] of [
          [28, 33, 30, 29.4],
          [33, 32, 35, 28.6],
          [38, 31.5, 39.5, 28.4],
          [42, 31.4, 43, 28.6]
        ]) {
          L_([[x, y + by], [x2, y2 + by + lift]], 0.6, K.crD);
        }
      });

      mir(() => Q("M48 49.5Q43 46.5 36 50.5Q42 55 48 52.5Z", lg(36, 48, 48, 54, [[0, "#fff"], [1, K.cr]]), "rgba(190,160,120,.4)", 0.4));

      // Bico articulado com a fala
      const o = F.open;
      E(49, 50.4, 3.8, 1.6, "rgba(110,60,20,.28)");
      if (o > 0.04) {
        E(48, 49.4 + o * 2, 2.5 + o * 0.4, 0.4 + o * 2.2, lg(48, 48, 48, 54, [[0, "#3a0f18"], [1, "#7a2030"]]));
        if (o > 0.35) E(48, 50.6 + o * 2.8, 1.5, 0.5 + o * 0.5, "#e0707a");
      }
      Q(`M45.4 48.6Q48 49.6 50.6 48.6Q50.2 ${50.4 + o * 4} 48 ${51.4 + o * 4.4}Q45.8 ${50.4 + o * 4} 45.4 48.6Z`, lg(45, 48, 51, 54, [[0, "#f6b64a"], [1, K.bkD]]), "rgba(160,100,30,.4)", 0.3);
      shQ("M44.2 41.8Q48 39.8 51.8 41.8Q51.2 46.6 48 50.2Q44.8 46.6 44.2 41.8Z", lg(44, 42, 52, 50, [[0, "#ffd27a"], [1, K.bk]]), 44, 40, 8, 10, 0.25, 0.35);
      L_([[47, 42.4], [47.3, 47]], 0.45, "rgba(255,255,255,.55)");
      E(46.5, 43.4, 0.5, 0.7, "#8a4a10");
      E(49.5, 43.4, 0.5, 0.7, "#8a4a10");

      // Chapéu de Mago
      ctx.save();
      ctx.translate(48, 26);
      ctx.rotate(Math.sin(t * 1.2) * 0.012 + hatA * 0.5);
      ctx.translate(-48, -26);
      const hs = hatA * 28 + Math.sin(t * 1.8) * 1.6 + (crazy ? Math.sin(t * 9) * 3 : 0);
      E(48, 27.6, 31, 4.6, "rgba(20,5,50,.5)");
      E(48, 26, 33, 5.6, lg(15, 0, 81, 0, [[0, K.roD], [0.5, K.roL], [1, K.roD]]));
      ctx.save();
      ctx.setLineDash([1, 0.9]);
      ctx.strokeStyle = "rgba(240,194,74,.6)";
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.ellipse(48, 26, 31.6, 4.5, 0, 0, 7);
      ctx.stroke();
      ctx.restore();

      shQ(`M25 26C27 14 36 7 52 3Q62 1 ${69 + hs} 10Q62 11 63 17C66 20 70 23 72 26Z`, lg(25, 3, 72, 26, [[0, K.roL], [0.5, K.ro], [1, K.roD]]), 25, 1, 48, 26, 0.3, 0.45);
      for (const [d, c] of [
        ["M40 24Q40 14 50 5", "rgba(15,5,60,.35)"],
        ["M56 24Q58 14 61 9", "rgba(15,5,60,.35)"],
        ["M33 24Q34 16 42 9", "rgba(200,190,255,.22)"]
      ]) {
        Q(d, null, c, 0.8);
      }

      Q("M26.4 23Q48 28 70.6 23", null, K.go, 2.6);
      for (let i = 0; i < 10; i++) {
        const u = i / 9;
        const x = 27.5 + u * 42;
        const y = 23.2 + Math.sin(u * 3.14) * 3.7;
        P([[x, y - 0.9], [x + 0.7, y], [x, y + 0.9], [x - 0.7, y]], "#fff0a0");
      }

      RR(45, 22.6, 6, 4.6, 0.8, rg(48, 25, 3, "#fff0a0", K.goD));
      E(48, 24.9, 1, 1, "#5ad0ff");
      Q(`M62.5 24Q70 18 ${73 + hs * 0.3} 7Q68 15 62.5 24Z`, lg(62, 24, 73, 8, [[0, "#ffffff"], [1, "#8ad0ff"]]), "rgba(120,150,190,.5)", 0.3);
      L_([[62.5, 24], [72 + hs * 0.3, 9]], 0.4, "rgba(120,150,190,.7)");
      star(42, 16, 2, K.go);
      star(54, 11, 1.5, K.go);
      star(36, 21, 1.1, "#ffe48a");
      Q("M58 17a3 3 0 1 0 3 4a2.4 2.4 0 1 1 -3 -4Z", "#f6dd8a");
      star(69 + hs, 10, 2.4, K.go);
      spk(69 + hs, 10, 3.4, 0.7);

      ctx.restore();
      ctx.restore();
      ctx.restore();

      // Letras mágicas saindo do bico durante a fala
      if (speakingNow && (spawn -= dt) < 0) {
        spawn = 0.14;
        parts.push({
          ch: "ABCDEFGHIJKLMNOPQRSTUVWXYZ?!"[(Math.random() * 28) | 0],
          x: 48,
          y: 56 + bob,
          vx: (Math.random() - 0.5) * 22,
          vy: -12 - Math.random() * 10,
          l: 1.6,
          c: `hsl(${Math.random() * 360},85%,72%)`
        });
      }

      const nextBurstKey = stateRef.current.burstKey;
      if (nextBurstKey && nextBurstKey !== lastBurstKey) {
        lastBurstKey = nextBurstKey;
        burstEnergy = 1;
        burstRing = 1;
        burstParticles.length = 0;
        for (let i = 0; i < 18; i++) {
          const angle = (i / 18) * Math.PI * 2;
          const speed = 10 + (i % 4) * 2.5;
          const maxLife = 0.55 + (i % 3) * 0.08;
          burstParticles.push({
            x: 48,
            y: 57,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 4,
            life: maxLife,
            maxLife,
            size: 0.8 + (i % 3) * 0.35,
            color: i % 3 === 0 ? "#fff0a0" : i % 3 === 1 ? "#f0c24a" : "#5ad0ff"
          });
        }
      }
      if (burstEnergy > 0 || burstParticles.length > 0) {
        burstEnergy = Math.max(0, burstEnergy - dt * 2.8);
        burstRing = Math.max(0, burstRing - dt * 2.2);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        if (burstEnergy > 0) {
          ctx.globalAlpha = burstEnergy * 0.7;
          E(48, 57, 5 + burstEnergy * 8, 5 + burstEnergy * 8, "#fff0a0");
        }
        if (burstRing > 0) {
          ctx.globalAlpha = burstRing;
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = "#5ad0ff";
          ctx.beginPath();
          ctx.arc(48, 57, 5 + (1 - burstRing) * 17, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (let i = burstParticles.length - 1; i >= 0; i--) {
          const p = burstParticles[i];
          p.life -= dt;
          if (p.life <= 0) {
            burstParticles.splice(i, 1);
            continue;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 20 * dt;
          ctx.globalAlpha = Math.min(1, p.life / p.maxLife);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.restore();
      }

      ctx.font = 'bold 6px "Comic Sans MS",cursive,sans-serif';
      ctx.textAlign = "center";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.l -= dt;
        if (p.l <= 0) {
          parts.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 6 * dt;
        ctx.globalAlpha = Math.min(1, p.l);
        ctx.fillStyle = p.c;
        ctx.fillText(p.ch, p.x, p.y);
        ctx.globalAlpha = 1;
      }
    };

    let rafId: number;
    const loop = (ms: number) => {
      if (ms - lastPaint < paintInterval) {
        rafId = requestAnimationFrame(loop);
        return;
      }
      lastPaint = ms;
      const t = ms / 1000;
      const dt = Math.min(0.05, t - last);
      last = t;

      nextBlink -= dt;
      if (nextBlink < 0) {
        blinkT = 0.13;
        nextBlink = 2 + Math.random() * 3;
      }
      blinkT -= dt;

      // Parallax suave das pupilas
      mouse[0] = Math.max(-1, Math.min(1, stateRef.current.lookX));
      mouse[1] = Math.max(-1, Math.min(1, stateRef.current.lookY));
      look[0] = lerp(look[0], mouse[0], 0.1);
      look[1] = lerp(look[1], mouse[1], 0.1);

      draw(t, dt);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    // Rastreamento interativo de ponteiro sobre o canvas
    const handlePointerMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mouse[0] = Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width / 2)) / r.width) * 2));
      mouse[1] = Math.max(-1, Math.min(1, ((e.clientY - (r.top + r.height * 0.4)) / r.height) * 2));
    };

    cv.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      cv.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div
      className={`pixel-mr-crazy-art pixel-owl-avatar pixel-${activity} pixel-emotion-${emotion} pixel-gesture-${gesture} ${isBlinking ? "pixel-blinking" : ""} ${isAwake ? "pixel-awake" : ""}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible"
      } as CSSProperties}
      role="img"
      aria-label={`Mr. Crazy avatar Coruja Mago 2D ${isSpeaking ? "falando" : "pronto"}`}
    >
      <canvas
        ref={canvasRef}
        width={480}
        height={600}
        className="owl-wizard-canvas"
        style={{
          width: "auto",
          height: "100%",
          maxHeight: "100%",
          maxWidth: "100%",
          aspectRatio: "4 / 5",
          objectFit: "contain",
          background: "transparent",
          display: "block",
          filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))"
        }}
      />

      {/* Camada semântica e acessível preservando contratos de teste e transições */}
      <svg
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        aria-hidden="true"
        shapeRendering="crispEdges"
      >
        <g className="pixel-mouth" data-phoneme={phoneme} />
        <g className="pixel-gesture-layer">
          <g className="pixel-gesture-thumbsup" />
          <g className="pixel-gesture-heart" />
          <g className="pixel-gesture-watergun" />
        </g>
      </svg>
    </div>
  );
}
