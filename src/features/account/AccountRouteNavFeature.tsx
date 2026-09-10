import { NavLink } from 'react-router-dom';

export function AccountRouteNavFeature() {
  return <nav className="account-route-nav" aria-label="내 정보 메뉴">
    <NavLink end to="/">친구목록</NavLink>
    <NavLink to="/history">게임기록</NavLink>
    <NavLink to="/ranking">랭킹</NavLink>
  </nav>;
}
