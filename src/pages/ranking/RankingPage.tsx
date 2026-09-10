import { AccountMenuFeature } from '../../features/account/AccountMenuFeature';
import { AccountRouteNavFeature } from '../../features/account/AccountRouteNavFeature';
import { useAuthSession } from '../../features/auth/api/hooks';
import { RankingFeature } from '../../features/ranking/RankingFeature';

export function RankingPage() {
  const AUTH = useAuthSession(); const PROFILE = AUTH.data?.profile ?? null; const GUEST = AUTH.data?.guest ?? false;
  return <><AccountMenuFeature profile={PROFILE} guest={GUEST}/><div className="container account-page-container"><header className="account-page-header"><span className={`account-status ${PROFILE ? 'signed-in' : ''}`}>{PROFILE?.display_name ?? '게스트'}</span><h1>랭킹</h1><p>1등을 가장 많이 기록한 순서예요</p></header><AccountRouteNavFeature/><RankingFeature profile={PROFILE}/></div></>;
}
