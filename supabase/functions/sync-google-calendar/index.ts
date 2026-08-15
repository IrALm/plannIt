import { parse } from "npm:date-fns@4";
import { fromZonedTime } from "npm:date-fns-tz@3.2.0";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { getValidAccessToken } from "../_shared/google/tokenRefresh.ts";
import { captureException } from "../_shared/sentry.ts";

const EVENTS_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const APP_TIME_ZONE = "Europe/Paris";

// Fenêtre du tout premier sync (pas de syncToken encore) : le passé récent +
// un horizon raisonnable pour un planning perso — au-delà, un syncToken
// Google reste borné par la fenêtre de son sync initial, donc un événement
// créé dans Google à plus de 180 jours ne remonterait jamais. Limite
// assumée, documentée dans le README.
const INITIAL_LOOKBACK_MS = 60 * 24 * 60 * 60 * 1000;
const INITIAL_LOOKAHEAD_MS = 180 * 24 * 60 * 60 * 1000;

type AdminClient = ReturnType<typeof createAdminClient>;

type GoogleEventItem = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type ApplyResult = "imported" | "updated" | "deleted" | "skipped";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Résout les bornes réelles d'un item Google, qu'il ait une heure précise
 * (start.dateTime) ou soit "toute la journée" (start.date seul) — le schéma
 * `events` n'a pas de notion d'événement toute la journée, donc on le
 * représente comme un bloc couvrant exactement ces jours-là à Paris.
 * end.date est déjà exclusif côté Google (jour suivant le dernier jour),
 * donc directement utilisable comme borne de fin.
 */
function resolveEventRange(item: GoogleEventItem): { startAt: string; endAt: string; allDay: boolean } | null {
  if (item.start?.dateTime && item.end?.dateTime) {
    return { startAt: item.start.dateTime, endAt: item.end.dateTime, allDay: false };
  }
  if (item.start?.date && item.end?.date) {
    const startLocal = parse(item.start.date, "yyyy-MM-dd", new Date());
    const endLocal = parse(item.end.date, "yyyy-MM-dd", new Date());
    return {
      startAt: fromZonedTime(startLocal, APP_TIME_ZONE).toISOString(),
      endAt: fromZonedTime(endLocal, APP_TIME_ZONE).toISOString(),
      allDay: true,
    };
  }
  return null;
}

/**
 * Applique un item Google Calendar (créé/modifié/supprimé) à `events`, via
 * la table de correspondance google_calendar_event_map (déjà utilisée dans
 * l'autre sens par l'Edge Function google-calendar).
 */
async function applyItem(
  admin: AdminClient,
  userId: string,
  item: GoogleEventItem,
  defaultReminders: number[]
): Promise<ApplyResult> {
  const { data: mapRow } = await admin
    .from("google_calendar_event_map")
    .select("event_id")
    .eq("user_id", userId)
    .eq("google_event_id", item.id)
    .single();

  if (item.status === "cancelled") {
    if (!mapRow) return "skipped";
    // Ne supprime la copie PlannIt que si Google en était l'origine — un
    // événement créé dans PlannIt reste la propriété de PlannIt même si sa
    // copie Google est supprimée : elle est recréée au prochain edit
    // (cf. google-calendar/index.ts) plutôt que d'entraîner la suppression
    // de l'original.
    const { data: existing } = await admin
      .from("events")
      .select("synced_from_google")
      .eq("id", mapRow.event_id)
      .single();
    if (!existing?.synced_from_google) return "skipped";

    await admin.from("events").delete().eq("id", mapRow.event_id);
    return "deleted";
  }

  const range = resolveEventRange(item);
  if (!range) return "skipped";

  // Un rappel "30 min avant minuit" n'a pas de sens pour un événement toute
  // la journée — seule la notification automatique de démarrage (offset 0,
  // gérée par send-push-reminders indépendamment de `reminders`) s'applique.
  const reminders = range.allDay ? [] : defaultReminders;

  if (mapRow) {
    const { data: existing } = await admin
      .from("events")
      .select("start_at")
      .eq("id", mapRow.event_id)
      .single();
    if (!existing) return "skipped";

    // Même précaution que la correction d'updateEvent côté Next.js : ne
    // réinitialiser reminders_sent que si l'heure a réellement changé, pour
    // ne pas spammer de rappels en double sur une modif cosmétique.
    const startChanged = new Date(existing.start_at).getTime() !== new Date(range.startAt).getTime();

    await admin
      .from("events")
      .update({
        title: item.summary || "(Sans titre)",
        description: item.description ?? null,
        start_at: range.startAt,
        end_at: range.endAt,
        ...(startChanged ? { reminders_sent: [] } : {}),
      })
      .eq("id", mapRow.event_id);

    await admin
      .from("google_calendar_event_map")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("event_id", mapRow.event_id);
    return "updated";
  }

  const { data: created, error } = await admin
    .from("events")
    .insert({
      user_id: userId,
      title: item.summary || "(Sans titre)",
      description: item.description ?? null,
      start_at: range.startAt,
      end_at: range.endAt,
      reminders,
      google_event_id: item.id,
      synced_from_google: true,
    })
    .select("id")
    .single();
  if (error || !created) return "skipped";

  await admin.from("google_calendar_event_map").insert({
    user_id: userId,
    event_id: created.id,
    google_event_id: item.id,
    last_synced_at: new Date().toISOString(),
  });
  return "imported";
}

