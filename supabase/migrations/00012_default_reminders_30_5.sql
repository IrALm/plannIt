-- Nouveau défaut global : 30 min + 5 min (au lieu de 30 min seul). Au-delà de
-- ces deux valeurs, l'utilisateur peut ajouter librement autant de rappels
-- qu'il veut (n'importe quelle valeur, en minutes/heures/jours) — cf.
-- components/ui/reminder-picker.tsx.
alter table public.user_preferences alter column default_reminders set default '{30,5}';

-- Backfill uniquement les comptes encore sur l'ancien défaut inchangé
-- ('{30}') : ne touche pas aux préférences déjà personnalisées par un
-- utilisateur.
update public.user_preferences set default_reminders = '{30,5}' where default_reminders = '{30}';
