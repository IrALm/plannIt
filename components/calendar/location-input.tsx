"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { searchAddress, type GeocodeResult } from "@/lib/geo/geocode";
import type { EventLocation } from "@/features/events/types";

type LocationInputProps = {
  value: EventLocation | null;
  onChange: (location: EventLocation | null) => void;
};

/** Recherche d'adresse via Nominatim (OpenStreetMap) — debounced, appelée
 * côté serveur (cf. lib/geo/geocode.ts) pour respecter sa politique d'usage. */
export function LocationInput({ value, onChange }: LocationInputProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  function handleInput(next: string) {
    setQuery(next);
    onChange(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (next.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const found = await searchAddress(next);
      setResults(found);
      setOpen(found.length > 0);
    }, 500);
  }

  function pick(result: GeocodeResult) {
    onChange(result);
    setQuery(result.name);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-[10px] bg-surface border border-line rounded-card px-[13px] py-[12px]">
        <MapPin size={16} className="text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Adresse du lieu"
          className="flex-1 min-w-0 text-[14.5px] bg-transparent focus:outline-none"
        />
        {query && (
          <button type="button" onClick={clear} className="text-muted cursor-pointer shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-line rounded-card shadow-card overflow-hidden max-h-[220px] overflow-y-auto">
          {results.map((r) => (
            <button
              key={`${r.lat},${r.lon}`}
              type="button"
              onClick={() => pick(r)}
              className="w-full flex items-start gap-[8px] px-[13px] py-[10px] hover:bg-surface-2 text-left cursor-pointer border-b border-line last:border-b-0"
            >
              <MapPin size={13} className="text-accent shrink-0 mt-[2px]" />
              <span className="text-[13px] text-ink leading-snug">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
