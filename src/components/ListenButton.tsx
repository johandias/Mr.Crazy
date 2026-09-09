import { Volume2 } from "lucide-react";

export function ListenButton({ onClick, disabled }: Readonly<{ onClick: () => void; disabled?: boolean }>) {
  return (
    <button className="ghost-action" type="button" onClick={onClick} disabled={disabled}>
      <Volume2 size={17} />
      Ouvir
    </button>
  );
}
