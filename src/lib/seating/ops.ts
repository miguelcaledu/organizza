import { KINDS, isTable, newItem } from "./catalog";
import { bounds, computeWarnings, convexOverlap, dist, footprint, pointInPolygon, projectOnSegment, snap, wallAt } from "./geometry";
import { uid } from "./sample";
import type { Door, Guest, ItemKind, Plan, PlanItem, Pt, Room, SeatRef, Space, SpacePlan } from "./types";
import type { Warning } from "./geometry";

// Pure plan transformations used by the editor. Every function returns a new
// object. Guest/seat helpers work on the whole Plan (guests are shared by all
// spaces); layout helpers work on a SpacePlan — one space projected with
// spaceView() and written back with mergeSpace().

type WithSeats = { items: PlanItem[]; guests: Guest[] };

// ── spaces ──────────────────────────────────────────────────────────────

export function spaceView(plan: Plan, spaceId: string): SpacePlan {
  const space = plan.spaces.find((s) => s.id === spaceId) ?? plan.spaces[0];
  const { spaces, ...rest } = plan;
  void spaces;
  return { ...rest, spaceId: space.id, room: space.room, items: plan.items.filter((i) => i.spaceId === space.id) };
}

export function mergeSpace(plan: Plan, view: SpacePlan): Plan {
  return {
    ...plan,
    title: view.title,
    date: view.date,
    settings: view.settings,
    guests: view.guests,
    spaces: plan.spaces.map((s) => (s.id === view.spaceId ? { ...s, room: view.room } : s)),
    items: [...plan.items.filter((i) => i.spaceId !== view.spaceId), ...view.items.map((i) => (i.spaceId === view.spaceId ? i : { ...i, spaceId: view.spaceId }))],
  };
}

export function defaultRoom(w = 1500, h = 1000): Room {
  return {
    outline: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }],
    doors: [{ id: uid("d"), wall: 2, offset: w / 2, width: 180, label: "Entrada" }],
  };
}

export function addSpace(plan: Plan, name: string): { plan: Plan; id: string } {
  const space: Space = { id: uid("s"), name: name.trim().slice(0, 40) || `Espaço ${plan.spaces.length + 1}`, room: defaultRoom() };
  return { plan: { ...plan, spaces: [...plan.spaces, space] }, id: space.id };
}

export function renameSpace(plan: Plan, id: string, name: string): Plan {
  const n = name.trim().slice(0, 40);
  return n ? { ...plan, spaces: plan.spaces.map((s) => (s.id === id ? { ...s, name: n } : s)) } : plan;
}

/** Removes a space with everything in it; guests seated there become unseated (via reconcileGuests). */
export function removeSpace(plan: Plan, id: string): Plan {
  if (plan.spaces.length <= 1) return plan;
  return { ...plan, spaces: plan.spaces.filter((s) => s.id !== id), items: plan.items.filter((i) => i.spaceId !== id) };
}

export function moveSpace(plan: Plan, id: string, dir: -1 | 1): Plan {
  const i = plan.spaces.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= plan.spaces.length) return plan;
  const spaces = [...plan.spaces];
  [spaces[i], spaces[j]] = [spaces[j], spaces[i]];
  return { ...plan, spaces };
}

/** Warnings for every space; prefixed with the space name when there's more than one. */
export function allWarnings(plan: Plan): Warning[] {
  return plan.spaces.flatMap((sp) =>
    computeWarnings(spaceView(plan, sp.id)).map((w) => (plan.spaces.length > 1 ? { ...w, message: `${sp.name}: ${w.message}` } : w)),
  );
}

// ── guests & seats ──────────────────────────────────────────────────────

/** Unassign guests whose table was removed or whose seat no longer exists. */
export function reconcileGuests<P extends WithSeats>(plan: P): { plan: P; dropped: string[] } {
  const seatsByTable = new Map(plan.items.filter(isTable).map((t) => [t.id, t.seats ?? 0]));
  const dropped: string[] = [];
  const guests = plan.guests.map((g) => {
    if (!g.seat) return g;
    const n = seatsByTable.get(g.seat.tableId);
    if (n === undefined || g.seat.index >= n) {
      dropped.push(g.name);
      return { ...g, seat: null };
    }
    return g;
  });
  return dropped.length ? { plan: { ...plan, guests }, dropped } : { plan, dropped };
}

/**
 * Put a guest in a seat. If someone already sits there they swap places with
 * the incoming guest (or become unassigned), so a seat can never hold two
 * guests and a guest can never hold two seats.
 */
