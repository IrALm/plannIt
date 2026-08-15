"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, isSameMonth, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthGridDays, formatMonthLabel } from "@/lib/utils/date";
import { EVENT_COLOR_HEX } from "@/features/calendar/types";
import type { EventColor } from "@/lib/supabase/types";
import type { CalendarEvent } from "@/features/events/types";

const WEEKDAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];
const MAX_DOTS = 3;

type MonthViewProps = {
  anchorDate: Date;
  events: CalendarEvent[];
  monthUrl: (date: Date) => string;
  dayUrl: (date: Date) => string;
};

export function MonthView({ anchorDate, events, monthUrl, dayUrl }: MonthViewProps) {
  const router = useRouter();
  const days = useMemo(() => getMonthGridDays(anchorDate), [anchorDate]);

  const colorsByDay = useMemo(() => {
    const map = new Map<string, EventColor[]>();
    for (const ev of events) {
      const key = format(new Date(ev.startAt), "yyyy-MM-dd");
      const colors = map.get(key) ?? [];
      if (!colors.includes(ev.color)) colors.push(ev.color);
      map.set(key, colors);
    }
    return map;
  }, [events]);

  function goToPrevMonth() {
    const prev = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1);
    router.push(monthUrl(prev));
  }
  function goToNextMonth() {
    const next = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1);
    router.push(monthUrl(next));
  }

  return (
    <div className="flex-1 flex flex-col px-[15px] pb-24">
      <div className="flex items-center justify-between py-3">
        <button
          type="button"
          onClick={goToPrevMonth}
          aria-label="Mois précédent"
          className="size-9 rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft size={17} />
        </button>
        <span className="font-serif text-lg capitalize">{formatMonthLabel(anchorDate)}</span>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Mois suivant"
          className="size-9 rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center cursor-pointer"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LETTERS.map((letter, i) => (
          <span
            key={i}
            className="text-center text-[11px] font-medium text-muted py-1"
          >
            {letter}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, anchorDate);
          const today = isToday(day);
          const colors = colorsByDay.get(format(day, "yyyy-MM-dd")) ?? [];

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => router.push(dayUrl(day))}
              className="flex flex-col items-center gap-[3px] py-1.5 cursor-pointer"
            >
              <span
                className={`size-8 rounded-chip flex items-center justify-center font-mono text-[13px] ${
                  today
                    ? "bg-accent text-accent-ink font-semibold"
                    : inMonth
                      ? "text-ink"
                      : "text-muted"
                }`}
              >
                {day.getDate()}
              </span>
              <span className="flex gap-[3px] h-[5px] items-center">
                {colors.slice(0, MAX_DOTS).map((color) => (
                  <span
                    key={color}
                    className="size-[5px] rounded-full"
                    style={{ background: EVENT_COLOR_HEX[color] }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
