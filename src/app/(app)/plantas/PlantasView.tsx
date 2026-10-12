"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ChangeLegend } from "@/components/seating/Panels";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatDateLabel } from "@/lib/constants";
import { TRASH_DAYS } from "@/lib/seating/trash";
import { CHANGE_COLORS, type ChangeKind } from "@/lib/seating/clientEdits";
import { NewPlanWizard } from "./NewPlanWizard";
import { deletePlanAction, inviteClientAction, resendAccessAction, type ActionResult } from "./actions";

export interface PlanRow {
  id: string;
  title: string;
  updated_at: string;
  view_token: string;
  date: string | null;
  client: { full_name: string; email: string } | null;
}

export interface ActivityRow {
  id: number;
  plan_id: string;
  kind: ChangeKind;
  summary: string;
  actor_name: string;
  created_at: string;
  reviewed_at: string | null;
}

function Notice({ result }: { result: ActionResult }) {
  if (!result) return null;
  return <div className={`rounded px-3 py-2 text-xs ${result.ok ? "bg-sage-tint text-sage" : "bg-terracotta-tint text-terracotta"}`}>{result.message}</div>;
}

export function PlantasView({
  plans,
  pendingByPlan,
  recent,
  trashCount,
  loadError,
}: {
  plans: PlanRow[];
  trashCount: number;
  pendingByPlan: Record<string, number>;
  recent: ActivityRow[];
  loadError: string | null;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [flash, setFlash] = useState<ActionResult>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(t);
  }, [flash]);

  const totalPending = Object.values(pendingByPlan).reduce((a, b) => a + b, 0);
  const titles = new Map(plans.map((p) => [p.id, p.title]));
  const needle = query.trim().toLowerCase();
  const filtered = plans.filter((p) => !needle || p.title.toLowerCase().includes(needle) || (p.client?.email ?? "").includes(needle));

  return (
    <div className="px-10 pb-16 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-[26px] font-medium">Plantas de sala</h1>
          <div className="text-xs text-ink-soft">Painel de controlo de todos os mapas e das alterações feitas pelos casais.</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/plantas/lixo" className="rounded border border-border bg-surface px-3.5 py-2 text-sm text-ink-soft hover:border-sage hover:text-ink">
            Lixo{trashCount ? ` (${trashCount})` : ""}
          </Link>
          <button onClick={() => setPanelOpen(true)} className="rounded bg-sage px-3.5 py-2 text-sm font-medium text-white hover:bg-sage-hover">
            + Novo plano
          </button>
        </div>
      </div>

      {!loadError && (
        <div className="mb-6 grid grid-cols-3 gap-4 xl:grid-cols-[repeat(3,minmax(0,180px))_1fr]">
          <Stat label="Planos" value={plans.length} />
          <Stat label="Casais com acesso" value={plans.filter((p) => p.client).length} />
          <Stat label="Alterações por rever" value={totalPending} accent={totalPending > 0} />
          <div className="col-span-3 rounded border border-border bg-surface px-4 py-3 xl:col-span-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] tracking-wide text-ink-faint uppercase">Atividade recente dos casais</div>
              <ChangeLegend compact />
            </div>
            {recent.length === 0 ? (
              <div className="py-2 text-xs text-ink-faint">Sem alterações ainda.</div>
            ) : (
              <ul className="om-scroll max-h-[132px] space-y-1 overflow-y-auto">
                {recent.map((c) => (
                  <li key={c.id} className={`flex items-start gap-2 text-xs ${c.reviewed_at ? "opacity-55" : ""}`}>
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full border" style={{ background: CHANGE_COLORS[c.kind].fill, borderColor: CHANGE_COLORS[c.kind].stroke }} />
                    <Link href={`/plano/p/${c.plan_id}`} className="min-w-0 flex-1 truncate hover:text-sage">
                      <b className="font-medium">{titles.get(c.plan_id) ?? "Plano"}</b> · {c.summary}
                    </Link>
                    <span className="shrink-0 text-ink-faint">{new Date(c.created_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <div className="flex w-[240px] items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1.5">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar casal ou email" className="w-full bg-transparent text-xs outline-none" />
        </div>
        <div className="ml-auto text-xs text-ink-faint">
          {filtered.length} de {plans.length}
        </div>
      </div>

      {flash && (
        <div className="mb-4">
          <Notice result={flash} />
        </div>
      )}

      {loadError ? (
        <div className="rounded border border-terracotta/30 bg-terracotta-tint p-4 text-sm text-terracotta">
          Não foi possível carregar os planos ({loadError}). Confirme que <code>supabase/client-accounts.sql</code> foi executado no Supabase.
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded border border-dashed border-border py-16 text-center text-sm text-ink-faint">
          Ainda não há planos. Crie o primeiro e convide o casal por email.
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] tracking-wide text-ink-faint uppercase">
                <th className="px-4 py-2.5 font-medium">Casal</th>
                <th className="px-4 py-2.5 font-medium">Data</th>
                <th className="px-4 py-2.5 font-medium">Cliente (acesso)</th>
                <th className="px-4 py-2.5 font-medium">Por rever</th>
                <th className="px-4 py-2.5 font-medium">Atualizado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <PlanRowView key={p.id} plan={p} pending={pendingByPlan[p.id] ?? 0} onResult={setFlash} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panelOpen && <NewPlanWizard onClose={() => setPanelOpen(false)} />}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded border border-border bg-surface px-4 py-3">
      <div className="text-[11px] tracking-wide text-ink-faint uppercase">{label}</div>
      <div className={`font-serif-display mt-1 text-[28px] ${accent ? "text-[#B8890F]" : ""}`}>{value}</div>
    </div>
  );
}

function PlanRowView({ plan, pending: pendingCount, onResult }: { plan: PlanRow; pending: number; onResult: (r: ActionResult) => void }) {
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invite = (fd: FormData) =>
    startTransition(async () => {
      const r = await inviteClientAction(null, fd);
      if (r?.ok) {
        onResult(r);
        setInviting(false);
        setInviteError(null);
      } else setInviteError(r?.message ?? "Erro ao convidar.");
    });

  const run = (fn: () => Promise<ActionResult>) => startTransition(async () => onResult(await fn()));

  return (
    <tr className="border-b border-border-soft align-top last:border-0">
      <td className="px-4 py-3">
        <Link href={`/plano/p/${plan.id}`} className="font-medium hover:text-sage">
          {plan.title}
        </Link>
      </td>
      <td className="px-4 py-3 text-ink-soft">{plan.date ? formatDateLabel(plan.date) : "—"}</td>
      <td className="px-4 py-3">
        {plan.client ? (
          <div>
            <div className="text-ink">{plan.client.email}</div>
            <button disabled={pending} onClick={() => run(() => resendAccessAction(plan.id))} className="text-xs text-sage hover:underline disabled:opacity-50">
              Reenviar acesso
            </button>
          </div>
        ) : inviting ? (
          <form action={invite} className="flex flex-col gap-1.5">
            <input type="hidden" name="planId" value={plan.id} />
            <div className="flex gap-1.5">
              <input name="email" type="email" required autoFocus placeholder="email do casal" className="w-48 rounded border border-border px-2 py-1 text-xs outline-none focus:border-sage" />
              <button disabled={pending} className="rounded bg-sage px-2.5 text-xs font-medium text-white disabled:opacity-60">
                {pending ? "…" : "Convidar"}
              </button>
              <button type="button" onClick={() => setInviting(false)} className="text-xs text-ink-faint">
                Cancelar
              </button>
            </div>
            {inviteError && <div className="text-[11px] text-terracotta">{inviteError}</div>}
          </form>
        ) : (
          <button onClick={() => setInviting(true)} className="text-xs text-sage hover:underline">
            + Convidar casal
          </button>
        )}
      </td>
      <td className="px-4 py-3">
        {pendingCount > 0 ? (
          <Link href={`/plano/p/${plan.id}`} className="rounded-full bg-[#FBE7A1] px-2 py-0.5 text-xs font-medium text-[#8A6A08]" title="Abrir o plano e ver as alterações a cores">
            {pendingCount}
          </Link>
        ) : (
          <span className="text-xs text-ink-faint">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-ink-faint">{new Date(plan.updated_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-3 text-xs whitespace-nowrap">
          <Link href={`/plano/p/${plan.id}`} className="font-medium text-sage hover:underline">
            Abrir
          </Link>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(`${window.location.origin}/plano/v/${plan.view_token}`).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-ink-soft hover:text-ink"
            title="Copiar o link só de leitura (para a quinta / catering)"
          >
            {copied ? "Copiado ✓" : "Link leitura"}
          </button>
          <button disabled={pending} onClick={() => setConfirmDelete(true)} className="text-terracotta hover:underline disabled:opacity-50">
            Eliminar
          </button>
        </div>
        <ConfirmDialog
          open={confirmDelete}
          title={`Eliminar “${plan.title}”?`}
          confirmLabel="Mover para o lixo"
          busy={pending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() =>
            startTransition(async () => {
              onResult(await deletePlanAction(plan.id));
              setConfirmDelete(false);
            })
          }
        >
          O plano vai para o <b>Lixo</b>, onde pode ser restaurado durante {TRASH_DAYS} dias. Depois disso é eliminado automaticamente, com o histórico de alterações.
          {plan.client && (
            <>
              {" "}Entretanto, o casal (<b>{plan.client.email}</b>) deixa de o ver e o link de leitura deixa de funcionar.
            </>
          )}
        </ConfirmDialog>
      </td>
    </tr>
  );
}