export function assignSeat<P extends WithSeats>(plan: P, guestId: string, seat: SeatRef | null): { plan: P; displaced?: string } {
  const guest = plan.guests.find((g) => g.id === guestId);
  if (!guest) return { plan };
  const occupant = seat ? plan.guests.find((g) => g.id !== guestId && g.seat?.tableId === seat.tableId && g.seat.index === seat.index) : undefined;
  const guests = plan.guests.map((g) => {
    if (g.id === guestId) return { ...g, seat };
    if (occupant && g.id === occupant.id) return { ...g, seat: guest.seat };
    return g;
  });
  return { plan: { ...plan, guests }, displaced: occupant && !guest.seat ? occupant.name : undefined };
}

export function seatLabel(plan: { items: PlanItem[] }, seat: SeatRef | null) {
  if (!seat) return null;
  const t = plan.items.find((i) => i.id === seat.tableId);
  return t ? `${t.label} · lugar ${seat.index + 1}` : null;
}

/** Table numbers run across all spaces, so pass every item of the plan. */
export function nextTableLabel(items: PlanItem[]) {
  const nums = items.map((i) => /^Mesa (\d+)$/.exec(i.label)?.[1]).filter(Boolean).map(Number);
  return `Mesa ${nums.length ? Math.max(...nums) + 1 : 1}`;
}

// ── layout (one space) ──────────────────────────────────────────────────

function fitsAt(plan: SpacePlan, cand: PlanItem) {
  const fp = footprint(cand);
  const outline = plan.room.outline;
  if (outline.length >= 3 && !fp.every((p) => pointInPolygon(p, outline))) return false;
  return plan.items.every((o) => o.id === cand.id || !convexOverlap(fp, footprint(o)));
}

/** Search outward from `near` in a spiral for a spot where the item doesn't collide. */
export function findFreeSpot(plan: SpacePlan, item: PlanItem, near: Pt): Pt {
  const step = 40;
  for (let ring = 0; ring < 40; ring++) {
    const count = ring === 0 ? 1 : ring * 8;
    for (let k = 0; k < count; k++) {
      const a = (2 * Math.PI * k) / count;
      const p = { x: snap(near.x + Math.cos(a) * ring * step, 10), y: snap(near.y + Math.sin(a) * ring * step, 10) };
      if (fitsAt(plan, { ...item, ...p })) return p;
    }
  }
  return near;
}

/** `exact` places the item right where it was dropped; otherwise it goes to the nearest free spot. */
export function addItem(plan: SpacePlan, kind: ItemKind, near: Pt, exact = false, allItems: PlanItem[] = plan.items): { plan: SpacePlan; id: string } {
  const label = KINDS[kind].isTable ? nextTableLabel(allItems) : KINDS[kind].short;
  const it = newItem(kind, uid("i"), near, label, plan.spaceId);
  const at = exact ? { x: snap(near.x, 10), y: snap(near.y, 10) } : findFreeSpot(plan, it, near);
  const placed = { ...it, ...at };
  return { plan: { ...plan, items: [...plan.items, placed] }, id: placed.id };
}

export function duplicateItem(plan: SpacePlan, id: string, allItems: PlanItem[] = plan.items): { plan: SpacePlan; id: string } | null {
  const src = plan.items.find((i) => i.id === id);
  if (!src) return null;
  const copy: PlanItem = { ...src, id: uid("i"), label: isTable(src) ? nextTableLabel(allItems) : src.label };
  const at = findFreeSpot(plan, copy, { x: src.x + 60, y: src.y + 60 });
  const placed = { ...copy, ...at };
  return { plan: { ...plan, items: [...plan.items, placed] }, id: placed.id };
}

export function updateItem<P extends { items: PlanItem[] }>(plan: P, id: string, patch: Partial<PlanItem> | ((it: PlanItem) => PlanItem)): P {
  return {
    ...plan,
    items: plan.items.map((it) => (it.id === id ? (typeof patch === "function" ? patch(it) : { ...it, ...patch }) : it)),
  };
}

export function deleteItem<P extends { items: PlanItem[] }>(plan: P, id: string): P {
  return { ...plan, items: plan.items.filter((i) => i.id !== id) };
}

// ── room ────────────────────────────────────────────────────────────────

function clampDoors(outline: Pt[], doors: Door[]): Door[] {
  return doors
    .filter((d) => d.wall < outline.length)
    .map((d) => {
      const [a, b] = wallAt(outline, d.wall);
      const len = dist(a, b);
      const hw = Math.min(d.width / 2, len / 2);
      return { ...d, offset: Math.min(Math.max(d.offset, hw), len - hw) };
    });
}

export function setOutline(plan: SpacePlan, outline: Pt[]): SpacePlan {
  return { ...plan, room: { outline, doors: clampDoors(outline, plan.room.doors) } };
}

