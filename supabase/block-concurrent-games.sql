-- Apply this migration once in the Supabase SQL editor.
-- Registered users can host or participate in only one active game; guests are excluded.

create table if not exists public.active_game_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  claimed_at timestamptz not null default now()
);

alter table public.active_game_users enable row level security;

insert into public.active_game_users(user_id, room_id)
select distinct on (candidate.user_id) candidate.user_id, candidate.room_id
from (
  select gr.host_user_id as user_id, gr.id as room_id, gr.started_at
  from public.game_rooms gr
  where gr.status = 'active' and gr.expires_at > now()
  union all
  select gp.user_id, gr.id, gr.started_at
  from public.game_participants gp
  join public.game_rooms gr on gr.id = gp.room_id
  where gp.user_id is not null and gr.status = 'active' and gr.expires_at > now()
) candidate
order by candidate.user_id, candidate.started_at desc
on conflict (user_id) do nothing;

create or replace function public.friend_dashboard()
returns table(
  friendship_id bigint,
  user_id uuid,
  login_id text,
  display_name text,
  relationship text,
  presence_status text
)
language sql
security definer set search_path = ''
as $$
  with related as (
    select f.id as friendship_id,
      case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end as friend_id,
      case
        when f.status = 'accepted' then 'accepted'
        when f.addressee_id = auth.uid() then 'incoming'
        else 'outgoing'
      end as relationship
    from public.friendships f
    where f.requester_id = auth.uid() or f.addressee_id = auth.uid()
  )
  select r.friendship_id, p.id, p.login_id::text, p.display_name, r.relationship,
    case
      when exists (select 1 from public.active_game_users agu where agu.user_id = p.id) then 'playing'
      when up.last_seen_at >= now() - interval '1 minute' then 'online'
      else 'offline'
    end as presence_status
  from related r
  join public.profiles p on p.id = r.friend_id
  left join public.user_presence up on up.user_id = p.id
  order by case r.relationship when 'incoming' then 0 when 'accepted' then 1 else 2 end, p.display_name;
$$;

create or replace function public.start_game_room(
  requested_game_id text,
  requested_game_mode text,
  participants jsonb
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_room_id uuid;
  participant jsonb;
  participant_user_id uuid;
  participant_name text;
  conflict_name text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if requested_game_id not in ('skullking', 'tichu', 'generic') then raise exception 'invalid_game'; end if;
  if jsonb_typeof(participants) <> 'array' or jsonb_array_length(participants) < 1 then
    raise exception 'participants_required';
  end if;

  delete from public.game_rooms where status = 'active' and expires_at <= now();

  insert into public.game_rooms(game_id, game_mode, host_user_id)
  values (requested_game_id, left(coalesce(requested_game_mode, ''), 30), auth.uid())
  returning id into new_room_id;

  begin
    insert into public.active_game_users(user_id, room_id) values (auth.uid(), new_room_id);
  exception when unique_violation then
    select p.display_name into conflict_name from public.profiles p where p.id = auth.uid();
    raise exception using message = 'user_already_in_active_game:' || coalesce(conflict_name, '사용자');
  end;

  for participant in select value from jsonb_array_elements(participants)
  loop
    participant_user_id := nullif(participant ->> 'user_id', '')::uuid;
    participant_name := left(btrim(participant ->> 'display_name'), 50);
    if participant_user_id is not null and participant_user_id <> auth.uid() and not exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = participant_user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = participant_user_id))
    ) then
      raise exception 'participant_is_not_friend';
    end if;

    insert into public.game_participants(room_id, user_id, display_name, team_name)
    values (
      new_room_id,
      participant_user_id,
      participant_name,
      nullif(left(btrim(participant ->> 'team_name'), 30), '')
    );

    if participant_user_id is not null and participant_user_id <> auth.uid() then
      begin
        insert into public.active_game_users(user_id, room_id) values (participant_user_id, new_room_id);
      exception when unique_violation then
        raise exception using message = 'user_already_in_active_game:' || coalesce(participant_name, '참가자');
      end;
    end if;
  end loop;
  return new_room_id;
end;
$$;

create or replace function public.finish_game_room(requested_room_id uuid, results jsonb)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare result_item jsonb;
begin
  if not exists (
    select 1 from public.game_rooms gr
    where gr.id = requested_room_id and gr.host_user_id = auth.uid()
      and gr.status = 'active' and gr.expires_at > now()
  ) then raise exception 'active_room_not_found'; end if;

  for result_item in select value from jsonb_array_elements(results)
  loop
    update public.game_participants
      set final_score = (result_item ->> 'final_score')::integer,
          final_rank = (result_item ->> 'final_rank')::integer
      where room_id = requested_room_id
        and id = (result_item ->> 'participant_id')::bigint;
  end loop;

  if exists (
    select 1 from public.game_participants gp
    where gp.room_id = requested_room_id and (gp.final_score is null or gp.final_rank is null)
  ) then raise exception 'incomplete_results'; end if;

  update public.game_rooms set status = 'completed', ended_at = now()
  where id = requested_room_id;
  delete from public.active_game_users where room_id = requested_room_id;
end;
$$;
