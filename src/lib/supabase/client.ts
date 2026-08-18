import { createBrowserClient } from "@supabase/ssr";

// Not typed against the generated Database schema — the app's own domain
// types (src/lib/types.ts) are used for component props/state instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
