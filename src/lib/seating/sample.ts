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

export function blankPlan(title: string, date?: string, spaceName = "Sala"): Plan {
  return {
    version: 2,
    title,
    date,
    spaces: [
      {
        id: uid("s"),
        name: spaceName,
        room: {
          outline: rectOutline(2000, 1400),
          doors: [{ id: uid("d"), wall: 2, offset: 1000, width: 180, label: "Entrada principal" }],
        },
      },
    ],
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
 * Two spaces: a 16 × 12 m cocktail area (lounges, stage, photo booth) and an
 * 82-seat 20 × 14 m dinner room loosely following the reference "cheat
 * sheet": head table at the top, family closest, friends further out.
 */
export function samplePlan(title: string, date?: string): Plan {
  const plan = blankPlan(title, date, "Jantar");
  const dinner = plan.spaces[0];
  const cocktail = {
    id: uid("s"),
    name: "Cocktail",
    room: { outline: rectOutline(1600, 1200), doors: [{ id: uid("d"), wall: 2, offset: 800, width: 180, label: "Entrada" }] },
  };
  const items: PlanItem[] = [];
  let spaceId = cocktail.id;
  const add = (kind: PlanItem["kind"], x: number, y: number, label: string, patch: Partial<PlanItem> = {}) => {
    const it = { ...newItem(kind, uid("i"), { x, y }, label, spaceId), ...patch };
    items.push(it);
    return it;
  };

  // ── cocktail ──
  add("stage", 800, 165, "Palco", { w: 400, h: 250 });
  add("decor", 540, 100, "Arranjo floral");
  add("decor", 1060, 100, "Arranjo floral");
  add("bar", 1530, 400, "Bar", { w: 300, h: 70, rotation: 90 });
  add("sofa", 300, 300, "Sofá");
  // armchairs face each other across the lounge (backrest = local top edge)
  add("armchair", 160, 450, "Poltrona", { rotation: 270 });
  add("armchair", 440, 450, "Poltrona", { rotation: 90 });
  add("decor", 80, 80, "Planta", { w: 70, h: 70 });
  add("sofa", 1250, 1100, "Sofá", { rotation: 180 });
  add("armchair", 1100, 950, "Poltrona", { rotation: 270 });
  add("armchair", 1400, 950, "Poltrona", { rotation: 90 });
  add("photobooth", 200, 1030, "Photobooth");

  // ── dinner ──
  spaceId = dinner.id;

  const head = add("rect250", 1000, 160, "Mesa dos noivos", { seats: 2, seatSides: "one" });
  add("danceFloor", 1000, 560, "Pista de dança", { w: 600, h: 400 });
  add("dj", 1000, 860, "DJ", { w: 200, h: 80 });
  add("bar", 1890, 700, "Bar", { w: 300, h: 70, rotation: 90 });
  add("buffet", 110, 700, "Buffet", { w: 300, h: 80, rotation: 90 });

  let n = 1;
  const table = (kind: PlanItem["kind"], x: number, y: number) => add(kind, x, y, `Mesa ${n++}`);
  const t1 = table("round180", 430, 280);
  const t2 = table("round180", 1570, 280);
  table("round180", 430, 740);
  table("round180", 1570, 740);
  table("round160", 430, 1060);
  table("round160", 740, 1170);
  table("round160", 1260, 1170);
  table("round160", 1570, 1060);
  add("rect250", 1000, 1120, `Mesa ${n++}`, { rotation: 90, seats: 8 });
  add("cakeTable", 1350, 170, "Bolo");

  const guests: Guest[] = SAMPLE_GUESTS.map(([name, group]) => ({ id: uid("g"), name, group, seat: null }));
  // seat the two families at tables 1 & 2, leave friends/colleagues for the couple to place
  guests.slice(0, 6).forEach((g, i) => (g.seat = { tableId: t1.id, index: i }));
  guests.slice(6, 10).forEach((g, i) => (g.seat = { tableId: t2.id, index: i }));
  guests.unshift(
    { id: uid("g"), name: "Ana (noiva)", group: "Noivos", seat: { tableId: head.id, index: 0 } },
    { id: uid("g"), name: "João (noivo)", group: "Noivos", seat: { tableId: head.id, index: 1 } },
  );

  return { ...plan, spaces: [cocktail, dinner], items, guests };
}
