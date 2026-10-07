-- Organizza — wedding seating plans (couple-facing, link-based access)
-- Run once in the Supabase SQL editor, after schema.sql. Safe to re-run.
--
-- Couples don't have accounts: each plan has two unguessable tokens, one that
-- grants editing and one read-only (for the venue / planner). The table has RLS
-- enabled and NO policies, so the anon key can't list or read rows directly —
-- the only way in is through the security-definer functions below, which
-- require knowing a token.

create extension if not exists "pgcrypto" with schema extensions;

create table if not exists seating_plans (
  id uuid primary key default gen_random_uuid(),
  edit_token text not null unique,
  view_token text not null unique,
  title text not null default '',
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table seating_plans enable row level security;

drop trigger if exists seating_plans_set_updated_at on seating_plans;
create trigger seating_plans_set_updated_at before update on seating_plans
  for each row execute function set_updated_at();

-- 18 random bytes → 24 url-safe characters
create or replace function seating_token() returns text as $$
  select translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_');
$$ language sql volatile set search_path = public, extensions;

create or replace function create_seating_plan(p_title text, p_data jsonb)
returns table (edit_token text, view_token text) as $$
begin
  if pg_column_size(p_data) > 2000000 then
    raise exception 'plan too large';
  end if;
  return query
    insert into seating_plans as sp (edit_token, view_token, title, data)
    values (seating_token(), seating_token(), left(coalesce(p_title, ''), 120), p_data)
    returning sp.edit_token, sp.view_token;
end;
$$ language plpgsql security definer set search_path = public, extensions;

-- Returns the plan for either token. The edit token is only echoed back to
-- someone who already holds it; view-token holders get mode = 'view'.
create or replace function get_seating_plan(p_token text) returns jsonb as $$
  select jsonb_build_object(
    'mode', case when sp.edit_token = p_token then 'edit' else 'view' end,
    'edit_token', case when sp.edit_token = p_token then sp.edit_token end,
    'view_token', sp.view_token,
    'data', sp.data,
    'updated_at', sp.updated_at
  )
  from seating_plans sp
  where sp.edit_token = p_token or sp.view_token = p_token
  limit 1;
$$ language sql stable security definer set search_path = public;

create or replace function save_seating_plan(p_edit_token text, p_title text, p_data jsonb)
returns timestamptz as $$
declare
  ts timestamptz;
begin
  if pg_column_size(p_data) > 2000000 then
    raise exception 'plan too large';
  end if;
  update seating_plans
    set data = p_data, title = left(coalesce(p_title, ''), 120)
    where edit_token = p_edit_token
    returning updated_at into ts;
  return ts;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function create_seating_plan(text, jsonb) from public;
revoke all on function get_seating_plan(text) from public;
revoke all on function save_seating_plan(text, text, jsonb) from public;
grant execute on function create_seating_plan(text, jsonb) to anon, authenticated;
grant execute on function get_seating_plan(text) to anon, authenticated;
grant execute on function save_seating_plan(text, text, jsonb) to anon, authenticated;
