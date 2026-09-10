import { useMemo, useState } from 'react';
import { useFriendsQuery } from '../../shared/api/account';
import type { FriendRow, Profile } from '../../shared/data/types';

export interface SetupResult { names: string[]; membersA: string[]; membersB: string[]; participantUserIds: Record<string, string>; }

export function PlayerSetupFeature({ profile, guestOnly, team, min, max, onStart, onBack }: {
  profile: Profile | null;
  guestOnly: boolean; team: boolean; min: number; max: number;
  onStart: (result: SetupResult) => void; onBack: () => void;
}) {
  const FRIENDS = useFriendsQuery(Boolean(profile) && !guestOnly);
  const [SELECTED_FRIENDS, SET_SELECTED_FRIENDS] = useState<FriendRow[]>([]);
  const [GUESTS, SET_GUESTS] = useState<string[]>([]);
  const [INPUT, SET_INPUT] = useState('');
  const [TEAM_A, SET_TEAM_A] = useState<string[]>([]);
  const [ERROR, SET_ERROR] = useState('');
  const ACCEPTED_FRIENDS = useMemo(() => (FRIENDS.data ?? []).filter(FRIEND => FRIEND.relationship === 'accepted'), [FRIENDS.data]);
  const NAMES = useMemo(() => [...SELECTED_FRIENDS.map(FRIEND => FRIEND.display_name), ...GUESTS], [SELECTED_FRIENDS, GUESTS]);
  const MEMBERS_A = NAMES.filter(NAME => TEAM_A.includes(NAME));
  const MEMBERS_B = NAMES.filter(NAME => !TEAM_A.includes(NAME));
  const VISIBLE_FRIENDS = useMemo(() => {
    const QUERY = INPUT.trim().toLowerCase();
    return ACCEPTED_FRIENDS.filter(FRIEND => !SELECTED_FRIENDS.some(SELECTED => SELECTED.user_id === FRIEND.user_id))
      .filter(FRIEND => FRIEND.presence_status !== 'offline' || Boolean(QUERY && (`${FRIEND.display_name} ${FRIEND.login_id}`).toLowerCase().includes(QUERY)))
      .sort((FIRST, SECOND) => {
        if (!QUERY) return FIRST.display_name.localeCompare(SECOND.display_name, 'ko');
        const FIRST_MATCH = (`${FIRST.display_name} ${FIRST.login_id}`).toLowerCase().includes(QUERY);
        const SECOND_MATCH = (`${SECOND.display_name} ${SECOND.login_id}`).toLowerCase().includes(QUERY);
        return Number(SECOND_MATCH) - Number(FIRST_MATCH) || FIRST.display_name.localeCompare(SECOND.display_name, 'ko');
      });
  }, [ACCEPTED_FRIENDS, INPUT, SELECTED_FRIENDS]);

  function addName() {
    const NAME = INPUT.trim();
    if (!NAME || NAMES.includes(NAME)) { SET_ERROR('비어 있거나 이미 있는 이름이에요.'); return; }
    if (NAMES.length >= max) { SET_ERROR(`최대 ${max}명까지 참가할 수 있어요.`); return; }
    SET_GUESTS(CURRENT => [...CURRENT, NAME]);
    SET_TEAM_A(CURRENT => MEMBERS_A.length <= MEMBERS_B.length ? [...CURRENT, NAME] : CURRENT);
    SET_INPUT(''); SET_ERROR('');
  }

  function addFriend(friend: FriendRow) {
    if (NAMES.length >= max) { SET_ERROR(`최대 ${max}명까지 참가할 수 있어요.`); return; }
    if (NAMES.includes(friend.display_name)) { SET_ERROR('동일한 이름의 참가자가 이미 있어요.'); return; }
    SET_SELECTED_FRIENDS(CURRENT => [...CURRENT, friend]);
    if (MEMBERS_A.length <= MEMBERS_B.length) SET_TEAM_A(CURRENT => [...CURRENT, friend.display_name]);
    SET_INPUT(''); SET_ERROR('');
  }

  function removeFriend(friend: FriendRow) {
    SET_SELECTED_FRIENDS(CURRENT => CURRENT.filter(ITEM => ITEM.user_id !== friend.user_id));
    SET_TEAM_A(CURRENT => CURRENT.filter(ITEM => ITEM !== friend.display_name));
  }

  function start() {
    if (NAMES.length < min || NAMES.length > max) { SET_ERROR(`${min}~${max}명의 참가자가 필요해요.`); return; }
    if (team && (!MEMBERS_A.length || !MEMBERS_B.length)) { SET_ERROR('각 팀에 최소 1명씩 있어야 해요.'); return; }
    onStart({ names: NAMES, membersA: MEMBERS_A, membersB: MEMBERS_B, participantUserIds: Object.fromEntries(SELECTED_FRIENDS.map(FRIEND => [FRIEND.display_name, FRIEND.user_id])) });
  }

  return <section className="screen active">
    <div className="card"><h2>{guestOnly ? '참가 인원 등록' : '참가 인원 선택'}</h2>
      <div className="chip-list">
        {SELECTED_FRIENDS.map(FRIEND => <button key={FRIEND.user_id} className="chip selected" onClick={() => removeFriend(FRIEND)}>● {FRIEND.display_name} ✕</button>)}
        {GUESTS.map(NAME => <button key={NAME} className="chip selected" onClick={() => { SET_GUESTS(CURRENT => CURRENT.filter(ITEM => ITEM !== NAME)); SET_TEAM_A(CURRENT => CURRENT.filter(ITEM => ITEM !== NAME)); }}>👤 {NAME} ✕</button>)}
      </div>
      <div className="guest-row participant-search-row"><input value={INPUT} maxLength={20} placeholder="참가자 이름 입력" onChange={event => { SET_INPUT(event.target.value); SET_ERROR(''); }} onKeyDown={event => { if (event.key === 'Enter') addName(); }} /></div>
      {!guestOnly && profile && <div className="friend-suggestions"><div className="friend-suggestions-title"><strong>{INPUT.trim() ? '친구 검색 결과' : '현재 접속 중인 친구'}</strong><span>30초마다 갱신</span></div>
        {FRIENDS.isLoading && <p className="friend-suggestions-empty">친구 상태를 불러오는 중…</p>}
        {!FRIENDS.isLoading && !VISIBLE_FRIENDS.length && <p className="friend-suggestions-empty">{INPUT.trim() ? '일치하는 친구가 없어요.' : '현재 접속 중인 친구가 없어요.'}</p>}
        {VISIBLE_FRIENDS.map(FRIEND => <button className="friend-suggestion" key={FRIEND.user_id} onClick={() => addFriend(FRIEND)}><span><strong>{FRIEND.display_name}</strong><small>@{FRIEND.login_id}</small></span><span className={`presence ${FRIEND.presence_status}`}><i/>{FRIEND.presence_status === 'playing' ? '게임 중' : FRIEND.presence_status === 'online' ? '온라인' : '오프라인'}</span></button>)}
      </div>}
      <button className="btn ghost block guest-add-button" disabled={!INPUT.trim()} onClick={addName}>👤 {INPUT.trim() ? `“${INPUT.trim()}” 게스트로 추가` : '이름을 입력해 게스트로 추가'}</button>
      <p className={`error ${ERROR ? 'show' : ''}`}>{ERROR}</p>
    </div>
    {team && <div className="card"><h2>팀 나누기</h2><div className="team-cols">
      {[['팀 A', MEMBERS_A], ['팀 B', MEMBERS_B]].map(([LABEL, MEMBERS]) => <div className="team-box" key={LABEL as string}><h3>{LABEL}</h3>{(MEMBERS as string[]).map(NAME => <button key={NAME} className="chip selected" onClick={() => SET_TEAM_A(CURRENT => CURRENT.includes(NAME) ? CURRENT.filter(ITEM => ITEM !== NAME) : [...CURRENT, NAME])}>{NAME}</button>)}</div>)}
    </div><p className="hint">이름을 누르면 반대 팀으로 이동해요.</p></div>}
    <button className="btn block" onClick={start}>게임 시작</button><button className="btn ghost block" onClick={onBack}>← 이전</button>
  </section>;
}
