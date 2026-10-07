import { KINDS, maxSeatsFor, RECT_WIDTH_MAX, RECT_WIDTH_MIN } from "./catalog";
import { DEFAULT_SETTINGS } from "./sample";
import type { Door, Guest, ItemKind, Plan, PlanItem, Pt } from "./types";

// Plans arrive from anonymous link-holders, so everything is re-shaped and
// clamped before it's stored rather than trusted as-is.

const MAX_ITEMS = 400;
const MAX_GUESTS = 1500;
const MAX_POINTS = 64;
const COORD = 100_000; // 1 km — anything beyond is garbage

const num = (v: unknown, min: number, max: number, dflt: number) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : dflt;
  return Math.min(max, Math.max(min, n));
};
const str = (v: unknown, max: number, dflt = "") => (typeof v === "string" ? v.slice(0, max) : dflt);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

function pt(v: unknown): Pt {
  const o = obj(v);
  return { x: num(o.x, -COORD, COORD, 0), y: num(o.y, -COORD, COORD, 0) };
}

function item(v: unknown): PlanItem | null {
  const o = obj(v);
  const kind = o.kind as ItemKind;
  if (!(kind in KINDS)) return null;
  const spec = KINDS[kind];
  const it: PlanItem = {
    id: str(o.id, 40) || Math.random().toString(36).slice(2),
    kind,
    x: num(o.x, -COORD, COORD, 0),
    y: num(o.y, -COORD, COORD, 0),
    rotation: num(o.rotation, -360, 360, 0),
    w: spec.defaultW,
    h: spec.defaultH,
    label: str(o.label, 60, spec.short),
  };
  if (kind === "rect250") it.h = num(o.h, RECT_WIDTH_MIN, RECT_WIDTH_MAX, spec.defaultH);
  if (!spec.isTable) {
    it.w = num(o.w, spec.minSize!, spec.maxSize!, spec.defaultW);
    it.h = num(o.h, spec.minSize!, spec.maxSize!, spec.defaultH);
  }
  if (spec.isTable) {
    if (kind === "rect250") it.seatSides = o.seatSides === "one" ? "one" : "both";
    it.seats = Math.round(num(o.seats, 0, maxSeatsFor(it), spec.defaultSeats!));
  }
  return it;
}

export function sanitizePlan(input: unknown): Plan {
  const o = obj(input);
  const room = obj(o.room);
  const outline = arr(room.outline).slice(0, MAX_POINTS).map(pt);
  const doors: Door[] = arr(room.doors).slice(0, 20).map((d) => {
    const dd = obj(d);
    return {
      id: str(dd.id, 40) || Math.random().toString(36).slice(2),
      wall: Math.round(num(dd.wall, 0, Math.max(0, outline.length - 1), 0)),
      offset: num(dd.offset, 0, COORD, 0),
      width: num(dd.width, 60, 1000, 180),
      label: str(dd.label, 60, "Entrada"),
    };
  });
  const items = arr(o.items).slice(0, MAX_ITEMS).map(item).filter((x): x is PlanItem => !!x);
  const tables = new Map(items.map((i) => [i.id, i]));
  const taken = new Set<string>();
  const guests: Guest[] = arr(o.guests).slice(0, MAX_GUESTS).map((g) => {
    const gg = obj(g);
    const s = obj(gg.seat);
    let seat: Guest["seat"] = null;
    const table = tables.get(str(s.tableId, 40));
    const index = Math.round(num(s.index, 0, 100, -1));
    const key = `${table?.id}:${index}`;
    // one guest per seat — later duplicates are dropped to unassigned
    if (table && index >= 0 && index < (table.seats ?? 0) && !taken.has(key)) {
      seat = { tableId: table.id, index };
      taken.add(key);
    }
    const guest: Guest = { id: str(gg.id, 40) || Math.random().toString(36).slice(2), name: str(gg.name, 80), seat };
    const group = str(gg.group, 60);
    const note = str(gg.note, 200);
    if (group) guest.group = group;
    if (note) guest.note = note;
    return guest;
  });
  const st = obj(o.settings);
  return {
    version: 1,
    title: str(o.title, 120, "O nosso casamento"),
    date: /^\d{4}-\d{2}-\d{2}$/.test(str(o.date, 10)) ? str(o.date, 10) : undefined,
    room: { outline: outline.length >= 3 ? outline : [], doors },
    items,
    guests,
    settings: {
      snap: typeof st.snap === "boolean" ? st.snap : DEFAULT_SETTINGS.snap,
      snapStep: [5, 10, 25, 50].includes(st.snapStep as number) ? (st.snapStep as number) : DEFAULT_SETTINGS.snapStep,
      showGrid: typeof st.showGrid === "boolean" ? st.showGrid : DEFAULT_SETTINGS.showGrid,
      showNames: typeof st.showNames === "boolean" ? st.showNames : DEFAULT_SETTINGS.showNames,
    },
  };
}
