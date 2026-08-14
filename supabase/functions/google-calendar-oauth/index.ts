import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

// OAuth Google Calendar API — distinct de l'OAuth "Login with Google" de
// Supabase Auth (M3). Scope calendar dédié, tokens stockés côté serveur
// uniquement (table google_calendar_tokens, accès service_role only).
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const STATE_TTL_MS = 10 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function redirectUri() {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-oauth`;
}

function fallbackSiteUrl() {
  return Deno.env.get("SITE_URL") ?? "http://localhost:3000";
}

/**
 * Origines autorisées à recevoir la redirection post-OAuth : la valeur passée
 * par le frontend (dev = localhost, prod = domaine Vercel, cf. getURL() côté
 * Next.js) n'est acceptée que si elle figure ici — sinon fallback sur
 * SITE_URL. Liste = ALLOWED_APP_ORIGINS ("a,b,c") si défini, sinon juste
 * SITE_URL. Défense en profondeur : l'origine vient normalement déjà d'un
 * appel authentifié server-side, pas d'un input utilisateur brut.
 */
function allowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_APP_ORIGINS");
  if (raw) return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [fallbackSiteUrl()];
}

function resolveOrigin(candidate: string | null): string {
  if (candidate && allowedOrigins().includes(candidate)) return candidate;
  return fallbackSiteUrl();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = createAdminClient();

  // --- Déconnexion : appel fetch authentifié depuis les Réglages ---
  if (req.method === "DELETE") {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "unauthorized" }, 401);

    await admin.from("google_calendar_tokens").delete().eq("user_id", user.id);
    await admin
      .from("user_preferences")
      .update({ google_calendar_connected: false, google_email: null })
      .eq("user_id", user.id);

    return json({ success: true });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // --- Callback : redirection brute de Google, aucun header d'auth possible ---
  if (code && state) {
    const { data: stateRow } = await admin
      .from("oauth_states")
      .select("user_id, return_to, origin, created_at")
      .eq("state", state)
      .single();

    if (!stateRow) {
      return Response.redirect(`${fallbackSiteUrl()}/settings?google=error`, 302);
    }
    await admin.from("oauth_states").delete().eq("state", state);
    const returnTo = stateRow.return_to || "/settings";
    const origin = stateRow.origin || fallbackSiteUrl();

    const isExpired =
      Date.now() - new Date(stateRow.created_at).getTime() > STATE_TTL_MS;
    if (isExpired) {
      return Response.redirect(`${origin}${returnTo}?google=error`, 302);
    }

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        redirect_uri: redirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return Response.redirect(`${origin}${returnTo}?google=error`, 302);
    }

    const tokens = await tokenRes.json();
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    let googleEmail: string | null = null;
    try {
      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      if (userInfoRes.ok) {
        googleEmail = (await userInfoRes.json()).email ?? null;
      }
    } catch {
      // non bloquant : l'email est juste affiché dans les Réglages
    }

    await admin.from("google_calendar_tokens").upsert({
      user_id: stateRow.user_id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      google_email: googleEmail,
      scope: tokens.scope ?? SCOPE,
    });

    await admin
      .from("user_preferences")
      .update({ google_calendar_connected: true, google_email: googleEmail })
      .eq("user_id", stateRow.user_id);

    return Response.redirect(`${origin}${returnTo}?google=connected`, 302);
  }

  // --- Initiation : appel fetch authentifié depuis le frontend ---
  const user = await getUserFromRequest(req);
  if (!user) return json({ error: "unauthorized" }, 401);

  const returnTo = url.searchParams.get("return_to") || "/settings";
  const origin = resolveOrigin(url.searchParams.get("origin"));

  const { data: stateRow, error } = await admin
    .from("oauth_states")
    .insert({ user_id: user.id, return_to: returnTo, origin })
    .select("state")
    .single();

  if (error || !stateRow) return json({ error: "failed_to_start" }, 500);

  const consentUrl = new URL(GOOGLE_AUTH_URL);
  consentUrl.searchParams.set("client_id", Deno.env.get("GOOGLE_CLIENT_ID")!);
  consentUrl.searchParams.set("redirect_uri", redirectUri());
  consentUrl.searchParams.set("response_type", "code");
  consentUrl.searchParams.set("scope", SCOPE);
  consentUrl.searchParams.set("access_type", "offline");
  consentUrl.searchParams.set("prompt", "consent");
  consentUrl.searchParams.set("state", stateRow.state);

  return json({ url: consentUrl.toString() });
});
