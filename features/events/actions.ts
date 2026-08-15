"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncEventToGoogle } from "@/lib/google/edge-functions";
import type { CalendarEvent, EventActionState, EventInput } from "./types";

export async function getEventsByRange(
  startISO: string,
  endISO: string
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const [eventsRes, typesRes] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, description, start_at, end_at, reminders, event_type_id")
      .gte("start_at", startISO)
      .lt("start_at", endISO)
      .order("start_at", { ascending: true }),
    supabase.from("event_types").select("id, name, color"),
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (typesRes.error) throw typesRes.error;

  const typeById = new Map((typesRes.data ?? []).map((t) => [t.id, t]));

  return (eventsRes.data ?? []).map((e) => {
    const type = e.event_type_id ? typeById.get(e.event_type_id) : undefined;
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      startAt: e.start_at,
      endAt: e.end_at,
      reminders: e.reminders,
      eventTypeId: e.event_type_id,
      color: type?.color ?? "blue",
      typeName: type?.name ?? null,
    };
  });
}

function validate(input: EventInput): string | null {
  if (!input.title.trim()) return "Le titre est obligatoire.";
  if (!input.eventTypeId) return "Choisis un type d'activité.";
  if (new Date(input.endAt) <= new Date(input.startAt)) {
    return "Oups, l'heure de fin avant le début ?";
  }
  return null;
}

export async function createEvent(
  _prevState: EventActionState,
  input: EventInput
): Promise<EventActionState> {
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };

  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      event_type_id: input.eventTypeId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      start_at: input.startAt,
      end_at: input.endAt,
      reminders: input.reminders,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Impossible d'enregistrer l'activité." };

  await syncEventToGoogle("create", {
    id: data.id,
    title: input.title,
    description: input.description,
    startAt: input.startAt,
    endAt: input.endAt,
  });

  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateEvent(
  id: string,
  input: EventInput
): Promise<EventActionState> {
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  // Si l'heure de début change, les offsets déjà marqués "envoyés" (pour
  // l'ancien horaire) doivent être réinitialisés — sinon send-push-reminders
  // les considère à tort comme déjà notifiés et ne renvoie plus rien pour le
  // nouvel horaire, y compris le rappel automatique de démarrage. On ne le
  // fait que si l'heure a réellement changé, pour ne pas spammer de rappels
  // en double sur une simple modification de titre/description.
  const { data: existing } = await supabase
    .from("events")
    .select("start_at")
    .eq("id", id)
    .single();
  const startChanged = !existing || new Date(existing.start_at).getTime() !== new Date(input.startAt).getTime();

  const { error } = await supabase
    .from("events")
    .update({
      event_type_id: input.eventTypeId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      start_at: input.startAt,
      end_at: input.endAt,
      reminders: input.reminders,
      ...(startChanged ? { reminders_sent: [] } : {}),
    })
    .eq("id", id);

  if (error) return { error: "Impossible de mettre à jour l'activité." };

  await syncEventToGoogle("update", {
    id,
    title: input.title,
    description: input.description,
    startAt: input.startAt,
    endAt: input.endAt,
  });

  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteEvent(id: string): Promise<EventActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) return { error: "Impossible de supprimer l'activité." };

  await syncEventToGoogle("delete", { id });

  revalidatePath("/dashboard");
  return { error: null };
}
