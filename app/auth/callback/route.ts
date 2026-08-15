import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email/send";

const FIRST_LOGIN_WINDOW_MS = 60_000;

/**
 * Callback de connexion Google OAuth. Un seul écran de consentement Google
 * couvre à la fois la connexion ET l'accès Google Calendar (scope demandé
 * dès signInWithGoogle) — pas de 2e flux OAuth séparé. Échange le code PKCE
 * contre une session, stocke les tokens Calendar si présents, puis route
 * vers la complétion de profil, l'onboarding, ou le dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // provider_token / provider_refresh_token : uniquement présents ici,
      // juste après l'échange du code — jamais récupérables plus tard via
      // getSession()/getUser(), d'où le stockage immédiat.
      const providerToken = data.session?.provider_token;
      const providerRefreshToken = data.session?.provider_refresh_token;

      // Best-effort : un souci de stockage des tokens Calendar (ex. secret
      // service_role manquant côté déploiement) ne doit jamais faire échouer
      // la connexion elle-même — l'utilisateur pourra reconnecter Calendar
      // depuis Réglages plus tard.
      if (providerToken && providerRefreshToken) {
        try {
          const admin = createAdminClient();
          await admin.from("google_calendar_tokens").upsert({
            user_id: data.user.id,
            access_token: providerToken,
            refresh_token: providerRefreshToken,
            // Durée de vie réelle du token Google inconnue depuis la session
            // Supabase : on le marque déjà expiré pour forcer un rafraîchissement
            // (via google-calendar/_shared/google/tokenRefresh.ts) au premier
            // usage réel, qui renseignera alors la vraie expiration.
            expires_at: new Date().toISOString(),
            google_email: data.user.email,
            scope: "https://www.googleapis.com/auth/calendar.events",
          });

          await admin
            .from("user_preferences")
            .update({ google_calendar_connected: true, google_email: data.user.email })
            .eq("user_id", data.user.id);
        } catch (err) {
          console.error("[auth/callback] échec stockage tokens Google Calendar", err);
        }
      }

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
