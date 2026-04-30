-- If you already ran 20250429140000 with DISABLE RLS + anon grants, run this to align with production security.
-- Idempotent: safe to run more than once.

alter table if exists public.memberships enable row level security;

revoke all on table public.memberships from anon;
revoke all on table public.memberships from authenticated;
grant select, insert, update, delete on table public.memberships to service_role;
