import { AUTH_DOMAIN, GUEST_SESSION_KEY } from '../../../shared/data/game';
import { requireSupabase, SUPABASE_CLIENT } from '../../../shared/api/supabase';

export const normalizeId = (value: string) => value.trim().toLowerCase();
export const validId = (value: string) => /^[a-z0-9_]{4,20}$/.test(normalizeId(value));
export const internalEmail = (value: string) => `${normalizeId(value)}@${AUTH_DOMAIN}`;

export function errorMessage(error: unknown) {
  const MESSAGE = error && typeof error === 'object' && 'message' in error ? String(error.message) : '요청을 처리하지 못했어요.';
  if (/invalid login credentials/i.test(MESSAGE)) return '아이디 또는 비밀번호가 올바르지 않아요.';
  if (/user already registered|duplicate key/i.test(MESSAGE)) return '이미 사용 중인 아이디예요.';
  return MESSAGE;
}

export async function checkId(value: string) {
  if (!validId(value)) throw new Error('영문 소문자, 숫자, 밑줄로 4~20자를 입력해주세요.');
  const { data, error } = await requireSupabase().rpc('is_login_id_available', { candidate: normalizeId(value) });
  if (error) throw error;
  return Boolean(data);
}

export async function signIn(input: { id: string; password: string }) {
  if (!validId(input.id) || input.password.length < 6) throw new Error('아이디와 비밀번호를 확인해주세요.');
  const { error } = await requireSupabase().auth.signInWithPassword({ email: internalEmail(input.id), password: input.password });
  if (error) throw error;
  localStorage.removeItem(GUEST_SESSION_KEY);
}

export async function signUp(input: { id: string; name: string; password: string }) {
  const NAME = input.name.trim();
  if (!validId(input.id)) throw new Error('아이디 형식을 확인해주세요.');
  if (!NAME || NAME.length > 20) throw new Error('이름은 1~20자로 입력해주세요.');
  if (input.password.length < 6) throw new Error('비밀번호는 6자 이상 입력해주세요.');
  const CLIENT = requireSupabase();
  const { error } = await CLIENT.auth.signUp({
    email: internalEmail(input.id), password: input.password,
    options: { data: { login_id: normalizeId(input.id), display_name: NAME } },
  });
  if (error) throw error;
  await CLIENT.auth.signOut();
}

export async function startGuestSession() {
  // Guest access must work offline as well; remote sign-out is best effort.
  if (SUPABASE_CLIENT) void SUPABASE_CLIENT.auth.signOut();
  localStorage.setItem(GUEST_SESSION_KEY, 'active');
  await Promise.resolve();
}
