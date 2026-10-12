import { KINDS, maxSeatsFor, newItem } from "./catalog";
import { bounds, convexOverlap, doorZone, footprint, localFootprint, pointInPolygon } from "./geometry";
import { DEFAULT_SETTINGS, rectOutline, uid } from "./sample";
import type { Plan, PlanItem, Space, TableKind } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// "Novo plano" wizard: turn a few choices (spaces, guests, table type…) into a
// ready-to-edit plan with an automatic layout. Pure, so the wizard can preview
// exactly what the server will create.
// ─────────────────────────────────────────────────────────────────────────

export type SpaceKind = "cocktail" | "ceremony" | "dinner" | "party" | "custom";
export type HeadTable = "none" | "couple" | "honor";

export interface SetupSpace {
  kind: SpaceKind;
  name: string;
  /** cm */
  w: number;
  h: number;
}

export interface SetupConfig {
  title: string;
  date?: string;
  spaces: SetupSpace[];
  /** index into spaces of the room that gets the dining tables */
  seatingSpace: number;
  guests: number;
  tableKind: TableKind;
  seatsPerTable: number;
  tables: number;
  head: HeadTable;
  extras: { danceFloor: boolean; dj: boolean; bar: boolean; buffet: boolean; cake: boolean };
}

export const SPACE_PRESETS: Record<SpaceKind, { name: string; w: number; h: number }> = {
  cocktail: { name: "Cocktail", w: 1600, h: 1200 },
  ceremony: { name: "Cerimónia", w: 1500, h: 1000 },
  dinner: { name: "Jantar", w: 2000, h: 1400 },
  party: { name: "Festa", w: 1500, h: 1000 },
  custom: { name: "Espaço", w: 1500, h: 1000 },
};

export const HEAD_SEATS: Record<HeadTable, number> = { none: 0, couple: 2, honor: 5 };
export const HEAD_LABEL: Record<HeadTable, string> = { none: "Sem mesa principal", couple: "Mesa dos noivos (2)", honor: "Mesa de honra (5)" };

export function defaultSeats(kind: TableKind) {
  return KINDS[kind].defaultSeats ?? 8;
}

/** Tables needed for the guests not sitting at the head table. */
export function tablesNeeded(guests: number, seatsPerTable: number, head: HeadTable) {
  return Math.max(0, Math.ceil(Math.max(0, guests - HEAD_SEATS[head]) / Math.max(1, seatsPerTable)));
}

export function defaultSetup(): SetupConfig {
  const guests = 100;
  return {
    title: "",
    spaces: [
      { kind: "cocktail", ...SPACE_PRESETS.cocktail },
      { kind: "dinner", ...SPACE_PRESETS.dinner },
    ],
    seatingSpace: 1,
    guests,
    tableKind: "round180",
    seatsPerTable: 10,
    tables: tablesNeeded(guests, 10, "couple"),
    head: "couple",
    extras: { danceFloor: true, dj: true, bar: true, buffet: false, cake: true },
  };
}

