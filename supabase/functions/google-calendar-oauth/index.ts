import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Déconnexion de Google Calendar uniquement. L'accès Calendar est désormais
// demandé directement dans signInWithGoogle() (un seul écran de consentement
// Google pour la connexion ET Calendar) — les tokens sont capturés dans
// app/auth/callback/route.ts depuis la session Supabase Auth
// (provider_token/provider_refresh_token), plus besoin d'un flux OAuth
// séparé ici pour l'initiation/le callback.

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "DELETE") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const user = await getUserFromRequest(req);
  if (!user) return json({ error: "unauthorized" }, 401);

  const admin = createAdminClient();

  await admin.from("google_calendar_tokens").delete().eq("user_id", user.id);
  await admin
    .from("user_preferences")
    .update({ google_calendar_connected: false, google_email: null })
    .eq("user_id", user.id);

  return json({ success: true });
});
