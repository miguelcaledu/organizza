-- Organizza — trash for seating plans
-- Run once in the Supabase SQL editor, after client-accounts.sql. Safe to re-run.
--
-- "Eliminar" in Plantas now moves a plan to the trash (deleted_at is set).
-- Trashed plans are hidden from the couple and their read-only link stops
-- working. Staff can restore them for 30 days; after that they're deleted for
-- good (together with their change log) by a daily pg_cron job, and also
-- whenever staff open Plantas, in case pg_cron isn't enabled.

alter table seating_plans add column if not exists deleted_at timestamptz;
alter table seating_plans add column if not exists deleted_by uuid references profiles (id) on delete set null;
create index if not exists seating_plans_deleted_idx on seating_plans (deleted_at) where deleted_at is not null;

-- couples never see a trashed plan; staff see everything (the app filters)
drop policy if exists "seating_plans_select" on seating_plans;
create policy "seating_plans_select" on seating_plans for select to authenticated
  using (is_staff() or (client_id = auth.uid() and deleted_at is null));

-- the read-only link stops working while a plan is in the trash
create or replace function get_seating_plan(p_token text) returns jsonb as $$
  select jsonb_build_object(
    'mode', 'view',
    'view_token', sp.view_token,
    'data', sp.data,
    'updated_at', sp.updated_at
  )
  from seating_plans sp
  where sp.view_token = p_token and sp.deleted_at is null
  limit 1;
$$ language sql stable security definer set search_path = public;

create or replace function purge_deleted_seating_plans() returns integer as $$
declare
  n integer;
begin
  -- pg_cron runs without a user; from the app only staff may call this
  if auth.uid() is not null and not is_staff() then
    raise exception 'forbidden';
  end if;
  delete from seating_plans where deleted_at < now() - interval '30 days';
  get diagnostics n = row_count;
  return n;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function purge_deleted_seating_plans() from public;
grant execute on function purge_deleted_seating_plans() to authenticated;

-- daily clean-up at 03:15 UTC, if pg_cron is available on this project
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'purge-deleted-seating-plans';
  perform cron.schedule('purge-deleted-seating-plans', '15 3 * * *', 'select public.purge_deleted_seating_plans()');
exception when others then
  raise notice 'pg_cron unavailable (%): trashed plans are still purged whenever staff open Plantas', sqlerrm;
end;
$$;
