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

export type WeatherCityResult = { error: string | null; resolvedName?: string };

/** Géocode la ville via Open-Meteo (gratuit, sans clé) et stocke lat/lon —
 * une seule localisation pour tout le compte, utilisée par
 * send-weather-alerts pour les types marqués "sensible à la météo". */
export async function updateWeatherCity(city: string): Promise<WeatherCityResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };

  const trimmed = city.trim();
  if (!trimmed) {
    await supabase
      .from("user_preferences")
      .update({ weather_city: null, weather_lat: null, weather_lon: null })
      .eq("user_id", user.id);
    revalidatePath("/settings");
    return { error: null };
  }

  const params = new URLSearchParams({ name: trimmed, count: "1", language: "fr" });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!res.ok) return { error: "Service de géolocalisation indisponible, réessaie plus tard." };

  const data = await res.json();
  const match = data.results?.[0];
  if (!match) return { error: "Ville introuvable." };

  const resolvedName = `${match.name}${match.country ? ", " + match.country : ""}`;

  await supabase
    .from("user_preferences")
    .update({ weather_city: resolvedName, weather_lat: match.latitude, weather_lon: match.longitude })
    .eq("user_id", user.id);

  revalidatePath("/settings");
  return { error: null, resolvedName };
}
