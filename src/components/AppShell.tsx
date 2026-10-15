"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, TimerReset, Flame, ShieldCheck, User, LogOut, ArrowLeftRight, TrendingUp, ChevronDown } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";

interface AppShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

interface UserHeaderData {
  nickname?: string;
  email?: string;
  streak_days?: number;
  computedLevel?: string;
  role?: string;
}

export function AppShell({ children, isAdmin: initialIsAdmin }: AppShellProps) {
  const [isAdmin, setIsAdmin] = useState<boolean>(initialIsAdmin ?? false);
  const [userData, setUserData] = useState<UserHeaderData | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isNavActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile) {
          setUserData(data.profile);
          if (data.profile.role === "admin" && initialIsAdmin === undefined) {
            setIsAdmin(true);
          }
        }
      })
      .catch(() => {});
  }, [initialIsAdmin]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = () => {
    try {
      window.localStorage.removeItem("mr-crazy-session");
      window.sessionStorage.removeItem("mr-crazy-session-turns");
    } catch {}
    window.location.href = "/api/auth/logout?reset=1";
  };

  const handleSwitchAccount = () => {
    try {
      window.localStorage.removeItem("mr-crazy-session");
      window.sessionStorage.removeItem("mr-crazy-session-turns");
    } catch {}
    window.location.href = "/api/auth/logout?switch=1";
  };

  const userInitial = (userData?.nickname || userData?.email || "U")[0].toUpperCase();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="brand-mark" href="/practice" aria-label="Prática Mr.Crazy">
          <span className="brand-pulse" />
          <img
            src="/assets/character/mr_crazy_owl_epic.webp"
            alt="Mr.Crazy, coruja professora de inglês"
            className="brand-avatar-pixel"
            width={28}
            height={28}
          />
          <span className="brand-title-text">Mr.Crazy</span>
        </Link>
        <nav className="top-nav" aria-label="Navegação principal">
          <Link href="/practice" className={isNavActive("/practice") ? "is-active" : undefined} aria-current={isNavActive("/practice") ? "page" : undefined}>Praticar</Link>
          <Link href="/conversation" className={`beta-top-nav-link ${isNavActive("/conversation") ? "is-active" : ""}`} aria-current={isNavActive("/conversation") ? "page" : undefined}>Modo Beta</Link>
          <Link href="/progress" className={isNavActive("/progress") ? "is-active" : undefined} aria-current={isNavActive("/progress") ? "page" : undefined}>Progresso</Link>
          <Link href="/history" className={isNavActive("/history") ? "is-active" : undefined} aria-current={isNavActive("/history") ? "page" : undefined}>Histórico</Link>
          {isAdmin ? (
            <Link className={`admin-nav-item ${isNavActive("/admin") ? "is-active" : ""}`} href="/admin" aria-current={isNavActive("/admin") ? "page" : undefined}>
              <ShieldCheck size={14} /> Supervisor
            </Link>
          ) : null}
        </nav>
        <div className="header-actions">
          {isAdmin ? (
            <Link className="icon-link admin-action-btn" href="/admin" title="Painel do Administrador">
              <ShieldCheck size={18} />
            </Link>
          ) : null}
          <span className="streak-pill" title="Dias seguidos de prática">
            <TimerReset size={15} />
            <Flame size={15} className="streak-flame-icon" />
            {userData?.streak_days || 7}d
          </span>
          <Link className="icon-link" href="/settings" aria-label="Configurações e Perfil" title="Configurações e Calibração">
            <Settings size={18} />
          </Link>

          {/* Menu Dropdown de Conta / Usuário */}
          <div className="header-user-dropdown-container" ref={menuRef}>
            <button
              type="button"
              className={`user-avatar-menu-btn ${isMenuOpen ? "is-active" : ""}`}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Menu de conta do usuário"
              title="Sua conta e opções de acesso"
            >
              <span className="header-user-initial">{userInitial}</span>
              <ChevronDown size={13} className="header-user-caret" />
            </button>

            {isMenuOpen && (
              <div className="header-user-menu-dropdown" role="menu">
                <div className="dropdown-user-header">
                  <div className="dropdown-avatar-badge">{userInitial}</div>
                  <div className="dropdown-user-info">
                    <strong className="dropdown-user-name">
                      {userData?.nickname || "Aluno Mr.Crazy"}
                    </strong>
                    <span className="dropdown-user-email">{userData?.email || ""}</span>
                  </div>
                </div>

                <div className="dropdown-menu-list">
                  <Link
                    href="/settings"
                    className="dropdown-menu-item"
                    onClick={() => setIsMenuOpen(false)}
                    role="menuitem"
                  >
                    <Settings size={15} />
                    <span>Configurações & Áudio</span>
                  </Link>
                  <Link
                    href="/progress"
                    className="dropdown-menu-item"
                    onClick={() => setIsMenuOpen(false)}
                    role="menuitem"
                  >
                    <TrendingUp size={15} />
                    <span>Evolução & Nível</span>
                  </Link>

                  <div className="dropdown-menu-divider" />

                  <button
                    type="button"
                    className="dropdown-menu-item action-switch"
                    onClick={handleSwitchAccount}
                    role="menuitem"
                  >
                    <ArrowLeftRight size={15} />
                    <span>Trocar de Conta</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-menu-item action-logout"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut size={15} />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {children}
      <Suspense fallback={null}>
        <MobileNav isAdmin={isAdmin} />
      </Suspense>
    </div>
  );
}
