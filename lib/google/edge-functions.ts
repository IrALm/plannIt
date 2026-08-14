import { createClient } from "@/lib/supabase/server";
import { getURL } from "@/lib/utils/url";

const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

async function authedFetch(path: string, options: RequestInit = {}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Non authentifié");

  return fetch(`${FUNCTIONS_URL}/${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Démarre le flux OAuth Google Calendar : renvoie l'URL de consentement Google
 * à ouvrir. `returnTo` (ex. "/onboarding") est le chemin à rouvrir après le
 * callback — par défaut "/settings". L'origine (localhost en dev, domaine
 * Vercel en prod) est déterminée côté serveur via getURL() et transmise à
 * l'Edge Function, qui l'utilisera pour construire la redirection finale —
 * pas de secret SITE_URL à changer manuellement entre les deux environnements.
 */
export async function startGoogleCalendarConnect(returnTo = "/settings"): Promise<string> {
  const origin = await getURL();
  const res = await authedFetch(
    `google-calendar-oauth?return_to=${encodeURIComponent(returnTo)}&origin=${encodeURIComponent(origin)}`
  );
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Échec de connexion Google");
  return data.url as string;
}

export async function disconnectGoogleCalendar() {
  await authedFetch("google-calendar-oauth", { method: "DELETE" });
}

type SyncEvent = {
  id: string;
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
};

/**
 * Best-effort : un échec de sync Google ne doit jamais faire échouer la
 * sauvegarde locale de l'événement (cf. plan M6). Appelée après un
 * create/update/delete réussi dans features/events/actions.ts.
 */
export async function syncEventToGoogle(
  action: "create" | "update" | "delete",
  event: SyncEvent
) {
  try {
    await authedFetch("google-calendar", {
      method: "POST",
      body: JSON.stringify({ action, event }),
    });
  } catch {
    // silencieux — la Google Calendar API peut être injoignable, le token
    // expiré au-delà du refresh, ou l'utilisateur non connecté à Google.
  }
}
