import Link from "next/link";
import { Settings, TimerReset } from "lucide-react";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="brand-mark" href="/practice" aria-label="Mr.Crazy practice">
          <span className="brand-pulse" />
          Mr.Crazy
        </Link>
        <nav className="top-nav" aria-label="Navegacao principal">
          <Link href="/practice">Practice</Link>
          <Link href="/progress">Progress</Link>
          <Link href="/history">History</Link>
        </nav>
        <div className="header-actions">
          <span className="streak-pill">
            <TimerReset size={15} />
            7d
          </span>
          <Link className="icon-link" href="/settings" aria-label="Settings">
            <Settings size={18} />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
