-- Nonce à usage unique pour relier l'initiation de l'OAuth Google Calendar
-- (appel fetch authentifié depuis le frontend) au callback (redirect brut de
-- Google, sans header d'auth) : évite de faire transiter le user_id en clair
-- dans l'URL de callback.
create table public.oauth_states (
  state uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- chemin à rouvrir après le callback OAuth : /settings ou /onboarding selon
  -- le point de départ du flux, pour ne pas sortir l'utilisateur de l'onboarding.
  return_to text not null default '/settings',
  created_at timestamptz not null default now()
);

-- Même exception que google_calendar_tokens : accès exclusif service_role
-- (Edge Functions), aucune policy authenticated/anon.
alter table public.oauth_states enable row level security;
