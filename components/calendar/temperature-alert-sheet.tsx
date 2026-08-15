"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Thermometer, Snowflake } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Mascot } from "@/components/icons/mascot";

const COPY = {
  hot: {
    icon: Thermometer,
    label: "Forte chaleur en vue",
    message: "Ça va chauffer dans les prochaines heures. Pense à t'hydrater et à limiter l'effort en plein soleil.",
  },
  cold: {
    icon: Snowflake,
    label: "Froid vif en vue",
    message: "Le thermomètre va chuter dans les prochaines heures. Pense à te couvrir avant de sortir.",
  },
};

/** Feuille mascotte ouverte après un tap sur une alerte température ambiante
 * (?tempAlert=hot|cold, cf. worker/index.ts) — pas liée à un événement
 * précis, contrairement à WeatherAlertSheet (pluie avant une activité). */
export function TemperatureAlertSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kind = searchParams.get("tempAlert");
  const copy = kind === "hot" || kind === "cold" ? COPY[kind] : null;

  function close() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("tempAlert");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  if (!copy) return null;
  const Icon = copy.icon;

  return (
    <BottomSheet open={!!copy} onClose={close}>
      <div className="flex flex-col gap-4 items-center text-center pt-2">
        <Mascot size={56} />
        <div className="flex items-center gap-2 text-accent font-mono text-[11px] tracking-[.1em] uppercase">
          <Icon size={14} /> {copy.label}
        </div>
        <p className="text-[14.5px] text-ink leading-snug px-2">{copy.message}</p>
        <button
          type="button"
          onClick={close}
          className="h-11 w-full rounded-input bg-accent text-accent-ink text-[13.5px] font-semibold cursor-pointer"
        >
          Compris
        </button>
      </div>
    </BottomSheet>
  );
}
