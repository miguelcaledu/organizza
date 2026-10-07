import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Server-only — used for inviting client
// accounts and by the dev auth bypass. Never import from a client component.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
