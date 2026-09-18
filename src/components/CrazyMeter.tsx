import { Flame } from "lucide-react";
import type { Emotion } from "@/lib/mr-crazy";

export function getPuticidadeInfo(level: number) {
  if (level <= 20) return { label: "Zen", color: "#10b981" };
  if (level <= 45) return { label: "Incomodado", color: "#f59e0b" };
  if (level <= 70) return { label: "Puto", color: "#f97316" };
  if (level <= 90) return { label: "Puto pra Caralho", color: "#ef4444" };
  return { label: "Modo Demônio", color: "#dc2626" };
}

export function CrazyMeter({ level, emotion }: Readonly<{ level: number; emotion: Emotion }>) {
  const info = getPuticidadeInfo(level);
  const filled = Math.max(1, Math.ceil(level / 20));

  return (
    <div
      className={`crazy-meter puticidade-meter ${level >= 70 ? "is-furious" : level >= 46 ? "is-angry" : ""}`}
      aria-label={`Nível de Puticidade: ${info.label} (${level}%)`}
      title={`Nível de Puticidade: ${level}% - Mr. Crazy está ${info.label}!`}
    >
      <div className="puticidade-title">
        <Flame size={14} className={`flame-icon ${level >= 70 ? "animate-pulse" : ""}`} />
        <span className="puticidade-label">Puticidade:</span>
        <strong className="puticidade-status" style={{ color: info.color }}>
          {info.label}
        </strong>
        <span className="puticidade-percent">({level}%)</span>
      </div>
      <div className="puticidade-pips" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <i
            key={index}
            className={index < filled ? "active" : ""}
            style={{
              backgroundColor:
                index < filled
                  ? index >= 3
                    ? "#ef4444"
                    : index >= 2
                    ? "#f97316"
                    : "#f59e0b"
                  : undefined
            }}
          />
        ))}
      </div>
    </div>
  );
}
