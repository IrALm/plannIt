-- Distinct de onboarding_completed : permet de forcer le formulaire
-- nom + avatar en tout premier écran d'onboarding, y compris pour les
-- utilisateurs Google OAuth (dont le profil arrive déjà avec un nom Google
-- pré-rempli, mais qu'on veut quand même laisser choisir/personnaliser).
alter table public.profiles
  add column profile_completed boolean not null default false;
