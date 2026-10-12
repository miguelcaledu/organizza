"use client";

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { KINDS, RECT_WIDTH_MAX, RECT_WIDTH_MIN, toLocal } from "@/lib/seating/catalog";
import { bounds, projectOnSegment, snap, wallAt } from "@/lib/seating/geometry";
import { insertVertex, moveDoorTo, removeVertex, setOutline, updateItem } from "@/lib/seating/ops";
import type { ChangeHighlights } from "@/lib/seating/clientEdits";
import type { Pt, SeatRef, SpacePlan } from "@/lib/seating/types";
import { PlanDrawing } from "./PlanDrawing";

export interface CanvasHandle {
  fit(): void;
  /** world point at the centre of the visible area */
  center(): Pt;
  zoomBy(f: number): void;
  /** world point under a screen position, or null when it's outside the canvas */
  worldAt(clientX: number, clientY: number): Pt | null;
}

type View = { zoom: number; panX: number; panY: number };

type Gesture =
  | { type: "pan"; start: Pt; pan: Pt; moved: boolean; slop?: number }
  | { type: "pinch"; d0: number; zoom0: number; mid0: Pt; pan0: Pt }
  | { type: "item"; id: string; start: Pt; origin: Pt; moved: boolean; seat?: SeatRef; slop: number }
  | { type: "rotate"; id: string }
  | { type: "resize"; id: string }
  | { type: "width"; id: string }
  | { type: "vertex"; index: number }
  | { type: "door"; id: string };

const MIN_ZOOM = 0.04;
const MAX_ZOOM = 4;
const TAP_SLOP = 4; // px before a press becomes a drag
const TOUCH_SLOP = 10; // fingers wobble more

