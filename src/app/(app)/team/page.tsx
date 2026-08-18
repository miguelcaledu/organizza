"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const AVAIL_COLORS: Record<string, string> = { "Disponível": "#8A9A7B", "Ocupado": "#B8A88A", "Ausente": "#A8A199" };

export default function TeamPage() {
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("Todos");
  const [availFilter, setAvailFilter] = useState("Todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await createClient().from("profiles").select("*").order("full_name");
      setPeople(data ?? []);
      setLoading(false);
    })();
  }, []);

  const depts = useMemo(() => ["Todos", ...Array.from(new Set(people.map((p) => p.department).filter(Boolean)))], [people]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter(
      (p) =>
        (deptFilter === "Todos" || p.department === deptFilter) &&
        (availFilter === "Todos" || p.availability === availFilter) &&
        (!q || p.full_name.toLowerCase().includes(q))
    );
  }, [people, deptFilter, availFilter, query]);

  return (
    <div className="px-10 pb-16 pt-6">
      <h1 className="mb-5 font-serif-display text-[26px] font-medium">Equipa</h1>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          {depts.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value)} className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          {["Todos", "Disponível", "Ocupado", "Ausente"].map((d) => <option key={d}>{d}</option>)}
        </select>
        <div className="flex w-[200px] items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1.5">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar pessoa" className="w-full bg-transparent text-xs outline-none" />
        </div>
        <div className="ml-auto text-xs text-ink-faint">{filtered.length} de {people.length}</div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-ink-faint">A carregar…</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((p) => (
            <Link key={p.id} href={`/team/${p.id}`} className="block rounded border border-border bg-surface p-4 transition-colors hover:border-sage">
              <div className="mb-3 flex items-center gap-2.5">
                <Avatar name={p.full_name} color={p.avatar_color} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.full_name}</div>
                  <div className="text-xs text-ink-soft">{p.job_title}</div>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(p.skills ?? []).slice(0, 3).map((s) => (
                  <div key={s} className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-ink-soft">
                    {s}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: AVAIL_COLORS[p.availability] }}>
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: AVAIL_COLORS[p.availability] }} />
                {p.availability}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
