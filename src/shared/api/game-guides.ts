import { useQuery } from '@tanstack/react-query';
import { requireSupabase } from './supabase';
import type { GameGuideRow } from '../data/types';

export function useGameGuidesQuery() {
  return useQuery({
    queryKey: ['game-guides'],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<GameGuideRow[]> => {
      const { data, error } = await requireSupabase()
        .from('game_guides')
        .select('*')
        .eq('published', true)
        .order('sort_order')
        .order('release_year');
      if (error) throw error;
      return data ?? [];
    },
  });
}
