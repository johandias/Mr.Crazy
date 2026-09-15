"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Settings, TimerReset, Flame, ShieldCheck } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";

interface AppShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function AppShell({ children, isAdmin: initialIsAdmin }: AppShellProps) {
  const [isAdmin, setIsAdmin] = useState<boolean>(initialIsAdmin ?? false);

  useEffect(() => {
    if (initialIsAdmin !== undefined) {
      setIsAdmin(initialIsAdmin);
      return;
    }

    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role === "admin" && data?.user?.status === "approved") {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, [initialIsAdmin]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="brand-mark" href="/practice" aria-label="Prática Mr.Crazy">
          <span className="brand-pulse" />
          <img
            src="/assets/character/mr_crazy_avatar_clean.png"
            alt="Mr.Crazy"
            className="brand-avatar-pixel"
            width={28}
            height={28}
          />
          <span className="brand-title-text">Mr.Crazy</span>
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
            <Flame size={15} className="streak-flame-icon" />
            7d
          </span>
          <Link className="icon-link" href="/settings" aria-label="Configurações e Perfil">
            <Settings size={18} />
          </Link>
        </div>
      </header>
      {children}
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  );
}
