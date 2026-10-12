-- Organizza — tighten function permissions (Supabase security advisor)
-- Run after lock-signup.sql. Safe to re-run.
--
-- Trigger functions must never be callable through the API; role checks and
-- the trash purge are only needed by signed-in users (RLS policies run as the
-- `authenticated` role). get_seating_plan stays public on purpose: it backs the
-- read-only plan link for venues.

revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function protect_profile_role() from public, anon, authenticated;

revoke execute on function is_admin() from public, anon;
revoke execute on function is_staff() from public, anon;
revoke execute on function purge_deleted_seating_plans() from public, anon;
grant execute on function is_admin() to authenticated;
grant execute on function is_staff() to authenticated;
grant execute on function purge_deleted_seating_plans() to authenticated;

alter function set_updated_at() set search_path = public;
alter function is_admin() set search_path = public;
