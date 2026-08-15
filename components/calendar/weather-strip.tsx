import { CloudRain, Sun, Cloud } from "lucide-react";
import type { HourlyForecast } from "@/lib/weather/forecast";

const RAIN_THRESHOLD = 50;
const CLOUD_THRESHOLD = 30;

type WeatherStripProps = {
  hours: HourlyForecast[];
};

/** Bandeau horizontal défilant, visible en semaine/mois/stats (monté une
 * fois dans DashboardView) — les prochaines 24h de prévision à la position
 * enregistrée dans Réglages. */
export function WeatherStrip({ hours }: WeatherStripProps) {
  if (!hours.length) return null;

  return (
    <div className="flex gap-[7px] overflow-x-auto px-[18px] pb-[10px] pt-[2px] -mx-[1px]">
      {hours.map((h) => {
        const Icon =
          h.precipitationProbability >= RAIN_THRESHOLD
            ? CloudRain
            : h.precipitationProbability >= CLOUD_THRESHOLD
              ? Cloud
              : Sun;
        const iconColor = h.precipitationProbability >= RAIN_THRESHOLD ? "text-accent" : "text-muted";

        return (
          <div
            key={h.time}
            className="flex flex-col items-center gap-[4px] bg-surface border border-line rounded-chip px-[10px] py-[8px] shrink-0 min-w-[48px]"
          >
            <span className="text-[10px] font-mono text-muted">{h.hourLabel}</span>
            <Icon size={15} className={iconColor} />
            <span className="text-[11.5px] font-medium text-ink">{Math.round(h.temperature)}°</span>
          </div>
        );
      })}
    </div>
  );
}
