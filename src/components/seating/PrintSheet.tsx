"use client";

import { isTable, KINDS } from "@/lib/seating/catalog";
import { bounds, footprint } from "@/lib/seating/geometry";
import { seatLabel, stats } from "@/lib/seating/ops";
import { formatLongDate } from "@/lib/constants";
import type { Plan } from "@/lib/seating/types";
import { guestsBySeat, PlanDrawing } from "./PlanDrawing";

// Hidden on screen, shown only when printing (window.print → "Guardar como PDF").
// Page 1 is the floor plan; following pages list every table's seats and an
// alphabetical guest index, which is what venues actually work from on the day.

export function PrintSheet({ plan }: { plan: Plan }) {
  const s = stats(plan);
  const seated = guestsBySeat(plan.guests);
  const tables = plan.items.filter(isTable).sort((a, b) => a.label.localeCompare(b.label, "pt", { numeric: true }));
  const pts = [...plan.room.outline, ...plan.items.flatMap(footprint)];
  const b = pts.length ? bounds(pts) : { minX: 0, minY: 0, w: 1000, h: 1000 };
  const pad = 120;
  const viewBox = `${b.minX - pad} ${b.minY - pad} ${b.w + pad * 2} ${b.h + pad * 2}`;
  const guests = [...plan.guests].sort((a, c) => a.name.localeCompare(c.name, "pt"));
  const unseated = guests.filter((g) => !g.seat);

  return (
    <div className="seating-print hidden bg-white text-ink print:block">
      <style>{`@page { size: A4 landscape; margin: 10mm; }`}</style>

      <section className="flex h-[188mm] flex-col break-after-page">
        <header className="mb-2 flex items-end justify-between border-b border-border pb-2">
          <div>
            <div className="font-serif-display text-[22pt] leading-none">{plan.title}</div>
            {plan.date && <div className="mt-1 text-[10pt] text-ink-soft">{formatLongDate(plan.date)}</div>}
          </div>
          <div className="text-right text-[9pt] text-ink-soft">
            {s.tables} mesas · {s.seats} lugares · {s.seated}/{s.guests} convidados sentados
            <br />
            Planta à escala · grelha de 1 m
          </div>
        </header>
        <svg viewBox={viewBox} className="min-h-0 w-full flex-1" preserveAspectRatio="xMidYMid meet">
          <PlanDrawing plan={{ ...plan, settings: { ...plan.settings, showNames: true } }} mode="static" />
        </svg>
      </section>

      <section className="break-after-page">
        <h2 className="font-serif-display mb-3 text-[16pt]">Mesas e lugares</h2>
        <div className="columns-3 gap-6 text-[9pt]">
          {tables.map((t) => (
            <div key={t.id} className="mb-4 break-inside-avoid">
              <div className="flex items-baseline justify-between border-b border-border pb-0.5">
                <b className="font-serif-display text-[11pt] font-medium">{t.label}</b>
                <span className="text-[8pt] text-ink-soft">{KINDS[t.kind].short}</span>
              </div>
              <ol className="mt-1">
                {Array.from({ length: t.seats ?? 0 }, (_, i) => {
                  const g = seated.get(`${t.id}:${i}`);
                  return (
                    <li key={i} className="flex gap-2 py-px">
                      <span className="w-4 text-right text-ink-faint">{i + 1}</span>
                      <span className={g ? "" : "text-ink-faint"}>
                        {g?.name ?? "—"}
                        {g?.note ? <span className="text-ink-soft"> ({g.note})</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif-display mb-3 text-[16pt]">Lista de convidados</h2>
        <div className="columns-3 gap-6 text-[9pt]">
          {guests.map((g) => (
            <div key={g.id} className="flex justify-between gap-2 border-b border-border-soft py-0.5 break-inside-avoid">
              <span>{g.name}</span>
              <span className={g.seat ? "text-ink-soft" : "text-terracotta"}>{seatLabel(plan, g.seat) ?? "por sentar"}</span>
            </div>
          ))}
        </div>
        {unseated.length > 0 && <p className="mt-3 text-[9pt] text-terracotta">{unseated.length} convidado(s) ainda sem lugar.</p>}
      </section>
    </div>
  );
}
