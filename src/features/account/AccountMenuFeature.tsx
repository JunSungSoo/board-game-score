import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useFriendsQuery, useHistoryQuery, useRankingsQuery } from '../../shared/api/account';
import { SUPABASE_CLIENT } from '../../shared/api/supabase';
import { GUEST_SESSION_KEY } from '../../shared/data/game';
import type { Profile } from '../../shared/data/types';
import { QUERY_CLIENT } from '../../shared/api/query-client';

type Panel = 'account' | 'friends' | 'history' | 'ranking' | null;
export function AccountMenuFeature({ profile, guest, onGameSelect }: { profile: Profile | null; guest: boolean; onGameSelect: () => void }) {
  const [OPEN, SET_OPEN] = useState(false); const [PANEL, SET_PANEL] = useState<Panel>(null); const NAVIGATE = useNavigate();
  const FRIENDS = useFriendsQuery(Boolean(profile) && PANEL === 'friends');
  const HISTORY = useHistoryQuery(Boolean(profile) && PANEL === 'history');
  const RANKINGS = useRankingsQuery(Boolean(profile) && PANEL === 'ranking');
  async function logout() { if (SUPABASE_CLIENT) await SUPABASE_CLIENT.auth.signOut(); localStorage.removeItem(GUEST_SESSION_KEY); QUERY_CLIENT.clear(); NAVIGATE('/login', { replace: true }); }
  return <>
    <button className="menu-toggle" aria-label="메뉴 열기" onClick={() => SET_OPEN(true)}><span/><span/><span/></button>
    <button className={`side-menu-backdrop ${OPEN ? 'show' : ''}`} aria-label="메뉴 닫기" onClick={() => SET_OPEN(false)} />
    <nav className={`side-menu ${OPEN ? 'open' : ''}`}><div className="side-menu-header">메뉴</div>
      <button className="side-menu-item" onClick={() => { SET_PANEL('account'); SET_OPEN(false); }}>{profile ? `${profile.display_name} (@${profile.login_id})` : '게스트 이용 중'}</button>
      <button className="side-menu-item" disabled={!profile} onClick={() => { SET_PANEL('friends'); SET_OPEN(false); }}>친구 상태</button><button className="side-menu-item" disabled={!profile} onClick={() => { SET_PANEL('history'); SET_OPEN(false); }}>내 게임 기록</button><button className="side-menu-item" disabled={!profile} onClick={() => { SET_PANEL('ranking'); SET_OPEN(false); }}>승리 랭킹</button>
      <div className="side-menu-divider"/><button className="side-menu-item" onClick={() => { onGameSelect(); SET_OPEN(false); }}>게임 선택</button>
    </nav>
    {PANEL && <div className="modal-overlay show"><div className="modal-box account-box"><div className="modal-title-row"><h2>{PANEL === 'account' ? '내 계정' : PANEL === 'friends' ? '친구 상태' : PANEL === 'history' ? '내 게임 기록' : '1등 횟수 랭킹'}</h2><button className="modal-close" onClick={() => SET_PANEL(null)}>×</button></div>
      {PANEL === 'account' && <><div className="account-profile"><strong>{profile?.display_name ?? '게스트'}</strong><span>{profile ? `@${profile.login_id}` : '이 브라우저에만 기록됩니다.'}</span></div><button className="btn ghost block" onClick={logout}>{guest ? '게스트 종료' : '로그아웃'}</button></>}
      {PANEL === 'friends' && <div className="account-list">{FRIENDS.isLoading ? '불러오는 중…' : (FRIENDS.data ?? []).map((FRIEND: Record<string, string>) => <div className="friend-row" key={FRIEND.user_id}><strong>{FRIEND.display_name}</strong><span className={`presence ${FRIEND.presence_status}`}><i/>{FRIEND.presence_status === 'playing' ? '게임 중' : FRIEND.presence_status === 'online' ? '온라인' : '오프라인'}</span></div>)}</div>}
      {PANEL === 'history' && <div className="account-list">{HISTORY.isLoading ? '불러오는 중…' : (HISTORY.data ?? []).map((ITEM: Record<string, string | number>) => <div className="history-row" key={String(ITEM.id)}><div><strong>{String(ITEM.game_id)}</strong><small>{dayjs(String(ITEM.ended_at)).format('YYYY.MM.DD HH:mm')}</small></div><b>{ITEM.final_score}점 · {ITEM.final_rank}등</b></div>)}</div>}
      {PANEL === 'ranking' && <div className="account-list">{RANKINGS.isLoading ? '불러오는 중…' : (RANKINGS.data ?? []).map((ITEM: Record<string, string | number>, INDEX: number) => <div className="ranking-row" key={String(ITEM.login_id)}><span>{INDEX + 1}</span><strong>{String(ITEM.display_name)}</strong><b>{ITEM.wins}승</b></div>)}</div>}
    </div></div>}
  </>;
}

