-- Atomic append: locks the single store row, assigns the next id, and writes in one step.
-- Avoids last-write-wins lost applications when two signups finish close together.
-- Call from the API using SUPABASE_SERVICE_ROLE_KEY only (grants below).

create or replace function public.membership_store_append(p_input jsonb, p_now text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_data jsonb;
  next_id int;
  new_row jsonb; -- not "full" — reserved in SQL
  arr jsonb;
begin
  if jsonb_typeof(p_input) is distinct from 'object' or p_input = '{}'::jsonb then
    raise exception 'invalid p_input' using errcode = 'P0001';
  end if;
  if p_now is null or btrim(p_now) = '' then
    raise exception 'p_now is required' using errcode = 'P0001';
  end if;

  select m.data into cur_data from public.membership_store m where m.id = 1 for update;
  if not found then
    insert into public.membership_store (id, data)
    values (1, '{"nextId":1280,"memberships":[]}'::jsonb);
    select m.data into cur_data from public.membership_store m where m.id = 1 for update;
  end if;
  if cur_data is null then
    cur_data := '{"nextId":1280,"memberships":[]}'::jsonb;
  end if;

  next_id := coalesce(nullif(trim(cur_data->>'nextId'), '')::int, 1280);
  if next_id < 1 then
    next_id := 1280;
  end if;

  new_row := p_input
    || ('{"cancelledAt": null, "lastSheetEditAt": null}'::jsonb)
    || jsonb_build_object('membershipId', to_jsonb(next_id))
    || jsonb_build_object('createdAt', to_jsonb(p_now))
    || jsonb_build_object('updatedAt', to_jsonb(p_now))
    || jsonb_build_object('ownerNotes', to_jsonb(''));

  arr := coalesce(cur_data->'memberships', '[]'::jsonb) || jsonb_build_array(new_row);

  update public.membership_store
  set
    data = jsonb_set(
      jsonb_set(
        cur_data,
        '{nextId}',
        to_jsonb(next_id + 1)
      ),
      '{memberships}',
      arr
    ),
    updated_at = (now() at time zone 'utc')
  where id = 1;

  return new_row;
end;
$$;

-- Revoke default execute for all roles; only the service role may append.
revoke all on function public.membership_store_append(jsonb, text) from PUBLIC;
grant execute on function public.membership_store_append(jsonb, text) to service_role;

comment on function public.membership_store_append is 'Atomically add one membership; requires service role.';
