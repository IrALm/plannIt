"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  startGoogleCalendarConnect,
  disconnectGoogleCalendar,
} from "@/lib/google/edge-functions";
import type { ThemePreference } from "@/lib/supabase/types";

// `returnTo` doit être le 1er paramètre : quand cette action est liée via
// `.bind(null, returnTo)` sur un <form action={...}>, React ajoute FormData
// en dernier argument automatiquement.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- FormData ajouté par React sur un <form action>
export async function connectGoogleCalendar(returnTo: string, _formData: FormData) {
  const url = await startGoogleCalendarConnect(returnTo);
  redirect(url);
}

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
