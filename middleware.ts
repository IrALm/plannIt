import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// "/" est le seul point d'entrée public (auth Google uniquement, plus de
// login/register/forgot-password) — connecté, on en repart vers /dashboard.
const PUBLIC_ONLY_PATHS = ["/"];
// /auth/callback doit rester joignable dans tous les cas (retour Google,
// avant que la session ne soit établie). /privacy et /terms doivent rester
// visibles même connecté (pages légales, requises pour la validation Google
// OAuth) — pas de redirect ni dans un sens ni dans l'autre, contrairement à
// PUBLIC_ONLY_PATHS. /opengraph-image doit rester joignable sans session :
// les crawlers (Google, réseaux sociaux) n'ont jamais de cookie auth.
const ALWAYS_ALLOWED_PREFIXES = ["/auth", "/privacy", "/terms", "/opengraph-image"];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return supabaseResponse;
  }

  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.includes(pathname);

  if (!user && !isPublicOnlyPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && isPublicOnlyPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // icons/ et avatars/ exclus par préfixe (pas juste par extension) : le
    // contenu de avatars/ évolue librement (photos ajoutées par l'utilisateur
    // dans n'importe quel format), pas la peine de maintenir une liste
    // d'extensions à jour à chaque fois.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|sw.js|workbox-.*\\.js|icons/|avatars/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
