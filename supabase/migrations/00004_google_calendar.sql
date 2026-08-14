-- Tokens OAuth Google Calendar. Accès exclusivement via service_role depuis les
-- Edge Functions (cf. 00006_rls_policies.sql) — jamais lu/écrit depuis le client.
create table public.google_calendar_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  google_email text,
  scope text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger handle_updated_at
  before update on public.google_calendar_tokens
  for each row execute procedure moddatetime (updated_at);

-- Correspondance PlannIt <-> Google Calendar (survit à la suppression du pointeur
-- dénormalisé events.google_event_id, utile pour le debug/audit de sync).
create table public.google_calendar_event_map (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  google_event_id text not null,
  google_calendar_id text not null default 'primary',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id),
  unique (user_id, google_event_id)
);

create index google_calendar_event_map_user_id_idx on public.google_calendar_event_map (user_id);
