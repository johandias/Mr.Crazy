import Link from "next/link";
import { Settings, TimerReset } from "lucide-react";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="brand-mark" href="/practice" aria-label="Prática Mr.Crazy">
          <span className="brand-pulse" />
          Mr.Crazy
        </Link>
        <nav className="top-nav" aria-label="Navegação principal">
          <Link href="/practice">Praticar</Link>
          <Link href="/progress">Progresso</Link>
          <Link href="/history">Histórico</Link>
        </nav>
        <div className="header-actions">
          <span className="streak-pill">
            <TimerReset size={15} />
            7d
          </span>
          <Link className="icon-link" href="/settings" aria-label="Configurações">
            <Settings size={18} />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
