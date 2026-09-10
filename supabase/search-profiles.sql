create or replace function public.search_profiles(login_id_prefix text)
returns table(user_id uuid, login_id text, display_name text)
language sql
security definer set search_path = ''
as $$
  select p.id, p.login_id::text, p.display_name
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and left(lower(p.login_id::text), char_length(lower(btrim(login_id_prefix)))) = lower(btrim(login_id_prefix))
    and char_length(btrim(login_id_prefix)) > 0
    and not exists (
      select 1 from public.friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = p.id)
        or (f.addressee_id = auth.uid() and f.requester_id = p.id)
    )
  order by p.login_id
  limit 5;
$$;

revoke all on function public.search_profiles(text) from public;
grant execute on function public.search_profiles(text) to authenticated;
