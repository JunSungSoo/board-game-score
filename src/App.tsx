import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuthSession } from './features/auth/api/hooks';
import { useScreenRipple } from './shared/hooks/useScreenRipple';
import { APP_ROUTES } from './shared/data/routes';

const LOGIN_PAGE = lazy(() => import('./pages/login/LoginPage').then(MODULE => ({ default: MODULE.LoginPage })));
const SIGNUP_PAGE = lazy(() => import('./pages/signup/SignupPage').then(MODULE => ({ default: MODULE.SignupPage })));
const GAME_PAGE = lazy(() => import('./pages/game/GamePage').then(MODULE => ({ default: MODULE.GamePage })));
const HOME_PAGE = lazy(() => import('./pages/home/HomePage').then(MODULE => ({ default: MODULE.HomePage })));
const HISTORY_PAGE = lazy(() => import('./pages/history/HistoryPage').then(MODULE => ({ default: MODULE.HistoryPage })));
const RANKING_PAGE = lazy(() => import('./pages/ranking/RankingPage').then(MODULE => ({ default: MODULE.RankingPage })));

function ProtectedRoute() {
  const AUTH = useAuthSession();
  if (AUTH.isLoading) return <main className="auth-page-shell"><p>접속 정보를 확인하고 있어요…</p></main>;
  if (!AUTH.data?.profile && !AUTH.data?.guest) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  useScreenRipple();
  return <Suspense fallback={<main className="auth-page-shell"><p>화면을 준비하고 있어요…</p></main>}><Routes>
    <Route element={<ProtectedRoute />}>
      <Route path={APP_ROUTES.FRIENDS} element={<HOME_PAGE />} />
      <Route path={APP_ROUTES.GAME_HISTORY} element={<HISTORY_PAGE />} />
      <Route path={APP_ROUTES.RANK} element={<RANKING_PAGE />} />
      <Route path="/game/*" element={<GAME_PAGE />} />
      <Route path="/" element={<Navigate to={APP_ROUTES.FRIENDS} replace />} />
      <Route path="/games" element={<Navigate to={APP_ROUTES.GAME_SELECT} replace />} />
      <Route path="/history" element={<Navigate to={APP_ROUTES.GAME_HISTORY} replace />} />
      <Route path="/ranking" element={<Navigate to={APP_ROUTES.RANK} replace />} />
      <Route path="/index.html" element={<Navigate to={APP_ROUTES.FRIENDS} replace />} />
    </Route>
    <Route path="/login" element={<LOGIN_PAGE />} />
    <Route path="/login.html" element={<Navigate to="/login" replace />} />
    <Route path="/signup" element={<SIGNUP_PAGE />} />
    <Route path="/signup.html" element={<Navigate to="/signup" replace />} />
    <Route path="*" element={<Navigate to={APP_ROUTES.FRIENDS} replace />} />
  </Routes></Suspense>;
}
