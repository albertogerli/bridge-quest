import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-only jobs (cron, unsubscribe) that
 * run WITHOUT an authenticated user. Bypasses RLS — never import this from
 * client components. Requires SUPABASE_SERVICE_ROLE_KEY (server env only).
 *
 * Left untyped (like the rest of the codebase's Supabase clients) so inserts /
 * updates / rpc accept plain objects; callers cast query results explicitly.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Admin Supabase client non configurato: mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
