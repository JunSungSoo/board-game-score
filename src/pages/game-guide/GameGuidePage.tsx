import { GameGuideFeature } from '../../features/game-guide/GameGuideFeature';
import { GameRecordCtaFeature } from '../../features/game-select/GameRecordCtaFeature';
import { SideMenuFeature } from '../../features/navigation/SideMenuFeature';

export function GameGuidePage() {
  return <><SideMenuFeature/><div className="container account-page-container"><header className="account-page-header"><h1>보드게임 설명서</h1><p>게임 이름을 검색해 필수 규칙과 카드 효과를 확인하세요</p></header><GameRecordCtaFeature/><div className="game-guide-content"><GameGuideFeature/></div></div></>;
}
