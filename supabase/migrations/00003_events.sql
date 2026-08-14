create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type_id uuid references public.event_types (id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  -- minutes avant l'événement, ex. '{30,60}'
  reminders integer[] not null default '{}',
  -- pointeur rapide vers l'événement Google Calendar correspondant (cf. aussi
  -- google_calendar_event_map en 00004 pour l'historique complet de sync)
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (end_at > start_at)
);

create index events_user_id_start_at_idx on public.events (user_id, start_at);

create trigger handle_updated_at
  before update on public.events
  for each row execute procedure moddatetime (updated_at);
