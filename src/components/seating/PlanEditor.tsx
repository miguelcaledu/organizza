"use client";

import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { KINDS, PALETTE, isTable } from "@/lib/seating/catalog";
import { computeWarnings } from "@/lib/seating/geometry";
import { addItem, addSpace, allWarnings, assignSeat, deleteItem, duplicateItem, mergeSpace, moveSpace, reconcileGuests, removeSpace, renameSpace, seatLabel, spaceView, stats, updateItem } from "@/lib/seating/ops";
import type { Guest, ItemKind, Plan, SeatRef, SpacePlan } from "@/lib/seating/types";
import { FloorCanvas, type CanvasHandle } from "./FloorCanvas";
import { useRouter } from "next/navigation";
import { markReviewedAction } from "@/app/(app)/plantas/actions";
import { highlightsFrom, type PlanChange } from "@/lib/seating/clientEdits";
import { ChangeLegend, ChangesPanel, GuestsPanel, ItemPanel, RoomPanel, TablesOverview, WarningsPanel } from "./Panels";
import { PrintSheet } from "./PrintSheet";
import { SignOutButton } from "./ClientAuth";
import { SpacesBar } from "./SpacesBar";
import { MaterialPanel } from "./MaterialPanels";
import { DEFAULT_MATERIALS } from "@/lib/seating/materials";
import { Btn, CommitInput, I } from "./ui";

type Tab = "room" | "item" | "guests" | "warnings" | "tables" | "changes" | "material";
type SaveState = "saved" | "dirty" | "saving" | "error" | "signedOut";
type MobileTab = "plan" | "room" | "tables" | "guests";

const HISTORY_LIMIT = 100;
const NO_WARNINGS = new Set<string>();

function useIsMobile() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

function useCoarsePointer() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

export interface EditorViewer {
  name: string;
  email: string;
  /** Organizza staff (vs. the couple) */
  staff: boolean;
}

