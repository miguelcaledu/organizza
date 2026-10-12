import type { ItemKind, PlanItem, Pt, SeatSides, TableKind } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Furniture catalogue. Dining tables are fixed to the three sizes the venue
// stocks; everything else has editable dimensions. Defaults and seat limits
// are documented in docs/seating-planner.md — keep the two in sync.
// ─────────────────────────────────────────────────────────────────────────

/** how far a chair's centre sits from the table edge */
export const CHAIR_OFFSET = 28;
/** clearance a seated guest needs behind the table edge — used for overlap warnings */
export const CHAIR_ZONE = 55;
export const CHAIR_W = 42;
export const CHAIR_D = 40;

export const RECT_TABLE_LENGTH = 250;
export const RECT_WIDTH_MIN = 60;
export const RECT_WIDTH_MAX = 150;
export const RECT_WIDTH_DEFAULT = 100;

export interface KindSpec {
  label: string;
  short: string;
  isTable: boolean;
  defaultW: number;
  defaultH: number;
  /** editable size range for features (cm) */
  minSize?: number;
  maxSize?: number;
  defaultSeats?: number;
  maxSeats?: number;
  fill: string;
  stroke: string;
  /** round features are resized by diameter (w = h) */
  round?: boolean;
}

export const KINDS: Record<ItemKind, KindSpec> = {
  round160: {
    label: "Mesa redonda Ø160",
    short: "Redonda Ø160",
    isTable: true,
    defaultW: 160,
    defaultH: 160,
    defaultSeats: 8,
    maxSeats: 10,
    fill: "#FFFFFF",
    stroke: "#B8A88A",
  },
  round180: {
    label: "Mesa redonda Ø180",
    short: "Redonda Ø180",
    isTable: true,
    defaultW: 180,
    defaultH: 180,
    defaultSeats: 10,
    maxSeats: 12,
    fill: "#FFFFFF",
    stroke: "#B8A88A",
  },
  rect250: {
    label: "Mesa retangular 250 cm",
    short: "Retangular 250",
    isTable: true,
    defaultW: RECT_TABLE_LENGTH,
    defaultH: RECT_WIDTH_DEFAULT,
    defaultSeats: 8,
    maxSeats: 12,
    fill: "#FFFFFF",
    stroke: "#B8A88A",
  },
  danceFloor: {
    label: "Pista de dança",
    short: "Pista de dança",
    isTable: false,
    defaultW: 600,
    defaultH: 500,
    minSize: 200,
    maxSize: 2000,
    fill: "#F3ECDD",
    stroke: "#B8A88A",
  },
  bar: {
    label: "Bar",
    short: "Bar",
    isTable: false,
    defaultW: 300,
    defaultH: 70,
    minSize: 50,
    maxSize: 1500,
    fill: "#F6E6DC",
    stroke: "#C4703F",
  },
  buffet: {
    label: "Mesa de buffet",
    short: "Buffet",
    isTable: false,
    defaultW: 300,
    defaultH: 80,
    minSize: 50,
    maxSize: 1500,
    fill: "#ECEFE7",
    stroke: "#8A9A7B",
  },
  dj: {
    label: "Mesa do DJ",
    short: "DJ",
    isTable: false,
    defaultW: 200,
    defaultH: 80,
    minSize: 50,
    maxSize: 600,
    fill: "#E7EAF0",
    stroke: "#6B7B9A",
  },
  stage: {
    label: "Palco",
    short: "Palco",
    isTable: false,
    defaultW: 600,
    defaultH: 300,
    minSize: 100,
    maxSize: 2000,
    fill: "#E9E4DA",
    stroke: "#6B655D",
  },
  photobooth: {
    label: "Photobooth",
    short: "Photobooth",
    isTable: false,
    defaultW: 300,
    defaultH: 300,
    minSize: 100,
    maxSize: 1000,
    fill: "#F3EEF4",
    stroke: "#9A7BA0",
  },
  sofa: {
    label: "Sofá lounge",
    short: "Sofá",
    isTable: false,
    defaultW: 200,
    defaultH: 85,
    minSize: 60,
    maxSize: 500,
    fill: "#EFE9DF",
    stroke: "#A8916E",
  },
  armchair: {
    label: "Poltrona",
    short: "Poltrona",
    isTable: false,
    defaultW: 85,
    defaultH: 85,
    minSize: 50,
    maxSize: 200,
    fill: "#EFE9DF",
    stroke: "#A8916E",
  },
  decor: {
    label: "Planta / arranjo floral",
    short: "Decoração",
    isTable: false,
    defaultW: 80,
    defaultH: 80,
    minSize: 30,
    maxSize: 400,
    fill: "#E3EBDC",
    stroke: "#7C8C6E",
    round: true,
  },
  cakeTable: {
    label: "Mesa do bolo",
    short: "Bolo",
    isTable: false,
    defaultW: 90,
    defaultH: 90,
    minSize: 50,
    maxSize: 250,
    fill: "#FBF3EE",
    stroke: "#C4703F",
    round: true,
  },
};

export const TABLE_KINDS: TableKind[] = ["round160", "round180", "rect250"];
export const FEATURE_KINDS = ["danceFloor", "bar", "buffet", "dj"] as const;

