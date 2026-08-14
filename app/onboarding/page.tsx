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

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("onboarding_completed, onboarding_step")
    .eq("user_id", user.id)
    .single();

  if (prefs?.onboarding_completed) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <OnboardingWizard initialStep={prefs?.onboarding_step ?? 1} />
    </Suspense>
  );
}
