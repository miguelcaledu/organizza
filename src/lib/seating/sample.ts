import { newItem } from "./catalog";
import type { Guest, Plan, PlanItem, Pt } from "./types";

export function uid(prefix = "") {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
    : Math.random().toString(36).slice(2, 12);
  return prefix + rnd;
}

export const DEFAULT_SETTINGS: Plan["settings"] = { snap: true, snapStep: 10, showGrid: true, showNames: true };

export function rectOutline(w: number, h: number): Pt[] {
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
}

/** L-shaped room: the bottom-right corner is cut away. */
export function lOutline(w: number, h: number, cutW: number, cutH: number): Pt[] {
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h - cutH },
    { x: w - cutW, y: h - cutH },
    { x: w - cutW, y: h },
    { x: 0, y: h },
  ];
}

export function blankPlan(title: string, date?: string): Plan {
  return {
    version: 1,
    title,
    date,
    room: {
      outline: rectOutline(2000, 1400),
      doors: [{ id: uid("d"), wall: 2, offset: 1000, width: 180, label: "Entrada principal" }],
    },
    items: [],
    guests: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

const SAMPLE_GUESTS: [string, string][] = [
  ["Maria Fernandes", "Família da noiva"],
  ["Rui Fernandes", "Família da noiva"],
  ["Helena Fernandes", "Família da noiva"],
  ["António Fernandes", "Família da noiva"],
  ["Teresa Lopes", "Família da noiva"],
  ["Jorge Lopes", "Família da noiva"],
  ["Isabel Carvalho", "Família do noivo"],
  ["Paulo Carvalho", "Família do noivo"],
  ["Rita Carvalho", "Família do noivo"],
  ["Nuno Carvalho", "Família do noivo"],
  ["Sofia Martins", "Padrinhos"],
  ["Pedro Almeida", "Padrinhos"],
  ["Catarina Sousa", "Amigos"],
  ["Miguel Sousa", "Amigos"],
  ["Inês Ribeiro", "Amigos"],
  ["Tiago Ribeiro", "Amigos"],
  ["Beatriz Costa", "Amigos"],
  ["Diogo Pereira", "Amigos"],
  ["Mariana Gomes", "Colegas"],
  ["Ricardo Santos", "Colegas"],
  ["Joana Pinto", "Colegas"],
  ["Francisco Moreira", "Colegas"],
];

/**
 * An 82-seat sample for a 20 × 14 m room, loosely following the reference
 * "cheat sheet": head table at the top, family closest, friends further out.
 */
export function samplePlan(title: string, date?: string): Plan {
  const plan = blankPlan(title, date);
  const items: PlanItem[] = [];
  const add = (kind: PlanItem["kind"], x: number, y: number, label: string, patch: Partial<PlanItem> = {}) => {
    const it = { ...newItem(kind, uid("i"), { x, y }, label), ...patch };
    items.push(it);
    return it;
  };

  const head = add("rect250", 1000, 160, "Mesa dos noivos", { seats: 2, seatSides: "one" });
  add("danceFloor", 1000, 560, "Pista de dança", { w: 600, h: 400 });
  add("dj", 1000, 860, "DJ", { w: 200, h: 80 });
  add("bar", 1890, 700, "Bar", { w: 300, h: 70, rotation: 90 });
  add("buffet", 110, 700, "Buffet", { w: 300, h: 80, rotation: 90 });

  let n = 1;
  const table = (kind: PlanItem["kind"], x: number, y: number) => add(kind, x, y, `Mesa ${n++}`);
  const t1 = table("round180", 430, 330);
  const t2 = table("round180", 1570, 330);
  table("round180", 430, 680);
  table("round180", 1570, 680);
  table("round160", 430, 1060);
  table("round160", 740, 1170);
  table("round160", 1260, 1170);
  table("round160", 1570, 1060);
  add("rect250", 1000, 1120, `Mesa ${n++}`, { rotation: 90, seats: 8 });

  const guests: Guest[] = SAMPLE_GUESTS.map(([name, group]) => ({ id: uid("g"), name, group, seat: null }));
  // seat the two families at tables 1 & 2, leave friends/colleagues for the couple to place
  guests.slice(0, 6).forEach((g, i) => (g.seat = { tableId: t1.id, index: i }));
  guests.slice(6, 10).forEach((g, i) => (g.seat = { tableId: t2.id, index: i }));
  guests.unshift(
    { id: uid("g"), name: "Ana (noiva)", group: "Noivos", seat: { tableId: head.id, index: 0 } },
    { id: uid("g"), name: "João (noivo)", group: "Noivos", seat: { tableId: head.id, index: 1 } },
  );

  return { ...plan, items, guests };
}
