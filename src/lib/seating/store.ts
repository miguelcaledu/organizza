import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { sanitizePlan } from "./validate";
import type { Plan } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Seating-plan access. Editing requires a signed-in user: staff (admin /
// employee) see every plan, a client sees only plans assigned to them. All of
// that is enforced by RLS on seating_plans (supabase/client-accounts.sql), so
// queries here go through the *user's* Supabase client. The read-only venue
// link is the one anonymous path, via the get_seating_plan RPC.
// ─────────────────────────────────────────────────────────────────────────

export interface Viewer {
  id: string | null;
  role: Role;
  name: string;
  email: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

export const isPlanId = (id: string) => UUID_RE.test(id);
export const isViewToken = (t: string) => TOKEN_RE.test(t);
export const isStaff = (v: Viewer) => v.role === "admin" || v.role === "employee";

function devBypass() {
  return process.env.NODE_ENV === "development" && process.env.DEV_BYPASS_AUTH === "1";
}

/**
 * The signed-in user and a Supabase client acting as them. With the dev auth
 * bypass on (and no real session) staff access is simulated with the service
 * role, mirroring what (app)/layout.tsx does for the staff app.
 */
export async function getViewer({ allowDevBypass = true } = {}): Promise<{ viewer: Viewer; db: SupabaseClient } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: p } = await supabase.from("profiles").select("id, role, full_name, email").eq("id", user.id).single();
    if (!p) return null;
    return { viewer: { id: p.id, role: p.role, name: p.full_name, email: p.email }, db: supabase };
  }
  if (allowDevBypass && devBypass()) {
    return { viewer: { id: null, role: "admin", name: "Dev (bypass)", email: "" }, db: createAdminClient() };
  }
  return null;
}

export interface LoadedPlan {
  id: string;
  plan: Plan;
  viewToken: string;
  clientId: string | null;
  updatedAt: string;
}

export async function loadPlan(db: SupabaseClient, id: string): Promise<LoadedPlan | null> {
  if (!isPlanId(id)) return null;
  const { data } = await db.from("seating_plans").select("id, data, view_token, client_id, updated_at").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!data) return null;
  return { id: data.id, plan: sanitizePlan(data.data), viewToken: data.view_token, clientId: data.client_id, updatedAt: data.updated_at };
}

/** Returns the new updated_at, or null when the plan doesn't exist or this user can't edit it. */
export async function savePlan(db: SupabaseClient, id: string, plan: Plan): Promise<string | null> {
  if (!isPlanId(id)) return null;
  const { data, error } = await db.from("seating_plans").update({ data: plan, title: plan.title }).eq("id", id).is("deleted_at", null).select("updated_at").maybeSingle();
  if (error) throw error;
  return data?.updated_at ?? null;
}

export async function createPlan(db: SupabaseClient, plan: Plan, createdBy: string | null): Promise<string> {
  const { data, error } = await db.from("seating_plans").insert({ data: plan, title: plan.title, created_by: createdBy }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function loadByViewToken(token: string): Promise<{ plan: Plan; viewToken: string } | null> {
  if (!isViewToken(token)) return null;
  const anon = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.rpc("get_seating_plan", { p_token: token });
  if (error) throw error;
  if (!data) return null;
  return { plan: sanitizePlan(data.data), viewToken: data.view_token };
}
