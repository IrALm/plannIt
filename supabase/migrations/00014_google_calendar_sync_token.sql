-- Curseur d'incrémental sync Google Calendar (syncToken officiel de l'API :
-- renvoie uniquement les événements créés/modifiés/supprimés depuis le
-- dernier appel, y compris les suppressions — impossible à détecter avec un
-- simple events.list borné par date). Un par utilisateur connecté, à côté
-- de ses tokens OAuth.
alter table public.google_calendar_tokens add column sync_token text;

-- Import Google Calendar → PlannIt (le sens PlannIt → Google existe déjà via
-- syncEventToGoogle) : toutes les 10 min, réutilise le même jeton Vault
-- cron_secret que send-push-reminders/send-weekly-recap (migration 00011).
select
  cron.schedule (
    'sync-google-calendar',
    '*/10 * * * *',
    $$
    select net.http_post(
      url := 'https://foukyqukmutuciunctbi.supabase.co/functions/v1/sync-google-calendar',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb
    );
    $$
  );
