export function ListeningWave({ active }: Readonly<{ active: boolean }>) {
  return (
    <div className={`listening-wave ${active ? "active" : ""}`} aria-hidden="true">
      {Array.from({ length: 22 }).map((_, index) => (
        <span key={index} style={{ animationDelay: `${index * 38}ms` }} />
      ))}
    </div>
  );
}
