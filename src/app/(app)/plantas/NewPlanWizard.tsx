"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { PlanDrawing } from "@/components/seating/PlanDrawing";
import { KINDS, maxSeatsFor } from "@/lib/seating/catalog";
import { bounds, footprint } from "@/lib/seating/geometry";
import { spaceView } from "@/lib/seating/ops";
import {
  buildPlanFromSetup,
  defaultSetup,
  HEAD_LABEL,
  HEAD_SEATS,
  SPACE_PRESETS,
  suggestRoomSize,
  tablesNeeded,
  type HeadTable,
  type SetupConfig,
  type SpaceKind,
} from "@/lib/seating/setup";
import type { TableKind } from "@/lib/seating/types";
import { createPlanAction, type ActionResult } from "./actions";

// "Novo plano" wizard: event → spaces → guests & tables, with a live preview of
// the automatic layout. The server rebuilds the plan from the same config.

const STEPS = ["Evento", "Espaços", "Convidados e mesas"];
const KIND_LABEL: Record<SpaceKind, string> = { cocktail: "Cocktail", ceremony: "Cerimónia", dinner: "Jantar", party: "Festa", custom: "Outro" };
const TABLE_LABEL: Record<TableKind, string> = { round160: "Redonda Ø160", round180: "Redonda Ø180", rect250: "Retangular 250 cm" };

const field = "w-full rounded border border-border px-2.5 py-2 text-sm outline-none focus:border-sage";
const m = (cm: number) => String(Math.round(cm) / 100).replace(".", ",");
const parseM = (v: string) => Math.round(parseFloat(v.replace(",", ".")) * 100);

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center rounded border border-border" aria-label={label}>
      <button type="button" className="px-3 py-1.5 text-ink-soft disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Menos">
        −
      </button>
      <input
        className="w-14 bg-transparent text-center text-sm font-medium tabular-nums outline-none"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
      <button type="button" className="px-3 py-1.5 text-ink-soft disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Mais">
        +
      </button>
    </div>
  );
}

