"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";
import { useCurrentPosition } from "@/lib/geo/use-current-position";
import { haversineKm, estimateMinutes, TRAVEL_MODES, type TravelMode } from "@/lib/geo/distance";
import { formatTime } from "@/lib/utils/date";
import type { EventLocation } from "@/features/events/types";

// Leaflet a besoin de `window` — jamais rendu côté serveur.
const LocationMap = dynamic(() => import("./location-map").then((m) => m.LocationMap), { ssr: false });

type TravelEstimateProps = {
  location: EventLocation;
  startAt: string;
};

/** Distance à vol d'oiseau + vitesse moyenne par mode — pas un vrai
 * itinéraire routier (cf. lib/geo/distance.ts). Position actuelle "à la
 * demande" (GPS, repli IP), jamais automatique au montage. */
export function TravelEstimate({ location, startAt }: TravelEstimateProps) {
  const { state, getPosition } = useCurrentPosition();
  const [mode, setMode] = useState<TravelMode>("walk");

  const distanceKm = useMemo(() => {
    if (state.status !== "ready") return null;
    return haversineKm(state.position.lat, state.position.lon, location.lat, location.lon);
  }, [state, location]);

  if (state.status === "idle" || state.status === "denied") {
    return (
      <button
        type="button"
        onClick={getPosition}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-input border border-dashed border-line text-[13px] text-ink-2 cursor-pointer"
      >
        <Navigation size={14} />
        {state.status === "denied" ? "Position indisponible — réessayer" : "Voir le temps de trajet"}
      </button>
    );
  }

  if (state.status === "loading") {
    return <div className="text-[13px] text-muted text-center py-2">Localisation…</div>;
  }

  if (state.status !== "ready" || distanceKm === null) return null;

  const selectedSpeed = TRAVEL_MODES.find((m) => m.mode === mode)!.speedKmh;
  const minutes = estimateMinutes(distanceKm, selectedSpeed);
  const leaveBy = new Date(new Date(startAt).getTime() - minutes * 60_000);

  return (
    <div className="flex flex-col gap-[10px]">
      <LocationMap from={{ lat: state.position.lat, lon: state.position.lon }} to={{ lat: location.lat, lon: location.lon }} />

      <div className="flex gap-[7px]">
        {TRAVEL_MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            onClick={() => setMode(m.mode)}
            className={`flex-1 h-9 rounded-chip border text-[12.5px] font-medium cursor-pointer ${
              mode === m.mode ? "border-accent bg-tint text-ink" : "border-line text-ink-2"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="bg-surface-2 rounded-card px-[13px] py-[10px] text-[13px] text-ink">
        <span className="font-medium">{distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}</span>
        {" · "}
        environ {minutes} min
        {" · "}
        pars vers <span className="font-mono font-medium">{formatTime(leaveBy.toISOString())}</span>
        {state.position.accuracy === "ip" && (
          <div className="text-[11px] text-muted mt-1">Position approximative (par IP, pas GPS).</div>
        )}
      </div>
    </div>
  );
}
