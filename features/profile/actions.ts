"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SaveProfileState = { error: string | null };

/**
 * Étape indépendante de l'onboarding (pas un "step" du wizard) : gérée
 * uniquement par profiles.profile_completed, pas par un numéro d'étape à
 * synchroniser avec une navigation externe (Google OAuth) — élimine la
 * classe de bug de désynchronisation rencontrée avec l'ancienne approche.
 */
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
  if (!user) redirect("/");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, avatar_url: avatarUrl || null, profile_completed: true })
    .eq("id", user.id);

  if (error) return { error: "Impossible d'enregistrer ton profil." };

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .single();

  redirect(prefs?.onboarding_completed ? "/dashboard" : "/onboarding");
}
