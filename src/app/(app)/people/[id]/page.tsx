"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/components/AppContext";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { HrDocument, PeopleHr, Profile } from "@/lib/types";

function maskIban(iban: string) {
  return iban.slice(0, 7) + " •••• •••• •••• " + iban.slice(-4);
}
function maskTax(tax: string) {
  return "••• ••• " + tax.slice(-3);
}

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [person, setPerson] = useState<Profile | null>(null);
  const [hr, setHr] = useState<PeopleHr | null>(null);
  const [docs, setDocs] = useState<HrDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [ibanRevealed, setIbanRevealed] = useState(false);
  const [taxRevealed, setTaxRevealed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const [{ data: p }, { data: h }, { data: d }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("people_hr").select("*").eq("profile_id", id).maybeSingle(),
      supabase.from("hr_documents").select("*").eq("profile_id", id).order("created_at"),
    ]);
    setPerson(p ?? null);
    setHr(h ?? null);
    setDocs(d ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdmin]);

  async function save() {
    if (!person || !hr) return;
    setSaving(true);
    const supabase = createClient();
    await Promise.all([
      supabase.from("profiles").update({ job_title: person.job_title, department: person.department }).eq("id", id),
      supabase.from("people_hr").update({ rate: hr.rate, rate_unit: hr.rate_unit, status: hr.status }).eq("profile_id", id),
    ]);
    setSaving(false);
  }

  if (!isAdmin) return null;
  if (loading || !person) return <div className="px-10 py-16 text-center text-sm text-ink-faint">A carregar…</div>;

  return (
    <div className="max-w-[820px] px-10 pb-16 pt-6">
      <Link href="/people" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <Icon name="chevronLeft" size={14} />
        Voltar a Pessoas
      </Link>
      <div className="mb-3.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
        <Icon name="people" size={12} />
        Admin only · Confidencial
      </div>

      <div className="mb-8 flex items-center gap-5">
        <Avatar name={person.full_name} color={person.avatar_color} size={64} />
        <div className="flex-1">
          <div className="font-serif-display text-2xl font-medium">{person.full_name}</div>
          <div className="text-sm text-ink-soft">
            {person.job_title} · {person.department} · {hr?.contract_type}
          </div>
        </div>
        <button onClick={save} disabled={saving} className="rounded bg-sage px-4 py-2.5 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60">
          {saving ? "A guardar…" : "Guardar alterações"}
        </button>
      </div>

      <div className="flex flex-col gap-9">
        <Section title="Emprego">
          <Detail label="Função">
            <input value={person.job_title ?? ""} onChange={(e) => setPerson({ ...person, job_title: e.target.value })} className="w-full border-b border-border bg-transparent text-sm outline-none" />
          </Detail>
          <Detail label="Departamento">
            <input value={person.department ?? ""} onChange={(e) => setPerson({ ...person, department: e.target.value })} className="w-full border-b border-border bg-transparent text-sm outline-none" />
          </Detail>
          {hr && (
            <>
              <Detail label="Estado">
                <select value={hr.status} onChange={(e) => setHr({ ...hr, status: e.target.value as PeopleHr["status"] })} className="w-full border-b border-border bg-transparent text-sm outline-none">
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </Detail>
              <Detail label={`Valor / ${hr.rate_unit}`}>
                <input type="number" value={hr.rate} onChange={(e) => setHr({ ...hr, rate: Number(e.target.value) })} className="w-full border-b border-border bg-transparent text-sm tabular-nums outline-none" />
              </Detail>
              <Detail label="Data de início" value={hr.start_date ?? "—"} />
              <Detail label="Horas semanais" value={`${hr.weekly_hours}h`} />
            </>
          )}
        </Section>

        {hr && (
          <Section title="Pessoal">
            <Detail label="Data de nascimento" value={hr.dob ?? "—"} />
            <Detail label="Morada" value={hr.address ?? "—"} span2 />
            <Detail label="Telefone pessoal" value={hr.personal_phone ?? "—"} />
            <Detail label="Email pessoal" value={hr.personal_email ?? "—"} />
            <Detail label="Contacto de emergência" value={hr.emergency_name ?? "—"} />
            <Detail label="Telefone de emergência" value={hr.emergency_phone ?? "—"} />
          </Section>
        )}

        {hr && (
          <Section title="Pagamento">
            <Detail label="IBAN">
              <div className="flex items-center gap-2.5">
                <span className="text-sm tabular-nums">{ibanRevealed ? hr.iban : maskIban(hr.iban ?? "")}</span>
                <button onClick={() => setIbanRevealed((v) => !v)} className="text-[11px] font-medium text-sage">
                  {ibanRevealed ? "Ocultar" : "Revelar"}
                </button>
              </div>
            </Detail>
            <Detail label="Banco" value={hr.bank_name ?? "—"} />
            <Detail label="NIF">
              <div className="flex items-center gap-2.5">
                <span className="text-sm tabular-nums">{taxRevealed ? hr.tax_id : maskTax(hr.tax_id ?? "")}</span>
                <button onClick={() => setTaxRevealed((v) => !v)} className="text-[11px] font-medium text-sage">
                  {taxRevealed ? "Ocultar" : "Revelar"}
                </button>
              </div>
            </Detail>
          </Section>
        )}

        <Section title="Documentos">
          <div className="col-span-2 overflow-hidden rounded border border-border">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3.5 border-b border-border px-4 py-3">
                <Icon name="documents" className="text-ink-faint" size={14} />
                <div className="flex-1 text-sm">{d.name}</div>
                <div className="text-xs text-ink-faint">{d.expiry ?? "Sem validade"}</div>
              </div>
            ))}
            {docs.length === 0 && <div className="p-4 text-sm text-ink-faint">Sem documentos.</div>}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{title}</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded border border-border bg-surface p-5">{children}</div>
    </div>
  );
}

function Detail({ label, value, span2, children }: { label: string; value?: string; span2?: boolean; children?: React.ReactNode }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <div className="mb-0.5 text-[11px] text-ink-faint">{label}</div>
      {children ?? <div className="text-sm">{value}</div>}
    </div>
  );
}
