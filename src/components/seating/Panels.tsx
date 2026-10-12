"use client";

import { useMemo, useState } from "react";
import { changeTableKind, formatM, isTable, KINDS, maxSeatsFor, RECT_WIDTH_MAX, RECT_WIDTH_MIN } from "@/lib/seating/catalog";
import { bounds, dist, signedArea, wallAt, type Warning } from "@/lib/seating/geometry";
import { addDoor, removeVertex, replaceOutline, resizeRoom, seatLabel, setOutline, updateItem } from "@/lib/seating/ops";
import { lOutline, rectOutline, uid } from "@/lib/seating/sample";
import { CHANGE_COLORS, type PlanChange } from "@/lib/seating/clientEdits";
import type { Guest, Plan, PlanItem, SeatRef, SpacePlan } from "@/lib/seating/types";
import type { Materials } from "@/lib/seating/materials";
import { ItemDetailsSection } from "./MaterialPanels";
import { guestsBySeat } from "./PlanDrawing";
import { Btn, CommitInput, I, inputCls, Label, MetreInput, Section, Segmented, Stepper } from "./ui";

type Commit = (next: Plan) => void;
type CommitSpace = (next: SpacePlan) => void;

// ─────────────────────────────────────────────────────────────────────────
// Room
// ─────────────────────────────────────────────────────────────────────────

