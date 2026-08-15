export type TravelMode = "walk" | "bike" | "car";

export const TRAVEL_MODES: { mode: TravelMode; label: string; speedKmh: number }[] = [
  { mode: "walk", label: "À pied", speedKmh: 5 },
  { mode: "bike", label: "À vélo", speedKmh: 15 },
  { mode: "car", label: "En voiture", speedKmh: 30 },
];

/** Distance à vol d'oiseau (km) — pas un vrai itinéraire routier (cf. choix
 * assumé : OSRM public n'est pas fiable pour de la production, et un vrai
 * service de routage demanderait une clé payante). Suffisant pour une
 * estimation "dois-je partir maintenant", pas pour de la navigation. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateMinutes(distanceKm: number, speedKmh: number): number {
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}
