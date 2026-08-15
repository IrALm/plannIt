import type { EventColor } from "@/lib/supabase/types";

export type EventType = {
  id: string;
  name: string;
  color: EventColor;
  isDefault: boolean;
  weatherSensitive: boolean;
};

export const EVENT_COLOR_HEX: Record<EventColor, string> = {
  blue: "#3B82F6",
  coral: "#F0674F",
  green: "#3FAF7A",
  amber: "#E0A63C",
  purple: "#9366CE",
};

export const EVENT_COLORS: EventColor[] = ["blue", "coral", "green", "amber", "purple"];
