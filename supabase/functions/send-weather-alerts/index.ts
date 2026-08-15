import webpush from "npm:web-push@3.6.7";
import { formatInTimeZone } from "npm:date-fns-tz@3.2.0";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { captureException } from "../_shared/sentry.ts";

const APP_TIME_ZONE = "Europe/Paris";
// Fenêtre "prochaines heures" : assez tôt pour pouvoir encore décaler
// l'activité, assez proche pour une prévision météo fiable.
const LOOKAHEAD_MS = 4 * 60 * 60 * 1000;
const RAIN_PROBABILITY_THRESHOLD = 50; // %
const RAIN_AMOUNT_THRESHOLD_MM = 0.5;

type AdminClient = ReturnType<typeof createAdminClient>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Cherche l'heure de prévision la plus proche du début de l'événement et
 * renvoie son risque de pluie, ou null si hors de la plage prévue. */
async function getRainRiskAt(lat: number, lon: number, whenISO: string) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "precipitation_probability,precipitation",
    timezone: APP_TIME_ZONE,
    forecast_days: "2",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const targetHour = formatInTimeZone(new Date(whenISO), APP_TIME_ZONE, "yyyy-MM-dd'T'HH':00'");
  const idx = (data.hourly?.time ?? []).indexOf(targetHour);
  if (idx === -1) return null;

  return {
    probability: data.hourly.precipitation_probability?.[idx] ?? 0,
    amount: data.hourly.precipitation?.[idx] ?? 0,
  };
}

async function notifyUser(admin: AdminClient, userId: string, title: string, body: string, eventId: string) {
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  // type:"weather" + eventId : le service worker (worker/index.ts) route le
  // clic vers /dashboard?weatherAlert=<id>, qui ouvre la feuille mascotte de
  // confirmation plutôt que le modal d'édition classique.
  const payload = JSON.stringify({ title, body, tag: `weather-${eventId}`, type: "weather", eventId });
  const staleIds: string[] = [];

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload,
        { urgency: "normal" }
      );
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) staleIds.push(sub.id);
    }
  }
  if (staleIds.length) await admin.from("push_subscriptions").delete().in("id", staleIds);
}

/**
 * Toutes les 30 min (migration 00016) : pour chaque utilisateur avec une
 * ville enregistrée, cherche les événements des prochaines heures dont le
 * type est marqué "sensible à la météo" et vérifie la prévision de pluie
 * via Open-Meteo (API publique, sans clé). Best-effort, un événement n'est
 * vérifié qu'une fois (weather_alert_sent) — un webhook temps réel n'a pas
 * de sens ici, la météo change lentement.
 */
Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const admin = createAdminClient();
  const now = new Date();

  try {
    const { data: prefs } = await admin
      .from("user_preferences")
      .select("user_id, weather_lat, weather_lon")
      .not("weather_lat", "is", null)
      .not("weather_lon", "is", null);

    let checked = 0;
    let alerted = 0;

    for (const pref of prefs ?? []) {
      const { data: events } = await admin
        .from("events")
        .select("id, user_id, title, start_at, event_type_id")
        .eq("user_id", pref.user_id)
        .eq("weather_alert_sent", false)
        .gt("start_at", now.toISOString())
        .lte("start_at", new Date(now.getTime() + LOOKAHEAD_MS).toISOString());

      if (!events?.length) continue;

      const eventTypeIds = [...new Set(events.map((e) => e.event_type_id).filter(Boolean))];
      if (!eventTypeIds.length) continue;

      const { data: types } = await admin
        .from("event_types")
        .select("id, weather_sensitive")
        .in("id", eventTypeIds);
      const sensitiveTypeIds = new Set((types ?? []).filter((t) => t.weather_sensitive).map((t) => t.id));

      for (const ev of events) {
        if (!ev.event_type_id || !sensitiveTypeIds.has(ev.event_type_id)) continue;
        checked++;

        try {
          const risk = await getRainRiskAt(pref.weather_lat!, pref.weather_lon!, ev.start_at);
          if (risk && (risk.probability >= RAIN_PROBABILITY_THRESHOLD || risk.amount >= RAIN_AMOUNT_THRESHOLD_MM)) {
            const time = formatInTimeZone(new Date(ev.start_at), APP_TIME_ZONE, "HH:mm");
            await notifyUser(
              admin,
              pref.user_id,
              `Pluie prévue pour "${ev.title}"`,
              `${risk.probability}% de risque de pluie à ${time}. Pense à t'organiser.`,
              ev.id
            );
            alerted++;
          }
        } catch (err) {
          await captureException(err, { function: "send-weather-alerts", event_id: ev.id });
        }

        await admin.from("events").update({ weather_alert_sent: true }).eq("id", ev.id);
      }
    }

    return json({ checked, alerted });
  } catch (err) {
    await captureException(err, { function: "send-weather-alerts" });
    return json({ error: String(err) }, 500);
  }
});
