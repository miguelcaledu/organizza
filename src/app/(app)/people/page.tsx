"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/components/AppContext";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { PeopleHr, Profile } from "@/lib/types";

type Row = Profile & { hr: PeopleHr | null };

export default function PeoplePage() {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [people, setPeople] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("Todos");
  const [contractFilter, setContractFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    (async () => {
      const { data } = await createClient().from("profiles").select("*, hr:people_hr!people_hr_profile_id_fkey(*)").neq("role", "client").order("full_name");
      setPeople((data ?? []).map((p: any) => ({ ...p, hr: p.hr ?? null })));
      setLoading(false);
    })();
  }, [isAdmin, router]);

  const depts = useMemo(() => ["Todos", ...Array.from(new Set(people.map((p) => p.department).filter(Boolean)))], [people]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter(
      (p) =>
        (deptFilter === "Todos" || p.department === deptFilter) &&
        (contractFilter === "Todos" || p.hr?.contract_type === contractFilter) &&
        (statusFilter === "Todos" || p.hr?.status === statusFilter) &&
        (!q || p.full_name.toLowerCase().includes(q))
    );
  }, [people, deptFilter, contractFilter, statusFilter, query]);

  if (!isAdmin) return null;

  return (
    <div className="px-10 pb-16 pt-6">
      <div className="mb-1.5 flex items-center gap-2.5">
        <h1 className="font-serif-display text-[26px] font-medium">Pessoas</h1>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <Icon name="people" size={12} />
          Admin only · Confidencial
        </div>
      </div>
      <div className="mb-6 text-sm text-ink-soft">Registos internos de colaboradores e freelancers.</div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          {depts.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={contractFilter} onChange={(e) => setContractFilter(e.target.value)} className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          {["Todos", "Permanente", "Freelancer"].map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          {["Todos", "Ativo", "Inativo"].map((d) => <option key={d}>{d}</option>)}
        </select>
        <div className="flex w-[200px] items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1.5">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar por nome" className="w-full bg-transparent text-xs outline-none" />
        </div>
        <div className="ml-auto text-xs text-ink-faint">{filtered.length} de {people.length}</div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-ink-faint">A carregar…</div>
      ) : (
        <div className="overflow-hidden rounded border border-border bg-surface">
          <div className="grid border-b border-border bg-canvas" style={{ gridTemplateColumns: "1.6fr 1.3fr 1.1fr 1fr 0.9fr 0.9fr" }}>
            {["Nome", "Função", "Departamento", "Contrato", "Estado", "Início"].map((c) => (
              <div key={c} className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{c}</div>
            ))}
          </div>
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/people/${p.id}`}
              className="grid items-center border-b border-border hover:bg-sage-tint/40"
              style={{ gridTemplateColumns: "1.6fr 1.3fr 1.1fr 1fr 0.9fr 0.9fr" }}
            >
              <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                <Avatar name={p.full_name} color={p.avatar_color} size={30} />
                <div className="text-sm font-medium">{p.full_name}</div>
              </div>
              <div className="px-3.5 py-2.5 text-sm text-ink-soft">{p.job_title}</div>
              <div className="px-3.5 py-2.5 text-sm text-ink-soft">{p.department}</div>
              <div className="px-3.5 py-2.5 text-xs text-ink-soft">{p.hr?.contract_type}</div>
              <div className="px-3.5 py-2.5">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    color: p.hr?.status === "Ativo" ? "#8A9A7B" : "#A8A199",
                    background: p.hr?.status === "Ativo" ? "#8A9A7B1A" : "#A8A1991A",
                  }}
                >
                  {p.hr?.status}
                </span>
              </div>
              <div className="px-3.5 py-2.5 text-xs tabular-nums text-ink-soft">{p.hr?.start_date}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
