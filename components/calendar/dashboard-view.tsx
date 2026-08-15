"use client";

import { useMemo } from "react";
import Link from "next/link";
import { isSameDay } from "date-fns";
import { Settings } from "lucide-react";
import { Mascot } from "@/components/icons/mascot";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WeekStrip } from "./week-strip";
import { Timeline } from "./timeline";
import { Fab } from "./fab";
import { EventModal } from "./event-modal";
import { useCalendarStore } from "@/stores/calendar.store";
import { useUIStore } from "@/stores/ui.store";
import { formatHeaderDate } from "@/lib/utils/date";
import type { CalendarEvent } from "@/features/events/types";
import type { EventType } from "@/features/calendar/types";

type DashboardViewProps = {
  displayName: string;
  avatarUrl: string | null;
  events: CalendarEvent[];
  types: EventType[];
};

export function DashboardView({ displayName, avatarUrl, events, types }: DashboardViewProps) {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const modalOpen = useUIStore((s) => s.modalOpen);
  const openAddModal = useUIStore((s) => s.openAddModal);
  const openEditModal = useUIStore((s) => s.openEditModal);
  const editingEventId = useUIStore((s) => s.editingEventId);

  const dayEvents = useMemo(
    () => events.filter((e) => isSameDay(new Date(e.startAt), selectedDate)),
    [events, selectedDate]
  );

  const editingEvent = events.find((e) => e.id === editingEventId) ?? null;

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col animate-plfade max-w-md mx-auto md:border-x md:border-line">
      <div className="flex items-center gap-[11px] px-[18px] pt-[10px] pb-[6px]">
        <div className="size-10 rounded-chip bg-tint flex items-center justify-center overflow-hidden shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- SVG local simple
            <img src={avatarUrl} alt="" className="w-full h-full" />
          ) : (
            <Mascot size={26} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-xl truncate">Bonjour, {displayName}</div>
          <div className="font-mono text-[10.5px] tracking-[.08em] text-muted mt-[3px]">
            {formatHeaderDate(selectedDate)}
          </div>
        </div>
        <ThemeToggle className="shrink-0" />
        <Link
          href="/settings"
          className="size-[38px] rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center shrink-0"
        >
          <Settings size={18} />
        </Link>
      </div>

      <WeekStrip />
      <Timeline events={dayEvents} onEventClick={openEditModal} />
      <Fab onClick={openAddModal} />

      {modalOpen && (
        <EventModal types={types} event={editingEvent} defaultDate={selectedDate} />
      )}
    </div>
  );
}
