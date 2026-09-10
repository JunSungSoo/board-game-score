import { useState, type FormEvent } from 'react';
import { useFriendMutation, useFriendResponseMutation, useFriendsQuery, useFriendSearchQuery } from '../../shared/api/account';
import type { Profile } from '../../shared/data/types';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';

const STATUS_LABEL = { online: '온라인', offline: '오프라인', playing: '게임 중' } as const;

export function FriendsFeature({ profile }: { profile: Profile | null }) {
  const [LOGIN_ID, SET_LOGIN_ID] = useState('');
  const SEARCH_ID = useDebouncedValue(LOGIN_ID.trim().toLowerCase(), 250);
  const FRIENDS = useFriendsQuery(Boolean(profile));
  const SEARCH = useFriendSearchQuery(SEARCH_ID, Boolean(profile));
  const REQUEST = useFriendMutation();
  const RESPONSE = useFriendResponseMutation();
  function addFriend(event: FormEvent) {
    event.preventDefault();
    const ID = LOGIN_ID.trim();
    if (!ID) return;
    REQUEST.mutate(ID, { onSuccess: async () => { SET_LOGIN_ID(''); await FRIENDS.refetch(); } });
  }
  if (!profile) return <section className="card account-page-card"><p className="empty-state">게스트 이용 중에는 친구 상태를 불러올 수 없어요.<br/>계정으로 로그인하면 친구의 온라인 상태와 게임 참여 여부를 확인할 수 있습니다.</p></section>;
  return <section className="card account-page-card">
    <form className="friend-add-form" onSubmit={addFriend}><label htmlFor="friend-login-id">친구 아이디 또는 이름</label><div className="friend-search-control"><div className="friend-search-input-wrap"><input id="friend-login-id" autoComplete="off" value={LOGIN_ID} onChange={EVENT => SET_LOGIN_ID(EVENT.target.value)} placeholder="아이디 또는 이름 입력"/>
      {LOGIN_ID.trim() && <div className="friend-search-results" role="listbox" aria-label="친구 검색 결과">
        {SEARCH.isFetching && <p>검색 중…</p>}
        {!SEARCH.isFetching && SEARCH.error && <p>검색 결과를 불러오지 못했어요.</p>}
        {!SEARCH.isFetching && !SEARCH.error && !(SEARCH.data?.length) && <p>일치하는 계정이 없어요.</p>}
        {(SEARCH.data ?? []).map(ACCOUNT => <button type="button" role="option" key={ACCOUNT.user_id} onClick={() => SET_LOGIN_ID(ACCOUNT.login_id)}>{ACCOUNT.login_id}({ACCOUNT.display_name})</button>)}
      </div>}
    </div><button className="btn" disabled={REQUEST.isPending}>추가</button></div></form>
    {REQUEST.error && <p className="account-feedback show">친구 요청을 처리하지 못했어요.</p>}
    <div className="legend"><span><i className="online"/>온라인</span><span><i className="offline"/>오프라인</span><span><i className="playing"/>게임 중</span></div>
    <div className="account-list">
      {FRIENDS.isLoading && <p className="empty-state">친구 목록을 불러오는 중…</p>}
      {FRIENDS.error && <p className="empty-state">친구 목록을 불러오지 못했어요.</p>}
      {!FRIENDS.isLoading && !FRIENDS.error && !FRIENDS.data?.length && <p className="empty-state">아직 등록된 친구가 없어요.</p>}
      {(FRIENDS.data ?? []).map(FRIEND => <div className="friend-row" key={FRIEND.friendship_id}><div><strong>{FRIEND.display_name}</strong><small>@{FRIEND.login_id}</small></div>
        {FRIEND.relationship === 'accepted' && <span className={`presence ${FRIEND.presence_status}`}><i/>{STATUS_LABEL[FRIEND.presence_status]}</span>}
        {FRIEND.relationship === 'outgoing' && <span className="presence offline"><i/>요청 대기중</span>}
        {FRIEND.relationship === 'incoming' && <div className="friend-actions"><button className="btn small" disabled={RESPONSE.isPending} onClick={() => RESPONSE.mutate({ friendshipId: FRIEND.friendship_id, accept: true })}>수락</button><button className="btn ghost small" disabled={RESPONSE.isPending} onClick={() => RESPONSE.mutate({ friendshipId: FRIEND.friendship_id, accept: false })}>거절</button></div>}
      </div>)}
    </div>
  </section>;
}
