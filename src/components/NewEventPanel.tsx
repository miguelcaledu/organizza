"use client";

import { useState } from "react";
import { Field, SidePanel, inputClass } from "@/components/SidePanel";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const TYPE_CHOICES = ["Casamento", "Corporativo", "Privado"];
const SERVICE_CHOICES = ["Produção", "Decoração", "Design Floral", "Catering", "Iluminação", "Mobiliário", "Fotografia", "Entretenimento"];

const EMPTY_FORM = { name: "", client: "", type: "Casamento", venue: "", date: "", guests: "", leadId: "" };

export function NewEventPanel({ open, onClose, onCreated, roster }: { open: boolean; onClose: () => void; onCreated: () => void; roster: Profile[] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [services, setServices] = useState<Set<string>>(new Set());
  const [team, setTeam] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm({ ...EMPTY_FORM, leadId: roster[0]?.id ?? "" });
    setTouched({});
    setServices(new Set());
    setTeam(new Set());
  }

  function close() {
    const dirty = form.name || form.client || form.venue || form.date;
    if (dirty && !window.confirm("Descartar as alterações a este evento?")) return;
    reset();
    onClose();
  }

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  }

  async function save() {
    setTouched({ name: true, venue: true, date: true });
    if (!form.name.trim() || !form.venue.trim() || !form.date) return;
    setSaving(true);
    const supabase = createClient();
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        name: form.name.trim(),
        client: form.client.trim() || null,
        type: form.type,
        venue: form.venue.trim(),
        event_date: form.date,
        guests: Number(form.guests) || 0,
        lead_id: form.leadId || null,
        status: "Planeamento",
      })
      .select("id")
      .single();

    if (!error && event) {
      if (services.size) {
        await supabase.from("event_services").insert(Array.from(services).map((label) => ({ event_id: event.id, label })));
      }
      if (team.size) {
        await supabase.from("event_team").insert(Array.from(team).map((profile_id) => ({ event_id: event.id, profile_id })));
      }
      reset();
      onCreated();
      onClose();
    }
    setSaving(false);
  }

  return (
    <SidePanel
      open={open}
      title="Novo evento"
      onClose={close}
      footer={
        <>
          <button onClick={close} className="flex-1 rounded border border-border bg-surface px-2.5 py-2.5 text-sm text-ink-soft">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded bg-sage px-2.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-hover disabled:opacity-60"
          >
            {saving ? "A guardar…" : "Guardar evento"}
          </button>
        </>
      }
    >
      <Field label="Nome do evento" required error={touched.name && !form.name.trim() ? "Campo obrigatório." : undefined}>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          placeholder="ex: Casamento Marta & Nuno"
          className={inputClass}
        />
      </Field>
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Cliente">
            <input value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} className={inputClass} />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Tipo">
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputClass}>
              {TYPE_CHOICES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <Field label="Local" required error={touched.venue && !form.venue.trim() ? "Campo obrigatório." : undefined}>
        <input
          value={form.venue}
          onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
          onBlur={() => setTouched((t) => ({ ...t, venue: true }))}
          placeholder="ex: Quinta da Torre"
          className={inputClass}
        />
      </Field>
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Data" required error={touched.date && !form.date ? "Campo obrigatório." : undefined}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, date: true }))}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Convidados">
            <input
              type="number"
              value={form.guests}
              onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
              className={inputClass}
            />
          </Field>
        </div>
      </div>
      <Field label="Responsável">
        <select value={form.leadId} onChange={(e) => setForm((f) => ({ ...f, leadId: e.target.value }))} className={inputClass}>
          {roster.map((r) => (
            <option key={r.id} value={r.id}>
              {r.full_name}
            </option>
          ))}
        </select>
      </Field>
      <div>
        <div className="mb-2 text-[11px] text-ink-faint">Serviços</div>
        <div className="flex flex-wrap gap-1.5">
          {SERVICE_CHOICES.map((s) => {
            const on = services.has(s);
            return (
              <button
                key={s}
                onClick={() => toggle(services, setServices, s)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
                  on ? "bg-sage text-white" : "border border-border bg-surface text-ink-faint"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[11px] text-ink-faint">Equipa</div>
        <div className="om-scroll flex max-h-[180px] flex-col gap-1.5 overflow-y-auto rounded border border-border p-2">
          {roster.map((r) => {
            const selected = team.has(r.id);
            return (
              <div
                key={r.id}
                onClick={() => toggle(team, setTeam, r.id)}
                className={`flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1.5 ${selected ? "bg-sage-tint" : ""}`}
              >
                <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-sage-tint text-[10px] font-semibold text-sage">
                  {r.full_name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="text-sm">{r.full_name}</div>
                {selected && <span className="ml-auto text-sage">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </SidePanel>
  );
}
