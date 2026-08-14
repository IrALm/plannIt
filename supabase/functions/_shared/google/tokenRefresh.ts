import { createAdminClient } from "../supabaseAdmin.ts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Renvoie un access_token Google valide pour cet utilisateur, en le
 * rafraîchissant via le refresh_token si nécessaire. Source unique de
 * vérité pour google-calendar-oauth (à l'échange initial) et google-calendar
 * (avant chaque appel API) — ne pas dupliquer cette logique ailleurs.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = createAdminClient();

  const { data: tokenRow, error } = await supabase
    .from("google_calendar_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !tokenRow) {
    throw new Error("Google Calendar non connecté");
  }

  const expiresAt = new Date(tokenRow.expires_at).getTime();
  const isExpired = expiresAt - Date.now() < 60_000;

  if (!isExpired) return tokenRow.access_token;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: tokenRow.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Échec du rafraîchissement du token Google");
  }

  const refreshed = await res.json();
  const newExpiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000
  ).toISOString();

  await supabase
    .from("google_calendar_tokens")
    .update({ access_token: refreshed.access_token, expires_at: newExpiresAt })
    .eq("user_id", userId);

  return refreshed.access_token;
}
