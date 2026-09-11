"use client";

import Link from "next/link";
import { BookOpen, ChartNoAxesColumnIncreasing, History, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/practice", label: "Praticar", icon: BookOpen },
  { href: "/progress", label: "Progresso", icon: ChartNoAxesColumnIncreasing },
  { href: "/history", label: "Historico", icon: History },
  { href: "/settings", label: "Ajustes", icon: Settings }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="Navegacao do aplicativo">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href === "/practice" && pathname === "/");

        return (
          <Link href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
