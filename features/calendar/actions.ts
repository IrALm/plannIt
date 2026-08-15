"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EventColor } from "@/lib/supabase/types";
import type { EventType } from "./types";

function mapRow(row: {
  id: string;
  name: string;
  color: EventColor;
  is_default: boolean;
  weather_sensitive: boolean;
  location_required: boolean;
}): EventType {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isDefault: row.is_default,
    weatherSensitive: row.weather_sensitive,
    locationRequired: row.location_required,
  };
}

export async function listEventTypes(): Promise<EventType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_types")
    .select("id, name, color, is_default, weather_sensitive, location_required")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createEventTypes(
  types: { name: string; color: EventColor; isDefault?: boolean }[]
) {
  if (types.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase.from("event_types").upsert(
    types.map((t) => ({
      user_id: user.id,
      name: t.name,
      color: t.color,
      is_default: t.isDefault ?? false,
    })),
    { onConflict: "user_id,name", ignoreDuplicates: true }
  );

  if (error) throw error;
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function createEventType(name: string, color: EventColor) {
  await createEventTypes([{ name, color }]);
}

/** Variante qui renvoie la ligne créée — utile pour sélectionner immédiatement le
 * nouveau type dans un <TypeSelect> juste après sa création. */
export async function createEventTypeAndReturn(
  name: string,
  color: EventColor,
  weatherSensitive = false,
  locationRequired = false
): Promise<EventType> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("event_types")
    .insert({
      user_id: user.id,
      name,
      color,
      is_default: false,
      weather_sensitive: weatherSensitive,
      location_required: locationRequired,
    })
    .select("id, name, color, is_default, weather_sensitive, location_required")
    .single();

  if (error) throw error;
  revalidatePath("/dashboard");
  return mapRow(data);
}

export async function deleteEventType(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("event_types").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function updateEventType(
  id: string,
  updates: { name?: string; color?: EventColor; weatherSensitive?: boolean; locationRequired?: boolean }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_types")
    .update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.color !== undefined ? { color: updates.color } : {}),
      ...(updates.weatherSensitive !== undefined ? { weather_sensitive: updates.weatherSensitive } : {}),
      ...(updates.locationRequired !== undefined ? { location_required: updates.locationRequired } : {}),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}
