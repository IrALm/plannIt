create type public.theme_preference as enum ('light', 'dark', 'auto');

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme public.theme_preference not null default 'auto',
  onboarding_completed boolean not null default false,
  onboarding_step integer not null default 1,
  default_reminders integer[] not null default '{30}',
  -- flag dénormalisé pratique : évite un join vers google_calendar_tokens
  -- juste pour afficher le statut de connexion dans les Réglages.
  google_calendar_connected boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger handle_updated_at
  before update on public.user_preferences
  for each row execute procedure moddatetime (updated_at);

-- Étend handle_new_user() (défini en 00001) pour créer aussi la ligne
-- user_preferences par défaut à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end;
$$;
