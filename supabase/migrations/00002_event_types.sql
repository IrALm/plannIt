-- 5 couleurs fixes du design system (cf. EV dans PlannIt.dc.html) : pas de hex libre,
-- pour garder les types custom visuellement cohérents avec le reste de l'app.
create type public.event_color as enum ('blue', 'coral', 'green', 'amber', 'purple');

create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color public.event_color not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index event_types_user_id_idx on public.event_types (user_id);

create trigger handle_updated_at
  before update on public.event_types
  for each row execute procedure moddatetime (updated_at);
