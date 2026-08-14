"use client";

import { useTransition } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useUIStore } from "@/stores/ui.store";
import { updateThemePreference } from "@/app/settings/actions";

export function AppearanceSection() {
  const theme = useUIStore((s) => s.resolvedTheme);
  const setTheme = useUIStore((s) => s.setTheme);
  const [, startTransition] = useTransition();

  function handleChange(value: "light" | "dark") {
    setTheme(value);
    startTransition(() => {
      updateThemePreference(value);
    });
  }

  return (
    <div>
      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted mb-2">
        Apparence
      </div>
      <SegmentedControl
        value={theme}
        onChange={handleChange}
        options={[
          { value: "light", label: "Clair" },
          { value: "dark", label: "Sombre" },
        ]}
      />
    </div>
  );
}
