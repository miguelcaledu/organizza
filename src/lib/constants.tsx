import type { EventStatus } from "@/lib/types";

export const STATUS_COLORS: Record<EventStatus, string> = {
  Planeamento: "#B8A88A",
  "Produção": "#8A9A7B",
  "Em curso": "#C4703F",
  "Concluído": "#A8A199",
  Cancelado: "#8A7F6E",
};

export const STATUS_BG: Record<EventStatus, string> = {
  Planeamento: "#B8A88A1A",
  "Produção": "#8A9A7B1A",
  "Em curso": "#C4703F1A",
  "Concluído": "#A8A1991A",
  Cancelado: "#D6CFC680",
};

export const MEMBER_COLORS = ["#8A9A7B", "#C4703F", "#B8A88A", "#6B655D"];

export const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const MONTH_ABBR_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const WEEKDAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function formatDateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatLongDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} de ${MONTHS_PT[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

export function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export type IconName = "dashboard" | "schedule" | "events" | "team" | "documents" | "settings" | "people" | "search" | "plus" | "close" | "chevronLeft" | "chevronRight" | "check" | "logout" | "plans";

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    className,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      );
    case "schedule":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
        </svg>
      );
    case "events":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="17" rx="1" /><line x1="3" y1="9" x2="21" y2="9" />
        </svg>
      );
    case "team":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" />
          <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M14.5 15c2.6.3 4.5 2.2 4.5 5" />
        </svg>
      );
    case "documents":
      return (
        <svg {...props}>
          <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="14 3 14 9 20 9" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    case "people":
      return (
        <svg {...props} strokeWidth={1.5}>
          <rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      );
    case "search":
      return (
        <svg {...props} strokeWidth={1.8}>
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props} strokeWidth={2}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case "close":
      return (
        <svg {...props} strokeWidth={1.8}>
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "chevronLeft":
      return (
        <svg {...props} strokeWidth={1.8}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      );
    case "chevronRight":
      return (
        <svg {...props} strokeWidth={1.8}>
          <polyline points="9 6 15 12 9 18" />
        </svg>
      );
    case "check":
      return (
        <svg {...props} strokeWidth={3}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "plans":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="1" /><circle cx="8.5" cy="9" r="2.2" /><circle cx="15.5" cy="15" r="2.2" /><rect x="13" y="6" width="5" height="3" rx="0.5" />
        </svg>
      );
    case "logout":
      return (
        <svg {...props} strokeWidth={1.8}>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
  }
}
