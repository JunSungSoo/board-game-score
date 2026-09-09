import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { checkId, errorMessage, normalizeId, signIn, signUp } from './api';
import { supabase } from '../../lib/supabase';
import { ScreenRipple } from '../../components/ScreenRipple';

export function AuthPage({ signup = false }: { signup?: boolean }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [verifiedId, setVerifiedId] = useState('');
  const [message, setMessage] = useState('');
  const currentId = useRef('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    async function restore() {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) {
        const profile = await supabase.rpc('my_profile');
        if (profile.error) throw profile.error;
        if (profile.data?.length) { if (alive) window.location.replace('index.html'); return; }
        await supabase.auth.signOut();
      }
    }
    restore().catch(error => { if (alive) setMessage(errorMessage(error)); })
      .finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);
  const availability = useMutation({
    mutationFn: checkId,
    onSuccess: (available, requestedId) => {
      if (normalizeId(currentId.current) === normalizeId(requestedId)) setVerifiedId(available ? normalizeId(requestedId) : '');
    },
  });
  const submit = useMutation({
    mutationFn: async () => signup ? signUp({ id, name, password }) : signIn({ id, password }),
    onSuccess: () => window.location.replace(signup ? 'login.html?joined=1' : 'index.html'),
  });
  const busy = !ready || submit.isPending;
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (signup && verifiedId !== normalizeId(id)) { setMessage('아이디 중복 확인을 먼저 진행해주세요.'); return; }
    submit.mutate();
  }
  async function guest() {
    try {
      if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw error; }
      localStorage.setItem('board-game-guest-session-v1', 'active');
      window.location.replace('index.html');
    } catch (error) { setMessage(errorMessage(error)); }
  }
  const error = message || (submit.error ? errorMessage(submit.error) : '');
  const joined = !signup && new URLSearchParams(location.search).get('joined') === '1';
  return <><ScreenRipple /><main className="auth-page-shell">
    {signup && <a className="auth-back-link" href="login.html">← 로그인으로</a>}
    <section className="auth-page-card" aria-labelledby="auth-title">
      <div className="auth-brand" aria-hidden="true">🎲</div>
      <h1 id="auth-title">{signup ? '회원가입' : '로그인'}</h1>
      <p className="auth-lead">{signup ? '이름과 고유 아이디로 계정을 만들어요.' : '내 게임 기록과 친구 상태를 확인해요.'}</p>
      <form onSubmit={handleSubmit} noValidate>
        {signup && <label className="account-field">이름<input name="name" autoComplete="name" maxLength={20} value={name} onChange={e => setName(e.target.value)} required disabled={busy} /></label>}
        <label className="account-field" htmlFor="auth-id">아이디</label>
        <div className={signup ? 'inline-input account-field' : 'account-field'}>
          <input id="auth-id" name="username" autoComplete="username" autoCapitalize="none" maxLength={20} value={id} disabled={busy} onChange={e => { setId(e.target.value); currentId.current = e.target.value; setVerifiedId(''); availability.reset(); }} required />
          {signup && <button className="btn ghost" type="button" disabled={busy || availability.isPending} onClick={() => availability.mutate(id)}>중복 확인</button>}
        </div>
        {signup && <p role="status" className={`account-feedback ${availability.status !== 'idle' ? 'show' : ''} ${verifiedId ? 'success' : ''}`}>
          {availability.isPending ? '확인 중…' : availability.error ? errorMessage(availability.error) : verifiedId ? '사용 가능한 아이디예요.' : availability.isSuccess ? '이미 사용 중인 아이디예요.' : ''}
        </p>}
        <label className="account-field">비밀번호<input name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /></label>
        <button className="btn block" disabled={busy} type="submit">{submit.isPending ? '처리 중…' : signup ? '회원가입' : '로그인'}</button>
      </form>
      <p className={`account-feedback ${error || joined ? 'show' : ''} ${joined && !error ? 'success' : ''}`} role="status">{error || (joined ? '회원가입이 완료됐어요. 새 계정으로 로그인해주세요.' : '')}</p>
      <p className="account-note">{signup ? '이메일·전화번호 인증과 계정 찾기는 제공하지 않아요.' : '아이디·비밀번호 찾기는 제공하지 않아요.'}</p>
      {!signup && <><div className="auth-divider"><span>또는</span></div><button className="btn ghost block guest-login-btn" disabled={busy} onClick={guest}>게스트로 이용하기</button><p className="account-note guest-note">게스트 기록은 이 브라우저에만 보관되며 친구·랭킹에는 반영되지 않아요.</p></>}
      <div className="auth-page-switch">{signup ? '이미 계정이 있나요? ' : '계정이 없나요? '}<a href={signup ? 'login.html' : 'signup.html'}>{signup ? '로그인' : '회원가입'}</a></div>
    </section>
  </main></>;
}
