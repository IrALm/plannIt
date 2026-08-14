import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ONLY_PATHS = ["/", "/login", "/register", "/forgot-password"];
// /auth/callback et /auth/reset-password doivent rester joignables dans tous
// les cas (lien cliqué depuis un email, avant ou sans session active).
const ALWAYS_ALLOWED_PREFIXES = ["/auth"];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return supabaseResponse;
  }

  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.includes(pathname);

  if (!user && !isPublicOnlyPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
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
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox-.*\\.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
