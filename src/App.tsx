import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useScreenRipple } from './shared/hooks/useScreenRipple';
import { useRouteScrollTop } from './shared/hooks/useRouteScrollTop';
import { APP_ROUTES } from './shared/data/routes';
import { LoadingScreen } from './shared/ui/LoadingScreen';

const GAME_PAGE = lazy(() => import('./pages/game/GamePage').then(MODULE => ({ default: MODULE.GamePage })));
const GAME_GUIDE_PAGE = lazy(() => import('./pages/game-guide/GameGuidePage').then(MODULE => ({ default: MODULE.GameGuidePage })));

export default function App() {
  useScreenRipple();
  useRouteScrollTop();
  return <Suspense fallback={<LoadingScreen />}><Routes>
    <Route path={APP_ROUTES.GAME_GUIDE} element={<GAME_GUIDE_PAGE />} />
    <Route path={`${APP_ROUTES.GAME_GUIDE}/:slug`} element={<GAME_GUIDE_PAGE />} />
    <Route path={`${APP_ROUTES.GAME_GUIDE}/:slug/:versionKey`} element={<GAME_GUIDE_PAGE />} />
    <Route path="/game/*" element={<GAME_PAGE />} />
    <Route path="/" element={<Navigate to={APP_ROUTES.GAME_SELECT} replace />} />
    <Route path="/index.html" element={<Navigate to={APP_ROUTES.GAME_SELECT} replace />} />
    <Route path="/games" element={<Navigate to={APP_ROUTES.GAME_SELECT} replace />} />
    <Route path="*" element={<Navigate to={APP_ROUTES.GAME_SELECT} replace />} />
  </Routes></Suspense>;
}
