"use client";

import { isSameDay } from "date-fns";
import { useCalendarStore } from "@/stores/calendar.store";
import { getWeekDays, formatDayLetter } from "@/lib/utils/date";

export function WeekStrip() {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const days = getWeekDays(selectedDate);

  return (
    <div className="flex justify-between px-[15px] py-3 gap-[3px]">
      {days.map((day) => {
        const active = isSameDay(day, selectedDate);
        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => setSelectedDate(day)}
            className="flex flex-col items-center gap-[6px] flex-1 cursor-pointer"
          >
            <span className="text-[11px] font-medium text-muted">
              {formatDayLetter(day)}
            </span>
            <span
              className={`size-[31px] rounded-chip flex items-center justify-center font-mono text-[13px] font-medium ${
                active ? "bg-accent text-accent-ink" : "text-ink-2"
              }`}
            >
              {day.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
