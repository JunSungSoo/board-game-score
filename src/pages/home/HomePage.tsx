import { AccountMenuFeature } from '../../features/account/AccountMenuFeature';
import { AccountRouteNavFeature } from '../../features/account/AccountRouteNavFeature';
import { GameRecordCtaFeature } from '../../features/account/GameRecordCtaFeature';
import { useAuthSession } from '../../features/auth/api/hooks';
import { FriendsFeature } from '../../features/friends/FriendsFeature';

export function HomePage() {
  const AUTH = useAuthSession(); const PROFILE = AUTH.data?.profile ?? null; const GUEST = AUTH.data?.guest ?? false;
  return <><AccountMenuFeature profile={PROFILE} guest={GUEST}/><div className="container account-page-container"><header className="account-page-header"><span className={`account-status ${PROFILE ? 'signed-in' : ''}`}>{PROFILE?.display_name ?? '게스트'}</span><h1>친구 목록</h1><p>친구의 접속 상태를 한눈에 확인해요</p></header>
    <GameRecordCtaFeature/>
    <AccountRouteNavFeature/><FriendsFeature profile={PROFILE}/>
  </div></>;
}
