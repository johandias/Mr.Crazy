import type React from "react";

export function ConversationBubble({
  label,
  children,
  tone = "neutral"
}: Readonly<{ label: string; children: React.ReactNode; tone?: "neutral" | "crazy" | "user"; key?: React.Key }>) {
  return (
    <article className={`conversation-bubble ${tone}`}>
      <span>{label}</span>
      <p>{children}</p>
    </article>
  );
}
