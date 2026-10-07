"use client";

import { useActionState, useEffect, useState } from "react";
import { useIsAdmin, useProfile } from "@/components/AppContext";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { NotificationPrefs, Profile, Role } from "@/lib/types";
import { inviteStaffAction } from "./actions";

export default function SettingsPage() {
  const isAdmin = useIsAdmin();
  const me = useProfile();
  const [profile, setProfile] = useState<Profile>(me);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [invite, inviteAction, inviting] = useActionState(inviteStaffAction, null);
  const [reloadKey, setReloadKey] = useState(0);
  // refresh the user list once an invite succeeds
  const [seenInvite, setSeenInvite] = useState(invite);
  if (invite !== seenInvite) {
    setSeenInvite(invite);
    if (invite?.ok) setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: p } = await supabase.from("notification_prefs").select("*").eq("profile_id", me.id).maybeSingle();
      setPrefs(p ?? { profile_id: me.id, notif_email: true, notif_sms: false, notif_schedule: true, notif_docs: true });
      if (isAdmin) {
        const { data: u } = await supabase.from("profiles").select("*").neq("role", "client").order("full_name");
        setUsers(u ?? []);
      }
    })();
  }, [me.id, isAdmin, reloadKey]);

  async function saveProfile() {
    setSaving(true);
    await createClient().from("profiles").update({ full_name: profile.full_name, phone: profile.phone }).eq("id", profile.id);
    setSaving(false);
    setSavedAt(Date.now());
  }

  async function togglePref(key: keyof NotificationPrefs) {
    if (!prefs || typeof prefs[key] !== "boolean") return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await createClient().from("notification_prefs").upsert(next);
  }

  async function changeRole(userId: string, role: Role) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    await createClient().from("profiles").update({ role }).eq("id", userId);
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-9 px-10 pb-20 pt-6">
      <h1 className="font-serif-display text-[26px] font-medium">Definições</h1>

      <Section title="Perfil">
        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-5">
          <div className="flex items-center gap-3.5">
            <Avatar name={profile.full_name} color={profile.avatar_color} size={52} />
            <div>
              <div className="text-[15px] font-medium">{profile.full_name}</div>
              <div className="text-xs text-ink-faint">{isAdmin ? "Administrador" : "Colaborador"}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <LabeledInput label="Nome" value={profile.full_name} onChange={(v) => setProfile({ ...profile, full_name: v })} />
            <LabeledInput label="Email" value={profile.email} disabled />
            <LabeledInput label="Telefone" value={profile.phone ?? ""} onChange={(v) => setProfile({ ...profile, phone: v })} />
          </div>
          <button onClick={saveProfile} disabled={saving} className="self-start rounded bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60">
            {saving ? "A guardar…" : savedAt ? "Guardado ✓" : "Guardar"}
          </button>
        </div>
      </Section>

      <Section title="Notificações">
        <div className="rounded-md border border-border bg-surface">
          {prefs &&
            (
              [
                ["notif_email", "Notificações por email", "Novos eventos, alterações de horário e tarefas atribuídas."],
                ["notif_sms", "Notificações por SMS", "Alertas urgentes apenas."],
                ["notif_schedule", "Alterações de escala", "Avisar quando o meu horário for alterado."],
                ["notif_docs", "Documentos a expirar", "Lembrete 30 dias antes da validade expirar."],
              ] as [keyof NotificationPrefs, string, string][]
            ).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between border-b border-border-soft px-5 py-3.5 last:border-b-0">
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-ink-faint">{desc}</div>
                </div>
                <button
                  onClick={() => togglePref(key)}
                  className="h-5 w-9 rounded-full p-0.5 transition-colors"
                  style={{ background: prefs[key] ? "#8A9A7B" : "#E8E3DC" }}
                >
                  <div className="h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: prefs[key] ? "translateX(16px)" : "translateX(0)" }} />
                </button>
              </div>
            ))}
        </div>
      </Section>

      {isAdmin && (
        <Section title="Utilizadores & funções">
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b border-border-soft px-5 py-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <Avatar name={u.full_name} color={u.avatar_color} size={34} />
                  <div>
                    <div className="text-sm font-medium">{u.full_name}</div>
                    <div className="text-xs text-ink-faint">{u.email}</div>
                  </div>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value as Role)}
                  disabled={u.id === me.id}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: u.role === "admin" ? "#8A9A7B1A" : "#A8A1991A", color: u.role === "admin" ? "#5F6E52" : "#6B655D" }}
                >
                  <option value="admin">Administrador</option>
                  <option value="employee">Colaborador</option>
                </select>
              </div>
            ))}
          </div>
          <form
            action={inviteAction}
            className="flex flex-col gap-3 rounded-md border border-border bg-surface p-5"
          >
            <div>
              <div className="text-sm font-medium">Convidar colaborador</div>
              <div className="text-xs text-ink-faint">Recebe um email para definir a palavra-passe. Contas novas não têm acesso até serem convidadas aqui.</div>
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2.5">
              <input name="full_name" required placeholder="Nome" className="rounded border border-border px-2.5 py-2 text-sm outline-none" />
              <input name="email" type="email" required placeholder="email@organizza.pt" className="rounded border border-border px-2.5 py-2 text-sm outline-none" />
              <select name="role" defaultValue="employee" className="rounded border border-border px-2.5 py-2 text-sm">
                <option value="employee">Colaborador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className={`text-xs ${invite?.ok ? "text-sage" : "text-terracotta"}`}>{invite?.message}</div>
              <button disabled={inviting} className="shrink-0 rounded bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60">
                {inviting ? "A enviar…" : "Enviar convite"}
              </button>
            </div>
          </form>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{title}</div>
      {children}
    </section>
  );
}

function LabeledInput({ label, value, onChange, disabled }: { label: string; value: string; onChange?: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-soft">{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="rounded border border-border px-2.5 py-2 text-sm outline-none disabled:bg-canvas disabled:text-ink-faint"
      />
    </div>
  );
}
