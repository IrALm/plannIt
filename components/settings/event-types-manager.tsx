"use client";

import { useState, useTransition } from "react";
import { CloudRain, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { EVENT_COLOR_HEX } from "@/features/calendar/types";
import { updateEventType } from "@/features/calendar/actions";
import type { EventType } from "@/features/calendar/types";

type EventTypesManagerProps = {
  types: EventType[];
};

/**
 * Les cases "sensible à la météo" / "nécessite un lieu" n'existent qu'au
 * moment de créer un NOUVEAU type (TypeSelect) — sans cet écran, impossible
 * de les activer sur un type déjà existant (Sport, Travail créés avant ces
 * fonctionnalités, par exemple).
 */
export function EventTypesManager({ types }: EventTypesManagerProps) {
  const [localTypes, setLocalTypes] = useState(types);
  const [, startTransition] = useTransition();

  function toggle(id: string, field: "weatherSensitive" | "locationRequired", value: boolean) {
    setLocalTypes((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
    startTransition(() => {
      updateEventType(id, { [field]: value });
    });
  }

  if (localTypes.length === 0) return null;

  return (
    <div>
      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted mb-2">
        Types d&apos;activité
      </div>
      <div className="bg-surface border border-line rounded-card divide-y divide-line">
        {localTypes.map((t) => (
          <div key={t.id} className="px-[14px] py-[11px] flex flex-col gap-[8px]">
            <div className="flex items-center gap-2">
              <span className="size-[9px] rounded-full shrink-0" style={{ background: EVENT_COLOR_HEX[t.color] }} />
              <span className="text-sm font-medium">{t.name}</span>
            </div>
            <div className="flex items-center justify-between pl-[17px]">
              <span className="flex items-center gap-[6px] text-[12.5px] text-ink-2">
                <CloudRain size={13} /> Sensible à la météo
              </span>
              <Switch
                checked={t.weatherSensitive}
                onCheckedChange={(v) => toggle(t.id, "weatherSensitive", v)}
              />
            </div>
            <div className="flex items-center justify-between pl-[17px]">
              <span className="flex items-center gap-[6px] text-[12.5px] text-ink-2">
                <MapPin size={13} /> Nécessite un lieu
              </span>
              <Switch
                checked={t.locationRequired}
                onCheckedChange={(v) => toggle(t.id, "locationRequired", v)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