export function PlanEditor({
  initial,
  planId,
  viewToken,
  viewer,
  changes,
  readOnly = false,
}: {
  initial: Plan;
  /** set when editing; the read-only link has none */
  planId?: string;
  viewToken: string;
  viewer?: EditorViewer;
  /** staff only: the client's change log, newest first */
  changes?: PlanChange[];
  readOnly?: boolean;
}) {
  const [plan, setPlan] = useState(initial);
  const planRef = useRef(plan);
  useLayoutEffect(() => {
    planRef.current = plan;
  });
  const past = useRef<Plan[]>([]);
  const future = useRef<Plan[]>([]);
  const gestureBase = useRef<Plan | null>(null);
  const [hist, setHist] = useState({ undo: 0, redo: 0 });
  const syncHist = useCallback(() => setHist({ undo: past.current.length, redo: future.current.length }), []);
  const canvas = useRef<CanvasHandle>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(readOnly ? "tables" : "guests");
  const [panelOpen, setPanelOpen] = useState(true);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ guest: Guest; x: number; y: number; active: boolean } | null>(null);
  const [hoverSeat, setHoverSeat] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [mobileTab, setMobileTab] = useState<MobileTab>("plan");
  const isMobile = useIsMobile();
  // Staff ("masters") edit everything. The couple may only manage guests and the
  // number of seats per table — the server enforces the same rule on save.
  const staff = !readOnly && !!viewer?.staff;
  const router = useRouter();
  const highlights = useMemo(() => (staff ? highlightsFrom(changes ?? []) : undefined), [staff, changes]);
  const pendingChanges = staff ? (changes ?? []).filter((c) => !c.reviewed_at).length : 0;
  const [reviewing, startReview] = useTransition();
  const markReviewed = () =>
    planId &&
    startReview(async () => {
      await markReviewedAction(planId);
      router.refresh();
    });
  const coarse = useCoarsePointer();
  const [paletteDrag, setPaletteDrag] = useState<{ kind: ItemKind; x: number; y: number; over: boolean } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // the space (Cocktail, Jantar…) currently shown; layout tools work on this projection
  const [spaceId, setSpaceId] = useState(() => (initial.spaces.find((sp) => initial.items.some((i) => i.spaceId === sp.id && isTable(i))) ?? initial.spaces[0]).id);
  const view = useMemo(() => spaceView(plan, spaceId), [plan, spaceId]);
  const activeSpace = view.spaceId;
  const warnings = useMemo(() => computeWarnings(view), [view]);
  const allWarns = useMemo(() => allWarnings(plan), [plan]);
  const warnIds = useMemo(() => new Set(warnings.flatMap((w) => w.itemIds as string[])), [warnings]);
  const s = useMemo(() => stats(plan), [plan]);
  const selected = view.items.find((i) => i.id === selectedId) ?? null;
  const roomMode = staff && !isMobile && tab === "room";

  const notify = useCallback((msg: string) => setToast({ msg, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  // ── history ────────────────────────────────────────────────────────────
  const commit = useCallback(
    (next: Plan) => {
      if (readOnly) return;
      const { plan: rec, dropped } = reconcileGuests(next);
      past.current.push(gestureBase.current ?? planRef.current);
      if (past.current.length > HISTORY_LIMIT) past.current.shift();
      gestureBase.current = null;
      future.current = [];
      planRef.current = rec;
      setPlan(rec);
      syncHist();
      if (dropped.length) notify(`${dropped.length === 1 ? dropped[0] + " ficou" : dropped.length + " convidados ficaram"} sem lugar.`);
    },
    [readOnly, notify, syncHist],
  );

  const commitView = useCallback((next: SpacePlan) => commit(mergeSpace(planRef.current, next)), [commit]);

  const onCanvasChange = useCallback(
    (nextView: SpacePlan, transient: boolean) => {
      const next = mergeSpace(planRef.current, nextView);
      if (!transient) return commit(next);
      if (!gestureBase.current) gestureBase.current = planRef.current;
      planRef.current = next;
      setPlan(next);
    },
    [commit],
  );

  const onGestureEnd = useCallback(() => {
    if (!gestureBase.current) return;
    past.current.push(gestureBase.current);
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    gestureBase.current = null;
    future.current = [];
    syncHist();
  }, [syncHist]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(planRef.current);
    planRef.current = prev;
    setPlan(prev);
    syncHist();
  }, [syncHist]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(planRef.current);
    planRef.current = next;
    setPlan(next);
    syncHist();
  }, [syncHist]);

  // ── autosave ───────────────────────────────────────────────────────────
  const version = useRef(0);
  const savedVersion = useRef(0);
  const save = useCallback(async () => {
    if (!planId) return;
    const v = version.current;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(planRef.current) });
      if (res.status === 401) return setSaveState("signedOut");
      if (!res.ok) throw new Error(String(res.status));
      savedVersion.current = Math.max(savedVersion.current, v);
      setSaveState(version.current === v ? "saved" : "dirty");
    } catch {
      setSaveState("error");
    }
  }, [planId]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (readOnly || !planId) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    version.current += 1;
    setSaveState("dirty");
    const t = setTimeout(save, 900);
    return () => clearTimeout(t);
  }, [plan, readOnly, planId, save]);

  useEffect(() => {
    if (readOnly || !planId) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      if (savedVersion.current >= version.current) return;
      // best effort flush, plus the browser's "leave site?" prompt
      fetch(`/api/plans/${planId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(planRef.current), keepalive: true }).catch(() => {});
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [readOnly, planId]);

  // ── actions ────────────────────────────────────────────────────────────
  function select(id: string | null) {
    const owner = id ? planRef.current.items.find((i) => i.id === id)?.spaceId : undefined;
    if (owner && owner !== activeSpace) setSpaceId(owner);
    setSelectedId(id);
    if (id && staff && (tab === "warnings" || tab === "room")) setTab("item");
    if (id && !readOnly && !staff && tab !== "guests") setTab("item");
    if (id && readOnly) {
      setTab("tables");
      requestAnimationFrame(() => document.getElementById(`table-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    }
  }

  const assign = useCallback(
    (guestId: string, seat: SeatRef | null) => {
      const { plan: next, displaced } = assignSeat(planRef.current, guestId, seat);
      commit(next);
      const g = next.guests.find((x) => x.id === guestId);
      if (displaced) notify(`${displaced} ficou por sentar (lugar ocupado por ${g?.name}).`);
      else if (seat && g) notify(`${g.name} → ${seatLabel(next, seat)}`);
    },
    [commit, notify],
  );

  function onSeatTap(seat: SeatRef) {
    if (readOnly || !pickedId) return;
    assign(pickedId, seat);
    setPickedId(null);
  }

  function add(kind: ItemKind, dropAt?: { x: number; y: number }) {
    const at = dropAt ?? canvas.current?.center() ?? { x: 500, y: 500 };
    const doc = planRef.current;
    const { plan: next, id } = addItem(spaceView(doc, activeSpace), kind, at, !!dropAt, doc.items);
    commitView(next);
    setSelectedId(id);
    setTab("item");
  }

  // palette → canvas drag. A tap (no movement) adds the item in the nearest free spot instead.
  function startPaletteDrag(kind: ItemKind, e: React.PointerEvent) {
    if (roomMode) return;
    if (e.pointerType === "mouse") e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let active = false;
    const move = (ev: PointerEvent) => {
      if (!active && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 8) return;
      active = true;
      setPaletteDrag({ kind, x: ev.clientX, y: ev.clientY, over: !!canvas.current?.worldAt(ev.clientX, ev.clientY) });
    };
    const done = (ev: PointerEvent, cancelled: boolean) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      setPaletteDrag(null);
      if (cancelled) return; // e.g. the palette strip scrolled sideways instead
      if (!active) return add(kind);
      const w = canvas.current?.worldAt(ev.clientX, ev.clientY);
      if (w) add(kind, w);
    };
    const up = (ev: PointerEvent) => done(ev, false);
    const cancel = (ev: PointerEvent) => done(ev, true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  }

  function duplicate() {
    if (!selectedId) return;
    const doc = planRef.current;
    const r = duplicateItem(spaceView(doc, activeSpace), selectedId, doc.items);
    if (r) {
      commitView(r.plan);
      setSelectedId(r.id);
    }
  }

  function remove() {
    if (!selectedId) return;
    commit(deleteItem(planRef.current, selectedId));
    setSelectedId(null);
  }

  // guest → seat drag (pointer based so it works with touch too)
  function startGuestDrag(guest: Guest, e: React.PointerEvent) {
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let active = false;
    const seatAt = (x: number, y: number) => document.elementFromPoint(x, y)?.closest("[data-seat]")?.getAttribute("data-seat") ?? null;
    const move = (ev: PointerEvent) => {
      if (!active && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) return;
      active = true;
      setDrag({ guest, x: ev.clientX, y: ev.clientY, active: true });
      setHoverSeat(seatAt(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setDrag(null);
      setHoverSeat(null);
      if (!active) {
        setPickedId((p) => (p === guest.id ? null : guest.id));
        return;
      }
      const key = seatAt(ev.clientX, ev.clientY);
      if (key) {
        const [tableId, idx] = key.split(":");
        assign(guest.id, { tableId, index: Number(idx) });
        setPickedId(null);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  // keyboard shortcuts
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (readOnly) return;
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable]")) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
      return;
    }
    if (e.key === "Escape") {
      setPickedId(null);
      setSelectedId(null);
      return;
    }
    if (!staff || !selectedId) return;
    const p = planRef.current;
    const it = p.items.find((i) => i.id === selectedId);
    if (!it) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove();
    } else if (mod && e.key.toLowerCase() === "d") {
      e.preventDefault();
      duplicate();
    } else if (e.key.toLowerCase() === "r" && !mod) {
      commit(updateItem(p, it.id, { rotation: (((it.rotation + (e.shiftKey ? -15 : 15)) % 360) + 360) % 360 }));
    } else if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const step = (p.settings.snap ? p.settings.snapStep : 1) * (e.shiftKey ? 10 : 1);
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      commit(updateItem(p, it.id, { x: it.x + dx, y: it.y + dy }));
    }
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const setSettings = (patch: Partial<Plan["settings"]>) => {
    // view preferences shouldn't clutter undo history
    const next = { ...planRef.current, settings: { ...planRef.current.settings, ...patch } };
    planRef.current = next;
    setPlan(next);
  };

  const pickedGuest = plan.guests.find((g) => g.id === pickedId) ?? null;

  // ── layout ─────────────────────────────────────────────────────────────
  const header = (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 md:gap-3 md:px-4">
      {viewer?.staff ? (
        <a href="/plantas" className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[13px] text-ink-soft hover:bg-border-soft hover:text-ink" title="Voltar à lista de plantas">
          <span aria-hidden>←</span> <span className="hidden md:inline">Plantas</span>
        </a>
      ) : (
        <span className="font-serif-display hidden text-[15px] text-gold lg:block">Organizza</span>
      )}
      <span className="hidden h-5 w-px bg-border lg:block" />
      <div className="min-w-0 flex-1">
        {!staff ? (
          <div className="font-serif-display truncate px-1.5 text-[17px] font-medium">{plan.title}</div>
        ) : (
          <CommitInput
            value={plan.title}
            onCommit={(title) => commit({ ...planRef.current, title: title.trim() || "O nosso casamento" })}
            className="font-serif-display w-full max-w-sm truncate rounded border border-transparent bg-transparent px-1.5 py-1 text-[17px] font-medium outline-none hover:border-border focus:border-sage"
            ariaLabel="Nome do plano"
          />
        )}
        <div className="truncate px-1.5 text-[11px] text-ink-faint">
          {s.tables} mesas · {s.seats} lugares · <span className={s.unseated ? "text-terracotta" : "text-sage"}>{s.seated}/{s.guests} sentados</span>
          {plan.expectedGuests ? <span className={s.seats < plan.expectedGuests ? "text-terracotta" : ""}> · {plan.expectedGuests} previstos</span> : null}
          {readOnly && <span className="ml-2 rounded-full bg-border-soft px-2 py-px text-ink-soft">só leitura</span>}
        </div>
      </div>

      {!readOnly && <SaveBadge state={saveState} onRetry={save} />}
      {!readOnly && (
        <div className="flex">
          <Btn title="Desfazer (⌘Z)" onClick={undo} disabled={!hist.undo}>
            <I name="undo" />
          </Btn>
          <Btn title="Refazer (⇧⌘Z)" onClick={redo} disabled={!hist.redo} className="max-sm:hidden">
            <I name="redo" />
          </Btn>
        </div>
      )}
      <Btn variant="outline" onClick={() => window.print()} title="Imprimir ou guardar PDF" className="max-sm:px-2!">
        <I name="print" size={15} /> <span className="hidden lg:inline">Imprimir / PDF</span>
      </Btn>
      {!readOnly && (
        <Btn variant="primary" onClick={() => setShareOpen(true)} title="Partilhar">
          <I name="share" size={15} /> <span className="hidden sm:inline">Partilhar</span>
        </Btn>
      )}
      {viewer && !viewer.staff && <SignOutButton className="max-sm:hidden" />}
    </header>
  );

  const seatedIn = (id: string) => {
    const tables = new Set(plan.items.filter((i) => i.spaceId === id && isTable(i)).map((i) => i.id));
    return plan.guests.filter((g) => g.seat && tables.has(g.seat.tableId)).length;
  };
  const spacesBar = (
    <SpacesBar
      spaces={plan.spaces}
      activeId={activeSpace}
      editable={staff}
      seatedIn={seatedIn}
      onSelect={(id) => {
        setSpaceId(id);
        setSelectedId(null);
      }}
      onAdd={(name) => {
        const r = addSpace(planRef.current, name);
        commit(r.plan);
        setSpaceId(r.id);
        setSelectedId(null);
        if (!isMobile) setTab("room");
        notify(`Espaço “${r.plan.spaces.at(-1)!.name}” criado — ajuste a sala e acrescente os móveis.`);
      }}
      onRename={(id, name) => commit(renameSpace(planRef.current, id, name))}
      onMove={(id, dir) => commit(moveSpace(planRef.current, id, dir))}
      onDelete={(id) => {
        commit(removeSpace(planRef.current, id));
        setSelectedId(null);
      }}
    />
  );

  const canvasEl = (
    <FloorCanvas
      key={activeSpace}
      ref={canvas}
      plan={view}
      mode={roomMode ? "room" : "items"}
      readOnly={!staff}
      highlights={highlights}
      handleScale={coarse ? 1.7 : 1}
      selectedId={selectedId}
      warnIds={staff ? warnIds : NO_WARNINGS}
      seatTargets={!!pickedId || !!drag?.active}
      hoverSeat={hoverSeat}
      onSelect={select}
      onChange={staff ? onCanvasChange : undefined}
      onGestureEnd={onGestureEnd}
      onSeatTap={onSeatTap}
    />
  );

  const canvasControls = (
    <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface/95 p-1 shadow-sm">
      <Btn title="Afastar" onClick={() => canvas.current?.zoomBy(1 / 1.25)} className="px-2!">
        <I name="minus" size={15} />
      </Btn>
      <Btn title="Aproximar" onClick={() => canvas.current?.zoomBy(1.25)} className="px-2!">
        <I name="plus" size={15} />
      </Btn>
      <Btn title="Ver a sala toda" onClick={() => canvas.current?.fit()} className="px-2!">
        <I name="fit" size={15} />
      </Btn>
      {!isMobile && (
        <>
          <span className="mx-0.5 h-5 w-px bg-border" />
          <Toggle on={plan.settings.showGrid} onClick={() => setSettings({ showGrid: !plan.settings.showGrid })} title="Grelha de medição (1 m)">
            <I name="grid" size={15} />
          </Toggle>
          <Toggle on={plan.settings.showNames} onClick={() => setSettings({ showNames: !plan.settings.showNames })} title="Mostrar nomes dos convidados">
            <I name="tag" size={15} />
          </Toggle>
          {!readOnly && (
            <>
              <Toggle on={plan.settings.snap} onClick={() => setSettings({ snap: !plan.settings.snap })} title="Encaixar na grelha">
                <I name="magnet" size={15} />
              </Toggle>
              {plan.settings.snap && (
                <select
                  aria-label="Passo de encaixe"
                  className="rounded border-0 bg-transparent py-1 pr-1 text-[12px] text-ink-soft outline-none"
                  value={plan.settings.snapStep}
                  onChange={(e) => setSettings({ snapStep: Number(e.target.value) })}
                >
                  {[5, 10, 25, 50].map((v) => (
                    <option key={v} value={v}>
                      {v} cm
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </>
      )}
    </div>
  );

  const banner = pickedGuest ? (
    <div className="absolute top-3 left-1/2 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full border border-sage bg-surface py-1.5 pr-1.5 pl-4 text-[13px] shadow-md">
      <span className="truncate">
        A sentar <b>{pickedGuest.name}</b> — toque numa cadeira
      </span>
      <Btn onClick={() => setPickedId(null)} className="rounded-full! px-2! py-1!" title="Cancelar">
        <I name="close" size={14} />
      </Btn>
    </div>
  ) : staff && pendingChanges > 0 ? (
    <button
      type="button"
      onClick={() => setTab("changes")}
      className="absolute top-3 left-3 flex flex-col gap-1 rounded-lg border border-border bg-surface/95 px-3 py-2 text-left shadow-sm"
    >
      <span className="text-[12px] font-medium">{pendingChanges} alterações do casal por rever</span>
      <ChangeLegend compact />
    </button>
  ) : roomMode ? (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full border border-border bg-surface px-4 py-1.5 text-[12px] text-ink-soft shadow-sm">
      A editar a sala · os móveis estão bloqueados
    </div>
  ) : null;

  const shared = (
    <>
      {drag?.active && (
        <div className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-[130%] rounded-full bg-sage px-3 py-1 text-[12px] font-medium text-white shadow-lg" style={{ left: drag.x, top: drag.y }}>
          {drag.guest.name}
        </div>
      )}
      {paletteDrag && (
        <div
          className={`pointer-events-none fixed z-[70] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-lg border bg-surface/95 px-2 py-1 text-[11px] shadow-lg ${paletteDrag.over ? "border-sage text-ink" : "border-border text-ink-faint"}`}
          style={{ left: paletteDrag.x, top: paletteDrag.y }}
        >
          <PaletteIcon kind={paletteDrag.kind} />
          {paletteDrag.over ? "Largar aqui" : KINDS[paletteDrag.kind].short}
        </div>
      )}
      {toast && (
        <div key={toast.id} className="fixed bottom-20 left-1/2 z-[60] max-w-[92vw] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[13px] text-white shadow-lg md:bottom-6 print:hidden">
          {toast.msg}
        </div>
      )}
      {shareOpen && <ShareDialog viewToken={viewToken} staff={!!viewer?.staff} onClose={() => setShareOpen(false)} />}
      <PrintSheet plan={plan} />
    </>
  );

  // ── mobile: full editing with touch (drag furniture, adjust sizes, guests) ─
  if (isMobile) {
    const selTable = selected && KINDS[selected.kind].isTable ? selected : null;
    const mobileTabs: [MobileTab, string, Parameters<typeof I>[0]["name"]][] = [
      ["plan", "Planta", "map"],
      ...(staff ? ([["room", "Sala", "room"]] as [MobileTab, string, Parameters<typeof I>[0]["name"]][]) : []),
      ["tables", "Mesas", "list"],
      ["guests", `Convidados${s.unseated && !readOnly ? ` · ${s.unseated}` : ""}`, "users"],
    ];
    return (
      <>
        <div className="flex h-dvh flex-col bg-canvas print:hidden">
          {header}
          <div className="relative flex min-h-0 flex-1 flex-col">
            {mobileTab === "plan" && (
              <>
                {spacesBar}
                <div className="relative min-h-0 flex-1">
                  {canvasEl}
                  {canvasControls}
                  {staff && warnings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => select(warnings[0].itemIds[0])}
                      className="absolute top-2 left-2 flex max-w-[80%] items-center gap-1.5 rounded-full border border-terracotta/30 bg-surface/95 px-3 py-1 text-[12px] text-terracotta shadow-sm"
                    >
                      <I name="alert" size={13} />
                      <span className="truncate">{warnings.length === 1 ? warnings[0].message : `${warnings.length} avisos · ${warnings[0].message}`}</span>
                    </button>
                  )}
                  {readOnly && selTable && (
                    <div className="absolute inset-x-2 bottom-16 max-h-[45%] overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                      <TablesOverview plan={{ ...plan, items: [selTable] }} />
                    </div>
                  )}
                </div>

                {!readOnly && selected && (
                  <MobileItemSheet
                    open={sheetOpen}
                    onToggle={() => setSheetOpen((o) => !o)}
                    onClose={() => {
                      setSelectedId(null);
                      setSheetOpen(false);
                    }}
                    layout={staff}
                    onRotate={() => commit(updateItem(planRef.current, selected.id, { rotation: (selected.rotation + 15) % 360 }))}
                    onDuplicate={duplicate}
                    onDelete={() => {
                      remove();
                      setSheetOpen(false);
                    }}
                    title={selected.label}
                    subtitle={KINDS[selected.kind].isTable ? `${KINDS[selected.kind].short} · ${selected.seats ?? 0} lugares` : KINDS[selected.kind].round ? `${KINDS[selected.kind].short} · Ø ${(selected.w / 100).toLocaleString("pt-PT")} m` : `${KINDS[selected.kind].short} · ${(selected.w / 100).toLocaleString("pt-PT")} × ${(selected.h / 100).toLocaleString("pt-PT")} m`}
                  >
                    <ItemPanel plan={view} item={selected} commit={commitView} onDuplicate={duplicate} onDelete={remove} onAssign={assign} warnings={warnings} limited={!staff} materials={staff ? (plan.materials ?? DEFAULT_MATERIALS) : undefined} />
                  </MobileItemSheet>
                )}

                {staff && !selected && (
                  <div className="shrink-0 border-t border-border bg-surface">
                    <div className="px-3 pt-2 text-[11px] text-ink-faint">Arraste para a planta, ou toque para adicionar</div>
                    <div className="flex gap-1 overflow-x-auto px-2 pt-1 pb-2" style={{ touchAction: "pan-x" }}>
                      {PALETTE.flatMap((g) => g.kinds).map((k) => (
                        <PaletteButton key={k} kind={k} onPointerDown={(e) => startPaletteDrag(k, e)} onKeyboard={() => add(k)} className="w-[76px] shrink-0" />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            {mobileTab === "room" && staff && (
              <div className="h-full overflow-y-auto bg-surface">
                <RoomPanel plan={view} commit={commitView} compact />
              </div>
            )}
            {mobileTab === "tables" && (
              <div className="h-full overflow-y-auto">
                <TablesOverview
                  plan={plan}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id);
                    if (!readOnly) {
                      setMobileTab("plan");
                      setSheetOpen(true);
                    }
                  }}
                />
              </div>
            )}
            {mobileTab === "guests" && (
              <div className="h-full bg-surface">
                <GuestsPanel plan={plan} commit={readOnly ? undefined : commit} readOnly={readOnly} onAssign={readOnly ? undefined : assign} />
              </div>
            )}
          </div>
          <nav className="grid shrink-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]" style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, minmax(0, 1fr))` }}>
            {mobileTabs.map(([key, label, icon]) => (
              <button key={key} type="button" onClick={() => setMobileTab(key)} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${mobileTab === key ? "text-sage" : "text-ink-soft"}`}>
                <I name={icon} size={18} />
                <span className="max-w-full truncate px-1">{label}</span>
              </button>
            ))}
          </nav>
        </div>
        {shared}
      </>
    );
  }

  // ── desktop / tablet ───────────────────────────────────────────────────
  const tabs: [Tab, string, Parameters<typeof I>[0]["name"], number?][] = readOnly
    ? [
        ["tables", "Mesas", "list"],
        ["guests", "Convidados", "users"],
      ]
    : !staff
      ? [
          ["item", "Mesa", "item"],
          ["guests", "Convidados", "users", s.unseated],
          ["tables", "Mesas", "list"],
        ]
      : [
          ["room", "Sala", "room"],
          ["item", "Elemento", "item"],
          ["guests", "Convidados", "users", s.unseated],
          ["warnings", "Avisos", "alert", allWarns.length],
          ["changes", "Alterações", "eye", pendingChanges],
          ["material", "Material", "box"],
        ];

  return (
    <>
      <div className="flex h-dvh flex-col bg-canvas print:hidden">
        {header}
        <div className="flex min-h-0 flex-1">
          {staff && (
            <aside className="om-scroll flex w-[84px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-surface px-1.5 py-3 lg:w-[104px]">
              {PALETTE.map((group, gi) => (
                <div key={group.title} className="flex flex-col gap-1">
                  <div className={`px-1 pb-1 text-center text-[10px] font-medium tracking-[0.12em] text-ink-faint uppercase ${gi ? "mt-2" : ""}`}>{group.title}</div>
                  {group.kinds.map((k) => (
                    <PaletteButton key={k} kind={k} onPointerDown={(e) => startPaletteDrag(k, e)} onKeyboard={() => add(k)} disabled={roomMode} />
                  ))}
                </div>
              ))}
            </aside>
          )}

          <main className="relative flex min-w-0 flex-1 flex-col">
            {spacesBar}
            <div className="relative min-h-0 flex-1">
            {canvasEl}
            {canvasControls}
            {banner}
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              className="absolute top-3 right-3 rounded-md border border-border bg-surface p-1.5 text-ink-soft shadow-sm hover:text-ink lg:hidden"
              title={panelOpen ? "Esconder painel" : "Mostrar painel"}
            >
              <I name={panelOpen ? "close" : "list"} size={16} />
            </button>
            </div>
          </main>

          {panelOpen && (
            <aside className="flex w-[300px] shrink-0 flex-col border-l border-border bg-surface lg:w-[340px]">
              <div className="flex shrink-0 border-b border-border">
                {tabs.map(([key, label, icon, badge]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${tab === key ? "text-ink" : "text-ink-faint hover:text-ink-soft"}`}
                  >
                    <I name={icon} size={17} />
                    {label}
                    {!!badge && (
                      <span className={`absolute top-1.5 right-[calc(50%-20px)] min-w-4 rounded-full px-1 text-[9px] leading-4 font-semibold text-white ${key === "warnings" ? "bg-terracotta" : key === "changes" ? "bg-[#D4A514]" : "bg-gold"}`}>
                        {badge}
                      </span>
                    )}
                    {tab === key && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded bg-sage" />}
                  </button>
                ))}
              </div>
              <div className="om-scroll min-h-0 flex-1 overflow-y-auto">
                {tab === "room" && <RoomPanel plan={view} commit={commitView} />}
                {tab === "item" &&
                  (selected ? (
                    <ItemPanel plan={view} item={selected} commit={commitView} onDuplicate={duplicate} onDelete={remove} onAssign={assign} warnings={warnings} limited={!staff} materials={staff ? (plan.materials ?? DEFAULT_MATERIALS) : undefined} />
                  ) : (
                    <EmptyItem staff={staff} />
                  ))}
                {tab === "guests" && (
                  <GuestsPanel
                    plan={plan}
                    commit={readOnly ? undefined : commit}
                    readOnly={readOnly}
                    pickedId={pickedId}
                    onPick={readOnly ? undefined : setPickedId}
                    onAssign={readOnly ? undefined : assign}
                    onDragStart={readOnly ? undefined : startGuestDrag}
                    guestMarks={highlights?.guests}
                  />
                )}
                {tab === "material" && staff && (
                  <MaterialPanel
                    plan={plan}
                    planId={planId}
                    onChange={(materials, resetItems) => {
                      const doc = planRef.current;
                      const items = resetItems
                        ? doc.items.map((i) => (i.details ? { ...i, details: i.details.note ? { note: i.details.note } : undefined } : i))
                        : doc.items;
                      commit({ ...doc, materials, items });
                      if (resetItems) notify("Todas as mesas seguem agora o padrão do plano.");
                    }}
                  />
                )}
                {tab === "changes" && staff && (
                  <ChangesPanel changes={changes ?? []} onReview={markReviewed} reviewing={reviewing} onSelectTable={(id) => setSelectedId(id)} />
                )}
                {tab === "warnings" && <WarningsPanel warnings={allWarns} onSelect={select} />}
                {tab === "tables" && <TablesOverview plan={plan} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />}
              </div>
            </aside>
          )}
        </div>
      </div>
      {shared}
    </>
  );
}

function MobileItemSheet({
  layout,
  open,
  onToggle,
  onClose,
  onRotate,
  onDuplicate,
  onDelete,
  title,
  subtitle,
  children,
}: {
  layout: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shrink-0 border-t border-border bg-surface shadow-[0_-4px_16px_rgba(28,26,23,0.06)]">
      <div className="flex items-center gap-0.5 px-2 py-1.5">
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 px-1.5 py-1 text-left">
          <div className="font-serif-display truncate text-[15px] font-medium">{title}</div>
          <div className="truncate text-[11px] text-ink-faint">{subtitle}</div>
        </button>
        {layout && (
          <>
            <Btn title="Rodar 15°" onClick={onRotate} className="px-2.5! py-2.5!">
              <I name="rotate" size={17} />
            </Btn>
            <Btn title="Duplicar" onClick={onDuplicate} className="px-2.5! py-2.5!">
              <I name="copy" size={17} />
            </Btn>
            <Btn title="Eliminar" onClick={onDelete} className="px-2.5! py-2.5! text-terracotta!">
              <I name="trash" size={17} />
            </Btn>
          </>
        )}
        <Btn variant={open ? "primary" : "outline"} onClick={onToggle} className="ml-1 py-2!">
          {open ? "Fechar" : layout ? "Ajustar" : "Lugares"}
        </Btn>
        <Btn title="Desselecionar" onClick={onClose} className="px-2! py-2.5!">
          <I name="close" size={17} />
        </Btn>
      </div>
      {open && <div className="om-scroll max-h-[40dvh] overflow-y-auto border-t border-border-soft">{children}</div>}
    </div>
  );
}

function EmptyItem({ staff }: { staff: boolean }) {
  if (!staff) {
    return (
      <div className="px-6 py-10 text-center">
        <div className="text-[13px] font-medium">Escolha uma mesa</div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">
          Toque numa mesa na planta para ver e alterar os lugares: quantas pessoas se sentam e quem fica em cada cadeira. A disposição da sala é gerida pela equipa Organizza.
        </p>
      </div>
    );
  }
  return (
    <div className="px-6 py-10 text-center">
      <div className="text-[13px] font-medium">Nenhum elemento selecionado</div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">
        Toque numa mesa ou espaço na planta para mudar o nome, lugares, tamanho ou rotação. Adicione novos elementos na barra da esquerda.
      </p>
      <div className="mt-5 space-y-1 text-left text-[11px] text-ink-faint">
        <div><b className="text-ink-soft">Arrastar</b> move · <b className="text-ink-soft">pega redonda</b> roda</div>
        <div><b className="text-ink-soft">R</b> roda 15° · <b className="text-ink-soft">⌘D</b> duplica · <b className="text-ink-soft">Delete</b> elimina</div>
        <div><b className="text-ink-soft">Setas</b> afinam a posição · <b className="text-ink-soft">⌘ + roda</b> faz zoom</div>
      </div>
    </div>
  );
}

function PaletteButton({
  kind,
  onPointerDown,
  onKeyboard,
  disabled,
  className = "",
}: {
  kind: ItemKind;
  onPointerDown: (e: React.PointerEvent) => void;
  onKeyboard: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const spec = KINDS[kind];
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      // pointer taps are handled by onPointerDown; detail === 0 means Enter/Space
      onClick={(e) => e.detail === 0 && onKeyboard()}
      disabled={disabled}
      title={`Arrastar ou tocar para adicionar: ${spec.label.toLowerCase()}`}
      className={`flex cursor-grab flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[10.5px] leading-tight text-ink-soft transition-colors select-none hover:bg-sage-tint hover:text-ink disabled:opacity-35 ${className}`}
    >
      <PaletteIcon kind={kind} />
      {spec.short}
    </button>
  );
}

function PaletteIcon({ kind }: { kind: ItemKind }) {
  const spec = KINDS[kind];
  const chair = (x: number, y: number) => <rect key={`${x}${y}`} x={x - 3} y={y - 3} width={6} height={6} rx={1.5} fill="#fff" stroke="#CFC6B6" />;
  const body = (() => {
    switch (kind) {
      case "round160":
      case "round180":
        return (
          <>
            {Array.from({ length: kind === "round160" ? 8 : 10 }, (_, i) => {
              const t = (2 * Math.PI * i) / (kind === "round160" ? 8 : 10);
              return chair(Math.round((20 + Math.cos(t) * 13) * 100) / 100, Math.round((16 + Math.sin(t) * 13) * 100) / 100);
            })}
            <circle cx="20" cy="16" r={kind === "round160" ? 8.5 : 9.5} fill="#fff" stroke={spec.stroke} />
          </>
        );
      case "rect250":
        return (
          <>
            {[9, 16, 24, 31].flatMap((x) => [chair(x, 7), chair(x, 25)])}
            <rect x="4" y="11" width="32" height="10" rx="1" fill="#fff" stroke={spec.stroke} />
          </>
        );
      case "sofa":
        return (
          <>
            <rect x="5" y="9" width="30" height="15" rx="3" fill={spec.fill} stroke={spec.stroke} />
            <rect x="5" y="9" width="30" height="5" rx="2" fill="#E2D7C4" stroke={spec.stroke} />
            <rect x="5" y="9" width="5" height="15" rx="2" fill="#E2D7C4" stroke={spec.stroke} />
            <rect x="30" y="9" width="5" height="15" rx="2" fill="#E2D7C4" stroke={spec.stroke} />
          </>
        );
      case "armchair":
        return (
          <>
            <rect x="11" y="8" width="18" height="17" rx="3" fill={spec.fill} stroke={spec.stroke} />
            <rect x="11" y="8" width="18" height="5" rx="2" fill="#E2D7C4" stroke={spec.stroke} />
          </>
        );
      case "decor":
        return (
          <>
            {Array.from({ length: 7 }, (_, i) => (
              <ellipse key={i} cx="20" cy="10.5" rx="3.2" ry="5.5" transform={`rotate(${(360 * i) / 7} 20 16)`} fill={spec.fill} stroke={spec.stroke} />
            ))}
            <circle cx="20" cy="16" r="3" fill="#F4E3D7" stroke="#C4703F" />
          </>
        );
      case "cakeTable":
        return (
          <>
            <circle cx="20" cy="16" r="11" fill={spec.fill} stroke={spec.stroke} />
            <circle cx="20" cy="16" r="5.5" fill="#fff" stroke={spec.stroke} />
          </>
        );
      case "photobooth":
        return (
          <>
            <rect x="9" y="5" width="22" height="22" rx="2" fill={spec.fill} stroke={spec.stroke} strokeDasharray="3 2" />
            <rect x="12" y="8" width="16" height="3" rx="1" fill={spec.stroke} opacity={0.4} />
          </>
        );
      case "stage":
        return (
          <>
            <rect x="4" y="7" width="32" height="18" rx="1.5" fill={spec.fill} stroke={spec.stroke} />
            <line x1="4" y1="21" x2="36" y2="21" stroke={spec.stroke} strokeDasharray="2 2" />
          </>
        );
      default:
        return (
          <rect
            x={kind === "danceFloor" ? 8 : 4}
            y={kind === "danceFloor" ? 4 : 11}
            width={kind === "danceFloor" ? 24 : 32}
            height={kind === "danceFloor" ? 24 : 10}
            rx="2"
            fill={spec.fill}
            stroke={spec.stroke}
          />
        );
    }
  })();
  return (
    <svg width="40" height="32" viewBox="0 0 40 32">
      {body}
    </svg>
  );
}

function Toggle({ on, onClick, title, children }: { on: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title} aria-pressed={on} className={`rounded-md p-1.5 transition-colors ${on ? "bg-sage-tint text-sage" : "text-ink-faint hover:text-ink-soft"}`}>
      {children}
    </button>
  );
}

function SaveBadge({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "signedOut") {
    // keep the tab open so nothing is lost: sign in elsewhere, then retry
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-terracotta-tint px-2.5 py-1 text-[11px] text-terracotta">
        Sessão terminada ·{" "}
        <a href={`/plano?next=${encodeURIComponent(window.location.pathname)}`} target="_blank" rel="noreferrer" className="underline">
          entrar
        </a>{" "}
        ·
        <button type="button" onClick={onRetry} className="underline">
          guardar
        </button>
      </span>
    );
  }
  if (state === "error") {
    return (
      <button type="button" onClick={onRetry} className="rounded-full bg-terracotta-tint px-2.5 py-1 text-[11px] text-terracotta">
        Erro ao guardar · tentar de novo
      </button>
    );
  }
  return (
    <span className="hidden items-center gap-1.5 text-[11px] text-ink-faint sm:flex">
      <span className={`h-1.5 w-1.5 rounded-full ${state === "saved" ? "bg-sage" : "animate-pulse bg-gold"}`} />
      {state === "saved" ? "Guardado" : "A guardar…"}
    </span>
  );
}

function ShareDialog({ viewToken, staff, onClose }: { viewToken: string; staff: boolean; onClose: () => void }) {
  const origin = window.location.origin;
  const links = [
    {
      title: "Link só de leitura",
      hint: "Para a quinta, o catering ou a wedding planner. Podem ver, imprimir e exportar — não podem alterar, e não precisam de conta.",
      url: `${origin}/plano/v/${viewToken}`,
      icon: "eye" as const,
    },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 sm:items-center sm:p-4 print:hidden" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-xl bg-surface p-5 shadow-2xl sm:rounded-xl sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Partilhar">
        <div className="flex items-center justify-between">
          <div className="font-serif-display text-lg font-medium">Partilhar o plano</div>
          <Btn onClick={onClose} title="Fechar" className="px-1.5!">
            <I name="close" />
          </Btn>
        </div>
        <div className="mt-4 space-y-4">
          {links.map((l) => (
            <CopyRow key={l.url} {...l} />
          ))}
        </div>
        <p className="mt-4 text-[11px] text-ink-faint">
          As alterações ficam guardadas automaticamente — quem abrir o link de leitura vê sempre a versão mais recente.{" "}
          {staff ? "Para dar acesso de edição ao casal, convide-o na lista de Plantas." : "Para editar, cada pessoa entra com a sua conta."}
        </p>
      </div>
    </div>
  );
}

function CopyRow({ title, hint, url, icon }: { title: string; hint: string; url: string; icon: "eye" | "share" }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] font-medium">
        <I name={icon} size={14} /> {title}
      </div>
      <div className="mt-0.5 text-[12px] text-ink-soft">{hint}</div>
      <div className="mt-2 flex gap-1.5">
        <input readOnly value={url} onFocus={(e) => e.target.select()} className="w-full rounded-md border border-border bg-canvas px-2.5 py-1.5 text-[12px] text-ink-soft outline-none" />
        <Btn
          variant={copied ? "outline" : "primary"}
          onClick={async () => {
            await navigator.clipboard.writeText(url).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
        >
          {copied ? <I name="check" size={14} /> : <I name="copy" size={14} />} {copied ? "Copiado" : "Copiar"}
        </Btn>
      </div>
    </div>
  );
}
