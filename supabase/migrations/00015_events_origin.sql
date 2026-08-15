-- Distingue les événements importés depuis Google (sync-google-calendar) des
-- événements natifs PlannIt poussés vers Google (syncEventToGoogle). Sert
-- uniquement à sync-google-calendar : une suppression détectée côté Google
-- ne doit effacer la copie PlannIt que si Google en était l'origine — un
-- événement créé dans PlannIt reste la propriété de PlannIt même si sa copie
-- Google disparaît (auto-réparé au prochain edit, cf. google-calendar/index.ts
-- createOnGoogle).
alter table public.events add column synced_from_google boolean not null default false;
