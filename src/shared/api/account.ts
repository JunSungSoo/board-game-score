import { useMutation, useQuery } from '@tanstack/react-query';
import { requireSupabase } from './supabase';
import { QUERY_CLIENT } from './query-client';
import type { GameState, Profile, RemoteParticipant } from '../data/types';

export function useProfileQuery(enabled: boolean) {
  return useQuery({ queryKey: ['account', 'profile'], enabled, queryFn: async (): Promise<Profile | null> => {
    const { data, error } = await requireSupabase().rpc('my_profile');
    if (error) throw error;
    return data?.[0] ?? null;
  }});
}

export function useFriendsQuery(enabled: boolean) {
  return useQuery({ queryKey: ['account', 'friends'], enabled, refetchInterval: 30_000, queryFn: async () => {
    const { data, error } = await requireSupabase().rpc('touch_presence');
    if (error) throw error;
    return data ?? [];
  }});
}

export function useHistoryQuery(enabled: boolean) {
  return useQuery({ queryKey: ['account', 'history'], enabled, queryFn: async () => {
    const { data, error } = await requireSupabase().rpc('my_game_history');
    if (error) throw error;
    return data ?? [];
  }});
}

export function useRankingsQuery(enabled: boolean) {
  return useQuery({ queryKey: ['account', 'rankings'], enabled, queryFn: async () => {
    const { data, error } = await requireSupabase().rpc('win_rankings');
    if (error) throw error;
    return data ?? [];
  }});
}

export function useFriendMutation() {
  return useMutation({ mutationFn: async (loginId: string) => {
    const { error } = await requireSupabase().rpc('send_friend_request', { target_login_id: loginId });
    if (error) throw error;
  }, onSuccess: () => QUERY_CLIENT.invalidateQueries({ queryKey: ['account', 'friends'] }) });
}

export function useStartGameMutation() {
  return useMutation({ mutationFn: async (game: GameState) => {
    const ENTITIES = game.teams ?? game.players ?? [];
    const PARTICIPANTS = game.teams
      ? ENTITIES.flatMap(TEAM => (TEAM.members ?? []).map(NAME => ({ user_id: null, display_name: NAME, team_name: TEAM.name })))
      : ENTITIES.map(PLAYER => ({ user_id: null, display_name: PLAYER.name, team_name: null }));
    const { data, error } = await requireSupabase().rpc('start_game_room', {
      requested_game_id: game.gameId,
      requested_game_mode: game.tichuMode ?? game.genericMode ?? game.mode,
      participants: PARTICIPANTS,
    });
    if (error) throw error;
    const ROWS = await requireSupabase().from('game_participants').select('id,user_id,display_name,team_name').eq('room_id', data);
    if (ROWS.error) throw ROWS.error;
    return { roomId: data as string | number, participants: ROWS.data as RemoteParticipant[] };
  }});
}

export function useFinishGameMutation() {
  return useMutation({ mutationFn: async ({ game, cancel }: { game: GameState; cancel: boolean }) => {
    if (!game.remoteRoomId) return;
    if (cancel) {
      const { error } = await requireSupabase().rpc('cancel_game_room', { requested_room_id: game.remoteRoomId });
      if (error) throw error;
      return;
    }
    const ENTITIES = game.teams ?? game.players ?? [];
    const RANKED = [...ENTITIES].sort((FIRST, SECOND) => SECOND.total - FIRST.total);
    const RESULTS = (game.remoteParticipants ?? []).map(PARTICIPANT => {
      const ENTITY = game.teams
        ? game.teams.find(TEAM => TEAM.name === PARTICIPANT.team_name)
        : game.players?.find(PLAYER => PLAYER.name === PARTICIPANT.display_name || PLAYER.name === '나');
      if (!ENTITY) return null;
      return { participant_id: PARTICIPANT.id, final_score: ENTITY.total, final_rank: RANKED.findIndex(ROW => ROW.total === ENTITY.total) + 1 };
    }).filter(Boolean);
    const { error } = await requireSupabase().rpc('finish_game_room', { requested_room_id: game.remoteRoomId, results: RESULTS });
    if (error) throw error;
  }, onSuccess: () => QUERY_CLIENT.invalidateQueries({ queryKey: ['account'] }) });
}