/** Clamp anything coming from the browser into a sane config. */
export function sanitizeSetup(input: unknown): SetupConfig {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const num = (v: unknown, min: number, max: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : d);
  const kinds: SpaceKind[] = ["cocktail", "ceremony", "dinner", "party", "custom"];
  const spaces: SetupSpace[] = (Array.isArray(o.spaces) ? o.spaces : []).slice(0, 8).map((s: unknown) => {
    const so = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
    const kind = kinds.includes(so.kind as SpaceKind) ? (so.kind as SpaceKind) : "custom";
    return {
      kind,
      name: (typeof so.name === "string" ? so.name.trim().slice(0, 40) : "") || SPACE_PRESETS[kind].name,
      w: num(so.w, 300, 10000, SPACE_PRESETS[kind].w),
      h: num(so.h, 300, 10000, SPACE_PRESETS[kind].h),
    };
  });
  if (!spaces.length) spaces.push({ kind: "dinner", ...SPACE_PRESETS.dinner });
  const tableKind: TableKind = (["round160", "round180", "rect250"] as const).includes(o.tableKind as TableKind) ? (o.tableKind as TableKind) : "round180";
  const head: HeadTable = (["none", "couple", "honor"] as const).includes(o.head as HeadTable) ? (o.head as HeadTable) : "couple";
  const seatsPerTable = num(o.seatsPerTable, 1, maxSeatsFor({ kind: tableKind, seatSides: "both" }), defaultSeats(tableKind));
  const guests = num(o.guests, 0, 2000, 100);
  const ex = (o.extras && typeof o.extras === "object" ? o.extras : {}) as Record<string, unknown>;
  return {
    title: typeof o.title === "string" ? o.title.trim().slice(0, 120) : "",
    date: typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : undefined,
    spaces,
    seatingSpace: num(o.seatingSpace, 0, spaces.length - 1, Math.max(0, spaces.findIndex((s) => s.kind === "dinner"))),
    guests,
    tableKind,
    seatsPerTable,
    tables: num(o.tables, 0, 200, tablesNeeded(guests, seatsPerTable, head)),
    head,
    extras: { danceFloor: ex.danceFloor !== false, dj: ex.dj !== false, bar: ex.bar !== false, buffet: ex.buffet === true, cake: ex.cake !== false },
  };
}

// ── layout ──────────────────────────────────────────────────────────────

const WALL = 60; // clearance from the walls
// walkway between the chair zones of neighbouring tables (each zone is already
// 55 cm), i.e. ~1.9 m between table edges
const AISLE = 80;

type Room = Space["room"];

function fits(item: PlanItem, room: Room, placed: PlanItem[]) {
  const fp = footprint(item);
  if (!fp.every((p) => pointInPolygon(p, room.outline))) return false;
  const b = bounds(fp), r = bounds(room.outline);
  if (b.minX < r.minX + WALL / 2 || b.maxX > r.maxX - WALL / 2 || b.minY < r.minY + WALL / 2 || b.maxY > r.maxY - WALL / 2) return false;
  if (room.doors.some((d) => convexOverlap(doorZone(room.outline, d), fp))) return false;
  return placed.every((o) => !convexOverlap(fp, footprint(o)));
}

function roomFor(sp: SetupSpace): Room {
  return { outline: rectOutline(sp.w, sp.h), doors: [{ id: uid("d"), wall: 2, offset: sp.w / 2, width: 180, label: "Entrada" }] };
}

/** Features of a dining room: head table at the top, dance floor and DJ in the middle, bar/buffet on the side walls. */
function diningFeatures(cfg: SetupConfig, sp: SetupSpace, spaceId: string): PlanItem[] {
  const out: PlanItem[] = [];
  const add = (kind: PlanItem["kind"], x: number, y: number, label: string, patch: Partial<PlanItem> = {}) => {
    const it = { ...newItem(kind, uid("i"), { x, y }, label, spaceId), ...patch };
    out.push(it);
    return it;
  };
  const W = sp.w, H = sp.h;
  let top = WALL;
  if (cfg.head !== "none") {
    const seats = HEAD_SEATS[cfg.head];
    add("rect250", W / 2, WALL + 55 + 50, cfg.head === "couple" ? "Mesa dos noivos" : "Mesa de honra", { seats, seatSides: "one" });
    top = WALL + 55 + 100;
    if (cfg.extras.cake) add("cakeTable", Math.min(W - WALL - 60, W / 2 + 260), WALL + 105, "Bolo");
  } else if (cfg.extras.cake) {
    add("cakeTable", W / 2, WALL + 60, "Bolo");
    top = WALL + 120;
  }
  if (cfg.extras.danceFloor) {
    const s = cfg.guests <= 100 ? 500 : cfg.guests <= 160 ? 600 : 700;
    const fw = Math.min(s, W * 0.4), fh = Math.min(s * 0.8, H * 0.35);
    const fy = top + 120 + fh / 2;
    add("danceFloor", W / 2, fy, "Pista de dança", { w: Math.round(fw / 10) * 10, h: Math.round(fh / 10) * 10 });
    if (cfg.extras.dj) add("dj", W / 2, fy + fh / 2 + 80, "DJ");
  } else if (cfg.extras.dj) {
    add("dj", W / 2, top + 100, "DJ");
  }
  if (cfg.extras.bar) add("bar", W - WALL - 35, H / 2, "Bar", { rotation: 90 });
  if (cfg.extras.buffet) add("buffet", WALL + 40, H / 2, "Buffet", { rotation: 90 });
  return out;
}

