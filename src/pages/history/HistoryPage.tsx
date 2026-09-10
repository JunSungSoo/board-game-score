import { AccountMenuFeature } from '../../features/account/AccountMenuFeature';
import { AccountRouteNavFeature } from '../../features/account/AccountRouteNavFeature';
import { useAuthSession } from '../../features/auth/api/hooks';
import { GameHistoryFeature } from '../../features/game-history/GameHistoryFeature';

export function HistoryPage() {
  const AUTH = useAuthSession(); const PROFILE = AUTH.data?.profile ?? null; const GUEST = AUTH.data?.guest ?? false;
  return <><AccountMenuFeature profile={PROFILE} guest={GUEST}/><div className="container account-page-container"><header className="account-page-header"><span className={`account-status ${PROFILE ? 'signed-in' : ''}`}>{PROFILE?.display_name ?? '게스트'}</span><h1>게임 기록</h1><p>완료한 게임과 점수, 순위를 확인해요</p></header><AccountRouteNavFeature/><GameHistoryFeature profile={PROFILE}/></div></>;
}
