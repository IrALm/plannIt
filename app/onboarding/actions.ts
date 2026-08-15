"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startGoogleCalendarConnect } from "@/lib/google/edge-functions";

export async function setOnboardingStep(step: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_preferences")
    .update({ onboarding_step: step })
    .eq("user_id", user.id);
}

/**
 * Persiste l'étape ET lance le flux OAuth Google Calendar dans la même
 * requête serveur — évite la course entre le `setOnboardingStep` fire-and-
 * forget côté client (déclenché en arrière-plan par un clic "Suivant") et la
 * navigation immédiate vers Google causée par la soumission du formulaire
 * "Connecter" : sans ça, la page pouvait naviguer vers Google avant que
 * l'étape soit vraiment enregistrée, et au retour l'utilisateur retombait sur
 * onboarding_step (pas encore à jour) → renvoyé à l'étape 1 (profil).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- FormData ajouté par React sur un <form action>
export async function connectGoogleCalendarFromOnboarding(step: number, _formData: FormData) {
  await setOnboardingStep(step);
  const url = await startGoogleCalendarConnect("/onboarding");
  redirect(url);
}

export type SaveProfileState = { error: string | null };

export async function saveProfile(
  _prevState: SaveProfileState,
  formData: FormData
): Promise<SaveProfileState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "");

  if (!fullName) return { error: "Dis-nous comment t'appeler." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, avatar_url: avatarUrl || null, profile_completed: true })
    .eq("id", user.id);

  if (error) return { error: "Impossible d'enregistrer ton profil." };

  return { error: null };
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("user_preferences")
    .update({ onboarding_completed: true, onboarding_step: 1 })
    .eq("user_id", user.id);

  redirect("/dashboard");
}
