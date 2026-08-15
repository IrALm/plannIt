"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { isSameDay, format, parse } from "date-fns";
import { Settings } from "lucide-react";
import { Mascot } from "@/components/icons/mascot";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { WeekStrip } from "./week-strip";
import { Timeline } from "./timeline";
import { MonthView } from "./month-view";
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
  defaultReminders: number[];
  view: "week" | "month" | "stats";
  anchorDate: string;
  statsPeriod: "month" | "year";
};

// recharts (~120kB) n'est chargée que si l'utilisateur ouvre l'onglet Stats —
// évite d'alourdir le bundle initial du dashboard (semaine/mois) pour tout
// le monde.
const StatsView = dynamic(() => import("./stats-view").then((m) => m.StatsView), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center text-ink-2 text-sm">Chargement…</div>,
});

function monthUrl(date: Date) {
  return `/dashboard?view=month&month=${format(date, "yyyy-MM")}`;
}
function dayUrl(date: Date) {
  return `/dashboard?view=week&date=${format(date, "yyyy-MM-dd")}`;
}
function monthStatsUrl(date: Date) {
  return `/dashboard?view=stats&period=month&month=${format(date, "yyyy-MM")}`;
}
function yearStatsUrl(date: Date) {
  return `/dashboard?view=stats&period=year&year=${format(date, "yyyy")}`;
}

export function DashboardView({
  displayName,
  avatarUrl,
  events,
  types,
  defaultReminders,
  view,
  anchorDate,
  statsPeriod,
}: DashboardViewProps) {
  const router = useRouter();
  // anchorDate est un Y-M-D pur (jamais un instant sérialisé, cf.
  // lib/utils/date.ts) : reconstruit ici via le fuseau réel du navigateur,
  // pas via new Date("yyyy-MM-dd") qui serait interprété en UTC par le spec
  // JS et pourrait décaler le jour selon le fuseau de lecture.
  const anchorDateObj = useMemo(() => parse(anchorDate, "yyyy-MM-dd", new Date()), [anchorDate]);

  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const modalOpen = useUIStore((s) => s.modalOpen);
  const openAddModal = useUIStore((s) => s.openAddModal);
  const openEditModal = useUIStore((s) => s.openEditModal);
  const editingEventId = useUIStore((s) => s.editingEventId);

  // La semaine affichée (WeekStrip/Timeline) suit l'ancre résolue côté
  // serveur (aujourd'hui par défaut, ou le jour tapé depuis la vue mois).
  useEffect(() => {
    if (view === "week") setSelectedDate(anchorDateObj);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, anchorDate]);

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
            {view === "week" ? formatHeaderDate(selectedDate) : view === "month" ? "Vue mensuelle" : "Stats"}
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

      <div className="px-[18px] pb-1">
        <SegmentedControl
          options={[
            { value: "week", label: "Semaine" },
            { value: "month", label: "Mois" },
            { value: "stats", label: "Stats" },
          ]}
          value={view}
          onChange={(next) =>
            router.push(
              next === "month"
                ? monthUrl(anchorDateObj)
                : next === "stats"
                  ? "/dashboard?view=stats"
                  : "/dashboard"
            )
          }
        />
      </div>

      {view === "week" && (
        <>
          <WeekStrip />
          <Timeline events={dayEvents} onEventClick={openEditModal} />
        </>
      )}
      {view === "month" && (
        <MonthView anchorDate={anchorDateObj} events={events} monthUrl={monthUrl} dayUrl={dayUrl} />
      )}
      {view === "stats" && (
        <StatsView
          anchorDate={anchorDateObj}
          period={statsPeriod}
          events={events}
          types={types}
          monthStatsUrl={monthStatsUrl}
          yearStatsUrl={yearStatsUrl}
        />
      )}

      {view !== "stats" && <Fab onClick={openAddModal} />}

      {modalOpen && (
        <EventModal
          types={types}
          event={editingEvent}
          defaultDate={selectedDate}
          defaultReminders={defaultReminders}
        />
      )}
    </div>
  );
}
