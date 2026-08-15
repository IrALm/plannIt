"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { disconnectGoogleCalendar } from "@/lib/google/edge-functions";
import type { ThemePreference } from "@/lib/supabase/types";

export async function disconnectGoogleCalendarAction() {
  await disconnectGoogleCalendar();
  redirect("/settings");
}

export async function updateProfileName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ full_name: trimmed }).eq("id", user.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateProfileAvatar(avatarUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateThemePreference(theme: ThemePreference) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_preferences").update({ theme }).eq("user_id", user.id);
}

export async function updateDefaultReminders(minutes: number[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_preferences")
    .update({ default_reminders: minutes })
    .eq("user_id", user.id);
}

export async function updateWeeklyRecapEnabled(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_preferences")
    .update({ weekly_recap_enabled: enabled })
    .eq("user_id", user.id);
}
