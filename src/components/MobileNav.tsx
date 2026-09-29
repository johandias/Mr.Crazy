"use client";

import Link from "next/link";
import { Mic, TrendingUp, Sparkles, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/practice",
    label: "Praticar",
    icon: Mic,
    isConversationGroup: true
  },
  {
    href: "/conversation",
    label: "Modo Beta",
    icon: Sparkles,
    badge: "BETA",
    isBeta: true,
    isConversationGroup: true
  },
  {
    href: "/progress",
    label: "Evolução",
    icon: TrendingUp
  },
  {
    href: "/settings",
    label: "Ajustes",
    icon: Settings
  }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="Navegação rápida do aplicativo">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/practice"
            ? pathname === "/practice" || pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            href={item.href}
            key={item.href}
            className={`mobile-nav-item ${active ? "active" : ""} ${item.isBeta ? "is-beta" : ""} ${
              item.isConversationGroup ? "in-conversation-group" : ""
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-nav-icon-wrap">
              <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
              {item.badge && <span className="mobile-nav-badge-pill">{item.badge}</span>}
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
