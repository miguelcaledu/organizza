-- Organizza — close public sign-up
-- Run once in the Supabase SQL editor, after client-accounts.sql. Safe to re-run.
--
-- Until now any new auth user (e.g. someone using the old "Criar a primeira
-- conta de administrador" link, or calling Supabase's sign-up API directly with
-- the public anon key) became an 'employee' — i.e. staff with access to every
-- event and every couple's plan.
--
-- New users now start as 'client', which on its own grants nothing (a client
-- only sees plans explicitly assigned to them). Staff roles are granted only by:
--   • app_metadata.role, which only the service role can set (seed script), or
--   • an admin, via Definições → Utilizadores → Convidar colaborador.
-- The very first user of an empty project still becomes admin (bootstrap).
--
-- Also recommended: Supabase → Authentication → Sign In / Providers → turn off
-- "Allow new users to sign up". Invites from the app keep working.

create or replace function handle_new_user() returns trigger as $$
declare
  is_first boolean;
  granted text := new.raw_app_meta_data ->> 'role';
begin
  select not exists (select 1 from profiles) into is_first;
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when granted in ('admin', 'employee') then granted
      when is_first then 'admin'
      else 'client'
    end
  );
  insert into notification_prefs (profile_id) values (new.id) on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
