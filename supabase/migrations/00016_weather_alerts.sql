-- Types "sensibles à la météo" (ex. Sport, Extérieur) : opt-in par type,
-- pas par événement — évite d'avoir à le redemander à chaque création.
alter table public.event_types add column weather_sensitive boolean not null default false;

-- Une seule localisation par utilisateur (pas par événement) : suffisant
-- pour un planning perso, évite toute UI de saisie de lieu par activité.
-- Géocodée une fois côté serveur (Open-Meteo, gratuit, sans clé) à l'enregistrement.
alter table public.user_preferences add column weather_city text;
alter table public.user_preferences add column weather_lat double precision;
alter table public.user_preferences add column weather_lon double precision;

-- Empêche de renvoyer la même alerte plusieurs fois pour le même événement
-- (la fonction tourne toutes les 30 min) — vérifié une seule fois, quand
-- l'événement entre dans la fenêtre "prochaines heures".
alter table public.events add column weather_alert_sent boolean not null default false;

-- Vérification toutes les 30 min (la météo n'a pas besoin de précision à la
-- minute) — réutilise le même jeton Vault cron_secret que les autres jobs
-- (migration 00011).
select
  cron.schedule (
    'send-weather-alerts',
    '*/30 * * * *',
    $$
    select net.http_post(
      url := 'https://foukyqukmutuciunctbi.supabase.co/functions/v1/send-weather-alerts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb
    );
    $$
  );
