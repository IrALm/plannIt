-- google_calendar_tokens est en lecture service_role uniquement (cf. 00006), donc
-- l'email Google connecté ne peut pas être lu directement par l'utilisateur pour
-- l'afficher dans les Réglages. On le dénormalise ici (donnée non sensible),
-- tenu à jour par l'Edge Function google-calendar-oauth à la connexion/déconnexion.
alter table public.user_preferences
  add column google_email text;
