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
          user_id: user.id,
          event_id: event.id,
          google_event_id: created.id,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "event_id" }
      );

      return json({ success: true, google_event_id: created.id });
    }

    const { data: mapRow } = await admin
      .from("google_calendar_event_map")
      .select("google_event_id")
      .eq("event_id", event.id)
      .single();

    if (!mapRow) return json({ success: false, error: "not_synced" }, 404);

    if (action === "update") {
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
      if (!res.ok) throw new Error(await res.text());

      await admin
        .from("google_calendar_event_map")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("event_id", event.id);

      return json({ success: true });
    }

    if (action === "delete") {
      await fetch(`${CALENDAR_EVENTS_API}/${mapRow.google_event_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
