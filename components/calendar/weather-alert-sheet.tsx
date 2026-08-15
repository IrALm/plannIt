"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CloudRain } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Mascot } from "@/components/icons/mascot";
import { formatTime } from "@/lib/utils/date";
import { getEventById, applyDelayCascade } from "@/features/events/actions";
import type { CalendarEvent } from "@/features/events/types";

const QUICK_DELAYS = [15, 30, 60];

/**
 * Feuille mascotte ouverte quand l'utilisateur tape sur une notification
 * météo (worker/index.ts navigue vers ?weatherAlert=<eventId>) — montée une
 * fois dans DashboardView, active quel que soit l'onglet (semaine/mois/stats).
 */
export function WeatherAlertSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("weatherAlert");

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      return;
    }
    getEventById(eventId).then(setEvent);
  }, [eventId]);

  function close() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("weatherAlert");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function delay(minutes: number) {
    if (!eventId) return;
    startTransition(async () => {
      await applyDelayCascade(eventId, minutes);
      router.refresh();
      close();
    });
  }

  return (
    <BottomSheet open={!!eventId && !!event} onClose={close}>
      {event && (
        <div className="flex flex-col gap-4 items-center text-center pt-2">
          <Mascot size={56} />
          <div className="flex items-center gap-2 text-accent font-mono text-[11px] tracking-[.1em] uppercase">
            <CloudRain size={14} /> Pluie prévue
          </div>
          <h2 className="font-serif text-xl leading-snug">
            Ça risque de mouiller
            <br />« {event.title} » à {formatTime(event.startAt)}
          </h2>
          <p className="text-[13.5px] text-ink-2">On décale, ou tu tentes le coup ?</p>

          <div className="flex gap-2 w-full mt-1">
            {QUICK_DELAYS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={pending}
                onClick={() => delay(m)}
                className="flex-1 h-11 rounded-input border border-accent bg-tint text-[13.5px] font-medium cursor-pointer disabled:opacity-50"
              >
                +{m} min
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="text-[13px] text-ink-2 underline cursor-pointer"
          >
            Laisser tel quel
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
