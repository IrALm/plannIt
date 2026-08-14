"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { updateDefaultReminders } from "@/app/settings/actions";

const PRESETS = [
  { minutes: 30, label: "30 minutes avant" },
  { minutes: 60, label: "1 heure avant" },
];

type RemindersSectionProps = {
  defaultReminders: number[];
};

export function RemindersSection({ defaultReminders }: RemindersSectionProps) {
  const [reminders, setReminders] = useState(defaultReminders);
  const [, startTransition] = useTransition();

  function toggle(minutes: number) {
    const next = reminders.includes(minutes)
      ? reminders.filter((m) => m !== minutes)
      : [...reminders, minutes];
    setReminders(next);
    startTransition(() => {
      updateDefaultReminders(next);
    });
  }

  return (
    <div>
      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted mb-2">
        Rappels par défaut
      </div>
      <div className="bg-surface border border-line rounded-card px-[14px]">
        {PRESETS.map((preset, i) => (
          <div
            key={preset.minutes}
            className={`flex items-center justify-between py-[11px] ${
              i < PRESETS.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <span className="text-sm">{preset.label}</span>
            <Switch
              checked={reminders.includes(preset.minutes)}
              onCheckedChange={() => toggle(preset.minutes)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
