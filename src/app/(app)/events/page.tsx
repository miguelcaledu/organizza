"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { NewEventPanel } from "@/components/NewEventPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { useIsAdmin } from "@/components/AppContext";
import { Icon, MEMBER_COLORS, WEEKDAYS_PT, formatDateLabel } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Event, Profile } from "@/lib/types";

type EventRow = Event & {
  services: string[];
  team: { profile_id: string; name: string }[];
  leadName: string;
};

type View = "Cartões" | "Tabela" | "Calendário";
type SortKey = "name" | "client" | "event_date" | "venue" | "guests" | "leadName" | "status";

export default function EventsPage() {
  const isAdmin = useIsAdmin();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [roster, setRoster] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("Cartões");
  const [panelOpen, setPanelOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [locationFilter, setLocationFilter] = useState("Todos");
  const [responsibleFilter, setResponsibleFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("event_date");
  const [sortAsc, setSortAsc] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: profiles }, { data: rows }] = await Promise.all([
      supabase.from("profiles").select("*").neq("role", "client").order("full_name"),
      supabase
        .from("events")
        .select("*, lead:profiles!events_lead_id_fkey(full_name), event_services(label), event_team(profile_id, profile:profiles!event_team_profile_id_fkey(full_name))"),
    ]);
    setRoster(profiles ?? []);
    setEvents(
      (rows ?? []).map((r: any) => ({
        ...r,
        leadName: r.lead?.full_name ?? "—",
        services: (r.event_services ?? []).map((s: any) => s.label),
        team: (r.event_team ?? []).map((t: any) => ({ profile_id: t.profile_id, name: t.profile?.full_name ?? "?" })),
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const today = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (statusFilter === "Próximos" && !(new Date(ev.event_date) >= today && ev.status !== "Cancelado")) return false;
      if (!["Todos", "Próximos"].includes(statusFilter) && ev.status !== statusFilter) return false;
      if (typeFilter !== "Todos" && ev.type !== typeFilter) return false;
      if (locationFilter !== "Todos" && ev.venue !== locationFilter) return false;
      if (responsibleFilter !== "Todos" && ev.leadName !== responsibleFilter) return false;
      if (dateFrom && ev.event_date < dateFrom) return false;
      if (dateTo && ev.event_date > dateTo) return false;
      return true;
    });
  }, [events, statusFilter, typeFilter, locationFilter, responsibleFilter, dateFrom, dateTo, today]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortAsc]);

  const typeOptions = ["Todos", "Casamento", "Corporativo", "Privado"];
  const locationOptions = ["Todos", ...Array.from(new Set(events.map((e) => e.venue)))];
  const responsibleOptions = ["Todos", ...Array.from(new Set(events.map((e) => e.leadName)))];
  const statusOptions = ["Todos", "Próximos", "Planeamento", "Produção", "Concluído", "Cancelado"];

  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (statusFilter !== "Todos") activeChips.push({ label: "Estado: " + statusFilter, onRemove: () => setStatusFilter("Todos") });
  if (typeFilter !== "Todos") activeChips.push({ label: "Tipo: " + typeFilter, onRemove: () => setTypeFilter("Todos") });
  if (locationFilter !== "Todos") activeChips.push({ label: "Local: " + locationFilter, onRemove: () => setLocationFilter("Todos") });
  if (responsibleFilter !== "Todos") activeChips.push({ label: "Responsável: " + responsibleFilter, onRemove: () => setResponsibleFilter("Todos") });
  if (dateFrom || dateTo)
    activeChips.push({ label: `Período: ${dateFrom || "…"} – ${dateTo || "…"}`, onRemove: () => { setDateFrom(""); setDateTo(""); } });

  function sortBy(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div className="px-10 pb-16 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-serif-display text-[26px] font-medium">Eventos</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 rounded border border-border bg-surface p-0.5">
            {(["Cartões", "Tabela", "Calendário"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  view === v ? "bg-sage text-white" : "text-ink-soft"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-1.5 rounded bg-sage px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-hover"
            >
              <Icon name="plus" size={13} />
              Novo evento
            </button>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          {statusOptions.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          {typeOptions.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          {locationOptions.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select value={responsibleFilter} onChange={(e) => setResponsibleFilter(e.target.value)} className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          {responsibleOptions.map((o) => <option key={o}>{o}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-border px-2 py-1.5 text-xs text-ink-soft" />
        <span className="text-xs text-ink-faint">até</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-border px-2 py-1.5 text-xs text-ink-soft" />
      </div>

      {activeChips.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <div key={chip.label} className="flex items-center gap-1.5 rounded-full bg-sage-tint py-1.5 pl-3 pr-1.5 text-xs text-[#5F6E52]">
              {chip.label}
              <span onClick={chip.onRemove} className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-sage/15">
                ✕
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 text-xs text-ink-faint">
        {filtered.length} de {events.length} eventos
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-ink-faint">A carregar…</div>
      ) : view === "Cartões" ? (
        filtered.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onAdd={() => setPanelOpen(true)} />
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {sorted.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="block overflow-hidden rounded border border-border bg-surface"
                style={{ borderLeft: `3px solid ${statusColor(ev.status)}` }}
              >
                <div className="relative flex h-[150px] items-center justify-center bg-canvas text-xs text-ink-faint">
                  {ev.venue}
                  <div
                    className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: statusColor(ev.status) }}
                  >
                    {ev.status}
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-1 font-serif-display text-[17px] font-medium">{ev.name}</div>
                  <div className="mb-2.5 text-sm text-ink-soft">{ev.client}</div>
                  <div className="mb-3 flex flex-col gap-1">
                    <Row label="Data" value={formatDateLabel(ev.event_date)} />
                    <Row label="Local" value={ev.venue} />
                    <Row label="Convidados" value={String(ev.guests)} />
                  </div>
                  <div className="flex">
                    {ev.team.map((m, i) => (
                      <Avatar key={m.profile_id} name={m.name} color={MEMBER_COLORS[i % 4]} size={24} offset={i === 0 ? 0 : -6} />
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : view === "Tabela" ? (
        <div className="overflow-hidden rounded border border-border bg-surface">
          <div className="grid border-b border-border bg-canvas" style={{ gridTemplateColumns: "1.6fr 1.2fr 0.9fr 1.2fr 0.7fr 1fr 0.9fr 1.4fr" }}>
            {[
              ["name", "Evento"], ["client", "Cliente"], ["event_date", "Data"], ["venue", "Local"],
              ["guests", "Convidados"], ["leadName", "Responsável"], ["status", "Estado"], ["services", "Serviços"],
            ].map(([key, label]) => (
              <div
                key={key}
                onClick={() => sortBy(key as SortKey)}
                className="flex cursor-pointer items-center gap-1 px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint"
              >
                {label}
                {sortKey === key ? (sortAsc ? " ↑" : " ↓") : ""}
              </div>
            ))}
          </div>
          {sorted.map((ev) => (
            <Link
              key={ev.id}
              href={`/events/${ev.id}`}
              onMouseEnter={() => setHoveredId(ev.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="grid items-center border-b border-border"
              style={{
                gridTemplateColumns: "1.6fr 1.2fr 0.9fr 1.2fr 0.7fr 1fr 0.9fr 1.4fr",
                borderLeft: `3px solid ${statusColor(ev.status)}`,
                background: hoveredId === ev.id ? "#8A9A7B08" : "transparent",
              }}
            >
              <div className="px-3.5 py-2.5 font-serif-display text-sm font-medium">{ev.name}</div>
              <div className="px-3.5 py-2.5 text-sm text-ink-soft">{ev.client}</div>
              <div className="px-3.5 py-2.5 text-xs text-ink-soft tabular-nums">{formatDateLabel(ev.event_date)}</div>
              <div className="px-3.5 py-2.5 text-xs text-ink-soft">{ev.venue}</div>
              <div className="px-3.5 py-2.5 text-xs text-ink-soft tabular-nums">{ev.guests}</div>
              <div className="px-3.5 py-2.5 text-xs text-ink-soft">{ev.leadName}</div>
              <div className="px-3.5 py-2.5">
                <StatusBadge status={ev.status} />
              </div>
              <div className="truncate px-3.5 py-2.5 text-[11px] text-ink-faint">{ev.services.join(" · ")}</div>
            </Link>
          ))}
        </div>
      ) : (
        <CalendarView events={filtered} />
      )}

      <NewEventPanel open={panelOpen} onClose={() => setPanelOpen(false)} onCreated={load} roster={roster} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5 text-xs text-ink-soft">
      <span className="text-ink-faint">{label}</span>
      {value}
    </div>
  );
}

function EmptyState({ isAdmin, onAdd }: { isAdmin: boolean; onAdd: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="mb-2 font-serif-display text-xl font-medium">Nenhum evento encontrado.</div>
      <div className="mb-5 text-sm text-ink-soft">Ajuste os filtros{isAdmin ? " ou crie um novo evento" : ""} para começar.</div>
      {isAdmin && (
        <button onClick={onAdd} className="rounded bg-sage px-4.5 py-2.5 text-sm font-medium text-white">
          Adicionar evento
        </button>
      )}
    </div>
  );
}

function CalendarView({ events }: { events: EventRow[] }) {
  const first = new Date(2026, 7, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const cells: { day: number | ""; events: EventRow[] }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: "", events: [] });
  for (let d = 1; d <= 31; d++) {
    const iso = `2026-08-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, events: events.filter((e) => e.event_date === iso) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: "", events: [] });

  return (
    <div>
      <div className="mb-4 text-sm text-ink-soft">Agosto 2026</div>
      <div className="grid grid-cols-7 gap-px border border-border bg-border">
        {WEEKDAYS_PT.map((wl) => (
          <div key={wl} className="bg-surface p-1.5 text-center text-[10px] uppercase tracking-wide text-ink-faint">
            {wl}
          </div>
        ))}
        {cells.map((c, i) => (
          <div key={i} className="min-h-[76px] bg-surface p-1.5">
            <div className="text-xs tabular-nums">{c.day}</div>
            {c.events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="mt-0.5 block truncate rounded px-1 py-0.5 text-[10px]"
                style={{ color: statusColor(e.status), background: statusColor(e.status) + "1A" }}
              >
                {e.name}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    Planeamento: "#B8A88A", "Produção": "#8A9A7B", "Em curso": "#C4703F", "Concluído": "#A8A199", Cancelado: "#8A7F6E",
  };
  return map[status] ?? "#A8A199";
}
