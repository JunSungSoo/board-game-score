import { useMutation, useQuery } from '@tanstack/react-query';
import { checkId, signIn, signUp, startGuestSession } from './auth';
import { GUEST_SESSION_KEY } from '../../../shared/data/game';
import { SUPABASE_CLIENT } from '../../../shared/api/supabase';
import type { Profile } from '../../../shared/data/types';

export function useAuthSession() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async (): Promise<{ profile: Profile | null; guest: boolean }> => {
      const GUEST = localStorage.getItem(GUEST_SESSION_KEY) === 'active';
      if (!SUPABASE_CLIENT) return { profile: null, guest: GUEST };
      const { data, error } = await SUPABASE_CLIENT.auth.getSession();
      if (error) throw error;
      if (!data.session) return { profile: null, guest: GUEST };
      const PROFILE_RESULT = await SUPABASE_CLIENT.rpc('my_profile');
      if (PROFILE_RESULT.error) throw PROFILE_RESULT.error;
      return { profile: PROFILE_RESULT.data?.[0] ?? null, guest: false };
    },
  });
}

export const useCheckIdMutation = () => useMutation({ mutationFn: checkId });
export const useSignInMutation = () => useMutation({ mutationFn: signIn });
export const useSignUpMutation = () => useMutation({ mutationFn: signUp });
export const useGuestMutation = () => useMutation({ mutationFn: startGuestSession });