export function NewPlanWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<SetupConfig>(defaultSetup);
  const [email, setEmail] = useState("");
  const [previewSpace, setPreviewSpace] = useState<number | null>(null);
  const [result, action, creating] = useActionState<ActionResult, FormData>(createPlanAction, null);

  const built = useMemo(() => buildPlanFromSetup(cfg), [cfg]);
  const shown = previewSpace ?? cfg.seatingSpace;
  const view = built.plan.spaces[shown] ? spaceView(built.plan, built.plan.spaces[shown].id) : null;
  const viewBox = useMemo(() => {
    if (!view) return "0 0 100 100";
    const b = bounds([...view.room.outline, ...view.items.flatMap(footprint)]);
    return `${b.minX - 100} ${b.minY - 100} ${b.w + 200} ${b.h + 200}`;
  }, [view]);

  const headSeats = HEAD_SEATS[cfg.head];
  const capacity = built.seats;
  const short = cfg.guests - capacity;
  const seating = cfg.spaces[cfg.seatingSpace];

  // guests, table type, seats or head table change → recompute the number of tables
  const setSizing = (patch: Partial<SetupConfig>) =>
    setCfg((c) => {
      const n = { ...c, ...patch };
      return { ...n, tables: tablesNeeded(n.guests, n.seatsPerTable, n.head) };
    });

  const setSpace = (i: number, patch: Partial<SetupConfig["spaces"][number]>) =>
    setCfg((c) => ({ ...c, spaces: c.spaces.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const addSpace = (kind: SpaceKind) =>
    setCfg((c) => {
      const spaces = [...c.spaces, { kind, ...SPACE_PRESETS[kind] }];
      const seatingSpace = c.spaces[c.seatingSpace]?.kind === "dinner" || kind !== "dinner" ? c.seatingSpace : spaces.length - 1;
      return { ...c, spaces, seatingSpace };
    });

  const removeSpace = (i: number) =>
    setCfg((c) => {
      const spaces = c.spaces.filter((_, j) => j !== i);
      let seatingSpace = c.seatingSpace === i ? Math.max(0, spaces.findIndex((s) => s.kind === "dinner")) : c.seatingSpace > i ? c.seatingSpace - 1 : c.seatingSpace;
      if (seatingSpace >= spaces.length) seatingSpace = 0;
      return { ...c, spaces, seatingSpace };
    });

  const grow = () => {
    const s = suggestRoomSize(cfg);
    if (s) setSpace(cfg.seatingSpace, s);
  };

  const canNext = step === 0 ? cfg.title.trim().length > 0 : step === 1 ? cfg.spaces.length > 0 : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4" onClick={() => !creating && onClose()}>
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Novo plano">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="font-serif-display text-[19px] font-medium">Novo plano de sala</div>
          <ol className="flex items-center gap-2 text-xs">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-5 bg-border" />}
                <button
                  type="button"
                  disabled={!!result?.ok || i > step}
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-1.5 ${i === step ? "font-medium text-ink" : i < step ? "text-sage" : "text-ink-faint"}`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${i === step ? "bg-sage text-white" : i < step ? "bg-sage-tint text-sage" : "border border-border"}`}>{i + 1}</span>
                  {s}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Fechar">
            ✕
          </button>
        </header>

        {result?.ok && result.planId ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-tint text-xl text-sage">✓</div>
            <div className="font-serif-display text-xl">Plano criado</div>
            <p className="max-w-md text-sm text-ink-soft">{result.message}</p>
            <Link href={`/plano/p/${result.planId}`} className="mt-2 rounded bg-sage px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-hover">
              Abrir o plano
            </Link>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[380px_1fr]">
            <div className="om-scroll flex flex-col gap-4 overflow-y-auto border-r border-border-soft p-6">
              {step === 0 && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-ink-soft">Nomes dos noivos *</span>
                    <input autoFocus className={field} placeholder="Ana & João" value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-ink-soft">Data do casamento</span>
                    <input type="date" className={field} value={cfg.date ?? ""} onChange={(e) => setCfg({ ...cfg, date: e.target.value || undefined })} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-ink-soft">Email do casal (opcional)</span>
                    <input type="email" className={field} placeholder="ana.joao@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <span className="mt-1 block text-[11px] text-ink-faint">Recebem um convite para entrar no plano e gerir os convidados.</span>
                  </label>
                </>
              )}

              {step === 1 && (
                <>
                  <p className="text-xs text-ink-soft">Quantas salas tem o evento? Cada espaço tem a sua planta. As medidas podem ser ajustadas depois.</p>
                  {cfg.spaces.map((sp, i) => (
                    <div key={i} className={`rounded border p-3 ${i === shown ? "border-sage" : "border-border"}`} onClick={() => setPreviewSpace(i)}>
                      <div className="flex gap-2">
                        <input className={field} value={sp.name} onChange={(e) => setSpace(i, { name: e.target.value })} aria-label="Nome do espaço" />
                        <select className="rounded border border-border px-2 text-sm" value={sp.kind} onChange={(e) => setSpace(i, { kind: e.target.value as SpaceKind })} aria-label="Tipo">
                          {(Object.keys(KIND_LABEL) as SpaceKind[]).map((k) => (
                            <option key={k} value={k}>
                              {KIND_LABEL[k]}
                            </option>
                          ))}
                        </select>
                        <button type="button" disabled={cfg.spaces.length <= 1} onClick={() => removeSpace(i)} className="px-1.5 text-ink-faint hover:text-terracotta disabled:opacity-30" aria-label="Remover espaço">
                          ✕
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                        <input key={`w${i}${sp.w}`} className="w-16 rounded border border-border px-2 py-1 text-right text-sm" defaultValue={m(sp.w)} onBlur={(e) => { const v = parseM(e.target.value); if (v >= 300) setSpace(i, { w: Math.min(10000, v) }); }} aria-label="Largura (m)" />
                        ×
                        <input key={`h${i}${sp.h}`} className="w-16 rounded border border-border px-2 py-1 text-right text-sm" defaultValue={m(sp.h)} onBlur={(e) => { const v = parseM(e.target.value); if (v >= 300) setSpace(i, { h: Math.min(10000, v) }); }} aria-label="Comprimento (m)" />
                        m
                        <label className="ml-auto flex items-center gap-1.5">
                          <input type="radio" name="seating" checked={cfg.seatingSpace === i} onChange={() => setCfg({ ...cfg, seatingSpace: i })} />
                          Mesas dos convidados aqui
                        </label>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(KIND_LABEL) as SpaceKind[]).map((k) => (
                      <button key={k} type="button" disabled={cfg.spaces.length >= 8} onClick={() => addSpace(k)} className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-ink-soft hover:border-sage hover:text-ink">
                        + {KIND_LABEL[k]}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Número de convidados</span>
                    <Stepper label="Convidados" value={cfg.guests} min={1} max={2000} onChange={(guests) => setSizing({ guests })} />
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs text-ink-soft">Tipo de mesa</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.keys(TABLE_LABEL) as TableKind[]).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSizing({ tableKind: k, seatsPerTable: KINDS[k].defaultSeats ?? 8 })}
                          className={`rounded border px-2 py-2 text-xs ${cfg.tableKind === k ? "border-sage bg-sage-tint font-medium" : "border-border hover:border-sage"}`}
                        >
                          {TABLE_LABEL[k]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lugares por mesa</span>
                    <Stepper label="Lugares por mesa" value={cfg.seatsPerTable} min={2} max={maxSeatsFor({ kind: cfg.tableKind, seatSides: "both" })} onChange={(seatsPerTable) => setSizing({ seatsPerTable })} />
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs text-ink-soft">Mesa principal</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.keys(HEAD_LABEL) as HeadTable[]).map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSizing({ head: h })}
                          className={`rounded border px-2 py-2 text-xs ${cfg.head === h ? "border-sage bg-sage-tint font-medium" : "border-border hover:border-sage"}`}
                        >
                          {HEAD_LABEL[h]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded border border-border-soft bg-canvas p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Mesas de convidados</span>
                      <Stepper label="Número de mesas" value={cfg.tables} min={0} max={200} onChange={(tables) => setCfg({ ...cfg, tables })} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-ink-faint">
                      Calculado: {Math.max(0, cfg.guests - headSeats)} convidados ÷ {cfg.seatsPerTable} lugares = {tablesNeeded(cfg.guests, cfg.seatsPerTable, cfg.head)} mesas. Pode ajustar.
                    </p>
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs text-ink-soft">Na sala de {seating?.name ?? "jantar"}</span>
                    <div className="grid grid-cols-2 gap-1.5 text-sm">
                      {(
                        [
                          ["danceFloor", "Pista de dança"],
                          ["dj", "Mesa do DJ"],
                          ["bar", "Bar"],
                          ["buffet", "Buffet"],
                          ["cake", "Mesa do bolo"],
                        ] as const
                      ).map(([k, label]) => (
                        <label key={k} className="flex items-center gap-2">
                          <input type="checkbox" checked={cfg.extras[k]} onChange={(e) => setCfg({ ...cfg, extras: { ...cfg.extras, [k]: e.target.checked } })} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* live preview */}
            <div className="flex min-h-[320px] flex-col bg-canvas p-4">
              {built.plan.spaces.length > 1 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {built.plan.spaces.map((sp, i) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => setPreviewSpace(i)}
                      className={`rounded-full px-3 py-1 text-xs ${i === shown ? "bg-surface font-medium shadow-sm" : "text-ink-soft hover:text-ink"}`}
                    >
                      {sp.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="min-h-0 flex-1 rounded border border-border bg-surface">
                {view && (
                  <svg viewBox={viewBox} className="h-full max-h-[52vh] w-full" preserveAspectRatio="xMidYMid meet">
                    <PlanDrawing plan={view} mode="static" />
                  </svg>
                )}
              </div>
              <div className="mt-3 text-sm">
                <b>{built.placed} mesas</b> · {capacity} lugares{headSeats ? ` (incl. ${headSeats} na mesa principal)` : ""} para <b>{cfg.guests} convidados</b>
                {short > 0 ? <span className="text-terracotta"> — faltam {short} lugares</span> : <span className="text-sage"> — {capacity - cfg.guests} lugares livres</span>}
              </div>
              {built.missing > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded bg-terracotta-tint px-3 py-2 text-xs text-terracotta">
                  {built.missing} mesa(s) não cabem em {seating?.name} ({m(seating.w)} × {m(seating.h)} m).
                  <button type="button" onClick={grow} className="rounded border border-terracotta/40 bg-surface px-2 py-1 font-medium hover:bg-terracotta-tint">
                    Aumentar a sala para caber
                  </button>
                </div>
              )}
              {result && !result.ok && <div className="mt-2 text-xs text-terracotta">{result.message}</div>}
            </div>
          </div>
        )}

        {!result?.ok && (
          <footer className="flex items-center justify-between border-t border-border px-6 py-3.5">
            <button type="button" onClick={() => (step ? setStep(step - 1) : onClose())} className="rounded border border-border px-4 py-2 text-sm hover:bg-canvas">
              {step ? "Anterior" : "Cancelar"}
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className="rounded bg-sage px-5 py-2 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-50">
                Seguinte
              </button>
            ) : (
              <form action={action}>
                <input type="hidden" name="setup" value={JSON.stringify(cfg)} />
                <input type="hidden" name="email" value={email} />
                <button disabled={creating || !cfg.title.trim()} className="rounded bg-sage px-5 py-2 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-50">
                  {creating ? "A criar…" : "Criar plano"}
                </button>
              </form>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
