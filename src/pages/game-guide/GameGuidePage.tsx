import { AccountMenuFeature } from '../../features/account/AccountMenuFeature';
import { GameRecordCtaFeature } from '../../features/account/GameRecordCtaFeature';
import { useAuthSession } from '../../features/auth/api/hooks';
import { GameGuideFeature } from '../../features/game-guide/GameGuideFeature';

export function GameGuidePage() {
  const AUTH = useAuthSession();
  const PROFILE = AUTH.data?.profile ?? null;
  const GUEST = AUTH.data?.guest ?? false;
  return <><AccountMenuFeature profile={PROFILE} guest={GUEST}/><div className="container account-page-container"><header className="account-page-header"><span className={`account-status ${PROFILE ? 'signed-in' : ''}`}>{PROFILE?.display_name ?? '게스트'}</span><h1>보드게임 설명서</h1><p>게임 이름을 검색해 필수 규칙과 카드 효과를 확인하세요</p></header><GameRecordCtaFeature/><div className="game-guide-content"><GameGuideFeature/></div></div></>;
}
