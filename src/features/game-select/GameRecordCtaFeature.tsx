import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../shared/data/routes';

export function GameRecordCtaFeature() {
  const NAVIGATE = useNavigate();
  return <button className="btn block game-record-cta" onClick={() => NAVIGATE(APP_ROUTES.GAME_SELECT)}>🎲 게임 점수 기록</button>;
}