export function RoomPanel({ plan, commit, compact }: { plan: SpacePlan; commit: CommitSpace; compact?: boolean }) {
  const { outline, doors } = plan.room;
  const b = bounds(outline);
  const area = Math.abs(signedArea(outline)) / 10_000;
  const shape = outline.length === 4 ? "rect" : outline.length === 6 ? "l" : "custom";

  return (
    <div>
      <Section title="Forma da sala">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["rect", "Retangular", () => replaceOutline(plan, rectOutline(b.w, b.h))],
              ["l", "Em L", () => replaceOutline(plan, lOutline(b.w, b.h, Math.round(b.w * 0.35), Math.round(b.h * 0.4)))],
            ] as const
          ).map(([key, label, make]) => (
            <button
              key={key}
              type="button"
              onClick={() => commit(make())}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] ${shape === key ? "border-sage bg-sage-tint" : "border-border hover:border-sage"}`}
            >
              <svg width="22" height="18" viewBox="0 0 22 18" className="text-ink-soft">
                {key === "rect" ? (
                  <rect x="1" y="1" width="20" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" />
                ) : (
                  <path d="M1 1h20v9h-8v7H1z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                )}
              </svg>
              {label}
            </button>
          ))}
        </div>
        {compact ? (
          <p className="mt-2.5 text-[12px] leading-snug text-ink-soft">
            Ajuste as medidas e os cantos abaixo. Para desenhar a forma arrastando os cantos, abra o plano num tablet ou computador.
          </p>
        ) : (
        <p className="mt-2.5 text-[12px] leading-snug text-ink-soft">
          Para outras formas, arraste os <b className="text-sage">pontos verdes</b> na planta. Toque no <b className="text-sage">+</b> a meio de uma parede para criar um canto novo; duplo clique num ponto para o remover.
        </p>
        )}
      </Section>

      <Section title="Dimensões">
        <div className="grid grid-cols-2 gap-2.5">
          <Label text="Largura">
            <MetreInput cm={b.w} min={300} max={20000} onCommit={(w) => commit(resizeRoom(plan, w, b.h))} ariaLabel="Largura da sala" />
          </Label>
          <Label text="Comprimento">
            <MetreInput cm={b.h} min={300} max={20000} onCommit={(h) => commit(resizeRoom(plan, b.w, h))} ariaLabel="Comprimento da sala" />
          </Label>
        </div>
        <div className="mt-2 text-[12px] text-ink-soft">
          Área: <b className="text-ink">{area.toLocaleString("pt-PT", { maximumFractionDigits: 1 })} m²</b>
          {shape !== "rect" && <span className="text-ink-faint"> · medidas exteriores; a forma é esticada proporcionalmente</span>}
        </div>
      </Section>

      <Section title={`Cantos (${outline.length})`}>
        <div className="space-y-1.5">
          {outline.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-5 text-[11px] text-ink-faint tabular-nums">{i + 1}</span>
              <MetreInput cm={p.x} min={-20000} max={20000} ariaLabel={`Canto ${i + 1} X`} onCommit={(x) => commit(setOutline(plan, outline.map((q, j) => (j === i ? { ...q, x } : q))))} />
              <MetreInput cm={p.y} min={-20000} max={20000} ariaLabel={`Canto ${i + 1} Y`} onCommit={(y) => commit(setOutline(plan, outline.map((q, j) => (j === i ? { ...q, y } : q))))} />
              <Btn title="Remover canto" disabled={outline.length <= 3} onClick={() => commit(removeVertex(plan, i))} className="px-1.5!">
                <I name="close" size={14} />
              </Btn>
            </div>
          ))}
        </div>
        <div className="mt-1.5 pl-6 text-[11px] text-ink-faint">X = da esquerda · Y = de cima</div>
      </Section>

      <Section
        title="Portas e entradas"
        aside={
          <Btn variant="outline" onClick={() => commit(addDoor(plan))} className="py-1! text-[12px]!">
            <I name="plus" size={13} /> Porta
          </Btn>
        }
      >
        {doors.length === 0 && <p className="text-[12px] text-ink-faint">Sem portas. Adicione pelo menos a entrada principal.</p>}
        <div className="space-y-3">
          {doors.map((d) => {
            const [a, c] = wallAt(outline, Math.min(d.wall, outline.length - 1));
            const len = dist(a, c);
            const set = (patch: Partial<typeof d>) => commit({ ...plan, room: { ...plan.room, doors: doors.map((x) => (x.id === d.id ? { ...x, ...patch } : x)) } });
            return (
              <div key={d.id} className="rounded-md border border-border-soft bg-canvas/60 p-2.5">
                <div className="flex gap-1.5">
                  <CommitInput value={d.label} onCommit={(label) => set({ label: label || "Porta" })} ariaLabel="Nome da porta" />
                  <Btn title="Remover porta" variant="danger" onClick={() => commit({ ...plan, room: { ...plan.room, doors: doors.filter((x) => x.id !== d.id) } })}>
                    <I name="trash" size={14} />
                  </Btn>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <Label text="Parede">
                    <select className={inputCls} value={d.wall} onChange={(e) => set({ wall: Number(e.target.value) })}>
                      {outline.map((_, i) => {
                        const [p, q] = wallAt(outline, i);
                        return (
                          <option key={i} value={i}>
                            {i + 1} · {formatM(dist(p, q))}
                          </option>
                        );
                      })}
                    </select>
                  </Label>
                  <Label text="Largura">
                    <MetreInput cm={d.width} min={60} max={Math.min(1000, len)} onCommit={(width) => set({ width })} />
                  </Label>
                  <Label text="Posição">
                    <MetreInput cm={d.offset} min={d.width / 2} max={len - d.width / 2} onCommit={(offset) => set({ offset })} />
                  </Label>
                </div>
              </div>
            );
          })}
        </div>
        {doors.length > 0 && <p className="mt-2 text-[11px] text-ink-faint">Também pode arrastar as portas ao longo das paredes na planta.</p>}
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Selected item
// ─────────────────────────────────────────────────────────────────────────

export function ItemPanel({
  plan,
  item,
  commit,
  onDuplicate,
  onDelete,
  onAssign,
  warnings,
  limited,
  materials,
}: {
  plan: SpacePlan;
  item: PlanItem;
  commit: CommitSpace;
  onDuplicate: () => void;
  onDelete: () => void;
  onAssign: (guestId: string, seat: SeatRef | null) => void;
  warnings: Warning[];
  /** client view: only seat count and seat assignments */
  limited?: boolean;
  /** plan material defaults; when given (staff), the details section is shown */
  materials?: Materials;
}) {
  const spec = KINDS[item.kind];
  const set = (patch: Partial<PlanItem>) => commit(updateItem(plan, item.id, patch));
  const table = isTable(item);
  if (limited) {
    return (
      <div>
        <Section title={spec.label}>
          <div className="font-serif-display text-lg">{item.label}</div>
          {!table && <p className="mt-1 text-[12px] text-ink-soft">A disposição da sala é gerida pela equipa Organizza.</p>}
        </Section>
        {table && <SeatsSection plan={plan} item={item} set={set} onAssign={onAssign} />}
      </div>
    );
  }
  const rotate = (d: number) => set({ rotation: (((item.rotation + d) % 360) + 360) % 360 });
  const mine = warnings.filter((w) => (w.itemIds as string[]).includes(item.id));

  return (
    <div>
      <Section title={spec.label}>
        <Label text={table ? "Nome ou número da mesa" : "Nome"}>
          <CommitInput value={item.label} onCommit={(label) => set({ label: label.trim() || spec.short })} ariaLabel="Nome" />
        </Label>

        {table && (
          <div className="mt-3">
            <span className="mb-1 block text-[11px] text-ink-soft">Tipo de mesa</span>
            <Segmented
              value={item.kind as "round160" | "round180" | "rect250"}
              options={[
                ["round160", "Ø 160"],
                ["round180", "Ø 180"],
                ["rect250", "250 cm"],
              ]}
              onChange={(k) => commit(updateItem(plan, item.id, (it) => changeTableKind(it, k)))}
            />
          </div>
        )}

        {item.kind === "rect250" && (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Label text="Largura da mesa">
              <MetreInput unit="cm" cm={item.h} min={RECT_WIDTH_MIN} max={RECT_WIDTH_MAX} onCommit={(h) => set({ h })} />
            </Label>
            <div>
              <span className="mb-1 block text-[11px] text-ink-soft">Cadeiras</span>
              <Segmented
                value={item.seatSides ?? "both"}
                options={[
                  ["both", "2 lados"],
                  ["one", "1 lado"],
                ]}
                onChange={(seatSides) => commit(updateItem(plan, item.id, (it) => ({ ...it, seatSides, seats: Math.min(it.seats ?? 0, maxSeatsFor({ ...it, seatSides })) })))}
              />
            </div>
          </div>
        )}

        {!table && spec.round && (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Label text="Diâmetro">
              <MetreInput cm={item.w} min={spec.minSize} max={spec.maxSize} onCommit={(d) => set({ w: d, h: d })} />
            </Label>
          </div>
        )}

        {!table && !spec.round && (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Label text="Comprimento">
              <MetreInput cm={item.w} min={spec.minSize} max={spec.maxSize} onCommit={(w) => set({ w })} />
            </Label>
            <Label text="Largura">
              <MetreInput cm={item.h} min={spec.minSize} max={spec.maxSize} onCommit={(h) => set({ h })} />
            </Label>
          </div>
        )}

        <div className="mt-3 flex items-end gap-2.5">
          <Label text="Rotação">
            <div className="flex items-center gap-1">
              <Btn variant="outline" title="Rodar −15°" onClick={() => rotate(-15)} className="px-2!">
                <span className="inline-block -scale-x-100"><I name="rotate" size={14} /></span>
              </Btn>
              <div className="w-16">
                <MetreInput unit="°" cm={item.rotation} min={0} max={359} onCommit={(r) => set({ rotation: r })} ariaLabel="Rotação em graus" />
              </div>
              <Btn variant="outline" title="Rodar +15°" onClick={() => rotate(15)} className="px-2!">
                <I name="rotate" size={14} />
              </Btn>
              <Btn variant="outline" title="Rodar 90°" onClick={() => rotate(90)} className="text-[12px]!">
                90°
              </Btn>
            </div>
          </Label>
        </div>
        <p className="mt-1 text-[11px] text-ink-faint">Em graus. Também pode usar a pega redonda na planta.</p>

        <div className="mt-4 flex gap-2">
          <Btn variant="outline" onClick={onDuplicate} className="flex-1">
            <I name="copy" size={14} /> Duplicar
          </Btn>
          <Btn variant="danger" onClick={onDelete} className="flex-1">
            <I name="trash" size={14} /> Eliminar
          </Btn>
        </div>

        {mine.length > 0 && (
          <div className="mt-3 space-y-1 rounded-md bg-terracotta-tint p-2.5 text-[12px] text-terracotta">
            {mine.map((w, i) => (
              <div key={i} className="flex gap-1.5">
                <I name="alert" size={14} /> {w.message}
              </div>
            ))}
          </div>
        )}
      </Section>

      {table && <SeatsSection plan={plan} item={item} set={set} onAssign={onAssign} />}
      {materials && <ItemDetailsSection item={item} materials={materials} onChange={(details) => set({ details })} />}
    </div>
  );
}

function SeatsSection({ plan, item, set, onAssign }: { plan: SpacePlan; item: PlanItem; set: (p: Partial<PlanItem>) => void; onAssign: (guestId: string, seat: SeatRef | null) => void }) {
  const seated = guestsBySeat(plan.guests);
  const max = maxSeatsFor(item);
  const n = item.seats ?? 0;
  const unseated = plan.guests.filter((g) => !g.seat).sort(byName);

  return (
    <Section
      title="Lugares"
      aside={<Stepper value={n} min={0} max={max} onChange={(seats) => set({ seats })} ariaLabel="Número de lugares" />}
    >
      <p className="-mt-1 mb-2.5 text-[11px] text-ink-faint">Máximo {max} lugares nesta mesa.</p>
      <div className="space-y-1.5">
        {Array.from({ length: n }, (_, i) => {
          const g = seated.get(`${item.id}:${i}`);
          return (
            <div key={i} className="flex items-center gap-2">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums ${g ? "bg-sage text-white" : "border border-border text-ink-faint"}`}>{i + 1}</span>
              <select
                aria-label={`Lugar ${i + 1}`}
                className={inputCls}
                value={g?.id ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) onAssign(id, { tableId: item.id, index: i });
                  else if (g) onAssign(g.id, null);
                }}
              >
                <option value="">— lugar livre —</option>
                {g && <option value={g.id}>{g.name}</option>}
                {unseated.length > 0 && (
                  <optgroup label="Por sentar">
                    {unseated.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

const byName = (a: Guest, b: Guest) => a.name.localeCompare(b.name, "pt");

// ─────────────────────────────────────────────────────────────────────────
// Guests
// ─────────────────────────────────────────────────────────────────────────

type Filter = "all" | "unseated" | "seated";

export function GuestsPanel({
  plan,
  commit,
  readOnly,
  pickedId,
  onPick,
  onAssign,
  onDragStart,
  guestMarks,
}: {
  plan: Plan;
  guestMarks?: Map<string, "added" | "changed">;
  commit?: Commit;
  readOnly?: boolean;
  pickedId?: string | null;
  onPick?: (id: string | null) => void;
  onAssign?: (guestId: string, seat: SeatRef | null) => void;
  onDragStart?: (guest: Guest, e: React.PointerEvent) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(readOnly ? "all" : "unseated");
  const [newName, setNewName] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const seatedCount = plan.guests.filter((g) => g.seat).length;
  const unseatedCount = plan.guests.length - seatedCount;

  const list = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("pt");
    return plan.guests
      .filter((g) => (filter === "all" ? true : filter === "seated" ? !!g.seat : !g.seat))
      .filter((g) => !needle || g.name.toLocaleLowerCase("pt").includes(needle) || (g.group ?? "").toLocaleLowerCase("pt").includes(needle))
      .sort(byName);
  }, [plan.guests, q, filter]);

  const seatOptions = useMemo(() => {
    const seated = guestsBySeat(plan.guests);
    const multi = plan.spaces.length > 1;
    const spaceName = new Map(plan.spaces.map((sp) => [sp.id, sp.name]));
    return plan.items.filter(isTable).map((t) => ({
      label: multi ? `${t.label} · ${spaceName.get(t.spaceId) ?? ""}` : t.label,
      table: t,
      seats: Array.from({ length: t.seats ?? 0 }, (_, i) => ({ index: i, occupant: seated.get(`${t.id}:${i}`) })),
    }));
  }, [plan.guests, plan.items, plan.spaces]);

  function addGuests(raw: string) {
    if (!commit) return;
    const names = raw.split(/\r?\n|;/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    const existing = new Set(plan.guests.map((g) => g.name.toLocaleLowerCase("pt")));
    const fresh = names.filter((n) => !existing.has(n.toLocaleLowerCase("pt")));
    commit({ ...plan, guests: [...plan.guests, ...fresh.map((name) => ({ id: uid("g"), name: name.slice(0, 80), seat: null }))] });
    setNewName("");
    if (fresh.length < names.length) alert(`${names.length - fresh.length} nome(s) já existiam na lista e não foram repetidos.`);
  }

  const setGuest = (id: string, patch: Partial<Guest>) => commit?.({ ...plan, guests: plan.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) });

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2.5 border-b border-border-soft px-4 py-3.5">
        {!readOnly && (
          <form
            className="flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              addGuests(newName);
            }}
          >
            <input
              className={inputCls}
              placeholder="Nome do convidado…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (/\n/.test(text)) {
                  e.preventDefault();
                  addGuests(text);
                }
              }}
              aria-label="Novo convidado"
            />
            <Btn variant="primary" type="submit" title="Adicionar convidado">
              <I name="plus" size={14} />
            </Btn>
          </form>
        )}
        {!readOnly && <p className="-mt-1 text-[11px] text-ink-faint">Dica: cole uma lista (um nome por linha) para adicionar vários de uma vez.</p>}
        <input className={inputCls} placeholder="Procurar…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Procurar convidado" />
        <Segmented
          value={filter}
          options={[
            ["unseated", `Por sentar · ${unseatedCount}`],
            ["seated", `Sentados · ${seatedCount}`],
            ["all", `Todos · ${plan.guests.length}`],
          ]}
          onChange={setFilter}
        />
        {onDragStart && unseatedCount > 0 && filter !== "seated" && (
          <p className="text-[11px] leading-snug text-ink-soft">
            Arraste um nome para uma cadeira na planta — ou toque no nome e depois na cadeira.
          </p>
        )}
      </div>

      <ul className="om-scroll flex-1 overflow-y-auto px-2 py-2">
        {list.length === 0 && (
          <li className="px-3 py-8 text-center text-[13px] text-ink-faint">
            {plan.guests.length === 0 ? "Ainda sem convidados." : filter === "unseated" ? "Todos os convidados têm lugar. 🎉" : "Nenhum resultado."}
          </li>
        )}
        {list.map((g) => {
          const picked = pickedId === g.id;
          const open = openId === g.id;
          const where = seatLabel(plan, g.seat);
          return (
            <li key={g.id} className={`mb-1 rounded-md border ${picked ? "border-sage bg-sage-tint" : open ? "border-border bg-surface" : "border-transparent hover:bg-canvas"}`}>
              <div className="flex items-center gap-1.5 px-1.5 py-1">
                {onDragStart && (
                  <span
                    className="cursor-grab touch-none rounded p-1 text-ink-faint hover:text-ink"
                    onPointerDown={(e) => onDragStart?.(g, e)}
                    title="Arrastar para uma cadeira"
                  >
                    <I name="drag" size={14} />
                  </span>
                )}
                <button
                  type="button"
                  className="min-w-0 flex-1 py-1 text-left"
                  onClick={() => (onPick ? onPick(picked ? null : g.id) : setOpenId(open ? null : g.id))}
                >
                  <div className="flex items-center gap-1.5 truncate text-[13px] font-medium">
                    {guestMarks?.has(g.id) && (
                      <span
                        title={guestMarks.get(g.id) === "added" ? "Adicionado pelo casal" : "Alterado pelo casal"}
                        className="h-2 w-2 shrink-0 rounded-full border"
                        style={{
                          background: CHANGE_COLORS[guestMarks.get(g.id) === "added" ? "guest_added" : "guest_changed"].fill,
                          borderColor: CHANGE_COLORS[guestMarks.get(g.id) === "added" ? "guest_added" : "guest_changed"].stroke,
                        }}
                      />
                    )}
                    <span className="truncate">{g.name || <span className="text-ink-faint italic">sem nome</span>}</span>
                  </div>
                  <div className={`truncate text-[11px] ${where ? "text-sage" : "text-ink-faint"}`}>
                    {where ?? "Por sentar"}
                    {g.group ? <span className="text-ink-faint"> · {g.group}</span> : null}
                  </div>
                </button>
                {!readOnly && (
                  <Btn title="Editar" onClick={() => setOpenId(open ? null : g.id)} className="px-2! text-[12px]!">
                    {open ? "Fechar" : "Editar"}
                  </Btn>
                )}
              </div>

              {open && (
                <div className="space-y-2 border-t border-border-soft px-3 py-2.5">
                  {readOnly ? (
                    <>
                      {g.note && <div className="text-[12px] text-ink-soft">{g.note}</div>}
                      {!g.note && <div className="text-[12px] text-ink-faint">Sem notas.</div>}
                    </>
                  ) : (
                    <>
                      <Label text="Nome">
                        <CommitInput value={g.name} onCommit={(name) => setGuest(g.id, { name: name.trim().slice(0, 80) })} />
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Label text="Grupo (opcional)">
                          <CommitInput value={g.group ?? ""} placeholder="Família da noiva…" onCommit={(group) => setGuest(g.id, { group: group.trim() || undefined })} />
                        </Label>
                        <Label text="Nota (opcional)">
                          <CommitInput value={g.note ?? ""} placeholder="Vegetariano, criança…" onCommit={(note) => setGuest(g.id, { note: note.trim() || undefined })} />
                        </Label>
                      </div>
                      <Label text="Lugar">
                        <select
                          className={inputCls}
                          value={g.seat ? `${g.seat.tableId}:${g.seat.index}` : ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) return onAssign?.(g.id, null);
                            const [tableId, idx] = v.split(":");
                            onAssign?.(g.id, { tableId, index: Number(idx) });
                          }}
                        >
                          <option value="">Por sentar</option>
                          {seatOptions.map(({ table, label, seats }) => (
                            <optgroup key={table.id} label={label}>
                              {seats.map(({ index, occupant }) => (
                                <option key={index} value={`${table.id}:${index}`}>
                                  Lugar {index + 1}
                                  {occupant && occupant.id !== g.id ? ` — ${occupant.name} (trocar)` : ""}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </Label>
                      <div className="flex justify-end">
                        <Btn
                          variant="danger"
                          onClick={() => {
                            if (confirm(`Remover ${g.name || "este convidado"} da lista?`)) commit?.({ ...plan, guests: plan.guests.filter((x) => x.id !== g.id) });
                          }}
                          className="text-[12px]!"
                        >
                          <I name="trash" size={13} /> Remover
                        </Btn>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Warnings
// ─────────────────────────────────────────────────────────────────────────

export function WarningsPanel({ warnings, onSelect }: { warnings: Warning[]; onSelect: (id: string) => void }) {
  if (!warnings.length) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-tint text-sage">
          <I name="check" size={20} />
        </span>
        <div className="text-[13px] font-medium">Tudo em ordem</div>
        <div className="text-[12px] text-ink-soft">Nada se sobrepõe, nada sai da sala e as portas estão livres.</div>
      </div>
    );
  }
  return (
    <div className="px-2 py-2">
      <p className="px-2 pt-1 pb-2.5 text-[12px] leading-snug text-ink-soft">
        Os avisos contam com o espaço das cadeiras (55 cm atrás da mesa) e 1 m livre à frente de cada porta.
      </p>
      {warnings.map((w, i) => (
        <button key={i} type="button" onClick={() => onSelect(w.itemIds[0])} className="mb-1 flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-[13px] hover:bg-terracotta-tint">
          <span className="mt-0.5 text-terracotta">
            <I name="alert" size={15} />
          </span>
          <span>{w.message}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Tables overview (read-only view + mobile)
// ─────────────────────────────────────────────────────────────────────────

export function TablesOverview({ plan, selectedId, onSelect }: { plan: Plan; selectedId?: string | null; onSelect?: (id: string) => void }) {
  const seated = guestsBySeat(plan.guests);
  const tables = plan.items.filter(isTable).sort((a, b) => a.label.localeCompare(b.label, "pt", { numeric: true }));
  if (!tables.length) return <div className="px-6 py-12 text-center text-[13px] text-ink-faint">Ainda não há mesas.</div>;
  return (
    <div className="space-y-2 p-3">
      {tables.map((t) => {
        const n = t.seats ?? 0;
        const used = Array.from({ length: n }, (_, i) => seated.get(`${t.id}:${i}`)).filter(Boolean).length;
        return (
          <button
            key={t.id}
            id={`table-${t.id}`}
            type="button"
            onClick={() => onSelect?.(t.id)}
            className={`block w-full rounded-lg border bg-surface p-3 text-left ${selectedId === t.id ? "border-sage ring-2 ring-sage/20" : "border-border"}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-serif-display text-[15px] font-medium">{t.label}</span>
              <span className="text-[11px] text-ink-faint">
                {plan.spaces.length > 1 && `${plan.spaces.find((sp) => sp.id === t.spaceId)?.name ?? ""} · `}
                {KINDS[t.kind].short} · {used}/{n}
              </span>
            </div>
            <ol className="mt-1.5 grid grid-cols-1 gap-x-3 text-[12px] sm:grid-cols-2">
              {Array.from({ length: n }, (_, i) => {
                const g = seated.get(`${t.id}:${i}`);
                return (
                  <li key={i} className="flex gap-1.5 py-0.5">
                    <span className="w-4 text-right text-ink-faint tabular-nums">{i + 1}</span>
                    <span className={g ? "" : "text-ink-faint italic"}>{g?.name ?? "livre"}</span>
                  </li>
                );
              })}
            </ol>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Client change log (staff only)
// ─────────────────────────────────────────────────────────────────────────

export function ChangesPanel({
  changes,
  onReview,
  reviewing,
  onSelectTable,
}: {
  changes: PlanChange[];
  onReview: () => void;
  reviewing: boolean;
  onSelectTable: (id: string) => void;
}) {
  const pending = changes.filter((c) => !c.reviewed_at).length;
  return (
    <div>
      <div className="space-y-2.5 border-b border-border-soft px-4 py-3.5">
        <ChangeLegend />
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-ink-soft">{pending ? `${pending} por rever` : "Tudo revisto"}</span>
          <Btn variant="outline" disabled={!pending || reviewing} onClick={onReview} className="text-[12px]!">
            <I name="check" size={13} /> {reviewing ? "A marcar…" : "Marcar como visto"}
          </Btn>
        </div>
      </div>
      {changes.length === 0 ? (
        <div className="px-6 py-10 text-center text-[13px] text-ink-faint">O casal ainda não fez alterações.</div>
      ) : (
        <ul className="px-2 py-2">
          {changes.map((c) => {
            const col = CHANGE_COLORS[c.kind];
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={!c.table_id}
                  onClick={() => c.table_id && onSelectTable(c.table_id)}
                  className={`flex w-full gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-canvas ${c.reviewed_at ? "opacity-55" : ""}`}
                >
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border" style={{ background: col.fill, borderColor: col.stroke }} />
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-snug">{c.summary}</span>
                    <span className="block text-[11px] text-ink-faint">
                      {col.label} · {c.actor_name || "cliente"} · {new Date(c.created_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                      {c.reviewed_at ? " · visto" : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ChangeLegend({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1 ${compact ? "text-[11px]" : "text-[12px]"} text-ink-soft`}>
      {(["guest_changed", "guest_added", "seat_added"] as const).map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border" style={{ background: CHANGE_COLORS[k].fill, borderColor: CHANGE_COLORS[k].stroke }} />
          {CHANGE_COLORS[k].label}
        </span>
      ))}
    </div>
  );
}
