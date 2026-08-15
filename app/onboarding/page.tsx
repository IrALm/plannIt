import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: prefs }, { data: profile }] = await Promise.all([
    supabase
      .from("user_preferences")
      .select("onboarding_completed, onboarding_step")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, avatar_url, profile_completed")
      .eq("id", user.id)
      .single(),
  ]);

  if (prefs?.onboarding_completed) redirect("/dashboard");

  // Le profil (nom + avatar) est un préalable obligatoire à l'étape 1 : si
  // pas encore fait, on y ramène toujours, même si un onboarding_step plus
  // avancé était déjà enregistré.
  const initialStep = profile?.profile_completed ? prefs?.onboarding_step ?? 1 : 1;

  return (
    <Suspense fallback={null}>
      <OnboardingWizard
        initialStep={initialStep}
        initialFullName={profile?.full_name ?? ""}
        initialAvatarUrl={profile?.avatar_url}
      />
    </Suspense>
  );
}
