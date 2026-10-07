"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getViewer } from "@/lib/seating/store";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteResult = { ok: boolean; message: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Admin-only: invite a colleague by email. Public sign-up is closed (new
 * accounts start without access), so this is the way staff accounts are made.
 */
export async function inviteStaffAction(_prev: InviteResult, formData: FormData): Promise<InviteResult> {
  const access = await getViewer();
  if (!access || access.viewer.role !== "admin") return { ok: false, message: "Só administradores podem convidar colaboradores." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = formData.get("role") === "admin" ? "admin" : "employee";
  if (!fullName) return { ok: false, message: "Indique o nome." };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Email inválido." };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("profiles").select("role").eq("email", email).maybeSingle();
  if (existing) {
    return {
      ok: false,
      message: existing.role === "client" ? "Este email pertence a um cliente (casal)." : "Já existe um colaborador com este email.",
    };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)/.test(host) ? "http" : "https");
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${proto}://${host}/plano/definir-password`,
  });
  if (error || !data.user) {
    const msg = error?.message ?? "erro desconhecido";
    return { ok: false, message: /rate limit/i.test(msg) ? "Limite de emails do Supabase atingido — tente mais tarde ou configure um SMTP próprio." : `Não foi possível enviar o convite: ${msg}` };
  }

  // the profile is created without access by the sign-up trigger; grant the staff role here
  const { error: roleError } = await admin.from("profiles").update({ role, full_name: fullName }).eq("id", data.user.id);
  if (roleError) return { ok: false, message: "Convite enviado, mas não foi possível atribuir a função. Altere-a na lista abaixo." };

  revalidatePath("/settings");
  return { ok: true, message: `Convite enviado para ${email}.` };
}
