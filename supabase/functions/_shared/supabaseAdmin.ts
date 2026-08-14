import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Client service_role — bypass RLS, à n'utiliser que côté Edge Function,
 * jamais exposé au frontend. SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont
 * injectés automatiquement par Supabase dans chaque Edge Function.
 */
export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
