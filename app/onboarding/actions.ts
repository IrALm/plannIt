"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
