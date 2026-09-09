import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_CLIENT = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

export function requireSupabase() {
  if (!SUPABASE_CLIENT) throw new Error('서비스 연결 설정을 확인해주세요.');
  return SUPABASE_CLIENT;
}

