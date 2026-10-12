"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/lib/constants";
import type { Role } from "@/lib/types";

const NAV: { key: IconName; label: string; href: string; adminOnly?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "schedule", label: "Calendário", href: "/schedule" },
  { key: "events", label: "Eventos", href: "/events" },
  { key: "team", label: "Equipa", href: "/team" },
  { key: "documents", label: "Documentos", href: "/documents" },
  { key: "plans", label: "Plantas", href: "/plantas" },
  { key: "people", label: "Pessoas", href: "/people", adminOnly: true },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border flex flex-col gap-8 p-4 py-6">
      <div className="font-serif-display text-[19px] font-medium px-2">Organizza</div>
      <nav className="flex flex-col gap-1">
        {NAV.filter((n) => !n.adminOnly || role === "admin").map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-colors hover:bg-sage-tint ${
                active ? "bg-sage-tint font-medium text-ink" : "font-normal text-ink-soft"
              }`}
            >
              <Icon name={item.key} />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
