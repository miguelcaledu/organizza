"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatDateLabel } from "@/lib/constants";
import { daysLeft, purgeDate, TRASH_DAYS } from "@/lib/seating/trash";
import { purgePlanAction, restorePlanAction, type ActionResult } from "../actions";

export interface TrashRow {
  id: string;
  title: string;
  deleted_at: string;
  date: string | null;
  client: { email: string } | null;
  deleter: { full_name: string } | null;
}

export function TrashView({ plans, loadError }: { plans: TrashRow[]; loadError: string | null }) {
  const [flash, setFlash] = useState<ActionResult>(null);
  return (
    <div className="px-10 pb-16 pt-6">
      <Link href="/plantas" className="text-xs text-ink-soft hover:text-ink">
        ← Plantas de sala
      </Link>
      <h1 className="mt-1 font-serif-display text-[26px] font-medium">Lixo</h1>
      <p className="mb-5 text-xs text-ink-soft">
        Planos eliminados ficam aqui durante {TRASH_DAYS} dias e depois são apagados automaticamente, com o histórico de alterações. Enquanto estão no lixo, o casal não os vê e o link de leitura não funciona.
      </p>

      {flash && <div className={`mb-4 rounded px-3 py-2 text-xs ${flash.ok ? "bg-sage-tint text-sage" : "bg-terracotta-tint text-terracotta"}`}>{flash.message}</div>}

      {loadError ? (
        <div className="rounded border border-terracotta/30 bg-terracotta-tint p-4 text-sm text-terracotta">
          Não foi possível carregar o lixo ({loadError}). Confirme que <code>supabase/plans-trash.sql</code> foi executado no Supabase.
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded border border-dashed border-border py-16 text-center text-sm text-ink-faint">O lixo está vazio.</div>
      ) : (
        <div className="overflow-hidden rounded border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] tracking-wide text-ink-faint uppercase">
                <th className="px-4 py-2.5 font-medium">Casal</th>
                <th className="px-4 py-2.5 font-medium">Cliente</th>
                <th className="px-4 py-2.5 font-medium">Eliminado</th>
                <th className="px-4 py-2.5 font-medium">Apagado de vez</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <TrashRowView key={p.id} plan={p} onResult={setFlash} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TrashRowView({ plan, onResult }: { plan: TrashRow; onResult: (r: ActionResult) => void }) {
  const [pending, startTransition] = useTransition();
  const [confirmPurge, setConfirmPurge] = useState(false);
  const left = daysLeft(plan.deleted_at);
  const fmt = (d: Date) => d.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });

  return (
    <tr className="border-b border-border-soft align-top last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium">{plan.title}</div>
        {plan.date && <div className="text-xs text-ink-faint">{formatDateLabel(plan.date)}</div>}
      </td>
      <td className="px-4 py-3 text-ink-soft">{plan.client?.email ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-ink-soft">
        {fmt(new Date(plan.deleted_at))}
        {plan.deleter && <div className="text-ink-faint">por {plan.deleter.full_name}</div>}
      </td>
      <td className="px-4 py-3 text-xs">
        <span className={left <= 3 ? "font-medium text-terracotta" : "text-ink-soft"}>
          {left === 0 ? "hoje" : left === 1 ? "daqui a 1 dia" : `daqui a ${left} dias`}
        </span>
        <div className="text-ink-faint">{fmt(purgeDate(plan.deleted_at))}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-3 text-xs whitespace-nowrap">
          <button
            disabled={pending}
            onClick={() => startTransition(async () => onResult(await restorePlanAction(plan.id)))}
            className="font-medium text-sage hover:underline disabled:opacity-50"
          >
            Restaurar
          </button>
          <button disabled={pending} onClick={() => setConfirmPurge(true)} className="text-terracotta hover:underline disabled:opacity-50">
            Eliminar definitivamente
          </button>
        </div>
        <ConfirmDialog
          open={confirmPurge}
          title={`Eliminar “${plan.title}” definitivamente?`}
          confirmLabel="Eliminar para sempre"
          busy={pending}
          onCancel={() => setConfirmPurge(false)}
          onConfirm={() =>
            startTransition(async () => {
              onResult(await purgePlanAction(plan.id));
              setConfirmPurge(false);
            })
          }
        >
          O plano e todo o histórico de alterações do casal são apagados agora. <b>Esta ação não pode ser desfeita.</b>
        </ConfirmDialog>
      </td>
    </tr>
  );
}
