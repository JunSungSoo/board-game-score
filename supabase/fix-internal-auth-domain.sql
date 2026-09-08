-- Supabase rejects the non-public `.local` suffix as an invalid email address.
-- Keep using login ID only in the UI while using this project's public Supabase host internally.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  requested_id text := lower(btrim(new.raw_user_meta_data ->> 'login_id'));
  requested_name text := btrim(new.raw_user_meta_data ->> 'display_name');
begin
  if requested_id is null or requested_id !~ '^[a-z0-9_]{4,20}$' then
    raise exception 'invalid_login_id';
  end if;
  if requested_name is null or char_length(requested_name) not between 1 and 20 then
    raise exception 'invalid_display_name';
  end if;
  if lower(coalesce(new.email, '')) <> (requested_id || '@danbi.playground.com') then
    raise exception 'invalid_internal_identity';
  end if;

  insert into public.profiles (id, login_id, display_name)
  values (new.id, requested_id, requested_name);
  insert into public.user_presence (user_id) values (new.id);
  return new;
end;
$$;
