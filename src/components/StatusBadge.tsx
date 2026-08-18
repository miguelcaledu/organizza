import { STATUS_BG, STATUS_COLORS } from "@/lib/constants";
import type { EventStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className="whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: STATUS_COLORS[status], background: STATUS_BG[status] }}
    >
      {status}
    </span>
  );
}
