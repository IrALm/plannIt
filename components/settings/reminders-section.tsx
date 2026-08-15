"use client";

import { useState, useTransition } from "react";
import { ReminderPicker } from "@/components/ui/reminder-picker";
import { updateDefaultReminders } from "@/app/settings/actions";

type RemindersSectionProps = {
  defaultReminders: number[];
};

/**
 * Rappels par défaut : préremplissent chaque nouvel événement (modifiables
 * ensuite au cas par cas dans le modal). Une notification est en plus
 * toujours envoyée au début de l'événement, quels que soient ces réglages
 * (cf. send-push-reminders) — pas besoin de l'ajouter ici.
 */
export function RemindersSection({ defaultReminders }: RemindersSectionProps) {
  const [reminders, setReminders] = useState(defaultReminders);
  const [, startTransition] = useTransition();

  function handleChange(next: number[]) {
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
      <div className="bg-surface border border-line rounded-card p-[13px]">
        <ReminderPicker value={reminders} onChange={handleChange} />
      </div>
    </div>
  );
}
