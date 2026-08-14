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
