"use server";

export type GeocodeResult = { name: string; lat: number; lon: number };

/**
 * Nominatim (OpenStreetMap), gratuit sans clé — mais politique d'usage
 * stricte : 1 req/s max, User-Agent obligatoire identifiant l'app. Appelé
 * côté serveur (jamais depuis le navigateur) pour respecter ça facilement
 * et éviter les soucis CORS de l'instance publique.
 */
export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    limit: "5",
    "accept-language": "fr",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { "User-Agent": "PlannIt/1.0 (planning app, contact via Supabase project)" },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((r) => ({ name: r.display_name, lat: parseFloat(r.lat), lon: parseFloat(r.lon) }));
}
