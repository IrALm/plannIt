"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { updateWeeklyRecapEnabled } from "@/app/settings/actions";

type WeeklyRecapToggleProps = {
  enabled: boolean;
};

export function WeeklyRecapToggle({ enabled: initialEnabled }: WeeklyRecapToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(() => {
      updateWeeklyRecapEnabled(next);
    });
  }

  return (
    <div className="flex items-center justify-between py-[11px]">
      <div>
        <span className="text-sm">Résumé hebdomadaire</span>
        <div className="text-[11.5px] text-muted mt-0.5">
          Par email, chaque lundi, si tu as des activités prévues.
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} />
    </div>
  );
}
