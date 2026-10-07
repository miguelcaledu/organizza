import { isTable, maxSeatsFor } from "./catalog";
import { seatLabel } from "./ops";
import { sanitizePlan } from "./validate";
import type { Guest, Plan } from "./types";

// What a client (the couple) may change, and the change log their edits produce.
// Clients control people and the number of seats per table — nothing else.

/** Keep the stored layout; take only guests and per-table seat counts from the client's copy. */
export function applyClientEdits(stored: Plan, incoming: Plan): Plan {
  const seats = new Map(incoming.items.filter(isTable).map((t) => [t.id, t.seats ?? 0]));
  const items = stored.items.map((it) => {
    if (!isTable(it) || !seats.has(it.id)) return it;
    return { ...it, seats: Math.max(0, Math.min(maxSeatsFor(it), Math.round(seats.get(it.id)!))) };
  });
  // re-sanitize so seat references are checked against the *stored* tables
  return sanitizePlan({ ...stored, items, guests: incoming.guests });
}

export type ChangeKind = "guest_added" | "guest_changed" | "guest_removed" | "seat_added" | "seat_removed";

export interface ChangeEntry {
  kind: ChangeKind;
  table_id: string | null;
  table_label: string | null;
  seat_index: number | null;
  guest_id: string | null;
  guest_name: string | null;
  summary: string;
}

/** A change as stored in seating_plan_changes, as read by staff. */
export interface PlanChange extends ChangeEntry {
  id: number;
  plan_id: string;
  actor_name: string;
  created_at: string;
  reviewed_at: string | null;
}

const sameSeat = (a: Guest["seat"], b: Guest["seat"]) => (a?.tableId ?? null) === (b?.tableId ?? null) && (a?.index ?? null) === (b?.index ?? null);

export function diffClientChanges(before: Plan, after: Plan): ChangeEntry[] {
  const out: ChangeEntry[] = [];
  const where = (p: Plan, g: Guest) => seatLabel(p, g.seat) ?? "por sentar";
  const seatFields = (p: Plan, g: Guest) => {
    const t = g.seat ? p.items.find((i) => i.id === g.seat!.tableId) : null;
    return { table_id: t?.id ?? null, table_label: t?.label ?? null, seat_index: t ? g.seat!.index : null };
  };

  // seats first, so a "new seat + new guest in it" reads naturally in the log
  const oldTables = new Map(before.items.filter(isTable).map((t) => [t.id, t]));
  for (const t of after.items.filter(isTable)) {
    const o = oldTables.get(t.id);
    if (!o) continue; // clients can't add tables
    const was = o.seats ?? 0, now = t.seats ?? 0;
    for (let i = was; i < now; i++) {
      out.push({ kind: "seat_added", table_id: t.id, table_label: t.label, seat_index: i, guest_id: null, guest_name: null, summary: `Lugar ${i + 1} adicionado à ${t.label} (${was} → ${now})` });
    }
    for (let i = now; i < was; i++) {
      out.push({ kind: "seat_removed", table_id: t.id, table_label: t.label, seat_index: i, guest_id: null, guest_name: null, summary: `Lugar ${i + 1} removido da ${t.label} (${was} → ${now})` });
    }
  }

  const old = new Map(before.guests.map((g) => [g.id, g]));
  const seen = new Set<string>();
  for (const g of after.guests) {
    seen.add(g.id);
    const o = old.get(g.id);
    if (!o) {
      out.push({ kind: "guest_added", ...seatFields(after, g), guest_id: g.id, guest_name: g.name, summary: `${g.name} adicionado(a) · ${where(after, g)}` });
      continue;
    }
    const parts: string[] = [];
    if (o.name !== g.name) parts.push(`nome “${o.name}” → “${g.name}”`);
    if (!sameSeat(o.seat, g.seat)) parts.push(`${where(before, o)} → ${where(after, g)}`);
    if ((o.group ?? "") !== (g.group ?? "")) parts.push(`grupo “${o.group ?? ""}” → “${g.group ?? ""}”`);
    if ((o.note ?? "") !== (g.note ?? "")) parts.push(`nota “${o.note ?? ""}” → “${g.note ?? ""}”`);
    if (parts.length) out.push({ kind: "guest_changed", ...seatFields(after, g), guest_id: g.id, guest_name: g.name, summary: `${g.name}: ${parts.join("; ")}` });
  }
  for (const o of before.guests) {
    if (!seen.has(o.id)) out.push({ kind: "guest_removed", ...seatFields(before, o), guest_id: o.id, guest_name: o.name, summary: `${o.name} removido(a) da lista` });
  }
  return out;
}

export interface ChangeHighlights {
  /** guest id → most significant unreviewed change (added beats changed) */
  guests: Map<string, "added" | "changed">;
  /** "tableId:index" of seats added and not yet reviewed */
  seats: Set<string>;
}

export function highlightsFrom(changes: PlanChange[]): ChangeHighlights {
  const guests = new Map<string, "added" | "changed">();
  const seats = new Set<string>();
  for (const c of changes) {
    if (c.reviewed_at) continue;
    if (c.kind === "guest_added" && c.guest_id) guests.set(c.guest_id, "added");
    if (c.kind === "guest_changed" && c.guest_id && guests.get(c.guest_id) !== "added") guests.set(c.guest_id, "changed");
    if (c.kind === "seat_added" && c.table_id != null && c.seat_index != null) seats.add(`${c.table_id}:${c.seat_index}`);
  }
  return { guests, seats };
}

/** Colours agreed with the venue team: changed = yellow, added person = blue, added seat = red. */
export const CHANGE_COLORS: Record<ChangeKind, { fill: string; stroke: string; label: string }> = {
  guest_changed: { fill: "#FBE7A1", stroke: "#D4A514", label: "Pessoa alterada" },
  guest_added: { fill: "#D6E4FB", stroke: "#3B6FD8", label: "Pessoa adicionada" },
  seat_added: { fill: "#F9D4D4", stroke: "#D64545", label: "Lugar adicionado" },
  guest_removed: { fill: "#EDEAE5", stroke: "#A8A199", label: "Pessoa removida" },
  seat_removed: { fill: "#EDEAE5", stroke: "#A8A199", label: "Lugar removido" },
};
