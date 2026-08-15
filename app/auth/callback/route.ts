import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/send";

const FIRST_LOGIN_WINDOW_MS = 60_000;

/**
 * Callback de connexion Google OAuth (Supabase Auth — distinct de l'OAuth
 * Google Calendar de M6). Échange le code PKCE contre une session, puis route
 * vers la complétion de profil, l'onboarding, ou le dashboard selon l'état
 * déjà connu de l'utilisateur.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const [{ data: profile }, { data: prefs }] = await Promise.all([
        supabase
          .from("profiles")
          .select("profile_completed")
          .eq("id", data.user.id)
          .single(),
        supabase
          .from("user_preferences")
          .select("onboarding_completed")
          .eq("user_id", data.user.id)
          .single(),
      ]);

      // Heuristique "premier login" (pas de flag dédié en base) : ce callback
      // s'exécute à chaque connexion Google. created_at ≈ last_sign_in_at =>
      // tout juste inscrit.
      const createdAt = new Date(data.user.created_at).getTime();
      const lastSignInAt = data.user.last_sign_in_at
        ? new Date(data.user.last_sign_in_at).getTime()
        : createdAt;
      if (Math.abs(lastSignInAt - createdAt) < FIRST_LOGIN_WINDOW_MS && data.user.email) {
        await sendWelcomeEmail(data.user.email, data.user.user_metadata?.full_name);
      }

      const destination = !profile?.profile_completed
        ? "/complete-profile"
        : prefs?.onboarding_completed
          ? "/dashboard"
          : "/onboarding";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