/** Palette groups, in display order. */
export const PALETTE: { title: string; kinds: ItemKind[] }[] = [
  { title: "Mesas", kinds: TABLE_KINDS },
  { title: "Espaços", kinds: ["danceFloor", "bar", "buffet", "dj", "stage", "photobooth"] },
  { title: "Lounge", kinds: ["sofa", "armchair"] },
  { title: "Decoração", kinds: ["decor", "cakeTable"] },
];

export function isTable(item: Pick<PlanItem, "kind">): boolean {
  return KINDS[item.kind].isTable;
}

export function maxSeatsFor(item: Pick<PlanItem, "kind" | "seatSides">): number {
  if (item.kind === "rect250" && item.seatSides === "one") return 5;
  return KINDS[item.kind].maxSeats ?? 0;
}

export interface SeatGeom {
  /** local position (relative to the item centre, before rotation) */
  x: number;
  y: number;
  /** direction the chair faces *away* from the table, in degrees (0 = +x) */
  out: number;
}

/**
 * Chair positions, numbered clockwise starting top-left / 12 o'clock.
 * Rect tables fill the long sides first (max 5 per side), then the two ends.
 */
export function seatGeometry(item: Pick<PlanItem, "kind" | "w" | "h" | "seats" | "seatSides">): SeatGeom[] {
  const n = Math.max(0, item.seats ?? 0);
  if (!n) return [];
  if (item.kind === "round160" || item.kind === "round180") {
    const r = item.w / 2 + CHAIR_OFFSET;
    return Array.from({ length: n }, (_, i) => {
      const a = -90 + (360 * i) / n;
      const rad = (a * Math.PI) / 180;
      return { x: Math.round(r * Math.cos(rad) * 100) / 100, y: Math.round(r * Math.sin(rad) * 100) / 100, out: a };
    });
  }
  const L = item.w;
  const top = -item.h / 2 - CHAIR_OFFSET;
  const bottom = item.h / 2 + CHAIR_OFFSET;
  const along = (k: number, i: number) => -L / 2 + (L * (i + 0.5)) / k;

  if (item.seatSides === "one") {
    const k = Math.min(n, 5);
    return Array.from({ length: k }, (_, i) => ({ x: along(k, i), y: top, out: -90 }));
  }
  const sides = Math.min(n, 10);
  const nTop = Math.ceil(sides / 2);
  const nBottom = sides - nTop;
  const ends = Math.min(n - sides, 2);
  const seats: SeatGeom[] = [];
  for (let i = 0; i < nTop; i++) seats.push({ x: along(nTop, i), y: top, out: -90 });
  if (ends >= 1) seats.push({ x: L / 2 + CHAIR_OFFSET, y: 0, out: 0 });
  for (let i = nBottom - 1; i >= 0; i--) seats.push({ x: along(nBottom, i), y: bottom, out: 90 });
  if (ends >= 2) seats.push({ x: -L / 2 - CHAIR_OFFSET, y: 0, out: 180 });
  return seats;
}

export function rotatePt(p: Pt, deg: number): Pt {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  // rounded to 0.01 cm so server and client renders agree
  return { x: Math.round((p.x * c - p.y * s) * 100) / 100, y: Math.round((p.x * s + p.y * c) * 100) / 100 };
}

export function toWorld(item: Pick<PlanItem, "x" | "y" | "rotation">, p: Pt): Pt {
  const r = rotatePt(p, item.rotation);
  return { x: item.x + r.x, y: item.y + r.y };
}

export function toLocal(item: Pick<PlanItem, "x" | "y" | "rotation">, p: Pt): Pt {
  return rotatePt({ x: p.x - item.x, y: p.y - item.y }, -item.rotation);
}

/** `spaceId` may be left empty when the item is created inside a SpacePlan; mergeSpace fills it in. */
export function newItem(kind: ItemKind, id: string, at: Pt, label: string, spaceId = ""): PlanItem {
  const spec = KINDS[kind];
  const item: PlanItem = { id, spaceId, kind, x: at.x, y: at.y, rotation: 0, w: spec.defaultW, h: spec.defaultH, label };
  if (spec.isTable) {
    item.seats = spec.defaultSeats;
    if (kind === "rect250") item.seatSides = "both";
  }
  return item;
}

/** Switch a table between the three stocked sizes, keeping seat count within the new limit. */
export function changeTableKind(item: PlanItem, kind: TableKind, sides?: SeatSides): PlanItem {
  const spec = KINDS[kind];
  const next: PlanItem = {
    ...item,
    kind,
    w: spec.defaultW,
    h: kind === "rect250" ? (item.kind === "rect250" ? item.h : RECT_WIDTH_DEFAULT) : spec.defaultH,
    seatSides: kind === "rect250" ? (sides ?? item.seatSides ?? "both") : undefined,
  };
  next.seats = Math.min(item.seats ?? spec.defaultSeats ?? 0, maxSeatsFor(next));
  return next;
}

export function formatM(cm: number): string {
  const m = cm / 100;
  return `${(Math.round(m * 100) / 100).toLocaleString("pt-PT", { maximumFractionDigits: 2 })} m`;
}
