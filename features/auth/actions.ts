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

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = await getURL();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) redirect("/?error=google");

  redirect(data.url);
}
