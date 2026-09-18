import type { CSSProperties } from "react";

export function ListeningWave({
  active,
  speaking
}: Readonly<{ active: boolean; speaking?: boolean }>) {
  return (
    <div
      className={`listening-wave ${active ? "active" : ""} ${speaking ? "is-speaking" : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: 22 }).map((_, index) => {
        const heightMultiplier = speaking
          ? [0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8, 1.0, 0.7, 0.4][index % 10]
          : 1;
        return (
          <span
            key={index}
            style={
              {
                animationDelay: `${index * 38}ms`,
                ...(speaking ? { "--height-mult": `${heightMultiplier}` } : {})
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
