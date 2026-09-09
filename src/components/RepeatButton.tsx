import { RotateCcw } from "lucide-react";

export function RepeatButton({ onClick, disabled }: Readonly<{ onClick: () => void; disabled?: boolean }>) {
  return (
    <button className="ghost-action" type="button" onClick={onClick} disabled={disabled}>
      <RotateCcw size={17} />
      Repetir
    </button>
  );
}
