import { headers } from "next/headers";

/** Origine absolue de la requête courante, pour construire les redirect URLs Supabase Auth. */
export async function getURL() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
