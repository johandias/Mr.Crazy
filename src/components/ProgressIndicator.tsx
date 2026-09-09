export function ProgressIndicator({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="progress-indicator">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <meter min={0} max={100} value={value} aria-label={label} />
    </div>
  );
}