/** Simple starting furniture for the other kinds of space. */
function otherFeatures(sp: SetupSpace, spaceId: string): PlanItem[] {
  const out: PlanItem[] = [];
  const add = (kind: PlanItem["kind"], x: number, y: number, label: string, patch: Partial<PlanItem> = {}) => out.push({ ...newItem(kind, uid("i"), { x, y }, label, spaceId), ...patch });
  const W = sp.w, H = sp.h;
  if (sp.kind === "cocktail") {
    if (W >= 600) add("bar", W - WALL - 35, Math.max(WALL + 200, H * 0.35), "Bar", { rotation: 90 });
    if (W >= 800 && H >= 700) {
      add("sofa", WALL + 240, WALL + 100, "Sofá");
      add("armchair", WALL + 100, WALL + 250, "Poltrona", { rotation: 270 });
      add("armchair", WALL + 380, WALL + 250, "Poltrona", { rotation: 90 });
      add("decor", WALL + 40, H - WALL - 40, "Planta", { w: 70, h: 70 });
    }
  } else if (sp.kind === "party") {
    const s = Math.min(600, W * 0.5, H * 0.5);
    add("danceFloor", W / 2, H / 2, "Pista de dança", { w: Math.round(s / 10) * 10, h: Math.round(s / 10) * 10 });
    add("dj", W / 2, H / 2 - s / 2 - 80, "DJ");
    if (W >= 600) add("bar", W - WALL - 35, H / 2, "Bar", { rotation: 90 });
  }
  return out;
}

/** Push every vertex of a convex footprint outwards by m (good enough for circles and rectangles). */
function grow(poly: { x: number; y: number }[], m: number) {
  const cx = poly.reduce((n, p) => n + p.x, 0) / poly.length, cy = poly.reduce((n, p) => n + p.y, 0) / poly.length;
  return poly.map((p) => {
    const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / d) * m, y: p.y + (dy / d) * m };
  });
}

export interface SetupResult {
  plan: Plan;
  placed: number;
  missing: number;
  seats: number;
}

