"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatMonthLabel } from "@/lib/utils/date";
import { EVENT_COLOR_HEX } from "@/features/calendar/types";
import type { EventColor } from "@/lib/supabase/types";
import type { CalendarEvent } from "@/features/events/types";
import type { EventType } from "@/features/calendar/types";

type StatsViewProps = {
  anchorDate: Date;
  period: "month" | "year";
  events: CalendarEvent[];
  types: EventType[];
  monthStatsUrl: (date: Date) => string;
  yearStatsUrl: (date: Date) => string;
};

const MUTED = "var(--ink-2)";

export function StatsView({
  anchorDate,
  period,
  events,
  types,
  monthStatsUrl,
  yearStatsUrl,
}: StatsViewProps) {
  const router = useRouter();

  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);

  const byType = useMemo(() => {
    const map = new Map<string, { name: string; color: EventColor; count: number }>();
    for (const ev of events) {
      const t = ev.eventTypeId ? typeById.get(ev.eventTypeId) : undefined;
      const key = t?.id ?? "none";
      const entry = map.get(key) ?? { name: t?.name ?? "Sans type", color: t?.color ?? "blue", count: 0 };
      entry.count++;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [events, typeById]);

  const pieData = byType.map((t) => ({ name: t.name, value: t.count, color: EVENT_COLOR_HEX[t.color] }));
  const topType = byType[0];
  const activeDayCount = new Set(events.map((e) => e.startAt.slice(0, 10))).size;

  const monthlyData = useMemo(() => {
    if (period !== "year") return [];
    const counts = Array.from({ length: 12 }, () => 0);
    for (const ev of events) {
      const monthIndex = new Date(ev.startAt).getMonth();
      counts[monthIndex]++;
    }
    return counts.map((count, i) => ({
      label: format(new Date(anchorDate.getFullYear(), i, 1), "MMM", { locale: fr }),
      count,
    }));
  }, [events, period, anchorDate]);

  const busiestMonth =
    period === "year" && monthlyData.length
      ? monthlyData.reduce((max, m) => (m.count > max.count ? m : max), monthlyData[0])
      : null;

  function goPrev() {
    if (period === "month") {
      router.push(monthStatsUrl(new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1)));
    } else {
      router.push(yearStatsUrl(new Date(anchorDate.getFullYear() - 1, 0, 1)));
    }
  }
  function goNext() {
    if (period === "month") {
      router.push(monthStatsUrl(new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1)));
    } else {
      router.push(yearStatsUrl(new Date(anchorDate.getFullYear() + 1, 0, 1)));
    }
  }

  return (
    <div className="flex-1 flex flex-col px-[18px] pb-24 gap-4">
      <SegmentedControl
        options={[
          { value: "month", label: "Ce mois" },
          { value: "year", label: "Cette année" },
        ]}
        value={period}
        onChange={(next) =>
          router.push(next === "year" ? yearStatsUrl(anchorDate) : monthStatsUrl(anchorDate))
        }
      />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Précédent"
          className="size-9 rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft size={17} />
        </button>
        <span className="font-serif text-lg capitalize">
          {period === "month" ? formatMonthLabel(anchorDate) : anchorDate.getFullYear()}
        </span>
        <button
          type="button"
          onClick={goNext}
          aria-label="Suivant"
          className="size-9 rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center cursor-pointer"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-ink-2 text-sm px-8 text-center">
          Rien à afficher {period === "month" ? "ce mois-ci" : "cette année"}.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatBox value={events.length} label={events.length > 1 ? "activités" : "activité"} />
            {period === "month" ? (
              <StatBox value={activeDayCount} label={activeDayCount > 1 ? "jours actifs" : "jour actif"} />
            ) : (
              <StatBox value={busiestMonth?.label ?? "—"} label="mois le + chargé" />
            )}
            <StatBox value={topType?.name ?? "—"} label="type favori" />
          </div>

          <div className="bg-surface border border-line rounded-card p-[16px]">
            <div className="font-mono text-[10px] tracking-[.12em] uppercase text-muted mb-3">
              Répartition par type
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[130px] h-[130px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={38}
                      outerRadius={62}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-col gap-[10px] min-w-0">
                {byType.map((t) => {
                  const pct = Math.round((t.count / events.length) * 100);
                  return (
                    <div key={t.name} className="flex items-center gap-2 text-[13px]">
                      <span
                        className="size-[9px] rounded-full shrink-0"
                        style={{ background: EVENT_COLOR_HEX[t.color] }}
                      />
                      <span className="flex-1 min-w-0 truncate text-ink">{t.name}</span>
                      <span className="font-mono text-ink-2 shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {period === "year" && (
            <div className="bg-surface border border-line rounded-card p-[16px]">
              <div className="font-mono text-[10px] tracking-[.12em] uppercase text-muted mb-3">
                Activités par mois
              </div>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--line)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: MUTED }}
                      axisLine={{ stroke: "var(--line)" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: MUTED }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--surface-2)" }}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-surface-2 rounded-card px-2 py-3 text-center">
      <div className="font-serif text-[19px] text-accent truncate">{value}</div>
      <div className="text-[11px] text-ink-2 mt-0.5">{label}</div>
    </div>
  );
}
