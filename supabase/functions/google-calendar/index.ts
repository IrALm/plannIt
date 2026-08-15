import { getUserFromRequest } from "../_shared/auth.ts";
import { getValidAccessToken } from "../_shared/google/tokenRefresh.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { captureException } from "../_shared/sentry.ts";

const CALENDAR_EVENTS_API =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

type SyncAction = "create" | "update" | "delete";
type SyncEvent = {
  id: string;
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
};
type AdminClient = ReturnType<typeof createAdminClient>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toGoogleEvent(event: SyncEvent) {
  return {
    summary: event.title,
    description: event.description ?? undefined,
    start: { dateTime: event.startAt },
    end: { dateTime: event.endAt },
  };
}

/** Crée l'événement côté Google et (ré)écrit le mapping — utilisé à la
 * création initiale, et en secours quand une mise à jour vise un événement
 * qui n'existe plus/jamais existé côté Google (cf. action "update"). */
async function createOnGoogle(
  admin: AdminClient,
  accessToken: string,
  userId: string,
  event: SyncEvent
) {
  const res = await fetch(CALENDAR_EVENTS_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toGoogleEvent(event)),
  });
  if (!res.ok) throw new Error(await res.text());
  const created = await res.json();

  await admin.from("google_calendar_event_map").upsert(
    {
      user_id: userId,
      event_id: event.id,
      google_event_id: created.id,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "event_id" }
  );

  return created.id as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const user = await getUserFromRequest(req);
  if (!user) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => null);
  const action = body?.action as SyncAction | undefined;
  const event = body?.event as SyncEvent | undefined;

  if (!action || !event?.id) return json({ error: "invalid_payload" }, 400);

  try {
    const accessToken = await getValidAccessToken(user.id);
    const admin = createAdminClient();

    if (action === "create") {
      const googleEventId = await createOnGoogle(admin, accessToken, user.id, event);
      return json({ success: true, google_event_id: googleEventId });
    }

    const { data: mapRow } = await admin
      .from("google_calendar_event_map")
      .select("google_event_id")
      .eq("event_id", event.id)
      .single();

    if (action === "update") {
      // Pas (ou plus) de mapping — soit jamais synchronisé, soit supprimé
      // directement dans Google Calendar entre-temps : on recrée plutôt que
      // d'échouer, pour qu'une modification dans PlannIt fasse toujours
      // réapparaître l'événement côté Google.
      if (!mapRow) {
        await createOnGoogle(admin, accessToken, user.id, event);
        return json({ success: true, recreated: true });
      }

      const res = await fetch(
        `${CALENDAR_EVENTS_API}/${mapRow.google_event_id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(toGoogleEvent(event)),
        }
      );

      const bodyText = await res.text();

      // Google ne renvoie pas toujours une vraie erreur HTTP pour un événement
      // supprimé : une suppression via l'UI Google Calendar laisse souvent
      // l'événement en place avec status:"cancelled" (suppression "douce",
      // pour la cohérence de sync) — le PATCH réussit alors (200 OK) sans
      // rien faire réapparaître. D'où la vérification du statut en plus du
      // code HTTP.
      let isCancelled = false;
      if (res.ok) {
        try {
          isCancelled = JSON.parse(bodyText)?.status === "cancelled";
        } catch {
          // réponse non-JSON inattendue : traité comme un succès normal ci-dessous.
        }
      }

      if (res.status === 404 || res.status === 410 || isCancelled) {
        // L'événement mappé n'existe plus (ou plus visiblement) côté Google :
        // on le recrée avec un nouvel id plutôt que d'abandonner.
        await createOnGoogle(admin, accessToken, user.id, event);
        return json({ success: true, recreated: true });
      }
      if (!res.ok) throw new Error(bodyText);

      await admin
        .from("google_calendar_event_map")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("event_id", event.id);

      return json({ success: true });
    }

    if (action === "delete") {
      if (mapRow) {
        await fetch(`${CALENDAR_EVENTS_API}/${mapRow.google_event_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
      await admin
        .from("google_calendar_event_map")
        .delete()
        .eq("event_id", event.id);

      return json({ success: true });
    }

    return json({ success: false, error: "unknown_action" }, 400);
  } catch (err) {
    await captureException(err, { function: "google-calendar", action: String(action) });
    return json({ success: false, error: String(err) }, 500);
  }
});
