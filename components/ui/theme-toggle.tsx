"use client";

import { Sun, Moon } from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils/cn";

type ThemeToggleProps = {
  className?: string;
};

/** Bascule clair/sombre en un tap — présente sur tous les écrans, pas seulement dans Réglages. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useUIStore((s) => s.resolvedTheme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}
      className={cn(
        "size-[38px] shrink-0 rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors duration-200",
        className
      )}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
