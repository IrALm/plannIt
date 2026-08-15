-- Abonnements Web Push (un par navigateur/appareil), créés côté client via
-- pushManager.subscribe(). Lus/écrits uniquement par leur propriétaire côté
-- client (souscription/désinscription) ; consommés en lecture par
-- l'Edge Function send-push-reminders via le client service_role.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy "select own" on public.push_subscriptions for select using (auth.uid () = user_id);
create policy "insert own" on public.push_subscriptions for insert with check (auth.uid () = user_id);
create policy "delete own" on public.push_subscriptions for delete using (auth.uid () = user_id);
-- pas de policy update : la désinscription supprime la ligne, elle n'est
-- jamais modifiée en place (cf. features/notifications/actions.ts).

-- Décalages (en minutes) déjà notifiés pour un événement, pour que le cron
-- (qui tourne chaque minute) ne renvoie pas le même rappel plusieurs fois.
alter table public.events add column reminders_sent integer[] not null default '{}';

-- Déclencheur planifié pour les rappels (brique manquante identifiée depuis
-- le plan M7) : chaque minute, pg_cron appelle l'Edge Function
-- send-push-reminders, qui scanne les événements à venir et envoie les push
-- dus à tous les abonnements de l'utilisateur concerné.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Le jeton d'appel (comparé côté fonction à Deno.env.get("CRON_SECRET"),
-- cf. supabase/functions/send-push-reminders) est lu depuis Vault plutôt que
-- codé en dur ici, pour ne jamais committer de secret dans une migration.
-- Sur un nouveau projet, avant que le cron ne fonctionne, exécuter une fois
-- (hors migration versionnée) :
--   select vault.create_secret('<même valeur que le secret Edge Function CRON_SECRET>', 'cron_secret');
select
  cron.schedule (
    'send-event-reminders',
    '* * * * *',
    $$
    select net.http_post(
      url := 'https://foukyqukmutuciunctbi.supabase.co/functions/v1/send-push-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb
    );
    $$
  );
