import Link from "next/link";
import { Settings, TimerReset, ShieldCheck } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { getCurrentSession } from "@/lib/server-auth";

export async function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession();
  const isAdmin = session?.role === "admin" && session.status === "approved";

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
          {isAdmin ? (
            <Link className="admin-nav-item" href="/admin">
              <ShieldCheck size={14} /> Admin
            </Link>
          ) : null}
        </nav>
        <div className="header-actions">
          {isAdmin ? (
            <Link className="icon-link admin-action-btn" href="/admin" title="Painel do Administrador">
              <ShieldCheck size={18} />
            </Link>
          ) : null}
          <span className="streak-pill">
            <TimerReset size={15} />
            7d
          </span>
          <Link className="icon-link" href="/settings" aria-label="Configurações e Perfil">
            <Settings size={18} />
          </Link>
        </div>
      </header>
      {children}
      <MobileNav />
    </div>
  );
}
