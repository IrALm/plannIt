-- Capture l'origine (http://localhost:3000 en dev, https://plann-it-cyan.vercel.app
-- en prod, etc.) au moment où le flux OAuth Google Calendar démarre, pour
-- rediriger le navigateur vers le bon domaine après le callback — sans ça,
-- un seul secret SITE_URL statique romprait le flux dans l'un des deux
-- environnements (cf. discussion sur la config des URLs dev/prod).
alter table public.oauth_states
  add column origin text;
