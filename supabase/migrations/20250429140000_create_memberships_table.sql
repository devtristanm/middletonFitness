-- One row per membership application (replaces monolithic membership_store for app reads/writes).
-- Backfills from membership_store when present; advances sequence past max id.

create sequence if not exists public.membership_id_seq as integer start with 1280 increment by 1;

create table if not exists public.memberships (
  membership_id integer not null default nextval('public.membership_id_seq'::regclass),
  record jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint memberships_pkey primary key (membership_id),
  constraint memberships_record_object check (jsonb_typeof(record) = 'object')
);

alter sequence public.membership_id_seq owned by public.memberships.membership_id;

-- Keep record.membershipId in sync with PK (single round-trip insert from the app).
create or replace function public.memberships_sync_record_id()
returns trigger
language plpgsql
as $$
begin
  new.record := jsonb_set(
    coalesce(new.record, '{}'::jsonb),
    '{membershipId}',
    to_jsonb(new.membership_id),
    true
  );
  return new;
end;
$$;

drop trigger if exists memberships_sync_record_id on public.memberships;
create trigger memberships_sync_record_id
  before insert on public.memberships
  for each row
  execute procedure public.memberships_sync_record_id();

comment on table public.memberships is 'Membership applications; record is full MembershipRecord JSON.';

-- RLS on, no policies for anon/authenticated: direct PostgREST access with publishable keys is denied.
-- The Next.js API uses SUPABASE_SERVICE_ROLE_KEY; service_role bypasses RLS.
alter table public.memberships enable row level security;

grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.memberships from anon;
revoke all on table public.memberships from authenticated;
grant select, insert, update, delete on table public.memberships to service_role;

-- Backfill from legacy single-row store (if it exists and has memberships).
insert into public.memberships (membership_id, record, created_at, updated_at)
select
  (elem->>'membershipId')::integer,
  elem,
  coalesce((elem->>'createdAt')::timestamptz, timezone('utc'::text, now())),
  coalesce((elem->>'updatedAt')::timestamptz, timezone('utc'::text, now()))
from public.membership_store ms
cross join lateral jsonb_array_elements(coalesce(ms.data->'memberships', '[]'::jsonb)) as elem
where ms.id = 1
  and jsonb_typeof(elem) = 'object'
  and (elem ? 'membershipId')
on conflict (membership_id) do nothing;

select setval(
  'public.membership_id_seq',
  greatest(
    coalesce((select max(membership_id) from public.memberships), 0),
    1279
  )
);
