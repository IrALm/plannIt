-- Préférence email : résumé hebdomadaire activé par défaut, désactivable
-- depuis Réglages (lien "Désactiver ce résumé" dans l'email lui-même).
alter table public.user_preferences add column weekly_recap_enabled boolean not null default true;

-- Verrou anti-double-envoi : send-weekly-recap tourne toutes les 15 min (cf.
-- cron ci-dessous) mais ne doit déclencher l'envoi qu'une seule fois pour la
-- semaine qui commence — la contrainte unique sur week_start fait office de
-- verrou distribué (le premier insert gagne, les invocations suivantes dans
-- la même fenêtre échouent silencieusement sur le conflit).
create table public.weekly_recap_log (
  week_start date primary key,
  sent_at timestamptz not null default now()
);

-- Jamais accédée par le client, uniquement par l'Edge Function via
-- service_role — même exception délibérée que google_calendar_tokens.
alter table public.weekly_recap_log enable row level security;

-- Réutilise le même jeton Vault que send-push-reminders (cron_secret,
-- migration 00011) : les deux fonctions vérifient CRON_SECRET de la même
-- façon, pas besoin d'un second secret.
select
  cron.schedule (
    'send-weekly-recap',
    '*/15 * * * *',
    $$
    select net.http_post(
      url := 'https://foukyqukmutuciunctbi.supabase.co/functions/v1/send-weekly-recap',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb
    );
    $$
  );
