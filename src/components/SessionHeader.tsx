import { Flame, Gauge, Sparkles } from "lucide-react";
import { CrazyMeter } from "@/components/CrazyMeter";
import type { Emotion } from "@/lib/mr-crazy";

export function SessionHeader({
  crazyLevel,
  emotion,
  xp,
  level
}: Readonly<{ crazyLevel: number; emotion: Emotion; xp: number; level: string }>) {
  return (
    <section className="session-header" aria-label="Resumo da sessao">
      <CrazyMeter level={crazyLevel} emotion={emotion} />
      <div className="session-stat">
        <Gauge size={16} />
        <span>{level}</span>
      </div>
      <div className="session-stat">
        <Sparkles size={16} />
        <span>{xp} XP</span>
      </div>
      <div className="session-stat">
        <Flame size={16} />
        <span>Crazy {crazyLevel}</span>
      </div>
    </section>
  );
}
