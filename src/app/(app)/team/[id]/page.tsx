"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Icon, WEEKDAYS_PT } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Event, Profile } from "@/lib/types";

const AVAIL_COLORS: Record<string, string> = { "Disponível": "#8A9A7B", "Ocupado": "#B8A88A", "Ausente": "#A8A199" };

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [person, setPerson] = useState<Profile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [busyDates, setBusyDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const [{ data: p }, { data: team }, { data: shifts }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("event_team").select("event:events(*)").eq("profile_id", id),
        supabase.from("shifts").select("shift_date").eq("profile_id", id).gte("shift_date", monthStart).lte("shift_date", monthEnd),
      ]);
      setPerson(p ?? null);
      setEvents((team ?? []).map((t: any) => t.event).filter(Boolean));
      setBusyDates(new Set((shifts ?? []).map((s) => s.shift_date)));
      setLoading(false);
    })();
  }, [id]);

  if (loading || !person) return <div className="px-10 py-16 text-center text-sm text-ink-faint">A carregar…</div>;

  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells: { day: number | ""; busy?: boolean }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: "" });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, busy: busyDates.has(iso) });
  }

  return (
    <div className="max-w-[1000px] px-10 pb-16 pt-6">
      <Link href="/team" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <Icon name="chevronLeft" size={14} />
        Voltar à equipa
      </Link>

      <div className="mb-8 flex items-center gap-5">
        <Avatar name={person.full_name} color={person.avatar_color} size={64} />
        <div className="flex-1">
          <div className="font-serif-display text-2xl font-medium">{person.full_name}</div>
          <div className="text-sm text-ink-soft">{person.job_title} · {person.department}</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: AVAIL_COLORS[person.availability] }}>
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: AVAIL_COLORS[person.availability] }} />
          {person.availability}
        </div>
      </div>

      <div className="mb-9 flex flex-wrap gap-1.5">
        {(person.skills ?? []).map((s) => (
          <div key={s} className="rounded-full bg-sage-tint px-3.5 py-1.5 text-xs font-medium text-[#5F6E52]">
            {s}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div>
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Eventos participados</div>
          <div className="flex flex-col">
            {events.map((ev) => (
              <Link key={ev.id} href={`/events/${ev.id}`} className="flex items-center gap-3 border-b border-border py-2.5 pl-3">
                <div className="flex-1">
                  <div className="font-serif-display text-sm font-medium">{ev.name}</div>
                  <div className="text-xs text-ink-soft">{ev.venue}</div>
                </div>
                <StatusBadge status={ev.status} />
              </Link>
            ))}
            {events.length === 0 && <div className="text-sm text-ink-faint">Sem eventos ainda.</div>}
          </div>
        </div>

        <div>
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Disponibilidade — {now.toLocaleDateString("pt-PT", { month: "long" })}
          </div>
          <div className="grid grid-cols-7 gap-px border border-border bg-border">
            {WEEKDAYS_PT.map((wl) => (
              <div key={wl} className="bg-surface p-1 text-center text-[9px] uppercase text-ink-faint">{wl}</div>
            ))}
            {cells.map((c, i) => (
              <div
                key={i}
                className="min-h-[30px] p-1 text-center text-[10px] tabular-nums"
                style={{ background: c.busy ? "#B8A88A1A" : "#8A9A7B0D", color: c.busy ? "#B8A88A" : "#5F6E52" }}
              >
                {c.day}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
