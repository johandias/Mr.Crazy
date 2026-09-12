"use client";

import Link from "next/link";
import { Mic, TrendingUp, Sparkles, Settings } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  { href: "/practice", label: "Praticar", icon: Mic },
  { href: "/progress", label: "Evolução", icon: TrendingUp },
  { href: "/progress?tab=techniques", label: "Técnicas IA", icon: Sparkles },
  { href: "/settings", label: "Ajustes", icon: Settings }
];

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  return (
    <nav className="mobile-nav" aria-label="Navegação rápida do aplicativo">
      {items.map((item) => {
        const Icon = item.icon;
        const isTechniques = item.href.includes("tab=techniques");
        const active = isTechniques
          ? pathname === "/progress" && activeTab === "techniques"
          : (pathname === item.href || (item.href === "/practice" && pathname === "/")) && (!activeTab || !item.href.includes("/progress"));

        return (
          <Link
            href={item.href}
            key={item.href}
            className={`mobile-nav-item ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-nav-icon-wrap">
              <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