/** Replace the whole outline (shape presets), moving each door to the nearest wall of the new shape. */
export function replaceOutline(plan: SpacePlan, outline: Pt[]): SpacePlan {
  const old = plan.room.outline;
  const doors = plan.room.doors.map((d) => {
    const [a, b] = wallAt(old, Math.min(d.wall, old.length - 1));
    const len = dist(a, b) || 1;
    const c = { x: a.x + ((b.x - a.x) * d.offset) / len, y: a.y + ((b.y - a.y) * d.offset) / len };
    let best = { wall: 0, d: Infinity, along: 0 };
    outline.forEach((_, i) => {
      const [p, q] = wallAt(outline, i);
      const pr = projectOnSegment(c, p, q);
      if (pr.d < best.d) best = { wall: i, d: pr.d, along: pr.along };
    });
    return { ...d, wall: best.wall, offset: best.along };
  });
  return { ...plan, room: { outline, doors: clampDoors(outline, doors) } };
}

/** Insert a corner on wall i at the point nearest `at`; doors stay on whichever half they were on. */
export function insertVertex(plan: SpacePlan, wall: number, at: Pt): SpacePlan {
  const { outline, doors } = plan.room;
  const [a, b] = wallAt(outline, wall);
  const { q, along } = projectOnSegment(at, a, b);
  const mid = { x: Math.round(q.x), y: Math.round(q.y) };
  const next = [...outline.slice(0, wall + 1), mid, ...outline.slice(wall + 1)];
  const nextDoors = doors.map((d) => {
    if (d.wall > wall) return { ...d, wall: d.wall + 1 };
    if (d.wall === wall && d.offset > along) return { ...d, wall: wall + 1, offset: d.offset - along };
    return d;
  });
  return { ...plan, room: { outline: next, doors: clampDoors(next, nextDoors) } };
}

export function removeVertex(plan: SpacePlan, index: number): SpacePlan {
  const { outline, doors } = plan.room;
  if (outline.length <= 3) return plan;
  const next = outline.filter((_, i) => i !== index);
  const n = outline.length;
  // walls (index-1) and (index) merge into (index-1)
  const prevWall = (index - 1 + n) % n;
  const nextDoors = doors.map((d) => {
    let wall = d.wall;
    if (wall === index) wall = prevWall;
    else if (wall > index) wall -= 1;
    return { ...d, wall: Math.min(wall, next.length - 1) };
  });
  return { ...plan, room: { outline: next, doors: clampDoors(next, nextDoors) } };
}

/** Stretch the room outline so its bounding box is w × h, keeping its shape. */
export function resizeRoom(plan: SpacePlan, w: number, h: number): SpacePlan {
  const b = bounds(plan.room.outline);
  const sx = b.w ? w / b.w : 1;
  const sy = b.h ? h / b.h : 1;
  const outline = plan.room.outline.map((p) => ({ x: Math.round(b.minX + (p.x - b.minX) * sx), y: Math.round(b.minY + (p.y - b.minY) * sy) }));
  // keep doors at the same relative position along their wall
  const doors = plan.room.doors.map((d) => {
    const [a0, b0] = wallAt(plan.room.outline, d.wall);
    const [a1, b1] = wallAt(outline, d.wall);
    const l0 = dist(a0, b0) || 1;
    return { ...d, offset: (d.offset / l0) * dist(a1, b1) };
  });
  return { ...plan, room: { outline, doors: clampDoors(outline, doors) } };
}

export function moveDoorTo(plan: SpacePlan, doorId: string, wall: number, offset: number): SpacePlan {
  const doors = plan.room.doors.map((d) => (d.id === doorId ? { ...d, wall, offset } : d));
  return { ...plan, room: { ...plan.room, doors: clampDoors(plan.room.outline, doors) } };
}

export function addDoor(plan: SpacePlan): SpacePlan {
  const { outline } = plan.room;
  if (outline.length < 2) return plan;
  // put it on the longest wall
  let wall = 0, best = 0;
  outline.forEach((_, i) => {
    const [a, b] = wallAt(outline, i);
    if (dist(a, b) > best) { best = dist(a, b); wall = i; }
  });
  const door: Door = { id: uid("d"), wall, offset: best / 2, width: 160, label: `Porta ${plan.room.doors.length + 1}` };
  return { ...plan, room: { ...plan.room, doors: clampDoors(outline, [...plan.room.doors, door]) } };
}

export function stats(plan: Plan) {
  const tables = plan.items.filter(isTable);
  const seats = tables.reduce((n, t) => n + (t.seats ?? 0), 0);
  const seated = plan.guests.filter((g) => g.seat).length;
  return { tables: tables.length, seats, guests: plan.guests.length, seated, unseated: plan.guests.length - seated, warnings: allWarnings(plan).length };
}
