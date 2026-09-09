import { queryClient } from '../../lib/query-client';
import { requireSupabase } from '../../lib/supabase';

export async function accountRows(name: 'my_game_history' | 'win_rankings', userId: string) {
  const data = await queryClient.fetchQuery({
    queryKey: ['account', userId, name],
    queryFn: async () => {
      const { data, error } = await requireSupabase().rpc(name);
      if (error) throw error;
      return data || [];
    },
  });
  return { data };
}
export function invalidateAccount() { return queryClient.invalidateQueries({ queryKey: ['account'] }); }
export function clearAccountCache() { queryClient.clear(); }
