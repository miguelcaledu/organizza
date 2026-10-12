"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MONTH_ABBR_PT } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import type { Event, Task } from "@/lib/types";

type UpcomingEvent = Event;
type ScheduleItem = { time: string; label: string; person: string };
type OverdueTask = Task & { eventName: string };

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ thisMonth: 0, active: 0, teamTotal: 0, teamBusy: 0, completedThisYear: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([]);
  const [today, setToday] = useState<ScheduleItem[]>([]);
  const [overdue, setOverdue] = useState<OverdueTask[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const yearStart = `${now.getFullYear()}-01-01`;
      const yearEnd = `${now.getFullYear()}-12-31`;

      const [{ data: events }, { data: profiles }, { data: shiftsToday }, { data: tasks }] = await Promise.all([
        supabase.from("events").select("*").order("event_date"),
        supabase.from("profiles").select("id").neq("role", "client"),
        supabase
          .from("shifts")
          .select("start_time, end_time, role_on_shift, profile:profiles!shifts_profile_id_fkey(full_name), event:events(name)")
          .eq("shift_date", todayIso)
          .order("start_time"),
        supabase
          .from("tasks")
          .select("*, event:events(name)")
          .eq("done", false)
          .lt("deadline", todayIso)
          .order("deadline"),
      ]);

      const all = events ?? [];
      setStats({
        thisMonth: all.filter((e) => e.event_date >= monthStart && e.event_date <= monthEnd).length,
        active: all.filter((e) => ["Planeamento", "Produção", "Em curso"].includes(e.status)).length,
        teamTotal: profiles?.length ?? 0,
        teamBusy: new Set((shiftsToday ?? []).map((s: any) => s.profile?.full_name)).size,
        completedThisYear: all.filter((e) => e.status === "Concluído" && e.event_date >= yearStart && e.event_date <= yearEnd).length,
      });
      setUpcoming(all.filter((e) => e.event_date >= todayIso && e.status !== "Cancelado").slice(0, 4));
      setToday(
        (shiftsToday ?? []).map((s: any) => ({
          time: s.start_time?.slice(0, 5) ?? "",
          label: `${s.event?.name ?? "Turno"} — ${s.role_on_shift ?? ""}`,
          person: s.profile?.full_name ?? "",
        }))
      );
      setOverdue((tasks ?? []).map((t: any) => ({ ...t, eventName: t.event?.name ?? "" })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="px-10 py-16 text-center text-sm text-ink-faint">A carregar…</div>;

  return (
    <div className="mx-auto max-w-[1120px] px-10 py-10">
      <h1 className="mb-8 font-serif-display text-[26px] font-medium">Visão geral</h1>

      <div className="mb-10 grid grid-cols-4 gap-5">
        <StatCard label="Eventos este mês" value={stats.thisMonth} />
        <StatCard label="Projetos ativos" value={stats.active} />
        <StatCard label="Equipa disponível hoje" value={`${stats.teamTotal - stats.teamBusy}/${stats.teamTotal}`} sub={`${stats.teamBusy} em evento`} />
        <StatCard label="Eventos concluídos este ano" value={stats.completedThisYear} />
      </div>

      {overdue.length > 0 && (
        <div className="mb-10 flex gap-3 rounded border border-terracotta/20 bg-terracotta-tint px-4.5 py-3.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4703F" strokeWidth="1.8" className="mt-0.5 shrink-0">
            <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9L2.7 17a1.8 1.8 0 001.5 2.7h15.6a1.8 1.8 0 001.5-2.7L13.7 3.9a1.8 1.8 0 00-3.4 0z" />
          </svg>
          <div className="flex flex-col gap-1.5">
            {overdue.slice(0, 4).map((t) => (
              <div key={t.id} className="text-sm">
                <strong>Tarefa atrasada</strong> — &ldquo;{t.label}&rdquo; ({t.eventName}), vencida desde {t.deadline}.
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1.4fr_1fr] gap-10">
        <div>
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Próximos eventos</div>
          <div className="flex flex-col gap-3.5">
            {upcoming.length === 0 && <div className="text-sm text-ink-faint">Sem eventos futuros.</div>}
            {upcoming.map((ev) => {
              const d = new Date(ev.event_date + "T00:00:00");
              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="flex items-center gap-4 rounded border border-border bg-surface p-4"
                  style={{ borderLeft: `3px solid ${statusColor(ev.status)}` }}
                >
                  <div className="w-[46px] shrink-0 text-center">
                    <div className="font-serif-display text-[19px] font-medium">{d.getDate()}</div>
                    <div className="text-[10px] uppercase tracking-wide text-ink-faint">{MONTH_ABBR_PT[d.getMonth()]}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif-display text-[15px] font-medium">{ev.name}</div>
                    <div className="text-xs text-ink-soft">{ev.venue}</div>
                  </div>
                  <StatusBadge status={ev.status} />
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Agenda de hoje</div>
          <div className="flex flex-col">
            {today.length === 0 && <div className="text-sm text-ink-faint">Sem turnos agendados para hoje.</div>}
            {today.map((it, i) => (
              <div key={i} className="flex gap-3.5">
                <div className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-ink-soft">{it.time}</div>
                <div className="flex shrink-0 flex-col items-center">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sage" />
                  {i < today.length - 1 && <div className="min-h-6 w-px flex-1 bg-border" />}
                </div>
                <div className="pb-5">
                  <div className="text-sm">{it.label}</div>
                  <div className="text-xs text-ink-faint">{it.person}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded border border-border bg-surface p-5">
      <div className="mb-3 text-[11px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mb-1.5 font-serif-display text-[32px] font-medium tabular-nums">{value}</div>
      {sub && <div className="text-xs text-ink-faint">{sub}</div>}
    </div>
  );
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    Planeamento: "#B8A88A", "Produção": "#8A9A7B", "Em curso": "#C4703F", "Concluído": "#A8A199", Cancelado: "#8A7F6E",
  };
  return map[status] ?? "#A8A199";
}
