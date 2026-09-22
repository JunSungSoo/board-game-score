import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../shared/data/routes';

export function SideMenuFeature() {
  const [OPEN, SET_OPEN] = useState(false);
  const LOCATION = useLocation();
  const NAVIGATE = useNavigate();
  const GO = (path: string) => { NAVIGATE(path); SET_OPEN(false); };

  return <>
    <button className="menu-toggle" aria-label="메뉴 열기" onClick={() => SET_OPEN(true)}><span/><span/><span/></button>
    <button className={`side-menu-backdrop ${OPEN ? 'show' : ''}`} aria-label="메뉴 닫기" onClick={() => SET_OPEN(false)} />
    <nav className={`side-menu ${OPEN ? 'open' : ''}`} aria-label="주 메뉴">
      <div className="side-menu-header">메뉴</div>
      <button className={`side-menu-item side-menu-home ${LOCATION.pathname.startsWith('/game/') ? 'current' : ''}`} onClick={() => GO(APP_ROUTES.GAME_SELECT)}>⌂ 홈</button>
      <button className={`side-menu-item ${LOCATION.pathname.startsWith(APP_ROUTES.GAME_GUIDE) ? 'current' : ''}`} onClick={() => GO(APP_ROUTES.GAME_GUIDE)}>보드게임 설명서</button>
    </nav>
  </>;
}
