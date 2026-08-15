import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteProfileForm } from "@/components/profile/complete-profile-form";

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, profile_completed")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_preferences")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single(),
  ]);

  // Déjà fait : ne pas re-présenter le formulaire (accès direct à l'URL par ex.).
  if (profile?.profile_completed) {
    redirect(prefs?.onboarding_completed ? "/dashboard" : "/onboarding");
  }

  return (
    <CompleteProfileForm
      initialFullName={profile?.full_name ?? ""}
      initialAvatarUrl={profile?.avatar_url ?? null}
    />
  );
}
