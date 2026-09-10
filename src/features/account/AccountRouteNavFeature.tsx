import { NavLink } from 'react-router-dom';
import { APP_ROUTES } from '../../shared/data/routes';

export function AccountRouteNavFeature() {
  return <nav className="account-route-nav" aria-label="내 정보 메뉴">
    <NavLink to={APP_ROUTES.FRIENDS}>친구목록</NavLink>
    <NavLink to={APP_ROUTES.GAME_HISTORY}>게임기록</NavLink>
    <NavLink to={APP_ROUTES.RANK}>랭킹</NavLink>
  </nav>;
}
