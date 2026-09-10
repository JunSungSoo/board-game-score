import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage, normalizeId } from './api/auth';
import { useCheckIdMutation, useGuestMutation, useSignInMutation, useSignUpMutation } from './api/hooks';
import { QUERY_CLIENT } from '../../shared/api/query-client';
import { APP_ROUTES } from '../../shared/data/routes';

export function AuthFeature({ signup = false }: { signup?: boolean }) {
  const NAVIGATE = useNavigate();
  const [SEARCH_PARAMS] = useSearchParams();
  const [ID, SET_ID] = useState('');
  const [NAME, SET_NAME] = useState('');
  const [PASSWORD, SET_PASSWORD] = useState('');
  const [VERIFIED_ID, SET_VERIFIED_ID] = useState('');
  const CURRENT_ID = useRef('');
  const CHECK_ID = useCheckIdMutation();
  const SIGN_IN = useSignInMutation();
  const SIGN_UP = useSignUpMutation();
  const GUEST = useGuestMutation();
  const ACTIVE_MUTATION = signup ? SIGN_UP : SIGN_IN;
  const ERROR = ACTIVE_MUTATION.error ? errorMessage(ACTIVE_MUTATION.error) : '';

  function submit(event: FormEvent) {
    event.preventDefault();
    if (signup && VERIFIED_ID !== normalizeId(ID)) return;
    const ON_SUCCESS = async () => {
        await QUERY_CLIENT.invalidateQueries({ queryKey: ['auth'] });
        NAVIGATE(signup ? '/login?joined=1' : APP_ROUTES.FRIENDS, { replace: true });
    };
    if (signup) SIGN_UP.mutate({ id: ID, name: NAME, password: PASSWORD }, { onSuccess: ON_SUCCESS });
    else SIGN_IN.mutate({ id: ID, password: PASSWORD }, { onSuccess: ON_SUCCESS });
  }

  return <main className="auth-page-shell">
    {signup && <Link className="auth-back-link" to="/login">← 로그인으로</Link>}
    <section className="auth-page-card">
      <div className="auth-brand" aria-hidden="true">🎲</div>
      <h1>{signup ? '회원가입' : '로그인'}</h1>
      <p className="auth-lead">{signup ? '이름과 고유 아이디로 계정을 만들어요.' : '내 게임 기록과 친구 상태를 확인해요.'}</p>
      <form onSubmit={submit}>
        {signup && <label className="account-field">이름<input maxLength={20} value={NAME} onChange={event => SET_NAME(event.target.value)} required /></label>}
        <label className="account-field">아이디</label>
        <div className={signup ? 'inline-input account-field' : 'account-field'}>
          <input autoComplete="username" maxLength={20} value={ID} onChange={event => { SET_ID(event.target.value); CURRENT_ID.current = event.target.value; SET_VERIFIED_ID(''); CHECK_ID.reset(); }} required />
          {signup && <button className="btn ghost" type="button" onClick={() => CHECK_ID.mutate(ID, { onSuccess: available => SET_VERIFIED_ID(available && normalizeId(CURRENT_ID.current) === normalizeId(ID) ? normalizeId(ID) : '') })}>중복 확인</button>}
        </div>
        {signup && <p className={`account-feedback show ${VERIFIED_ID ? 'success' : ''}`}>{CHECK_ID.isPending ? '확인 중…' : CHECK_ID.error ? errorMessage(CHECK_ID.error) : VERIFIED_ID ? '사용 가능한 아이디예요.' : CHECK_ID.isSuccess ? '이미 사용 중인 아이디예요.' : ''}</p>}
        <label className="account-field">비밀번호<input type="password" minLength={6} value={PASSWORD} onChange={event => SET_PASSWORD(event.target.value)} required /></label>
        <button className="btn block" disabled={ACTIVE_MUTATION.isPending || (signup && VERIFIED_ID !== normalizeId(ID))}>{ACTIVE_MUTATION.isPending ? '처리 중…' : signup ? '회원가입' : '로그인'}</button>
      </form>
      <p className={`account-feedback ${ERROR || SEARCH_PARAMS.get('joined') ? 'show' : ''}`}>{ERROR || (SEARCH_PARAMS.get('joined') ? '회원가입이 완료됐어요. 로그인해주세요.' : '')}</p>
      <p className="account-note">아이디·비밀번호 찾기는 제공하지 않아요.</p>
      {!signup && <><div className="auth-divider"><span>또는</span></div><button className="btn ghost block" onClick={() => GUEST.mutate(undefined, { onSuccess: async () => { await QUERY_CLIENT.invalidateQueries({ queryKey: ['auth'] }); NAVIGATE(APP_ROUTES.FRIENDS, { replace: true }); } })}>게스트로 이용하기</button></>}
      <div className="auth-page-switch">{signup ? '이미 계정이 있나요? ' : '계정이 없나요? '}<Link to={signup ? '/login' : '/signup'}>{signup ? '로그인' : '회원가입'}</Link></div>
    </section>
  </main>;
}
