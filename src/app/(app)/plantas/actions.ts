"use server";

import { createClient as createPlainClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { blankPlan, samplePlan } from "@/lib/seating/sample";
import { createPlan, getViewer, isPlanId, isStaff } from "@/lib/seating/store";
import { sanitizePlan } from "@/lib/seating/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { TRASH_DAYS } from "@/lib/seating/trash";

export type ActionResult = { ok: boolean; message: string; planId?: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireStaff() {
  const access = await getViewer();
  if (!access || !isStaff(access.viewer)) throw new Error("Sem permissão.");
  return access;
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

function friendlyAuthError(message: string) {
  if (/rate limit/i.test(message)) return "O limite de emails do Supabase foi atingido. Tente daqui a uma hora ou configure um SMTP próprio.";
  return `Não foi possível enviar o convite: ${message}`;
}

/**
 * Attach a client account to a plan, inviting them by email if they don't have
 * one yet. The invite carries role = 'client', which handle_new_user() honours.
 */
async function linkClient(planId: string, rawEmail: string, fullName: string): Promise<{ ok: boolean; message: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Email inválido." };
  const admin = createAdminClient();

  const { data: existing } = await admin.from("profiles").select("id, role").eq("email", email).maybeSingle();
  let clientId: string;
  let message: string;
  if (existing) {
    if (existing.role !== "client") return { ok: false, message: "Este email pertence a um membro da equipa — use o email do casal." };
    clientId = existing.id;
    message = `${email} já tinha conta: o plano aparece quando entrar.`;
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { role: "client", full_name: fullName },
      redirectTo: `${await siteOrigin()}/plano/definir-password`,
    });
    if (error || !data.user) return { ok: false, message: friendlyAuthError(error?.message ?? "erro desconhecido") };
    clientId = data.user.id;
    message = `Convite enviado para ${email}.`;
  }

  const { error } = await admin.from("seating_plans").update({ client_id: clientId }).eq("id", planId);
  if (error) return { ok: false, message: "Não foi possível associar o cliente ao plano." };
  return { ok: true, message };
}

export async function createPlanAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { db, viewer } = await requireStaff();
    const title = String(formData.get("title") ?? "").trim() || "Casamento";
    const date = String(formData.get("date") ?? "") || undefined;
    const email = String(formData.get("email") ?? "").trim();
    const plan = formData.get("start") === "blank" ? blankPlan(title, date) : samplePlan(title, date);
    const planId = await createPlan(db, sanitizePlan(plan), viewer.id);
    revalidatePath("/plantas");
    if (!email) return { ok: true, message: `Plano “${title}” criado. Pode convidar o casal mais tarde.`, planId };
    const r = await linkClient(planId, email, title);
    return { ok: r.ok, message: r.ok ? `Plano “${title}” criado. ${r.message}` : `Plano criado, mas: ${r.message}`, planId };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erro ao criar o plano." };
  }
}

export async function inviteClientAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { db } = await requireStaff();
    const planId = String(formData.get("planId") ?? "");
    if (!isPlanId(planId)) return { ok: false, message: "Plano inválido." };
    const { data: plan } = await db.from("seating_plans").select("title").eq("id", planId).maybeSingle();
    if (!plan) return { ok: false, message: "Plano não encontrado." };
    const r = await linkClient(planId, String(formData.get("email") ?? ""), plan.title);
    revalidatePath("/plantas");
    return { ...r, planId };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erro ao convidar." };
  }
}

/** Emails the couple a link to (re)set their password — also works if they never used the invite. */
export async function resendAccessAction(planId: string): Promise<ActionResult> {
  try {
    const { db } = await requireStaff();
    const { data } = await db.from("seating_plans").select("client:profiles!seating_plans_client_id_fkey(email)").eq("id", planId).maybeSingle();
    const email = (data?.client as { email?: string } | null)?.email;
    if (!email) return { ok: false, message: "Este plano ainda não tem cliente." };
    // implicit flow: the link must work on the couple's device, not this browser
    const sb = createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false },
    });
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${await siteOrigin()}/plano/definir-password` });
    if (error) return { ok: false, message: friendlyAuthError(error.message) };
    return { ok: true, message: `Enviado para ${email} um link para definir a palavra-passe.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erro ao reenviar." };
  }
}

/** "Eliminar": moves the plan to the trash. It's purged for good after TRASH_DAYS. */
export async function deletePlanAction(planId: string): Promise<ActionResult> {
  try {
    const { db, viewer } = await requireStaff();
    if (!isPlanId(planId)) return { ok: false, message: "Plano inválido." };
    const { data, error } = await db
      .from("seating_plans")
      .update({ deleted_at: new Date().toISOString(), deleted_by: viewer.id })
      .eq("id", planId)
      .is("deleted_at", null)
      .select("title")
      .maybeSingle();
    if (error || !data) return { ok: false, message: "Não foi possível eliminar." };
    revalidatePath("/plantas");
    return { ok: true, message: `“${data.title}” foi para o lixo. Pode restaurá-lo durante ${TRASH_DAYS} dias.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erro ao eliminar." };
  }
}

export async function restorePlanAction(planId: string): Promise<ActionResult> {
  try {
    const { db } = await requireStaff();
    if (!isPlanId(planId)) return { ok: false, message: "Plano inválido." };
    const { data, error } = await db
      .from("seating_plans")
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", planId)
      .not("deleted_at", "is", null)
      .select("title")
      .maybeSingle();
    if (error || !data) return { ok: false, message: "Não foi possível restaurar." };
    revalidatePath("/plantas");
    return { ok: true, message: `“${data.title}” foi restaurado.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erro ao restaurar." };
  }
}

/** Permanent delete, only for plans already in the trash. Also removes their change log. */
export async function purgePlanAction(planId: string): Promise<ActionResult> {
  try {
    const { db } = await requireStaff();
    if (!isPlanId(planId)) return { ok: false, message: "Plano inválido." };
    const { data, error } = await db.from("seating_plans").delete().eq("id", planId).not("deleted_at", "is", null).select("title").maybeSingle();
    if (error || !data) return { ok: false, message: "Não foi possível eliminar definitivamente." };
    revalidatePath("/plantas");
    return { ok: true, message: `“${data.title}” foi eliminado definitivamente.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erro ao eliminar." };
  }
}

/** Staff acknowledge the couple's changes: clears the yellow / blue / red highlights. */
export async function markReviewedAction(planId: string): Promise<ActionResult> {
  try {
    const { db, viewer } = await requireStaff();
    if (!isPlanId(planId)) return { ok: false, message: "Plano inválido." };
    const { error } = await db
      .from("seating_plan_changes")
      .update({ reviewed_at: new Date().toISOString(), reviewed_by: viewer.id })
      .eq("plan_id", planId)
      .is("reviewed_at", null);
    if (error) return { ok: false, message: "Não foi possível marcar como visto." };
    revalidatePath("/plantas");
    return { ok: true, message: "Alterações marcadas como vistas." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erro." };
  }
}
