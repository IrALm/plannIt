"use server";

import { revalidatePath } from "next/cache";
import { parse, addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { syncEventToGoogle } from "@/lib/google/edge-functions";
import { APP_TIME_ZONE, toAppTimeZoneInstant } from "@/lib/utils/date";
import type { CalendarEvent, EventActionState, EventInput, EventLocation } from "./types";

const EVENT_COLUMNS =
  "id, title, description, start_at, end_at, reminders, event_type_id, location_name, location_lat, location_lon";

function toLocation(row: {
  location_name: string | null;
  location_lat: number | null;
  location_lon: number | null;
}): EventLocation | null {
  if (row.location_name == null || row.location_lat == null || row.location_lon == null) return null;
  return { name: row.location_name, lat: row.location_lat, lon: row.location_lon };
}

/** Un seul événement, par id — utilisé par la feuille mascotte d'alerte
 * météo (l'événement concerné n'est pas forcément dans la plage déjà
 * chargée par la vue courante, ex. Stats sur un autre mois). */
export async function getEventById(id: string): Promise<CalendarEvent | null> {
  const supabase = await createClient();

  const { data: e } = await supabase.from("events").select(EVENT_COLUMNS).eq("id", id).single();
  if (!e) return null;

  const type = e.event_type_id
    ? (await supabase.from("event_types").select("name, color").eq("id", e.event_type_id).single()).data
    : null;

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
    location: toLocation(e),
  };
}

export async function getEventsByRange(
  startISO: string,
  endISO: string
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const [eventsRes, typesRes] = await Promise.all([
    supabase
      .from("events")
      .select(EVENT_COLUMNS)
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
      location: toLocation(e),
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

function locationColumns(location: EventLocation | null | undefined) {
  return {
    location_name: location?.name ?? null,
    location_lat: location?.lat ?? null,
    location_lon: location?.lon ?? null,
  };
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
      ...locationColumns(input.location),
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
      ...locationColumns(input.location),
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

export type DelayCascadeResult = { error: string | null; shiftedCount?: number };

/**
 * "Je suis en retard" — décale cet événement et tous ceux qui suivent le
 * même jour (heure de Paris) du même délai, plutôt que de laisser
 * l'utilisateur tout recaler à la main un par un. Aucun calendrier
 * mainstream ne le fait (cf. mémoire produit "Roadmap Produit").
 */
export async function applyDelayCascade(
  eventId: string,
  delayMinutes: number
): Promise<DelayCascadeResult> {
  if (!Number.isFinite(delayMinutes) || delayMinutes <= 0) {
    return { error: "Choisis un retard positif." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };

  const { data: source } = await supabase
    .from("events")
    .select("start_at")
    .eq("id", eventId)
    .single();
  if (!source) return { error: "Activité introuvable." };

  // Borne de fin = minuit (Paris) le lendemain du jour de l'événement — on ne
  // décale que ce qui reste à venir CE jour-là, pas les jours suivants.
  const dayYMD = formatInTimeZone(new Date(source.start_at), APP_TIME_ZONE, "yyyy-MM-dd");
  const dayEndLocal = addDays(parse(dayYMD, "yyyy-MM-dd", new Date()), 1);
  const dayEndUTC = toAppTimeZoneInstant(dayEndLocal).toISOString();

  const { data: toShift, error: fetchError } = await supabase
    .from("events")
    .select("id, title, description, start_at, end_at")
    .eq("user_id", user.id)
    .gte("start_at", source.start_at)
    .lt("start_at", dayEndUTC)
    .order("start_at", { ascending: true });

  if (fetchError || !toShift) return { error: "Impossible de récupérer les activités du jour." };

  // En parallèle plutôt qu'un par un : chaque décalage implique un aller-retour
  // vers Google Calendar (syncEventToGoogle), qui devient perceptiblement
  // lent en série dès que plusieurs activités suivent dans la journée.
  const deltaMs = delayMinutes * 60_000;
  await Promise.all(
    toShift.map(async (ev) => {
      const newStart = new Date(new Date(ev.start_at).getTime() + deltaMs).toISOString();
      const newEnd = new Date(new Date(ev.end_at).getTime() + deltaMs).toISOString();

      await supabase
        .from("events")
        .update({ start_at: newStart, end_at: newEnd, reminders_sent: [] })
        .eq("id", ev.id);

      await syncEventToGoogle("update", {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        startAt: newStart,
        endAt: newEnd,
      });
    })
  );

  revalidatePath("/dashboard");
  return { error: null, shiftedCount: toShift.length };
}

export async function deleteEvent(id: string): Promise<EventActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) return { error: "Impossible de supprimer l'activité." };

  await syncEventToGoogle("delete", { id });

  revalidatePath("/dashboard");
  return { error: null };
}
