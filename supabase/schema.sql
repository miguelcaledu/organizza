-- Organizza — schema + RLS
-- Run this once in the Supabase SQL editor (or `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- Orgs: single row for now. Every tenant-scoped table carries org_id with
-- this row as the default, so multi-tenancy later is a filter change, not
-- a rewrite: add more org rows, stop defaulting org_id, add an org switcher.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists orgs (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  name text not null default 'Organizza',
  created_at timestamptz not null default now()
);
insert into orgs (id, name) values ('00000000-0000-0000-0000-000000000001', 'Organizza')
  on conflict (id) do nothing;

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────────────────────────────────
-- Profiles (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null default '00000000-0000-0000-0000-000000000001' references orgs (id),
  full_name text not null default '',
  email text not null default '',
  role text not null default 'employee' check (role in ('admin', 'employee')),
  phone text default '',
  avatar_color text not null default '#8A9A7B',
  job_title text default '',
  department text default '',
  skills text[] not null default '{}',
  availability text not null default 'Disponível' check (availability in ('Disponível', 'Ocupado', 'Ausente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

-- New auth users get a profile row automatically. The very first user to
-- sign up becomes admin (bootstrap); everyone after starts as employee and
-- an admin can promote them later via Definições → Utilizadores.
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
    case when is_first then 'admin' else 'employee' end
  );
  insert into notification_prefs (profile_id) values (new.id) on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- helper used throughout RLS policies below
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ─────────────────────────────────────────────────────────────────────────
-- Events
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001' references orgs (id),
  name text not null,
  type text not null default 'Casamento',
  client text default '',
  venue text not null default '',
  event_date date not null,
  guests int not null default 0,
  lead_id uuid references profiles (id),
  status text not null default 'Planeamento'
    check (status in ('Planeamento', 'Produção', 'Em curso', 'Concluído', 'Cancelado')),
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists events_set_updated_at on events;
create trigger events_set_updated_at before update on events
  for each row execute function set_updated_at();

create table if not exists event_services (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  label text not null
);

create table if not exists event_team (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role_on_event text default '',
  unique (event_id, profile_id)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  label text not null,
  responsible_id uuid references profiles (id),
  deadline date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001' references orgs (id),
  event_id uuid references events (id) on delete cascade,
  name text not null,
  category text not null default 'Modelos',
  storage_path text not null,
  uploaded_by uuid references profiles (id),
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001' references orgs (id),
  profile_id uuid not null references profiles (id) on delete cascade,
  event_id uuid references events (id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  role_on_shift text default '',
  location text default '',
  notes text default '',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- People / HR — admin-only sensitive extension of profiles
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists people_hr (
  profile_id uuid primary key references profiles (id) on delete cascade,
  dob date,
  address text default '',
  personal_phone text default '',
  personal_email text default '',
  emergency_name text default '',
  emergency_phone text default '',
  contract_type text not null default 'Permanente' check (contract_type in ('Permanente', 'Freelancer')),
  weekly_hours numeric default 0,
  rate numeric default 0,
  rate_unit text default 'mês',
  manager_id uuid references profiles (id),
  iban text default '',
  tax_id text default '',
  bank_name text default '',
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  start_date date
);

create table if not exists hr_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  expiry date,
  created_at timestamptz not null default now()
);

create table if not exists notification_prefs (
  profile_id uuid primary key references profiles (id) on delete cascade,
  notif_email boolean not null default true,
  notif_sms boolean not null default false,
  notif_schedule boolean not null default true,
  notif_docs boolean not null default true
);

-- create the trigger now that notification_prefs exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table events enable row level security;
alter table event_services enable row level security;
alter table event_team enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;
alter table documents enable row level security;
alter table shifts enable row level security;
alter table people_hr enable row level security;
alter table hr_documents enable row level security;
alter table notification_prefs enable row level security;

-- profiles: everyone signed in can see the roster; you can update your own
-- basics, admins can update anyone (e.g. to change roles).
create policy "profiles_select_authenticated" on profiles for select to authenticated using (true);
create policy "profiles_update_own_or_admin" on profiles for update to authenticated
  using (id = auth.uid() or is_admin());

-- events: readable by anyone signed in; only admins create/edit/delete.
create policy "events_select_authenticated" on events for select to authenticated using (true);
create policy "events_write_admin" on events for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "event_services_select_authenticated" on event_services for select to authenticated using (true);
create policy "event_services_write_admin" on event_services for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "event_team_select_authenticated" on event_team for select to authenticated using (true);
create policy "event_team_write_admin" on event_team for all to authenticated
  using (is_admin()) with check (is_admin());

-- tasks: everyone can read; admins manage the list; anyone can flip `done`
-- on a task (kept simple — column-level restriction isn't enforced by RLS).
create policy "tasks_select_authenticated" on tasks for select to authenticated using (true);
create policy "tasks_insert_admin" on tasks for insert to authenticated with check (is_admin());
create policy "tasks_delete_admin" on tasks for delete to authenticated using (is_admin());
create policy "tasks_update_admin_or_responsible" on tasks for update to authenticated
  using (is_admin() or responsible_id = auth.uid());

-- notes: everyone can read and add; only admins or the author can delete.
create policy "notes_select_authenticated" on notes for select to authenticated using (true);
create policy "notes_insert_own" on notes for insert to authenticated with check (author_id = auth.uid());
create policy "notes_delete_admin_or_author" on notes for delete to authenticated
  using (is_admin() or author_id = auth.uid());

-- documents: everyone can read and upload; only admins delete.
create policy "documents_select_authenticated" on documents for select to authenticated using (true);
create policy "documents_insert_authenticated" on documents for insert to authenticated with check (true);
create policy "documents_delete_admin" on documents for delete to authenticated using (is_admin());

-- shifts: everyone can read (so employees see the schedule); only admins write.
create policy "shifts_select_authenticated" on shifts for select to authenticated using (true);
create policy "shifts_write_admin" on shifts for all to authenticated
  using (is_admin()) with check (is_admin());

-- people_hr / hr_documents: admin-only, full stop.
create policy "people_hr_admin_only" on people_hr for all to authenticated
  using (is_admin()) with check (is_admin());
create policy "hr_documents_admin_only" on hr_documents for all to authenticated
  using (is_admin()) with check (is_admin());

-- notification_prefs: everyone manages their own.
create policy "notification_prefs_own" on notification_prefs for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- Storage bucket for documents
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

create policy "documents_bucket_read" on storage.objects for select to authenticated
  using (bucket_id = 'documents');
create policy "documents_bucket_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents');
create policy "documents_bucket_delete_admin" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and is_admin());
