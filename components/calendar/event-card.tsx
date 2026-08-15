import type { CalendarEvent } from "@/features/events/types";
import { EVENT_COLOR_HEX } from "@/features/calendar/types";
import { formatTime } from "@/lib/utils/date";
import { DelayButton } from "./delay-button";

type EventCardProps = {
  event: CalendarEvent;
  onClick: () => void;
  showDelayButton?: boolean;
};

export function EventCard({ event, onClick, showDelayButton }: EventCardProps) {
  const color = EVENT_COLOR_HEX[event.color];

  return (
    <div className="flex gap-[9px] px-4 cursor-pointer" onClick={onClick}>
      <div className="w-9 pt-[11px] text-right shrink-0">
        <div className="font-mono text-[11.5px] font-medium text-ink">
          {formatTime(event.startAt)}
        </div>
        <div className="font-mono text-[9.5px] text-muted mt-0.5">
          {formatTime(event.endAt)}
        </div>
      </div>
      <div className="flex-1 bg-surface rounded-card p-[10px_12px] border border-line flex items-center gap-[10px]">
        <div className="w-1 self-stretch rounded-full" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{event.title}</div>
          <div className="flex items-center gap-[6px] mt-[3px]">
            <span className="size-[6px] rounded-full shrink-0" style={{ background: color }} />
            <span className="text-[11px] text-ink-2 truncate">
              {event.typeName ?? "Sans type"}
            </span>
          </div>
        </div>
        {showDelayButton && <DelayButton eventId={event.id} />}
      </div>
    </div>
  );
}
