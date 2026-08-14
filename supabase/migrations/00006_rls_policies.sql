-- Pattern RLS uniforme : chaque utilisateur ne voit/modifie que ses propres lignes.
-- Seule exception délibérée : google_calendar_tokens, tout en bas de ce fichier.

alter table public.profiles enable row level security;
create policy "select own" on public.profiles for select using (auth.uid () = id);
create policy "update own" on public.profiles for update using (auth.uid () = id) with check (auth.uid () = id);
-- pas d'insert/delete client : la ligne est créée par le trigger handle_new_user()
-- et supprimée en cascade avec auth.users.

alter table public.event_types enable row level security;
create policy "select own" on public.event_types for select using (auth.uid () = user_id);
create policy "insert own" on public.event_types for insert with check (auth.uid () = user_id);
create policy "update own" on public.event_types for update using (auth.uid () = user_id) with check (auth.uid () = user_id);
create policy "delete own" on public.event_types for delete using (auth.uid () = user_id);

alter table public.events enable row level security;
create policy "select own" on public.events for select using (auth.uid () = user_id);
create policy "insert own" on public.events for insert with check (auth.uid () = user_id);
create policy "update own" on public.events for update using (auth.uid () = user_id) with check (auth.uid () = user_id);
create policy "delete own" on public.events for delete using (auth.uid () = user_id);

alter table public.google_calendar_event_map enable row level security;
create policy "select own" on public.google_calendar_event_map for select using (auth.uid () = user_id);
create policy "insert own" on public.google_calendar_event_map for insert with check (auth.uid () = user_id);
create policy "update own" on public.google_calendar_event_map for update using (auth.uid () = user_id) with check (auth.uid () = user_id);
create policy "delete own" on public.google_calendar_event_map for delete using (auth.uid () = user_id);

alter table public.user_preferences enable row level security;
create policy "select own" on public.user_preferences for select using (auth.uid () = user_id);
create policy "update own" on public.user_preferences for update using (auth.uid () = user_id) with check (auth.uid () = user_id);
-- pas d'insert/delete client : ligne créée par handle_new_user(), supprimée en cascade.

-- EXCEPTION DÉLIBÉRÉE : google_calendar_tokens contient des tokens OAuth vivants.
-- RLS activé mais AUCUNE policy pour authenticated/anon => accès refusé par défaut
-- pour tout le monde sauf service_role (qui bypass RLS), utilisé uniquement à
-- l'intérieur des Edge Functions google-calendar / google-calendar-oauth.
-- Ne pas "corriger" en ajoutant des policies select/update pour aligner avec le
-- pattern ci-dessus : c'est la restriction voulue.
alter table public.google_calendar_tokens enable row level security;
