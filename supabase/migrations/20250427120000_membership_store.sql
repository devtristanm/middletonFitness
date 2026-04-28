-- Single-row JSON document matching src/lib/types MembershipsFile shape.
-- Run this in Supabase SQL Editor (or via Supabase CLI) before using the app.

create table if not exists public.membership_store (
  id integer primary key default 1,
  constraint membership_store_single_row check (id = 1),
  data jsonb not null default '{"nextId":1280,"memberships":[]}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.membership_store is 'Application membership ledger (one row, id=1).';

-- Local testing with the publishable key: leave RLS off or grant anon via policies.
-- Production: prefer SUPABASE_SERVICE_ROLE_KEY on the server + RLS enabled with no public policies.
alter table public.membership_store disable row level security;

insert into public.membership_store (id, data)
values (1, '{"nextId":1280,"memberships":[]}'::jsonb)
on conflict (id) do nothing;

-- Required for PostgREST (publishable / anon JWT); without this, writes fail with permission denied.
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.membership_store to anon;
grant select, insert, update, delete on table public.membership_store to authenticated;
grant select, insert, update, delete on table public.membership_store to service_role;