/** Sync complet d'un utilisateur : pagine jusqu'au bout, applique chaque
 * item, puis persiste le nextSyncToken pour le prochain passage. */
async function syncUser(admin: AdminClient, userId: string, storedSyncToken: string | null) {
  const accessToken = await getValidAccessToken(userId);

  const items: GoogleEventItem[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;

  do {
    const params = new URLSearchParams({ singleEvents: "true", maxResults: "250" });
    if (storedSyncToken) {
      params.set("syncToken", storedSyncToken);
    } else {
      params.set("timeMin", new Date(Date.now() - INITIAL_LOOKBACK_MS).toISOString());
      params.set("timeMax", new Date(Date.now() + INITIAL_LOOKAHEAD_MS).toISOString());
    }
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${EVENTS_API}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 410) {
      // syncToken expiré/invalide : on repart de zéro au prochain passage.
      await admin.from("google_calendar_tokens").update({ sync_token: null }).eq("user_id", userId);
      return { imported: 0, updated: 0, deleted: 0 };
    }
    if (!res.ok) throw new Error(`Google Calendar API ${res.status}: ${await res.text()}`);

    const data = await res.json();
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
    nextSyncToken = data.nextSyncToken;
  } while (pageToken);

  const counts = { imported: 0, updated: 0, deleted: 0 };
  if (items.length) {
    const { data: prefs } = await admin
      .from("user_preferences")
      .select("default_reminders")
      .eq("user_id", userId)
      .single();
    const defaultReminders = prefs?.default_reminders ?? [30, 5];

    for (const item of items) {
      const result = await applyItem(admin, userId, item, defaultReminders);
      if (result !== "skipped") counts[result]++;
    }
  }

  if (nextSyncToken) {
    await admin.from("google_calendar_tokens").update({ sync_token: nextSyncToken }).eq("user_id", userId);
  }

  return counts;
}

/**
 * Import Google Calendar → PlannIt (le sens inverse, PlannIt → Google,
 * existe déjà via features/events/actions.ts + l'Edge Function
 * google-calendar). Appelée toutes les 10 min par pg_cron (migration 00014).
 *
 * Utilise le syncToken officiel de l'API Calendar (incrémental, inclut les
 * suppressions) plutôt qu'un simple events.list borné par date — sinon
 * impossible de distinguer "jamais existé" de "supprimé depuis le dernier
 * passage".
 */
Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const admin = createAdminClient();
  const { data: tokenRows } = await admin.from("google_calendar_tokens").select("user_id, sync_token");

  let usersProcessed = 0;
  const totals = { imported: 0, updated: 0, deleted: 0 };

  for (const row of tokenRows ?? []) {
    try {
      const counts = await syncUser(admin, row.user_id, row.sync_token);
      totals.imported += counts.imported;
      totals.updated += counts.updated;
      totals.deleted += counts.deleted;
      usersProcessed++;
    } catch (err) {
      await captureException(err, { function: "sync-google-calendar", user_id: row.user_id });
    }
  }

  return json({ usersProcessed, ...totals });
});
