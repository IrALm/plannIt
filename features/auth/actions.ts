"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getURL } from "@/lib/utils/url";

// Authentification email/mot de passe retirée — Google OAuth uniquement.
// Simplifie le flux (plus de confirmation d'email à gérer) et supprime la
// classe de bug rencontrée précédemment (boucle inscription/connexion liée à
// la confirmation email requise par défaut côté Supabase Auth).

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Un seul écran de consentement Google pour tout : connexion ET accès Google
 * Calendar (scope calendar.events demandé dès ce premier clic — plus de 2e
 * flux OAuth séparé plus tard dans l'onboarding). access_type=offline +
 * prompt=consent forcent Google à renvoyer un refresh_token à chaque fois,
 * nécessaire pour que l'app puisse rafraîchir l'accès Calendar plus tard.
 * Les tokens (session.provider_token/provider_refresh_token) sont récupérés
 * et stockés dans app/auth/callback/route.ts juste après l'échange du code.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = await getURL();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: "https://www.googleapis.com/auth/calendar.events",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) redirect("/?error=google");

  redirect(data.url);
}