export function FloorCanvas({
  ref,
  plan,
  mode,
  readOnly,
  selectedId,
  warnIds,
  seatTargets,
  hoverSeat,
  handleScale = 1,
  highlights,
  onSelect,
  onChange,
  onGestureEnd,
  onSeatTap,
}: {
  ref?: Ref<CanvasHandle>;
  plan: SpacePlan;
  mode: "items" | "room";
  readOnly?: boolean;
  selectedId: string | null;
  warnIds: Set<string>;
  seatTargets?: boolean;
  hoverSeat?: string | null;
  handleScale?: number;
  highlights?: ChangeHighlights;
  onSelect: (id: string | null) => void;
  onChange?: (plan: SpacePlan, transient: boolean) => void;
  onGestureEnd?: () => void;
  onSeatTap?: (seat: SeatRef) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ zoom: 0.4, panX: 40, panY: 40 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const viewRef = useRef(view);
  const planRef = useRef(plan);
  useLayoutEffect(() => {
    viewRef.current = view;
    planRef.current = plan;
  });
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<Gesture | null>(null);
  const fitted = useRef(false);

  const toWorldPt = useCallback((clientX: number, clientY: number): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    const v = viewRef.current;
    return { x: (clientX - r.left - v.panX) / v.zoom, y: (clientY - r.top - v.panY) / v.zoom };
  }, []);

  const fit = useCallback(() => {
    const el = wrapRef.current;
    const outline = planRef.current.room.outline;
    const pts = [...outline, ...planRef.current.items.map((i) => ({ x: i.x, y: i.y }))];
    if (!el || !pts.length) return;
    const b = bounds(pts);
    const pad = 70;
    const w = el.clientWidth, h = el.clientHeight;
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min((w - pad * 2) / Math.max(b.w, 100), (h - pad * 2) / Math.max(b.h, 100))));
    setView({ zoom, panX: (w - b.w * zoom) / 2 - b.minX * zoom, panY: (h - b.h * zoom) / 2 - b.minY * zoom });
  }, []);

  const zoomAt = useCallback((factor: number, sx: number, sy: number) => {
    setView((v) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor));
      const k = zoom / v.zoom;
      return { zoom, panX: sx - (sx - v.panX) * k, panY: sy - (sy - v.panY) * k };
    });
  }, []);

  useImperativeHandle(ref, () => ({
    fit,
    center() {
      const el = wrapRef.current!;
      const v = viewRef.current;
      return { x: (el.clientWidth / 2 - v.panX) / v.zoom, y: (el.clientHeight / 2 - v.panY) / v.zoom };
    },
    zoomBy(f) {
      const el = wrapRef.current!;
      zoomAt(f, el.clientWidth / 2, el.clientHeight / 2);
    },
    worldAt(clientX, clientY) {
      const r = svgRef.current?.getBoundingClientRect();
      if (!r || clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
      return toWorldPt(clientX, clientY);
    },
  }), [fit, zoomAt, toWorldPt]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
      if (!fitted.current && el.clientWidth > 0) {
        fitted.current = true;
        fit();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  // non-passive wheel: ctrl/⌘ + wheel (and trackpad pinch) zooms, plain wheel pans
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top);
      } else {
        setView((v) => ({ ...v, panX: v.panX - e.deltaX, panY: v.panY - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const editable = !readOnly && !!onChange;
  const s = (v: number) => (plan.settings.snap ? snap(v, plan.settings.snapStep) : Math.round(v));

  function startPinch() {
    const [a, b] = [...pointers.current.values()];
    const r = svgRef.current!.getBoundingClientRect();
    const v = viewRef.current;
    gesture.current = {
      type: "pinch",
      d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      zoom0: v.zoom,
      mid0: { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top },
      pan0: { x: v.panX, y: v.panY },
    };
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    try {
      svgRef.current!.setPointerCapture(e.pointerId);
    } catch {
      // pointer already gone (e.g. released mid-frame) — the gesture still works without capture
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      if (gesture.current && gesture.current.type !== "pan" && gesture.current.type !== "pinch") onGestureEnd?.();
      startPinch();
      return;
    }
    if (pointers.current.size > 2) return;

    const target = e.target as Element;
    const w = toWorldPt(e.clientX, e.clientY);
    const p = planRef.current;
    const handle = target.closest("[data-handle]")?.getAttribute("data-handle");
    const vertex = target.closest("[data-vertex]")?.getAttribute("data-vertex");
    const mid = target.closest("[data-mid]")?.getAttribute("data-mid");
    const door = target.closest("[data-door]")?.getAttribute("data-door");
    const itemId = target.closest("[data-item]")?.getAttribute("data-item");
    const seatAttr = target.closest("[data-seat]")?.getAttribute("data-seat");
    const seat = seatAttr ? { tableId: seatAttr.split(":")[0], index: Number(seatAttr.split(":")[1]) } : undefined;

    if (editable && mode === "room") {
      if (vertex != null) {
        gesture.current = { type: "vertex", index: Number(vertex) };
        return;
      }
      if (mid != null) {
        const next = insertVertex(p, Number(mid), w);
        onChange!(next, true);
        gesture.current = { type: "vertex", index: Number(mid) + 1 };
        return;
      }
      if (door) {
        gesture.current = { type: "door", id: door };
        return;
      }
    }
    if (editable && mode === "items" && handle && selectedId) {
      gesture.current = { type: handle === "rotate" ? "rotate" : handle === "width" ? "width" : "resize", id: selectedId };
      return;
    }
    if (itemId && mode === "items") {
      onSelect(itemId);
      const it = p.items.find((i) => i.id === itemId)!;
      gesture.current = { type: "item", id: itemId, start: w, origin: { x: it.x, y: it.y }, moved: false, seat, slop: e.pointerType === "touch" ? TOUCH_SLOP : TAP_SLOP };
      return;
    }
    gesture.current = {
      type: "pan",
      start: { x: e.clientX, y: e.clientY },
      pan: { x: viewRef.current.panX, y: viewRef.current.panY },
      moved: false,
      slop: e.pointerType === "touch" ? TOUCH_SLOP : TAP_SLOP,
    };
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const p = planRef.current;

    if (g.type === "pinch") {
      const [a, b] = [...pointers.current.values()];
      if (!b) return;
      const r = svgRef.current!.getBoundingClientRect();
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (g.zoom0 * d) / g.d0));
      const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
      const k = zoom / g.zoom0;
      setView({ zoom, panX: mid.x - (g.mid0.x - g.pan0.x) * k, panY: mid.y - (g.mid0.y - g.pan0.y) * k });
      return;
    }
    if (g.type === "pan") {
      const dx = e.clientX - g.start.x, dy = e.clientY - g.start.y;
      if (Math.hypot(dx, dy) > (g.slop ?? TAP_SLOP)) g.moved = true;
      setView((v) => ({ ...v, panX: g.pan.x + dx, panY: g.pan.y + dy }));
      return;
    }
    if (!editable) {
      // read-only: dragging anywhere (even on a table) pans the view
      if (g.type === "item") {
        gesture.current = { type: "pan", start: { x: e.clientX, y: e.clientY }, pan: { x: viewRef.current.panX, y: viewRef.current.panY }, moved: true };
      }
      return;
    }
    const w = toWorldPt(e.clientX, e.clientY);

    if (g.type === "item") {
      const z = viewRef.current.zoom;
      if (!g.moved && Math.hypot(w.x - g.start.x, w.y - g.start.y) * z < g.slop) return;
      g.moved = true;
      onChange!(updateItem(p, g.id, { x: s(g.origin.x + w.x - g.start.x), y: s(g.origin.y + w.y - g.start.y) }), true);
    } else if (g.type === "rotate") {
      const it = p.items.find((i) => i.id === g.id);
      if (!it) return;
      let a = (Math.atan2(w.y - it.y, w.x - it.x) * 180) / Math.PI + 90;
      if (p.settings.snap || e.shiftKey) a = Math.round(a / 15) * 15;
      onChange!(updateItem(p, g.id, { rotation: ((Math.round(a) % 360) + 360) % 360 }), true);
    } else if (g.type === "resize") {
      const it = p.items.find((i) => i.id === g.id);
      if (!it) return;
      const spec = KINDS[it.kind];
      const l = toLocal(it, w);
      const clamp = (v: number) => Math.min(spec.maxSize ?? 2000, Math.max(spec.minSize ?? 50, s(v)));
      if (spec.round) {
        const d = clamp(Math.max(Math.abs(l.x), Math.abs(l.y)) * 2);
        onChange!(updateItem(p, g.id, { w: d, h: d }), true);
      } else {
        onChange!(updateItem(p, g.id, { w: clamp(Math.abs(l.x) * 2), h: clamp(Math.abs(l.y) * 2) }), true);
      }
    } else if (g.type === "width") {
      const it = p.items.find((i) => i.id === g.id);
      if (!it) return;
      const l = toLocal(it, w);
      onChange!(updateItem(p, g.id, { h: Math.min(RECT_WIDTH_MAX, Math.max(RECT_WIDTH_MIN, s(Math.abs(l.y) * 2))) }), true);
    } else if (g.type === "vertex") {
      const outline = p.room.outline.map((pt, i) => (i === g.index ? { x: s(w.x), y: s(w.y) } : pt));
      onChange!(setOutline(p, outline), true);
    } else if (g.type === "door") {
      const outline = p.room.outline;
      let best = { wall: 0, d: Infinity, along: 0 };
      outline.forEach((_, i) => {
        const [a, b] = wallAt(outline, i);
        const pr = projectOnSegment(w, a, b);
        if (pr.d < best.d) best = { wall: i, d: pr.d, along: pr.along };
      });
      onChange!(moveDoorTo(p, g.id, best.wall, s(best.along)), true);
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (g.type === "pinch") {
      // drop back to panning with the remaining finger
      const rest = [...pointers.current.values()][0];
      gesture.current = rest ? { type: "pan", start: rest, pan: { x: viewRef.current.panX, y: viewRef.current.panY }, moved: true } : null;
      return;
    }
    if (pointers.current.size > 0) return;
    gesture.current = null;
    if (g.type === "pan") {
      if (!g.moved) onSelect(null);
      return;
    }
    if (g.type === "item" && !g.moved) {
      if (g.seat) onSeatTap?.(g.seat);
      return;
    }
    onGestureEnd?.();
  }

  function onDoubleClick(e: React.MouseEvent) {
    if (!editable || mode !== "room") return;
    const v = (e.target as Element).closest("[data-vertex]")?.getAttribute("data-vertex");
    if (v != null && planRef.current.room.outline.length > 3) onChange!(removeVertex(planRef.current, Number(v)), false);
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-[#F5F2EC]">
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="block touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <g transform={`translate(${view.panX} ${view.panY}) scale(${view.zoom})`}>
          <PlanDrawing
            plan={plan}
            mode={mode}
            zoom={view.zoom}
            selectedId={selectedId}
            warnIds={warnIds}
            seatTargets={seatTargets}
            hoverSeat={hoverSeat}
            handleScale={handleScale}
            layoutEditable={editable}
            highlights={highlights}
          />
        </g>
      </svg>
      <ScaleBar zoom={view.zoom} />
    </div>
  );
}

function ScaleBar({ zoom }: { zoom: number }) {
  // pick a round length that renders at roughly 60–140 px
  const options = [50, 100, 200, 500, 1000, 2000];
  const cm = options.find((c) => c * zoom >= 60) ?? 2000;
  return (
    <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col items-end gap-1 rounded bg-surface/85 px-2 py-1.5 text-[10px] text-ink-soft shadow-sm">
      <span>{cm >= 100 ? `${cm / 100} m` : `${cm} cm`}</span>
      <div className="h-1.5 border-x border-b border-ink-soft" style={{ width: cm * zoom }} />
    </div>
  );
}
