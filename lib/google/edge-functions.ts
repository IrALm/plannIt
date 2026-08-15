import { createClient } from "@/lib/supabase/server";

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

// L'accès Google Calendar est maintenant demandé directement dans
// signInWithGoogle() (features/auth/actions.ts) — un seul écran de
// consentement Google pour la connexion ET Calendar. Pour "reconnecter"
// (après une déconnexion, ou si l'octroi initial a échoué), on ré-invoque
// simplement signInWithGoogle() ailleurs dans l'app plutôt qu'un flux dédié.

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
