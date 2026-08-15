"use client";

import { useState, useTransition } from "react";
import { CloudRain } from "lucide-react";
import { updateWeatherCity } from "@/app/settings/actions";

type WeatherCityInputProps = {
  initialCity: string | null;
};

export function WeatherCityInput({ initialCity }: WeatherCityInputProps) {
  const [city, setCity] = useState(initialCity ?? "");
  const [savedCity, setSavedCity] = useState(initialCity);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateWeatherCity(city);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSavedCity(result.resolvedName ?? null);
      if (result.resolvedName) setCity(result.resolvedName);
    });
  }

  return (
    <div>
      <div className="font-mono text-[10px] tracking-[.14em] uppercase text-muted mb-2">
        Alertes météo
      </div>
      <div className="bg-surface border border-line rounded-card p-[13px] flex flex-col gap-[10px]">
        <div className="flex items-center gap-2 text-[13px] text-ink-2">
          <CloudRain size={15} className="text-accent shrink-0" />
          {savedCity ? (
            <span>
              Ville enregistrée : <span className="text-ink font-medium">{savedCity}</span>
            </span>
          ) : (
            <span>Renseigne ta ville pour activer les alertes pluie sur les types sensibles à la météo.</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex. Paris"
            className="flex-1 h-9 rounded-input border border-line bg-bg px-3 text-[13.5px] focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="h-9 px-4 rounded-input bg-accent text-accent-ink text-[13px] font-semibold cursor-pointer disabled:opacity-50"
          >
            {pending ? "..." : "Enregistrer"}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-[12.5px] text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
