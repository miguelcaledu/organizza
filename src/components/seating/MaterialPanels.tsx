"use client";

import { useMemo } from "react";
import { countMaterials, DEFAULT_MATERIALS, detailFields, DROP_LABEL, effectiveDetails, materialsCsv, clothSize, type ClothDrop, type ItemDetails, type Materials } from "@/lib/seating/materials";
import type { Plan, PlanItem } from "@/lib/seating/types";
import { Btn, CommitInput, I, inputCls, Label, Section } from "./ui";

// Staff-only: tablecloths / napkins / chairs per item, plan-wide defaults and the
// automatic material count that feeds the folha de obra.

const COLORS = ["Branco", "Marfim", "Champanhe", "Cinza", "Verde-salva", "Rosa velho", "Terracota", "Azul", "Preto", "Dourado"];

const LIST_ID = "cores-material";

/** Suggestions for every colour field; render once per panel. */
function ColorList() {
  return (
    <datalist id={LIST_ID}>
      {COLORS.map((c) => (
        <option key={c} value={c} />
      ))}
    </datalist>
  );
}

function ColorInput({ value, onCommit, placeholder, ariaLabel }: { value: string; onCommit: (v: string) => void; placeholder?: string; ariaLabel: string }) {
  return <CommitInput value={value} onCommit={onCommit} placeholder={placeholder} ariaLabel={ariaLabel} list={LIST_ID} />;
}

/** Per-item details. Empty fields fall back to the plan defaults (shown as placeholders). */
export function ItemDetailsSection({ item, materials, onChange }: { item: PlanItem; materials: Materials; onChange: (details: ItemDetails | undefined) => void }) {
  const fields = detailFields(item);
  const own = item.details ?? {};
  const eff = effectiveDetails(item, materials);
  const set = (patch: Partial<ItemDetails>) => {
    const next: ItemDetails = { ...own, ...patch };
    for (const k of Object.keys(next) as (keyof ItemDetails)[]) if (next[k] === undefined || next[k] === "") delete next[k];
    onChange(Object.keys(next).length ? next : undefined);
  };
  const has = (f: keyof ItemDetails) => fields.includes(f);
  const cloth = clothSize(item, eff.clothDrop);
  const overridden = Object.keys(own).filter((k) => k !== "note").length > 0;

  return (
    <Section
      title="Detalhes e material"
      aside={
        overridden ? (
          <Btn onClick={() => onChange(own.note ? { note: own.note } : undefined)} className="py-0.5! text-[11px]!" title="Voltar a usar os valores padrão do plano">
            Repor padrão
          </Btn>
        ) : undefined
      }
    >
      <ColorList />
      <div className="space-y-2.5">
        {has("clothDrop") && (
          <div className="grid grid-cols-2 gap-2.5">
            <Label text="Toalha">
              <select
                className={inputCls}
                value={own.clothDrop ?? ""}
                onChange={(e) => set({ clothDrop: (e.target.value || undefined) as ClothDrop | undefined })}
              >
                <option value="">Padrão ({DROP_LABEL[eff.clothDrop ?? "none"].toLowerCase()})</option>
                {(Object.keys(DROP_LABEL) as ClothDrop[]).map((d) => (
                  <option key={d} value={d}>
                    {DROP_LABEL[d]}
                  </option>
                ))}
              </select>
            </Label>
            <Label text="Cor da toalha">
              <ColorInput value={own.clothColor ?? ""} placeholder={eff.clothColor ? `padrão: ${eff.clothColor}` : "ex.: Branco"} onCommit={(v) => set({ clothColor: v.trim() })} ariaLabel="Cor da toalha" />
            </Label>
          </div>
        )}
        {cloth && <p className="-mt-1 text-[11px] text-ink-faint">Medida: {cloth.label}</p>}

        {has("napkinColor") && (
          <div className="grid grid-cols-2 gap-2.5">
            <Label text="Guardanapos (cor)">
              <ColorInput value={own.napkinColor ?? ""} placeholder={eff.napkinColor ? `padrão: ${eff.napkinColor}` : "ex.: Branco"} onCommit={(v) => set({ napkinColor: v.trim() })} ariaLabel="Cor dos guardanapos" />
            </Label>
            <Label text="Capas de cadeira">
              <ColorInput value={own.chairCover ?? ""} placeholder={eff.chairCover ? `padrão: ${eff.chairCover}` : "sem capas"} onCommit={(v) => set({ chairCover: v.trim() })} ariaLabel="Cor das capas de cadeira" />
            </Label>
          </div>
        )}
        {has("chairModel") && (
          <Label text="Modelo de cadeira">
            <CommitInput value={own.chairModel ?? ""} placeholder={eff.chairModel ? `padrão: ${eff.chairModel}` : "ex.: Cadeira Tiffany"} onCommit={(v) => set({ chairModel: v.trim() })} ariaLabel="Modelo de cadeira" />
          </Label>
        )}
        {has("centerpiece") && (
          <div className="grid grid-cols-2 gap-2.5">
            {(["centerpiece", "tableNumber"] as const).map((f) => (
              <Label key={f} text={f === "centerpiece" ? "Centro de mesa" : "Número de mesa"}>
                <select
                  className={inputCls}
                  value={own[f] === undefined ? "" : own[f] ? "yes" : "no"}
                  onChange={(e) => set({ [f]: e.target.value === "" ? undefined : e.target.value === "yes" })}
                >
                  <option value="">Padrão ({eff[f] ? "sim" : "não"})</option>
                  <option value="yes">Sim</option>
                  <option value="no">Não</option>
                </select>
              </Label>
            ))}
          </div>
        )}
        <Label text="Notas para a montagem">
          <CommitInput value={own.note ?? ""} placeholder="ex.: toalha com saia, flores brancas…" onCommit={(v) => set({ note: v.trim() })} ariaLabel="Notas" />
        </Label>
      </div>
    </Section>
  );
}

