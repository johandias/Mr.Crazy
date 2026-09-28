"use client";

import { motion } from "framer-motion";
import { Map, Play, Sparkles, Target } from "lucide-react";
import { RpgCharacter } from "@/components/RpgCharacter";
import type { Emotion, VoiceState } from "@/lib/mr-crazy";

type PracticeStartScreenProps = {
  userName?: string;
  moduleTitle: string;
  moduleBadge: string;
  crazyLevel: number;
  emotion: Emotion;
  voiceState: VoiceState;
  onStart: () => void;
  onOpenMap: () => void;
};

export function PracticeStartScreen({
  userName,
  moduleTitle,
  moduleBadge,
  crazyLevel,
  emotion,
  voiceState,
  onStart,
  onOpenMap
}: Readonly<PracticeStartScreenProps>) {
  const firstName = userName?.trim().split(/\s+/u)[0];

  return (
    <main className="practice-start-main">
      <section className="practice-start-card" aria-labelledby="practice-start-title">
        <div className="practice-start-spotlight practice-start-spotlight-left" aria-hidden="true" />
        <div className="practice-start-spotlight practice-start-spotlight-right" aria-hidden="true" />

        <motion.div
          className="practice-start-copy"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
        >
          <span className="practice-start-eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            Treino de conversação ao vivo
          </span>
          <h1 id="practice-start-title">
            {firstName ? `Bora falar, ${firstName}.` : "Bora destravar sua fala."}
          </h1>
          <p>
            O Mr.Crazy escuta, corrige sua pronúncia e te faz usar inglês de verdade — sem enrolação.
          </p>

          <div className="practice-start-module" aria-label={`Módulo atual: ${moduleTitle}`}>
            <span className="practice-start-module-icon">
              <Target size={16} aria-hidden="true" />
            </span>
            <span>
              <small>Próxima missão</small>
              <strong>{moduleTitle}</strong>
            </span>
            <em>{moduleBadge}</em>
          </div>

          <div className="practice-start-actions">
            <button type="button" className="practice-start-primary" onClick={onStart}>
              <Play size={17} fill="currentColor" aria-hidden="true" />
              Iniciar prática
            </button>
            <button type="button" className="practice-start-secondary" onClick={onOpenMap}>
              <Map size={16} aria-hidden="true" />
              Escolher missão
            </button>
          </div>

          <span className="practice-start-note">Microfone começa desligado. Você decide quando falar.</span>
        </motion.div>

        <motion.div
          className="practice-start-character-panel"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.08, ease: "easeOut" }}
        >
          <div className="practice-start-character-aura" aria-hidden="true" />
          <span className="practice-start-character-label">Seu professor de inglês</span>
          <RpgCharacter
            crazyLevel={crazyLevel}
            emotion={emotion}
            voiceState={voiceState}
            gesture="idle"
            isAwake
          />
          <span className="practice-start-character-name">Mr.Crazy</span>
        </motion.div>
      </section>
    </main>
  );
}
