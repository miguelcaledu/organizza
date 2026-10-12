"use client";

import { useMemo } from "react";
import { formatLongDate } from "@/lib/constants";
import { KINDS } from "@/lib/seating/catalog";
import { countMaterials, materialsCsv, type MaterialSection } from "@/lib/seating/materials";
import type { Plan } from "@/lib/seating/types";

// Printable "folha de obra": everything the warehouse needs to load and the
// set-up team needs to lay out, counted automatically from the plan.

function Sections({ sections, compact }: { sections: MaterialSection[]; compact?: boolean }) {
  return (
    <table className="w-full border-collapse text-[12px] print:text-[9pt]">
      <thead>
        <tr className="border-b border-ink text-left text-[10px] tracking-wide text-ink-soft uppercase">
          <th className="w-6 py-1" />
          <th className="py-1">Material</th>
          <th className="py-1">Detalhe</th>
          <th className="py-1 text-right">Qtd.</th>
          {!compact && <th className="py-1 text-right">Com margem</th>}
        </tr>
      </thead>
      <tbody>
        {sections.map((s) => [
          <tr key={s.title}>
            <td colSpan={compact ? 4 : 5} className="pt-3 pb-1 font-serif-display text-[13px] font-medium print:text-[10pt]">
              {s.title}
            </td>
          </tr>,
          ...s.lines.map((l, i) => (
            <tr key={s.title + i} className="border-b border-border-soft">
              <td className="py-1 align-top">
                <span className="inline-block h-3 w-3 rounded-sm border border-ink-faint" />
              </td>
              <td className="py-1 pr-2">{l.label}</td>
              <td className="py-1 pr-2 text-ink-soft">{l.detail ?? "—"}</td>
              <td className="py-1 text-right tabular-nums">{l.qty}</td>
              {!compact && <td className="py-1 text-right font-semibold tabular-nums">{l.withSpare ?? l.qty}</td>}
            </tr>
          )),
        ])}
      </tbody>
    </table>
  );
}

export function WorkSheet({ plan, planId }: { plan: Plan; planId: string }) {
  const count = useMemo(() => countMaterials(plan), [plan]);
  const generated = new Date().toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });

  const downloadCsv = () => {
    const blob = new Blob([materialsCsv(plan, count)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `folha-de-obra-${plan.title.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen bg-canvas print:bg-white">
      <style>{`@page { size: A4 portrait; margin: 12mm; }`}</style>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-3 print:hidden">
        <a href={`/plano/p/${planId}`} className="text-[13px] text-ink-soft hover:text-ink">
          ← Voltar ao plano
        </a>
        <div className="flex gap-2">
          <button onClick={downloadCsv} className="rounded-md border border-border px-3 py-1.5 text-[13px] hover:border-sage">
            Exportar CSV
          </button>
          <button onClick={() => window.print()} className="rounded-md bg-sage px-3 py-1.5 text-[13px] font-medium text-white hover:bg-sage-hover">
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[820px] bg-surface px-8 py-8 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-end justify-between border-b-2 border-ink pb-3">
          <div>
            <div className="text-[11px] font-medium tracking-[0.2em] text-gold uppercase">Folha de obra</div>
            <h1 className="font-serif-display text-[26px] leading-tight font-medium">{plan.title}</h1>
            <div className="text-[13px] text-ink-soft">
              {plan.date ? formatLongDate(plan.date) : "Data por definir"} · {plan.spaces.map((s) => s.name).join(" · ")}
            </div>
          </div>
          <div className="text-right text-[11px] text-ink-faint">
            Gerada em {generated}
            <br />
            Responsável: ____________________
          </div>
        </header>

        <section className="mt-5">
          <h2 className="font-serif-display text-[17px] font-medium">Resumo do material</h2>
          <p className="text-[11px] text-ink-faint">
            Margem de reserva: guardanapos {(plan.materials?.spare.napkins ?? 10)}% · toalhas {(plan.materials?.spare.cloths ?? 0)}% · cadeiras/capas {(plan.materials?.spare.chairs ?? 0)}%
          </p>
          <Sections sections={count.sections} />
        </section>

        {count.bySpace.length > 0 && (
          <section className="mt-6 break-before-page">
            <h2 className="font-serif-display text-[17px] font-medium">Por espaço</h2>
            <div className="mt-1 grid gap-6 md:grid-cols-2 print:grid-cols-2">
              {count.bySpace.map((s) => (
                <div key={s.space} className="break-inside-avoid">
                  <div className="font-serif-display text-[14px] font-medium">{s.space}</div>
                  {s.sections.length ? <Sections sections={s.sections} compact /> : <p className="text-[12px] text-ink-faint">Sem elementos.</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {count.rows.length > 0 && (
          <section className="mt-6 break-before-page">
            <h2 className="font-serif-display text-[17px] font-medium">Mesa a mesa</h2>
            <table className="mt-1 w-full border-collapse text-[11px] print:text-[8pt]">
              <thead>
                <tr className="border-b border-ink text-left text-[10px] tracking-wide text-ink-soft uppercase">
                  <th className="w-5 py-1" />
                  {plan.spaces.length > 1 && <th className="py-1">Espaço</th>}
                  <th className="py-1">Mesa</th>
                  <th className="py-1">Tipo</th>
                  <th className="py-1 text-right">Lug.</th>
                  <th className="py-1 pl-2">Toalha</th>
                  <th className="py-1">Guard.</th>
                  <th className="py-1">Cadeiras</th>
                  <th className="py-1">Capas</th>
                  <th className="py-1">Centro</th>
                  <th className="py-1">Nº</th>
                </tr>
              </thead>
              <tbody>
                {count.rows.map((r) => (
                  <tr key={r.item.id} className="border-b border-border-soft align-top">
                    <td className="py-1">
                      <span className="inline-block h-3 w-3 rounded-sm border border-ink-faint" />
                    </td>
                    {plan.spaces.length > 1 && <td className="py-1 pr-1 text-ink-soft">{r.space}</td>}
                    <td className="py-1 pr-1 font-medium">{r.item.label}</td>
                    <td className="py-1 pr-1">{KINDS[r.item.kind].short}</td>
                    <td className="py-1 text-right tabular-nums">{r.seats}</td>
                    <td className="py-1 pl-2">
                      {r.cloth ? (
                        <>
                          {r.cloth.replace(/^(Redonda|Retangular) /, "")} <span className="text-ink-soft">{r.details.clothColor}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-1">{r.details.napkinColor || "—"}</td>
                    <td className="py-1">{r.details.chairModel || "—"}</td>
                    <td className="py-1">{r.details.chairCover || "—"}</td>
                    <td className="py-1">{r.details.centerpiece ? "sim" : "—"}</td>
                    <td className="py-1">{r.details.tableNumber ? "sim" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {count.notes.length > 0 && (
          <section className="mt-6 break-inside-avoid">
            <h2 className="font-serif-display text-[17px] font-medium">Notas de montagem</h2>
            <ul className="mt-1 space-y-1 text-[12px] print:text-[9pt]">
              {count.notes.map((n, i) => (
                <li key={i} className="flex gap-2 border-b border-border-soft py-1">
                  <span className="inline-block h-3 w-3 shrink-0 translate-y-0.5 rounded-sm border border-ink-faint" />
                  <span>
                    <b className="font-medium">{n.label}</b>
                    {plan.spaces.length > 1 && <span className="text-ink-soft"> ({n.space})</span>}: {n.note}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
