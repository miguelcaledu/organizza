-- Organizza — client (couple) accounts for the seating planner
-- Run once in the Supabase SQL editor, after schema.sql and seating-plans.sql. Safe to re-run.
--
-- Adds a third role, 'client', for couples invited by staff. Clients can sign in
-- and see only the seating plans assigned to them; everything else in the staff
-- app (events, roster, HR, documents…) becomes staff-only.
--
-- Clients never write to seating_plans directly: their saves go through the
-- app server (/api/plans/[id]), which keeps only the parts they're allowed to
-- change (guests + seats per table) and records each change in
-- seating_plan_changes for staff to review. Before this, every
-- signed-in user could read all staff data, which would have included clients.

-- ─────────────────────────────────────────────────────────────────────────
-- Roles
-- ─────────────────────────────────────────────────────────────────────────
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'employee', 'client'));

create or replace function is_staff() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'employee')
  );
$$ language sql security definer stable set search_path = public;

-- Invites from the staff app set user metadata role = 'client'. That's the only
-- role metadata can grant (it can only ever lower privileges); everything else
-- keeps the original bootstrap rule (first user admin, then employee).
create or replace function handle_new_user() returns trigger as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from profiles) into is_first;
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when new.raw_user_meta_data ->> 'role' = 'client' then 'client'
      when is_first then 'admin'
      else 'employee'
    end
  );
  insert into notification_prefs (profile_id) values (new.id) on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- profiles_update_own_or_admin lets people edit their own row, which also
-- covered the role column — a client could have promoted itself to staff.
-- Only admins may change roles.
create or replace function protect_profile_role() returns trigger as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists profiles_protect_role on profiles;
create trigger profiles_protect_role before update on profiles
  for each row execute function protect_profile_role();

-- ─────────────────────────────────────────────────────────────────────────
-- Staff data: readable by staff only (was: any signed-in user)
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "profiles_select_authenticated" on profiles;
create policy "profiles_select_authenticated" on profiles for select to authenticated
  using (is_staff() or id = auth.uid());

drop policy if exists "events_select_authenticated" on events;
create policy "events_select_authenticated" on events for select to authenticated using (is_staff());

drop policy if exists "event_services_select_authenticated" on event_services;
create policy "event_services_select_authenticated" on event_services for select to authenticated using (is_staff());

drop policy if exists "event_team_select_authenticated" on event_team;
create policy "event_team_select_authenticated" on event_team for select to authenticated using (is_staff());

drop policy if exists "tasks_select_authenticated" on tasks;
create policy "tasks_select_authenticated" on tasks for select to authenticated using (is_staff());

drop policy if exists "notes_select_authenticated" on notes;
create policy "notes_select_authenticated" on notes for select to authenticated using (is_staff());
drop policy if exists "notes_insert_own" on notes;
create policy "notes_insert_own" on notes for insert to authenticated
  with check (author_id = auth.uid() and is_staff());

drop policy if exists "documents_select_authenticated" on documents;
create policy "documents_select_authenticated" on documents for select to authenticated using (is_staff());
drop policy if exists "documents_insert_authenticated" on documents;
create policy "documents_insert_authenticated" on documents for insert to authenticated with check (is_staff());

drop policy if exists "shifts_select_authenticated" on shifts;
create policy "shifts_select_authenticated" on shifts for select to authenticated using (is_staff());

drop policy if exists "documents_bucket_read" on storage.objects;
create policy "documents_bucket_read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and is_staff());
drop policy if exists "documents_bucket_write" on storage.objects;
create policy "documents_bucket_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- Seating plans: owned by a client, managed by staff
-- ─────────────────────────────────────────────────────────────────────────
alter table seating_plans add column if not exists client_id uuid references profiles (id) on delete set null;
alter table seating_plans add column if not exists created_by uuid references profiles (id) on delete set null;
create index if not exists seating_plans_client_idx on seating_plans (client_id);

-- editing is by login now; old edit links stop working
alter table seating_plans alter column edit_token drop not null;
update seating_plans set edit_token = null where edit_token is not null;
alter table seating_plans alter column view_token set default seating_token();

drop policy if exists "seating_plans_select" on seating_plans;
create policy "seating_plans_select" on seating_plans for select to authenticated
  using (is_staff() or client_id = auth.uid());
drop policy if exists "seating_plans_insert_staff" on seating_plans;
create policy "seating_plans_insert_staff" on seating_plans for insert to authenticated
  with check (is_staff());
-- staff only: client saves are applied server-side (see header)
drop policy if exists "seating_plans_update" on seating_plans;
create policy "seating_plans_update" on seating_plans for update to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists "seating_plans_delete_staff" on seating_plans;
create policy "seating_plans_delete_staff" on seating_plans for delete to authenticated
  using (is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- Change log of client edits (staff-only). Rows are written by the app server
-- with the service role; staff read them and mark them reviewed.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists seating_plan_changes (
  id bigint generated always as identity primary key,
  plan_id uuid not null references seating_plans (id) on delete cascade,
  actor_id uuid references profiles (id) on delete set null,
  actor_name text not null default '',
  kind text not null check (kind in ('guest_added', 'guest_changed', 'guest_removed', 'seat_added', 'seat_removed')),
  table_id text,
  table_label text,
  seat_index int,
  guest_id text,
  guest_name text,
  summary text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles (id) on delete set null
);
create index if not exists seating_plan_changes_plan_idx on seating_plan_changes (plan_id, created_at desc);
create index if not exists seating_plan_changes_unreviewed_idx on seating_plan_changes (plan_id) where reviewed_at is null;
alter table seating_plan_changes enable row level security;

drop policy if exists "seating_plan_changes_select_staff" on seating_plan_changes;
create policy "seating_plan_changes_select_staff" on seating_plan_changes for select to authenticated using (is_staff());
drop policy if exists "seating_plan_changes_review_staff" on seating_plan_changes;
create policy "seating_plan_changes_review_staff" on seating_plan_changes for update to authenticated
  using (is_staff()) with check (is_staff());

-- The anonymous create/save RPCs are replaced by logged-in access above.
drop function if exists create_seating_plan(text, jsonb);
drop function if exists save_seating_plan(text, text, jsonb);

-- The read-only link (venue / caterer) keeps working without an account.
create or replace function get_seating_plan(p_token text) returns jsonb as $$
  select jsonb_build_object(
    'mode', 'view',
    'view_token', sp.view_token,
    'data', sp.data,
    'updated_at', sp.updated_at
  )
  from seating_plans sp
  where sp.view_token = p_token
  limit 1;
$$ language sql stable security definer set search_path = public;
