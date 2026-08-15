import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client service_role — bypass RLS, strictement serveur (jamais importé dans
 * un composant client). Réservé aux rares écritures que RLS interdit
 * délibérément à l'utilisateur authentifié lui-même, ex.
 * google_calendar_tokens (cf. migration 00006 : accès service_role only).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
