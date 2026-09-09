export function ConversationBubble({
  label,
  children,
  tone = "neutral"
}: Readonly<{ label: string; children: React.ReactNode; tone?: "neutral" | "crazy" | "user" }>) {
  return (
    <article className={`conversation-bubble ${tone}`}>
      <span>{label}</span>
      <p>{children}</p>
    </article>
  );
}