export function buildPlanFromSetup(cfg: SetupConfig): SetupResult {
  const spaces: Space[] = cfg.spaces.map((sp) => ({ id: uid("s"), name: sp.name, room: roomFor(sp) }));
  const items: PlanItem[] = [];
  let placed = 0, missing = 0;

  cfg.spaces.forEach((sp, i) => {
    const space = spaces[i];
    if (i !== cfg.seatingSpace) {
      items.push(...otherFeatures(sp, space.id).filter((it) => fits(it, space.room, items.filter((o) => o.spaceId === space.id))));
      return;
    }
    const features = diningFeatures(cfg, sp, space.id);
    const kept: PlanItem[] = [];
    for (const f of features) if (fits(f, space.room, kept)) kept.push(f);
    items.push(...kept);

    // Try a few grid offsets (and staggered rows) and keep the arrangement that
    // fits the most tables, preferring tables close to the dance floor / head table.
    const proto = { ...newItem(cfg.tableKind, "proto", { x: 0, y: 0 }, "", space.id), seats: cfg.seatsPerTable };
    const fb = bounds(localFootprint(proto));
    const round = cfg.tableKind !== "rect250";
    const pitchX = fb.w + AISLE;
    const focus = kept.find((k) => k.kind === "danceFloor") ?? kept.find((k) => k.kind === "rect250") ?? { x: sp.w / 2, y: sp.h / 3 };
    // features keep a walkway around them too
    const blocked = kept.map((k) => grow(footprint(k), AISLE / 2));

    let best: { tables: PlanItem[]; score: number } = { tables: [], score: Infinity };
    for (const stagger of round ? [false, true] : [false]) {
      const pitchY = (fb.h + AISLE) * (stagger ? 0.87 : 1);
      for (const fx of [0, 0.25, 0.5, 0.75]) {
        for (const fy of [0, 0.25, 0.5, 0.75]) {
          const cands: { x: number; y: number }[] = [];
          for (let r = 0, y = WALL + fb.h / 2 + fy * pitchY; y <= sp.h - WALL - fb.h / 2; r++, y += pitchY) {
            const shift = stagger && r % 2 ? pitchX / 2 : 0;
            for (let x = WALL + fb.w / 2 + ((fx * pitchX + shift) % pitchX); x <= sp.w - WALL - fb.w / 2; x += pitchX) cands.push({ x: Math.round(x), y: Math.round(y) });
          }
          cands.sort((a, b) => Math.hypot(a.x - focus.x, a.y - focus.y) - Math.hypot(b.x - focus.x, b.y - focus.y));
          const tables: PlanItem[] = [];
          for (const c of cands) {
            if (tables.length >= cfg.tables) break;
            const t = { ...proto, id: uid("i"), x: c.x, y: c.y };
            const fp = grow(footprint(t), AISLE / 2);
            if (!fits(t, space.room, kept)) continue;
            if (blocked.some((z) => convexOverlap(z, fp))) continue;
            if (tables.some((o) => convexOverlap(grow(footprint(o), AISLE / 2), fp))) continue;
            tables.push(t);
          }
          const score = -tables.length * 1e7 + tables.reduce((n, t) => n + Math.hypot(t.x - focus.x, t.y - focus.y), 0);
          if (score < best.score) best = { tables, score };
        }
      }
    }
    // fill pass: squeeze any remaining tables into leftover gaps on a fine lattice
    const chosen = [...best.tables];
    if (chosen.length < cfg.tables) {
      const fine: { x: number; y: number }[] = [];
      for (let y = WALL + fb.h / 2; y <= sp.h - WALL - fb.h / 2; y += 20) for (let x = WALL + fb.w / 2; x <= sp.w - WALL - fb.w / 2; x += 20) fine.push({ x, y });
      fine.sort((a, b) => Math.hypot(a.x - focus.x, a.y - focus.y) - Math.hypot(b.x - focus.x, b.y - focus.y));
      for (const c of fine) {
        if (chosen.length >= cfg.tables) break;
        const t = { ...proto, id: uid("i"), x: c.x, y: c.y };
        const fp = grow(footprint(t), AISLE / 2);
        if (!fits(t, space.room, kept)) continue;
        if (blocked.some((z) => convexOverlap(z, fp))) continue;
        if (chosen.some((o) => convexOverlap(grow(footprint(o), AISLE / 2), fp))) continue;
        chosen.push(t);
      }
    }
    // number tables from the front (closest to the couple) to the back
    const tables = chosen.sort((a, b) => a.y - b.y || a.x - b.x);
    tables.forEach((t, k) => (t.label = `Mesa ${k + 1}`));
    placed = tables.length;
    missing = Math.max(0, cfg.tables - placed);
    items.push(...tables);
  });

  const seats = items.reduce((n, i) => n + (KINDS[i.kind].isTable ? (i.seats ?? 0) : 0), 0);
  const plan: Plan = {
    version: 2,
    title: cfg.title || "Casamento",
    date: cfg.date,
    spaces,
    items,
    guests: [],
    settings: { ...DEFAULT_SETTINGS },
    expectedGuests: cfg.guests || undefined,
  };
  return { plan, placed, missing, seats };
}

/** Smallest proportional enlargement of the seating room that fits every table (null if it already fits). */
export function suggestRoomSize(cfg: SetupConfig): { w: number; h: number } | null {
  if (!buildPlanFromSetup(cfg).missing) return null;
  const sp = cfg.spaces[cfg.seatingSpace];
  for (let k = 1; k <= 40; k++) {
    const f = 1 + k * 0.05;
    const w = Math.ceil((sp.w * f) / 50) * 50, h = Math.ceil((sp.h * f) / 50) * 50;
    const trial = { ...cfg, spaces: cfg.spaces.map((s, i) => (i === cfg.seatingSpace ? { ...s, w, h } : s)) };
    if (!buildPlanFromSetup(trial).missing) return { w, h };
  }
  return null;
}