/** Plan-wide defaults + live material count. */
export function MaterialPanel({ plan, planId, onChange }: { plan: Plan; planId?: string; onChange: (materials: Materials, resetItems?: boolean) => void }) {
  const mat = plan.materials ?? DEFAULT_MATERIALS;
  const count = useMemo(() => countMaterials(plan, mat), [plan, mat]);
  const setTables = (patch: Partial<ItemDetails>) => onChange({ ...mat, tables: { ...mat.tables, ...patch } });
  const overrides = plan.items.filter((i) => i.details && Object.keys(i.details).some((k) => k !== "note")).length;

  const downloadCsv = () => {
    const blob = new Blob([materialsCsv(plan, count)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `folha-de-obra-${plan.title.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <Section title="Folha de obra">
        <div className="flex gap-2">
          {planId && (
            <a
              href={`/plano/p/${planId}/folha-de-obra`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-sage px-2.5 py-1.5 text-[13px] font-medium text-white hover:bg-sage-hover"
            >
              <I name="print" size={14} /> Abrir / imprimir
            </a>
          )}
          <Btn variant="outline" onClick={downloadCsv} className="flex-1">
            <I name="list" size={14} /> Exportar CSV
          </Btn>
        </div>
        <p className="mt-2 text-[11px] text-ink-faint">Contagem automática de todas as mesas e espaços, com a margem de reserva abaixo.</p>
      </Section>

      <Section title="Contagem">
        {count.sections.length === 0 && <p className="text-[12px] text-ink-faint">Ainda não há elementos.</p>}
        <div className="space-y-3">
          {count.sections.map((s) => (
            <div key={s.title}>
              <div className="mb-1 text-[11px] font-medium text-ink-soft">{s.title}</div>
              {s.lines.map((l, i) => (
                <div key={i} className="flex items-baseline justify-between gap-2 py-0.5 text-[12px]">
                  <span className="min-w-0 truncate">
                    {l.label}
                    {l.detail && <span className="text-ink-faint"> · {l.detail}</span>}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {l.withSpare ?? l.qty}
                    {l.withSpare !== undefined && <span className="ml-1 font-normal text-ink-faint">({l.qty})</span>}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Padrão das mesas"
        aside={
          overrides > 0 ? (
            <Btn onClick={() => onChange(mat, true)} className="py-0.5! text-[11px]!" title="Apagar as alterações feitas mesa a mesa (as notas mantêm-se)">
              Aplicar a todas ({overrides})
            </Btn>
          ) : undefined
        }
      >
        <ColorList />
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Label text="Toalha">
              <select className={inputCls} value={mat.tables.clothDrop ?? "none"} onChange={(e) => setTables({ clothDrop: e.target.value as ClothDrop })}>
                {(Object.keys(DROP_LABEL) as ClothDrop[]).map((d) => (
                  <option key={d} value={d}>
                    {DROP_LABEL[d]}
                  </option>
                ))}
              </select>
            </Label>
            <Label text="Cor da toalha">
              <ColorInput value={mat.tables.clothColor ?? ""} onCommit={(v) => setTables({ clothColor: v.trim() })} ariaLabel="Cor da toalha (padrão)" />
            </Label>
            <Label text="Guardanapos (cor)">
              <ColorInput value={mat.tables.napkinColor ?? ""} placeholder="sem guardanapos" onCommit={(v) => setTables({ napkinColor: v.trim() })} ariaLabel="Cor dos guardanapos (padrão)" />
            </Label>
            <Label text="Capas de cadeira">
              <ColorInput value={mat.tables.chairCover ?? ""} placeholder="sem capas" onCommit={(v) => setTables({ chairCover: v.trim() })} ariaLabel="Cor das capas (padrão)" />
            </Label>
          </div>
          <Label text="Modelo de cadeira">
            <CommitInput value={mat.tables.chairModel ?? ""} onCommit={(v) => setTables({ chairModel: v.trim() })} ariaLabel="Modelo de cadeira (padrão)" />
          </Label>
          <div className="flex gap-4 text-[12px]">
            {(["centerpiece", "tableNumber"] as const).map((f) => (
              <label key={f} className="flex items-center gap-1.5">
                <input type="checkbox" checked={!!mat.tables[f]} onChange={(e) => setTables({ [f]: e.target.checked })} />
                {f === "centerpiece" ? "Centro de mesa" : "Número de mesa"}
              </label>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Bar, buffet, DJ e bolo">
        <div className="grid grid-cols-2 gap-2.5">
          <Label text="Toalha">
            <select className={inputCls} value={mat.others.clothDrop ?? "none"} onChange={(e) => onChange({ ...mat, others: { ...mat.others, clothDrop: e.target.value as ClothDrop } })}>
              {(Object.keys(DROP_LABEL) as ClothDrop[]).map((d) => (
                <option key={d} value={d}>
                  {DROP_LABEL[d]}
                </option>
              ))}
            </select>
          </Label>
          <Label text="Cor da toalha">
            <ColorInput value={mat.others.clothColor ?? ""} onCommit={(v) => onChange({ ...mat, others: { ...mat.others, clothColor: v.trim() } })} ariaLabel="Cor da toalha (bar, buffet)" />
          </Label>
        </div>
      </Section>

      <Section title="Margem de reserva">
        <div className="grid grid-cols-3 gap-2.5">
          {(
            [
              ["napkins", "Guardanapos"],
              ["cloths", "Toalhas"],
              ["chairs", "Cadeiras / capas"],
            ] as const
          ).map(([k, label]) => (
            <Label key={k} text={label}>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={`${inputCls} pr-6`}
                  value={mat.spare[k]}
                  onChange={(e) => onChange({ ...mat, spare: { ...mat.spare, [k]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) } })}
                />
                <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px] text-ink-faint">%</span>
              </div>
            </Label>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-faint">Na contagem aparece o total com margem e, entre parênteses, o número exato.</p>
      </Section>
    </div>
  );
}
