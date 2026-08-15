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

// Alertes température ambiante, indépendantes des événements — fenêtre plus
// large (la température varie plus lentement que la pluie).
const TEMP_LOOKAHEAD_HOURS = 6;
const HEAT_THRESHOLD_C = 30;
const COLD_THRESHOLD_C = 3;

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

/** Température max/min prévue dans les prochaines `hours` heures. */
async function getTempRangeAhead(lat: number, lon: number, hours: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "temperature_2m",
    timezone: APP_TIME_ZONE,
    forecast_days: "2",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const times: string[] = data.hourly?.time ?? [];
  const temps: number[] = data.hourly?.temperature_2m ?? [];
  const currentHour = formatInTimeZone(new Date(), APP_TIME_ZONE, "yyyy-MM-dd'T'HH':00'");
  const startIdx = times.indexOf(currentHour);
  if (startIdx === -1) return null;

  const window = temps.slice(startIdx, startIdx + hours);
  if (!window.length) return null;
  return { max: Math.max(...window), min: Math.min(...window) };
}

async function sendPush(admin: AdminClient, userId: string, title: string, body: string, extra: Record<string, unknown>) {
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  const payload = JSON.stringify({ title, body, ...extra });
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
 * ville enregistrée, (1) cherche les événements des prochaines heures dont
 * le type est marqué "sensible à la météo" et vérifie le risque de pluie,
 * (2) vérifie la température ambiante des prochaines heures (indépendamment
 * de tout événement) et alerte au plus une fois par jour en cas de forte
 * chaleur/froid vif. Open-Meteo (API publique, sans clé). Best-effort.
 */
Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const admin = createAdminClient();
  const now = new Date();
  const todayYMD = formatInTimeZone(now, APP_TIME_ZONE, "yyyy-MM-dd");

  try {
    const { data: prefs } = await admin
      .from("user_preferences")
      .select("user_id, weather_lat, weather_lon, last_heat_alert_date, last_cold_alert_date")
      .not("weather_lat", "is", null)
      .not("weather_lon", "is", null);

    let checked = 0;
    let alerted = 0;
    let tempAlerted = 0;

    for (const pref of prefs ?? []) {
      // --- Pluie avant un événement sensible à la météo ---
      const { data: events } = await admin
        .from("events")
        .select("id, user_id, title, start_at, event_type_id")
        .eq("user_id", pref.user_id)
        .eq("weather_alert_sent", false)
        .gt("start_at", now.toISOString())
        .lte("start_at", new Date(now.getTime() + LOOKAHEAD_MS).toISOString());

      if (events?.length) {
        const eventTypeIds = [...new Set(events.map((e) => e.event_type_id).filter(Boolean))];
        const { data: types } = eventTypeIds.length
          ? await admin.from("event_types").select("id, weather_sensitive").in("id", eventTypeIds)
          : { data: [] };
        const sensitiveTypeIds = new Set((types ?? []).filter((t) => t.weather_sensitive).map((t) => t.id));

        for (const ev of events) {
          if (!ev.event_type_id || !sensitiveTypeIds.has(ev.event_type_id)) continue;
          checked++;

          try {
            const risk = await getRainRiskAt(pref.weather_lat!, pref.weather_lon!, ev.start_at);
            if (risk && (risk.probability >= RAIN_PROBABILITY_THRESHOLD || risk.amount >= RAIN_AMOUNT_THRESHOLD_MM)) {
              const time = formatInTimeZone(new Date(ev.start_at), APP_TIME_ZONE, "HH:mm");
              await sendPush(
                admin,
                pref.user_id,
                `Pluie prévue pour "${ev.title}"`,
                `${risk.probability}% de risque de pluie à ${time}. Pense à t'organiser.`,
                { tag: `weather-${ev.id}`, type: "weather", eventId: ev.id }
              );
              alerted++;
            }
          } catch (err) {
            await captureException(err, { function: "send-weather-alerts", event_id: ev.id });
          }

          await admin.from("events").update({ weather_alert_sent: true }).eq("id", ev.id);
        }
      }

      // --- Température ambiante, indépendante des événements ---
      try {
        const range = await getTempRangeAhead(pref.weather_lat!, pref.weather_lon!, TEMP_LOOKAHEAD_HOURS);
        if (range) {
          if (range.max >= HEAT_THRESHOLD_C && pref.last_heat_alert_date !== todayYMD) {
            await sendPush(
              admin,
              pref.user_id,
              "Forte chaleur en vue",
              `Jusqu'à ${Math.round(range.max)}°C dans les prochaines heures. Pense à t'hydrater.`,
              { tag: `temp-hot-${todayYMD}`, type: "temperature", kind: "hot" }
            );
            await admin.from("user_preferences").update({ last_heat_alert_date: todayYMD }).eq("user_id", pref.user_id);
            tempAlerted++;
          } else if (range.min <= COLD_THRESHOLD_C && pref.last_cold_alert_date !== todayYMD) {
            await sendPush(
              admin,
              pref.user_id,
              "Froid vif en vue",
              `Jusqu'à ${Math.round(range.min)}°C dans les prochaines heures. Pense à te couvrir.`,
              { tag: `temp-cold-${todayYMD}`, type: "temperature", kind: "cold" }
            );
            await admin.from("user_preferences").update({ last_cold_alert_date: todayYMD }).eq("user_id", pref.user_id);
            tempAlerted++;
          }
        }
      } catch (err) {
        await captureException(err, { function: "send-weather-alerts", context: "temperature", user_id: pref.user_id });
      }
    }

    return json({ checked, alerted, tempAlerted });
  } catch (err) {
    await captureException(err, { function: "send-weather-alerts" });
    return json({ error: String(err) }, 500);
  }
});
