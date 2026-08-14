-- Extension utilisée pour l'auto-update de la colonne updated_at sur toutes les tables.
create extension if not exists moddatetime;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure moddatetime (updated_at);

-- Crée automatiquement un profil (et en 00005 une ligne user_preferences) à l'inscription.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
