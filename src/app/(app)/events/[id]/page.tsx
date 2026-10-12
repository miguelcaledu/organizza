"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import { useIsAdmin, useProfile } from "@/components/AppContext";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Icon, formatDateLabel } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Document, Event, Note, Profile, Task } from "@/lib/types";

type Tab = "Overview" | "Team" | "Files" | "Tasks" | "Notes";
const TABS: Tab[] = ["Overview", "Team", "Files", "Tasks", "Notes"];

export default function EventWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isAdmin = useIsAdmin();
  const me = useProfile();
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [team, setTeam] = useState<{ profile: Profile; role_on_event: string | null }[]>([]);
  const [roster, setRoster] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<(Note & { author: Profile })[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addMemberId, setAddMemberId] = useState("");
  const [newTaskLabel, setNewTaskLabel] = useState("");

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: ev }, { data: svc }, { data: tm }, { data: rst }, { data: tk }, { data: nt }, { data: dc }] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).single(),
      supabase.from("event_services").select("label").eq("event_id", id),
      supabase.from("event_team").select("role_on_event, profile:profiles!event_team_profile_id_fkey(*)").eq("event_id", id),
      supabase.from("profiles").select("*").neq("role", "client").order("full_name"),
      supabase.from("tasks").select("*").eq("event_id", id).order("deadline"),
      supabase.from("notes").select("*, author:profiles!notes_author_id_fkey(*)").eq("event_id", id).order("created_at"),
      supabase.from("documents").select("*").eq("event_id", id).order("created_at"),
    ]);
    setEvent(ev ?? null);
    setServices((svc ?? []).map((s) => s.label));
    setTeam((tm ?? []).map((t: any) => ({ profile: t.profile, role_on_event: t.role_on_event })));
    setRoster(rst ?? []);
    setTasks(tk ?? []);
    setNotes((nt ?? []) as any);
    setDocs(dc ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  const nonTeamRoster = useMemo(() => roster.filter((r) => !team.some((t) => t.profile.id === r.id)), [roster, team]);

  async function toggleTask(taskId: string, done: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done } : t)));
    await createClient().from("tasks").update({ done }).eq("id", taskId);
  }

  async function addTask() {
    if (!newTaskLabel.trim()) return;
    const { data } = await createClient().from("tasks").insert({ event_id: id, label: newTaskLabel.trim() }).select().single();
    if (data) setTasks((prev) => [...prev, data]);
    setNewTaskLabel("");
  }

  async function addNote() {
    if (!newNote.trim()) return;
    const supabase = createClient();
    const { data } = await supabase.from("notes").insert({ event_id: id, author_id: me.id, body: newNote.trim() }).select().single();
    if (data) setNotes((prev) => [...prev, { ...data, author: me }]);
    setNewNote("");
  }

  async function addTeamMember() {
    if (!addMemberId) return;
    await createClient().from("event_team").insert({ event_id: id, profile_id: addMemberId });
    setAddMemberId("");
    load();
  }

  async function uploadFile(file: File) {
    const supabase = createClient();
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (!error) {
      const { data } = await supabase
        .from("documents")
        .insert({ event_id: id, name: file.name, category: "Fichas de Evento", storage_path: path, uploaded_by: me.id, size_bytes: file.size })
        .select()
        .single();
      if (data) setDocs((prev) => [...prev, data]);
    }
  }

  async function downloadFile(doc: Document) {
    const supabase = createClient();
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  if (loading || !event) return <div className="px-10 py-16 text-center text-sm text-ink-faint">A carregar…</div>;

  return (
    <div>
      <div className="relative flex h-[220px] w-full items-end bg-canvas p-10" style={{ background: "linear-gradient(160deg, #FAF8F5, #EFEAE1)" }}>
        <div>
          <div className="mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: statusColor(event.status) }}>
            {event.status}
          </div>
          <div className="mb-2.5 font-serif-display text-[34px] font-medium">{event.name}</div>
          <div className="flex flex-wrap gap-6 text-sm text-ink-soft">
            <span>{formatDateLabel(event.event_date)}</span>
            <span>{event.venue}</span>
            <span>{event.guests} convidados</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border px-10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-3.5 text-[13px] font-medium transition-colors ${
              tab === t ? "border-sage text-ink" : "border-transparent text-ink-faint"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-10 py-8 pb-16">
        {tab === "Overview" && (
          <div className="grid grid-cols-[1.1fr_0.9fr] gap-10">
            <div>
              <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Serviços contratados</div>
              <div className="mb-8 flex flex-wrap gap-2">
                {services.map((s) => (
                  <div key={s} className="rounded-full bg-sage px-3.5 py-1.5 text-xs font-medium text-white">
                    {s}
                  </div>
                ))}
                {services.length === 0 && <div className="text-sm text-ink-faint">Sem serviços definidos.</div>}
              </div>
              <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Detalhes do evento</div>
              <div className="grid grid-cols-2 gap-4">
                <Detail label="Tipo de evento" value={event.type} />
                <Detail label="Convidados" value={String(event.guests)} />
                <Detail label="Local" value={event.venue} />
                <Detail label="Data" value={formatDateLabel(event.event_date)} />
              </div>
            </div>
            <div>
              <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Cliente</div>
              <div className="rounded border border-border bg-surface p-4">
                <div className="text-sm font-medium">{event.client || "—"}</div>
              </div>
            </div>
          </div>
        )}

        {tab === "Team" && (
          <div>
            <div className="mb-4 grid grid-cols-3 gap-4">
              {team.map((t) => (
                <div key={t.profile.id} className="rounded border border-border bg-surface p-4.5">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar name={t.profile.full_name} color={t.profile.avatar_color} size={40} />
                    <div>
                      <div className="text-sm font-medium">{t.profile.full_name}</div>
                      <div className="text-xs text-ink-soft">{t.role_on_event || "Equipa"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <select value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)} className="rounded border border-border px-3 py-2 text-sm">
                  <option value="">Adicionar membro…</option>
                  {nonTeamRoster.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name}
                    </option>
                  ))}
                </select>
                <button onClick={addTeamMember} className="rounded bg-sage px-4 py-2 text-sm font-medium text-white">
                  Adicionar
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "Files" && (
          <div className="max-w-[680px]">
            {isAdmin && (
              <label className="mb-6 flex cursor-pointer flex-col items-center gap-2 rounded border border-dashed border-border p-6 text-center text-xs text-ink-faint hover:border-sage">
                <Icon name="documents" size={20} />
                Clique para carregar um ficheiro
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              </label>
            )}
            <div className="flex flex-col">
              {docs.map((d) => (
                <div key={d.id} onClick={() => downloadFile(d)} className="flex cursor-pointer items-center gap-3.5 border-b border-border py-3 hover:bg-sage-tint">
                  <Icon name="documents" className="shrink-0 text-ink-faint" />
                  <div className="flex-1 text-sm">{d.name}</div>
                  <div className="text-xs text-ink-faint">{(d.size_bytes / 1024).toFixed(0)} KB</div>
                </div>
              ))}
              {docs.length === 0 && <div className="text-sm text-ink-faint">Sem ficheiros.</div>}
            </div>
          </div>
        )}

        {tab === "Tasks" && (
          <div className="max-w-[760px]">
            {isAdmin && (
              <div className="mb-4 flex gap-2">
                <input
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  placeholder="Nova tarefa…"
                  className="flex-1 rounded border border-border px-3 py-2 text-sm"
                />
                <button onClick={addTask} className="rounded bg-sage px-4 py-2 text-sm font-medium text-white">
                  Adicionar
                </button>
              </div>
            )}
            <div className="flex flex-col">
              {tasks.map((t) => {
                const editable = isAdmin || t.responsible_id === me.id;
                const overdue = t.deadline && !t.done && t.deadline < new Date().toISOString().slice(0, 10);
                return (
                  <div key={t.id} className="flex items-center gap-3.5 border-b border-border py-3">
                    <button
                      disabled={!editable}
                      onClick={() => toggleTask(t.id, !t.done)}
                      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded"
                      style={{
                        border: `1.5px solid ${t.done ? "#8A9A7B" : "#E8E3DC"}`,
                        background: t.done ? "#8A9A7B" : "#FFFFFF",
                        cursor: editable ? "pointer" : "default",
                      }}
                    >
                      {t.done && <Icon name="check" size={11} className="text-white" />}
                    </button>
                    <div className={`flex-1 text-sm ${t.done ? "text-ink-faint line-through" : ""}`}>{t.label}</div>
                    <div
                      className="w-[100px] text-right text-xs tabular-nums"
                      style={{ color: overdue ? "#C4703F" : "#A8A199", fontWeight: overdue ? 600 : 400 }}
                    >
                      {t.deadline}
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && <div className="text-sm text-ink-faint">Sem tarefas.</div>}
            </div>
          </div>
        )}

        {tab === "Notes" && (
          <div className="flex max-w-[680px] flex-col gap-4.5">
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escrever uma nota…"
                className="flex-1 rounded border border-border px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addNote()}
              />
              <button onClick={addNote} className="rounded bg-sage px-4 py-2 text-sm font-medium text-white">
                Enviar
              </button>
            </div>
            {notes.map((n) => (
              <div key={n.id} className="flex gap-3">
                <Avatar name={n.author.full_name} color={n.author.avatar_color} size={32} />
                <div className="flex-1">
                  <div className="mb-0.5 flex items-baseline gap-2">
                    <div className="text-sm font-medium">{n.author.full_name}</div>
                    <div className="text-[11px] text-ink-faint">{new Date(n.created_at).toLocaleString("pt-PT")}</div>
                  </div>
                  <div className="text-sm leading-relaxed">{n.body}</div>
                </div>
              </div>
            ))}
            {notes.length === 0 && <div className="text-sm text-ink-faint">Sem notas ainda.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[11px] text-ink-faint">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    Planeamento: "#B8A88A", "Produção": "#8A9A7B", "Em curso": "#C4703F", "Concluído": "#A8A199", Cancelado: "#8A7F6E",
  };
  return map[status] ?? "#A8A199";
}
