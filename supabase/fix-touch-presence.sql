create or replace function public.touch_presence()
returns table(
  friendship_id bigint,
  user_id uuid,
  login_id text,
  display_name text,
  relationship text,
  presence_status text
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.user_presence(user_id, last_seen_at) values (auth.uid(), now())
    on conflict on constraint user_presence_pkey do update set last_seen_at = excluded.last_seen_at;
  return query select * from public.friend_dashboard();
end;
$$;

revoke all on function public.touch_presence() from public;
grant execute on function public.touch_presence() to authenticated;
