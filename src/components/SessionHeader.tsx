import { Gauge, Sparkles } from "lucide-react";
import { CrazyMeter } from "@/components/CrazyMeter";
import type { Emotion } from "@/lib/mr-crazy";

export function SessionHeader({
  crazyLevel,
  emotion,
  xp,
  level
}: Readonly<{ crazyLevel: number; emotion: Emotion; xp: number; level: string }>) {
  return (
    <section className="session-header" aria-label="Resumo da sessão">
      <CrazyMeter level={crazyLevel} emotion={emotion} />
      <div className="session-stat session-stat-level">
        <Gauge size={14} />
        <span>{level}</span>
      </div>
      <div className="session-stat session-stat-xp">
        <Sparkles size={14} />
        <span>{xp} XP</span>
      </div>
    </section>
  );
}
