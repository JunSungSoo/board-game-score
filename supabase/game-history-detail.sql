create or replace function public.game_history_detail(requested_room_id uuid)
returns table(participant_id bigint, display_name text, team_name text, final_score integer, final_rank integer)
language sql
security definer set search_path = ''
as $$
  select gp.id, gp.display_name, gp.team_name, gp.final_score, gp.final_rank
  from public.game_participants gp
  join public.game_rooms gr on gr.id = gp.room_id
  where gp.room_id = requested_room_id
    and gr.status = 'completed'
    and (
      gr.host_user_id = auth.uid()
      or exists (
        select 1 from public.game_participants mine
        where mine.room_id = requested_room_id and mine.user_id = auth.uid()
      )
    )
  order by gp.final_rank, gp.final_score desc, gp.display_name;
$$;

revoke all on function public.game_history_detail(uuid) from public;
grant execute on function public.game_history_detail(uuid) to authenticated;
