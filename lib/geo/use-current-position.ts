"use client";

import { useState } from "react";

export type Position = { lat: number; lon: number; accuracy: "gps" | "ip" };

type PositionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; position: Position }
  | { status: "denied" };

/**
 * Position "à la demande", pas un suivi continu — impossible à faire
 * fiablement en arrière-plan sur une PWA (surtout iOS). GPS d'abord
 * (précis, demande une permission navigateur) ; repli sur la géoloc IP
 * (approximative, précision ville) si refusé/indisponible. Appelée
 * explicitement (getPosition()), jamais automatiquement au montage — la
 * permission GPS doit être demandée suite à une action utilisateur claire.
 */
export function useCurrentPosition() {
  const [state, setState] = useState<PositionState>({ status: "idle" });

  async function getPosition() {
    setState({ status: "loading" });

    if ("geolocation" in navigator) {
      const gpsResult = await new Promise<Position | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: "gps" }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
        );
      });
      if (gpsResult) {
        setState({ status: "ready", position: gpsResult });
        return gpsResult;
      }
    }

    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.latitude === "number" && typeof data.longitude === "number") {
          const position: Position = { lat: data.latitude, lon: data.longitude, accuracy: "ip" };
          setState({ status: "ready", position });
          return position;
        }
      }
    } catch {
      // réseau indisponible ou service IP injoignable
    }

    setState({ status: "denied" });
    return null;
  }

  return { state, getPosition };
}
