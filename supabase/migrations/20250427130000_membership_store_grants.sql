-- Run this if you created membership_store before grants were included (fixes 503 on signup).
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.membership_store to anon;
grant select, insert, update, delete on table public.membership_store to authenticated;
grant select, insert, update, delete on table public.membership_store to service_role;
