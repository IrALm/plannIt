-- Types "nécessitant un lieu" (ex. Sport, Travail, Restaurant) : opt-in par
-- type, même principe que weather_sensitive (migration 00016).
alter table public.event_types add column location_required boolean not null default false;

-- Lieu par événement (contrairement à la météo, une seule ville pour tout le
-- compte ne suffit pas ici — le trajet dépend du lieu précis de CHAQUE
-- activité). Géocodé via Nominatim (OpenStreetMap) côté serveur.
alter table public.events add column location_name text;
alter table public.events add column location_lat double precision;
alter table public.events add column location_lon double precision;

-- Dédup des alertes température ambiante (indépendantes des événements,
-- contrairement aux alertes pluie) : au plus une par jour et par sens
-- (chaleur / froid), sinon on spammerait à chaque passage du cron tant que
-- le seuil reste dépassé.
alter table public.user_preferences add column last_heat_alert_date date;
alter table public.user_preferences add column last_cold_alert_date date;
