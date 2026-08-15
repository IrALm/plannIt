import { formatInTimeZone } from "date-fns-tz";
import { APP_TIME_ZONE } from "@/lib/utils/date";

export type HourlyForecast = {
  time: string; // ISO
  hourLabel: string; // "14h"
  temperature: number;
  precipitationProbability: number;
};

/** Prévision horaire (24h à partir de maintenant) via Open-Meteo — gratuit,
 * sans clé. Utilisée par le bandeau météo (semaine/mois/stats) et par
 * send-weather-alerts (Edge Function, implémentation Deno séparée). */
export async function getHourlyForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "temperature_2m,precipitation_probability",
    timezone: APP_TIME_ZONE,
    forecast_days: "2",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    next: { revalidate: 1800 },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const times: string[] = data.hourly?.time ?? [];
  const temps: number[] = data.hourly?.temperature_2m ?? [];
  const probs: number[] = data.hourly?.precipitation_probability ?? [];
  if (!times.length) return [];

  const currentHour = formatInTimeZone(new Date(), APP_TIME_ZONE, "yyyy-MM-dd'T'HH':00'");
  const startIdx = Math.max(0, times.indexOf(currentHour));

  return times.slice(startIdx, startIdx + 24).map((time, i) => {
    const idx = startIdx + i;
    return {
      time,
      hourLabel: `${time.slice(11, 13)}h`,
      temperature: temps[idx] ?? 0,
      precipitationProbability: probs[idx] ?? 0,
    };
  });
}
