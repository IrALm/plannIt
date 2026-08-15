import type { CalendarEvent } from "@/features/events/types";
import { EventCard } from "./event-card";

type TimelineProps = {
  events: CalendarEvent[];
  onEventClick: (id: string) => void;
  isToday?: boolean;
};

export function Timeline({ events, onEventClick, isToday }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-2 text-sm px-8 text-center">
        Rien de prévu ce jour-là. Appuie sur « Ajouter » pour commencer.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-[11px] pt-1 pb-24">
      {events.map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          onClick={() => onEventClick(ev.id)}
          showDelayButton={isToday}
        />
      ))}
    </div>
  );
}
