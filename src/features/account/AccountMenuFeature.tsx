import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SUPABASE_CLIENT } from '../../shared/api/supabase';
import { GUEST_SESSION_KEY } from '../../shared/data/game';
import type { Profile } from '../../shared/data/types';
import { QUERY_CLIENT } from '../../shared/api/query-client';
import { APP_ROUTES } from '../../shared/data/routes';

export function AccountMenuFeature({ profile, guest }: { profile: Profile | null; guest: boolean }) {
  const [OPEN, SET_OPEN] = useState(false); const [ACCOUNT_OPEN, SET_ACCOUNT_OPEN] = useState(false); const NAVIGATE = useNavigate(); const LOCATION = useLocation();
  const GO = (path: string) => { NAVIGATE(path); SET_OPEN(false); };
  async function logout() { if (SUPABASE_CLIENT) await SUPABASE_CLIENT.auth.signOut(); localStorage.removeItem(GUEST_SESSION_KEY); QUERY_CLIENT.clear(); NAVIGATE('/login', { replace: true }); }
  return <>
    <button className="menu-toggle" aria-label="메뉴 열기" onClick={() => SET_OPEN(true)}><span/><span/><span/></button>
    <button className={`side-menu-backdrop ${OPEN ? 'show' : ''}`} aria-label="메뉴 닫기" onClick={() => SET_OPEN(false)} />
    <nav className={`side-menu ${OPEN ? 'open' : ''}`}><div className="side-menu-header">메뉴</div>
      <button className="side-menu-item account-menu-item" onClick={() => { SET_ACCOUNT_OPEN(true); SET_OPEN(false); }}>{profile ? `${profile.display_name} (@${profile.login_id})` : '게스트 이용 중'}</button>
      <button className={`side-menu-item ${LOCATION.pathname === APP_ROUTES.FRIENDS ? 'current' : ''}`} onClick={() => GO(APP_ROUTES.FRIENDS)}>친구 목록</button>
      <button className={`side-menu-item ${LOCATION.pathname === APP_ROUTES.GAME_HISTORY ? 'current' : ''}`} onClick={() => GO(APP_ROUTES.GAME_HISTORY)}>게임 기록</button>
      <button className={`side-menu-item ${LOCATION.pathname === APP_ROUTES.RANK ? 'current' : ''}`} onClick={() => GO(APP_ROUTES.RANK)}>랭킹</button>
      <div className="side-menu-divider"/><button className={`side-menu-item ${LOCATION.pathname.startsWith('/game/') ? 'current' : ''}`} onClick={() => GO(APP_ROUTES.GAME_SELECT)}>게임선택</button>
      <button className="side-menu-logout" onClick={logout}>{guest ? '게스트 종료' : '로그아웃'}</button>
    </nav>
    {ACCOUNT_OPEN && <div className="modal-overlay show"><div className="modal-box account-box"><div className="modal-title-row"><h2>내 계정</h2><button className="modal-close" onClick={() => SET_ACCOUNT_OPEN(false)}>×</button></div>
      <div className="account-profile"><strong>{profile?.display_name ?? '게스트'}</strong><span>{profile ? `@${profile.login_id}` : '이 브라우저에만 기록됩니다.'}</span></div>
    </div></div>}
  </>;
}
