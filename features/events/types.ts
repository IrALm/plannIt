import type { EventColor } from "@/lib/supabase/types";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  reminders: number[];
  eventTypeId: string | null;
  color: EventColor;
  typeName: string | null;
};

export type EventInput = {
  title: string;
  description?: string | null;
  eventTypeId: string;
  startAt: string;
  endAt: string;
  reminders: number[];
};

export type EventActionState = { error: string | null };
