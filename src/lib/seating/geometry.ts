import { CHAIR_ZONE, isTable, seatGeometry, toWorld } from "./catalog";
import type { Door, Plan, PlanItem, Pt } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Polygon helpers + layout warnings. Every item footprint is a convex polygon
// (round tables are approximated by a 24-gon), so overlap is a plain SAT test.
// ─────────────────────────────────────────────────────────────────────────

const EPS = 1; // cm of tolerance — touching edges are fine

export function bounds(pts: Pt[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export function signedArea(pts: Pt[]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function wallAt(outline: Pt[], i: number): [Pt, Pt] {
  return [outline[i], outline[(i + 1) % outline.length]];
}

export function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function projectOnSegment(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  const q = { x: a.x + t * dx, y: a.y + t * dy };
  return { t, q, d: dist(p, q), along: t * Math.sqrt(len2) };
}

function pointOnBoundary(p: Pt, poly: Pt[]) {
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = wallAt(poly, i);
    if (projectOnSegment(p, a, b).d <= EPS) return true;
  }
  return false;
}

/** inclusive of the boundary (with tolerance) */
export function pointInPolygon(p: Pt, poly: Pt[], strict = false): boolean {
  if (pointOnBoundary(p, poly)) return !strict;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function project(poly: Pt[], ax: Pt) {
  let min = Infinity, max = -Infinity;
  for (const p of poly) {
    const v = p.x * ax.x + p.y * ax.y;
    min = Math.min(min, v); max = Math.max(max, v);
  }
  return [min, max];
}

/** SAT test for two convex polygons; true only when they overlap by more than EPS */
export function convexOverlap(a: Pt[], b: Pt[]): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      const ax = { x: -(q.y - p.y) / len, y: (q.x - p.x) / len };
      const [aMin, aMax] = project(a, ax);
      const [bMin, bMax] = project(b, ax);
      if (aMax <= bMin + EPS || bMax <= aMin + EPS) return false;
    }
  }
  return true;
}

function circlePoly(r: number, n = 24): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    // rounded so server and client renders agree (trig output can differ in the last bits)
    return { x: Math.round(r * Math.cos(a) * 100) / 100, y: Math.round(r * Math.sin(a) * 100) / 100 };
  });
}

/** Local-space footprint including the space chairs need. */
export function localFootprint(item: PlanItem): Pt[] {
  const hasSeats = isTable(item) && (item.seats ?? 0) > 0;
  if (item.kind === "round160" || item.kind === "round180") {
    return circlePoly(item.w / 2 + (hasSeats ? CHAIR_ZONE : 0));
  }
  let left = -item.w / 2, right = item.w / 2, top = -item.h / 2, bottom = item.h / 2;
  if (item.kind === "rect250" && hasSeats) {
    const seats = seatGeometry(item);
    top -= CHAIR_ZONE;
    if (seats.some((s) => s.out === 90)) bottom += CHAIR_ZONE;
    if (seats.some((s) => s.out === 0)) right += CHAIR_ZONE;
    if (seats.some((s) => s.out === 180)) left -= CHAIR_ZONE;
  }
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

export function footprint(item: PlanItem): Pt[] {
  return localFootprint(item).map((p) => toWorld(item, p));
}

/** Door clearance zone: the door width × 1 m into the room. */
export function doorZone(outline: Pt[], door: Door): Pt[] {
  const [a, b] = wallAt(outline, door.wall);
  const len = dist(a, b) || 1;
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
  // inward normal depends on winding: SVG is y-down, so a positive signed area is clockwise on screen
  const sign = signedArea(outline) > 0 ? 1 : -1;
  const nx = -uy * sign, ny = ux * sign;
  const c = { x: a.x + ux * door.offset, y: a.y + uy * door.offset };
  const hw = door.width / 2, depth = 100;
  return [
    { x: c.x - ux * hw, y: c.y - uy * hw },
    { x: c.x + ux * hw, y: c.y + uy * hw },
    { x: c.x + ux * hw + nx * depth, y: c.y + uy * hw + ny * depth },
    { x: c.x - ux * hw + nx * depth, y: c.y - uy * hw + ny * depth },
  ];
}

export function doorInward(outline: Pt[], door: Door) {
  const [a, b] = wallAt(outline, door.wall);
  const len = dist(a, b) || 1;
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
  const sign = signedArea(outline) > 0 ? 1 : -1;
  return { center: { x: a.x + ux * door.offset, y: a.y + uy * door.offset }, u: { x: ux, y: uy }, n: { x: -uy * sign, y: ux * sign } };
}

function insideRoom(fp: Pt[], outline: Pt[]) {
  if (!fp.every((p) => pointInPolygon(p, outline))) return false;
  // a concave room corner can poke into the footprint even if all its vertices are inside
  if (outline.some((p) => pointInPolygon(p, fp, true))) return false;
  return true;
}

export type Warning =
  | { kind: "outside"; itemIds: [string]; message: string }
  | { kind: "overlap"; itemIds: [string, string]; message: string }
  | { kind: "door"; itemIds: [string]; message: string };

export function computeWarnings(plan: Plan): Warning[] {
  const out: Warning[] = [];
  const outline = plan.room.outline;
  const fps = plan.items.map((it) => ({ it, fp: footprint(it) }));
  for (const { it, fp } of fps) {
    if (outline.length >= 3 && !insideRoom(fp, outline)) {
      out.push({ kind: "outside", itemIds: [it.id], message: `${it.label} sai fora dos limites da sala` });
    }
  }
  for (let i = 0; i < fps.length; i++) {
    for (let j = i + 1; j < fps.length; j++) {
      if (convexOverlap(fps[i].fp, fps[j].fp)) {
        const a = fps[i].it, b = fps[j].it;
        out.push({ kind: "overlap", itemIds: [a.id, b.id], message: `${a.label} sobrepõe-se a ${b.label}` });
      }
    }
  }
  if (outline.length >= 3) {
    for (const door of plan.room.doors) {
      if (door.wall >= outline.length) continue;
      const zone = doorZone(outline, door);
      for (const { it, fp } of fps) {
        if (convexOverlap(zone, fp)) {
          out.push({ kind: "door", itemIds: [it.id], message: `${it.label} bloqueia a passagem de “${door.label}”` });
        }
      }
    }
  }
  return out;
}

export function snap(v: number, step: number) {
  return Math.round(v / step) * step;
}
