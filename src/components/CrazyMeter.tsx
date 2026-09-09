import { getEmotionLabel, type Emotion } from "@/lib/mr-crazy";

export function CrazyMeter({ level, emotion }: Readonly<{ level: number; emotion: Emotion }>) {
  const filled = Math.max(1, Math.ceil(level / 25));

  return (
    <div className="crazy-meter" aria-label={`Estado ${getEmotionLabel(emotion)}`}>
      <span>Mr.Crazy</span>
      <div aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <i className={index < filled ? "active" : ""} key={index} />
        ))}
      </div>
    </div>
  );
}
