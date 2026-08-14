import type { Database } from "./database.types";

// Alias pratiques dérivés du type généré par `supabase gen types` — à importer
// depuis ce fichier plutôt que directement depuis database.types.ts, qui est
// régénéré (et donc écrasé) à chaque `supabase gen types typescript`.
export type EventColor = Database["public"]["Enums"]["event_color"];
export type ThemePreference = Database["public"]["Enums"]["theme_preference"];
