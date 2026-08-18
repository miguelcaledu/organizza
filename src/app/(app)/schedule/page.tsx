"use client";

import { useEffect, useMemo, useState } from "react";
import { useIsAdmin } from "@/components/AppContext";
import { Avatar } from "@/components/Avatar";
import { Field, SidePanel, inputClass } from "@/components/SidePanel";
import { Icon, WEEKDAYS_PT } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Event, Profile, Shift } from "@/lib/types";

type ShiftRow = Shift & { profileName: string; eventName: string };

function mondayOf(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function overlaps(a: ShiftRow, b: ShiftRow) {
  return a.shift_date === b.shift_date && a.profile_id === b.profile_id && a.id !== b.id && a.start_time < b.end_time && b.start_time < a.end_time;
}

const EMPTY_FORM = { profileId: "", eventId: "", role: "", date: "", start: "09:00", end: "17:00", location: "" };

export default function SchedulePage() {
  const isAdmin = useIsAdmin();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [roster, setRoster] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86400000)), [weekStart]);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: rst }, { data: evs }, { data: sh }] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("events").select("*").order("event_date"),
      supabase
        .from("shifts")
        .select("*, profile:profiles!shifts_profile_id_fkey(full_name), event:events(name)")
        .gte("shift_date", isoDate(weekDates[0]))
        .lte("shift_date", isoDate(weekDates[6])),
    ]);
    setRoster(rst ?? []);
    setEvents(evs ?? []);
    setShifts((sh ?? []).map((s: any) => ({ ...s, profileName: s.profile?.full_name ?? "?", eventName: s.event?.name ?? "" })));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const conflictIds = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((a) => shifts.forEach((b) => overlaps(a, b) && set.add(a.id)));
    return set;
  }, [shifts]);

  async function moveShift(shiftId: string, profileId: string, date: string) {
    setShifts((prev) => prev.map((s) => (s.id === shiftId ? { ...s, profile_id: profileId, shift_date: date } : s)));
    await createClient().from("shifts").update({ profile_id: profileId, shift_date: date }).eq("id", shiftId);
  }

  async function saveShift() {
    if (!form.profileId || !form.date || !form.start || !form.end) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("shifts")
      .insert({
        profile_id: form.profileId,
        event_id: form.eventId || null,
        shift_date: form.date,
        start_time: form.start,
        end_time: form.end,
        role_on_shift: form.role,
        location: form.location,
      })
      .select("*, profile:profiles!shifts_profile_id_fkey(full_name), event:events(name)")
      .single();
    if (data) {
      setShifts((prev) => [...prev, { ...data, profileName: (data as any).profile?.full_name ?? "?", eventName: (data as any).event?.name ?? "" }]);
      setForm(EMPTY_FORM);
      setPanelOpen(false);
    }
  }

  return (
    <div className="px-10 pb-16 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-serif-display text-[26px] font-medium">Calendário</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart((d) => new Date(d.getTime() - 7 * 86400000))} className="rounded border border-border p-1.5 text-ink-soft">
            <Icon name="chevronLeft" size={14} />
          </button>
          <span className="text-sm text-ink-soft">
            {weekDates[0].toLocaleDateString("pt-PT")} – {weekDates[6].toLocaleDateString("pt-PT")}
          </span>
          <button onClick={() => setWeekStart((d) => new Date(d.getTime() + 7 * 86400000))} className="rounded border border-border p-1.5 text-ink-soft">
            <Icon name="chevronRight" size={14} />
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setForm({ ...EMPTY_FORM, profileId: roster[0]?.id ?? "", date: isoDate(weekDates[0]) });
                setPanelOpen(true);
              }}
              className="ml-3 flex items-center gap-1.5 rounded bg-sage px-4 py-2.5 text-sm font-medium text-white hover:bg-sage-hover"
            >
              <Icon name="plus" size={13} />
              Adicionar turno
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-ink-faint">A carregar…</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid border-b border-border pb-2" style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}>
              <div />
              {weekDates.map((d) => (
                <div key={d.toISOString()} className="text-center">
                  <div className="text-[11px] uppercase tracking-wide text-ink-faint">{WEEKDAYS_PT[(d.getDay() + 6) % 7]}</div>
                  <div className="text-sm font-medium tabular-nums">{d.getDate()}/{d.getMonth() + 1}</div>
                </div>
              ))}
            </div>

            {roster.map((p) => (
              <div key={p.id} className="grid items-stretch border-b border-border" style={{ gridTemplateColumns: "180px repeat(7, 1fr)", minHeight: 64 }}>
                <div className="flex items-center gap-2 py-2">
                  <Avatar name={p.full_name} color={p.avatar_color} size={26} />
                  <div className="text-sm">{p.full_name}</div>
                </div>
                {weekDates.map((d) => {
                  const dateIso = isoDate(d);
                  const key = p.id + "-" + dateIso;
                  const cellShifts = shifts.filter((s) => s.profile_id === p.id && s.shift_date === dateIso);
                  return (
                    <div
                      key={key}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => setDragOverKey(key)}
                      onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                      onDrop={() => {
                        if (dragId) moveShift(dragId, p.id, dateIso);
                        setDragId(null);
                        setDragOverKey(null);
                      }}
                      className="border-r border-border p-1"
                      style={{ background: dragOverKey === key ? "#8A9A7B0F" : "transparent" }}
                    >
                      {cellShifts.map((s) => {
                        const conflict = conflictIds.has(s.id);
                        return (
                          <div
                            key={s.id}
                            draggable={isAdmin}
                            onDragStart={() => setDragId(s.id)}
                            onDragEnd={() => setDragId(null)}
                            title={`${s.eventName} · ${s.role_on_shift} · ${s.start_time}–${s.end_time}`}
                            className="mb-1 rounded px-2 py-1"
                            style={{
                              borderLeft: `3px solid ${conflict ? "#C4703F" : "#8A9A7B"}`,
                              background: conflict ? "#C4703F0D" : "#FFFFFF",
                              border: `1px solid ${conflict ? "#C4703F55" : "#E8E3DC"}`,
                              borderLeftWidth: 3,
                              cursor: isAdmin ? (dragId === s.id ? "grabbing" : "grab") : "default",
                              opacity: dragId === s.id ? 0.5 : 1,
                            }}
                          >
                            <div className="truncate text-[11px] font-semibold">{s.eventName || s.role_on_shift}</div>
                            <div className="truncate text-[10px] text-ink-soft">{s.role_on_shift}</div>
                            <div className="text-[10px] tabular-nums text-ink-faint">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <SidePanel
        open={panelOpen}
        title="Novo turno"
        onClose={() => setPanelOpen(false)}
        footer={
          <>
            <button onClick={() => setPanelOpen(false)} className="flex-1 rounded border border-border px-2.5 py-2.5 text-sm text-ink-soft">
              Cancelar
            </button>
            <button onClick={saveShift} className="flex-1 rounded bg-sage px-2.5 py-2.5 text-sm font-medium text-white hover:bg-sage-hover">
              Guardar turno
            </button>
          </>
        }
      >
        <Field label="Pessoa">
          <select value={form.profileId} onChange={(e) => setForm((f) => ({ ...f, profileId: e.target.value }))} className={inputClass}>
            {roster.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
          </select>
        </Field>
        <Field label="Evento">
          <select value={form.eventId} onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value }))} className={inputClass}>
            <option value="">—</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </Field>
        <Field label="Função">
          <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="ex: Assistente de Produção" className={inputClass} />
        </Field>
        <Field label="Data">
          <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} />
        </Field>
        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="Início">
              <input type="time" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} className={inputClass} />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Fim">
              <input type="time" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} className={inputClass} />
            </Field>
          </div>
        </div>
        <Field label="Local">
          <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className={inputClass} />
        </Field>
      </SidePanel>
    </div>
  );
}
