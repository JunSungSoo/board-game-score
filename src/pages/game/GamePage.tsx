import { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from 'zustand';
import { AccountMenuFeature } from '../../features/account/AccountMenuFeature';
import { useAuthSession } from '../../features/auth/api/hooks';
import { GameSelectFeature } from '../../features/game-select/GameSelectFeature';
import { ModeSelectFeature } from '../../features/mode-select/ModeSelectFeature';
import { TichuModeSelectFeature } from '../../features/mode-select/TichuModeSelectFeature';
import { PlayerSetupFeature, type SetupResult } from '../../features/player-setup/PlayerSetupFeature';
import { ResultFeature } from '../../features/result/ResultFeature';
import { ScoreBoardFeature } from '../../features/score-board/ScoreBoardFeature';
import { useFinishGameMutation, useStartGameMutation } from '../../shared/api/account';
import { SUPABASE_CLIENT } from '../../shared/api/supabase';
import { APP_ROUTES, GAME_MODE_ROUTES } from '../../shared/data/routes';
import type { GameMode, GameState, ScoreEntity } from '../../shared/data/types';
import { GAME_STORE, entitiesOf } from '../../stores/game-store';

type SetupChoice = 'skullking' | 'tichu-team' | 'tichu-zheng' | 'generic';
const MAKE_ENTITY = (name: string): ScoreEntity => ({ name, total: 0, rounds: [] });

function SingleModeLauncher({ onStart }: { onStart: () => void }) {
  const STARTED = useRef(false);
  useEffect(() => {
    if (STARTED.current) return;
    STARTED.current = true;
    onStart();
  }, [onStart]);
  return <section className="screen active"><div className="card"><p className="empty-state">내 점수 기록을 준비하고 있어요…</p></div></section>;
}

export function GamePage() {
  const GAME = useStore(GAME_STORE, STATE => STATE.game);
  const SET_GAME = useStore(GAME_STORE, STATE => STATE.setGame);
  const CLEAR_GAME = useStore(GAME_STORE, STATE => STATE.clear);
  const AUTH = useAuthSession();
  const START_REMOTE = useStartGameMutation();
  const FINISH_REMOTE = useFinishGameMutation();
  const LOCATION = useLocation();
  const NAVIGATE = useNavigate();
  const PROFILE = AUTH.data?.profile ?? null;
  const GUEST = AUTH.data?.guest ?? false;
  const PATH = LOCATION.pathname;

  const SETUP_CHOICE: SetupChoice | null = PATH === GAME_MODE_ROUTES.SKULL_KING_TOGETHER ? 'skullking'
    : PATH === GAME_MODE_ROUTES.TICHU_TOGETHER ? 'tichu-team'
      : PATH === GAME_MODE_ROUTES.TICHU_SINGLE ? 'tichu-zheng'
        : PATH === GAME_MODE_ROUTES.GENERIC_TOGETHER ? 'generic'
          : null;

  function selectGame(choice: string) {
    if (choice === 'skullking') NAVIGATE(APP_ROUTES.SKULL_KING);
    else if (choice === 'tichu') NAVIGATE(APP_ROUTES.TICHU);
    else NAVIGATE(APP_ROUTES.GENERIC);
  }

  function chooseMode(game: 'skullking' | 'generic', mode: GameMode) {
    const ROUTE = game === 'skullking'
      ? mode === 'all' ? GAME_MODE_ROUTES.SKULL_KING_TOGETHER : GAME_MODE_ROUTES.SKULL_KING_SINGLE
      : mode === 'all' ? GAME_MODE_ROUTES.GENERIC_TOGETHER : GAME_MODE_ROUTES.GENERIC_SINGLE;
    NAVIGATE(ROUTE);
  }

  function start(setup: SetupResult, choice: SetupChoice, forcedMode: GameMode = 'all') {
    const GAME_ID = choice.startsWith('tichu') ? 'tichu' : choice;
    let NEXT: GameState;
    if (GAME_ID === 'skullking') NEXT = { gameId: GAME_ID, mode: forcedMode, round: 1, players: forcedMode === 'me' ? [MAKE_ENTITY('나')] : setup.names.map(MAKE_ENTITY), participantUserIds: setup.participantUserIds, roundLabels: [], skullkingCustomMode: false, skullkingAutoAdvance: true };
    else if (GAME_ID === 'tichu' && choice === 'tichu-team') NEXT = { gameId: GAME_ID, mode: 'all', round: 1, tichuMode: 'team', teams: [{ ...MAKE_ENTITY('팀 A'), members: setup.membersA }, { ...MAKE_ENTITY('팀 B'), members: setup.membersB }], participantUserIds: setup.participantUserIds };
    else if (GAME_ID === 'tichu') NEXT = { gameId: GAME_ID, mode: 'all', round: 1, tichuMode: 'zheng', players: setup.names.map(MAKE_ENTITY), participantUserIds: setup.participantUserIds };
    else if (forcedMode === 'me') NEXT = { gameId: 'generic', mode: 'me', round: 1, genericMode: 'me', players: [MAKE_ENTITY('나')], participantUserIds: setup.participantUserIds, scoreUnit: 1, scoreUnitSource: 'preset' };
    else NEXT = { gameId: 'generic', mode: 'all', round: 1, genericMode: 'team', teams: [{ ...MAKE_ENTITY('팀 A'), members: setup.membersA }, { ...MAKE_ENTITY('팀 B'), members: setup.membersB }], participantUserIds: setup.participantUserIds, scoreUnit: 1, scoreUnitSource: 'preset' };
    SET_GAME(NEXT);
    NAVIGATE(APP_ROUTES.GAME_WRITE);
    if (PROFILE && SUPABASE_CLIENT) START_REMOTE.mutate(NEXT, { onSuccess: RESULT => GAME_STORE.getState().updateGame(CURRENT => ({ ...CURRENT, remoteRoomId: RESULT.roomId, remoteParticipants: RESULT.participants })) });
  }

  function startSingle(choice: 'skullking' | 'generic') {
    start({ names: ['나'], membersA: [], membersB: [], participantUserIds: PROFILE ? { '나': PROFILE.id } : {} }, choice, 'me');
  }

  function quit() {
    if (GAME?.remoteRoomId) FINISH_REMOTE.mutate({ game: GAME, cancel: true });
    CLEAR_GAME();
    NAVIGATE(APP_ROUTES.GAME_SELECT);
  }

  function finish() {
    if (!GAME) return;
    if (GAME.remoteRoomId) FINISH_REMOTE.mutate({ game: GAME, cancel: false });
    NAVIGATE(APP_ROUTES.GAME_RESULT);
  }

  function restart() {
    if (!GAME) return;
    const RESET = entitiesOf(GAME).map(ENTITY => ({ ...ENTITY, total: 0, rounds: [] }));
    SET_GAME({ ...GAME, round: 1, roundLabels: GAME.gameId === 'skullking' ? [] : undefined, ...(GAME.teams ? { teams: RESET } : { players: RESET }), remoteRoomId: null, remoteParticipants: [] });
    NAVIGATE(APP_ROUTES.GAME_WRITE);
  }

  const ROUTE_GAME = PATH.startsWith(APP_ROUTES.SKULL_KING) ? 'skullking' : PATH.startsWith(APP_ROUTES.TICHU) ? 'tichu' : null;
  const BACKGROUND_GAME = PATH === APP_ROUTES.GAME_WRITE || PATH === APP_ROUTES.GAME_RESULT ? GAME?.gameId ?? null : ROUTE_GAME;

  let CONTENT;
  if (PATH === APP_ROUTES.GAME_SELECT) CONTENT = <GameSelectFeature onSelect={selectGame} />;
  else if (PATH === APP_ROUTES.SKULL_KING) CONTENT = <ModeSelectFeature generic={false} onSelect={MODE => chooseMode('skullking', MODE)} onBack={() => NAVIGATE(APP_ROUTES.GAME_SELECT)} />;
  else if (PATH === APP_ROUTES.TICHU) CONTENT = <TichuModeSelectFeature onSelect={MODE => NAVIGATE(MODE === 'together' ? GAME_MODE_ROUTES.TICHU_TOGETHER : GAME_MODE_ROUTES.TICHU_SINGLE)} onBack={() => NAVIGATE(APP_ROUTES.GAME_SELECT)} />;
  else if (PATH === APP_ROUTES.GENERIC) CONTENT = <ModeSelectFeature generic onSelect={MODE => chooseMode('generic', MODE)} onBack={() => NAVIGATE(APP_ROUTES.GAME_SELECT)} />;
  else if (PATH === GAME_MODE_ROUTES.SKULL_KING_SINGLE) CONTENT = <SingleModeLauncher onStart={() => startSingle('skullking')} />;
  else if (PATH === GAME_MODE_ROUTES.GENERIC_SINGLE) CONTENT = <SingleModeLauncher onStart={() => startSingle('generic')} />;
  else if (SETUP_CHOICE) CONTENT = <PlayerSetupFeature profile={PROFILE} guestOnly={SETUP_CHOICE === 'generic'} team={SETUP_CHOICE === 'generic' || SETUP_CHOICE === 'tichu-team'} min={SETUP_CHOICE === 'tichu-zheng' ? 3 : 2} max={SETUP_CHOICE === 'generic' ? 20 : SETUP_CHOICE === 'tichu-zheng' ? 6 : 8} onStart={SETUP => start(SETUP, SETUP_CHOICE)} onBack={() => NAVIGATE(SETUP_CHOICE.startsWith('tichu') ? APP_ROUTES.TICHU : SETUP_CHOICE === 'generic' ? APP_ROUTES.GENERIC : APP_ROUTES.SKULL_KING)} />;
  else if (PATH === APP_ROUTES.GAME_WRITE) CONTENT = GAME ? <ScoreBoardFeature onQuit={quit} onFinish={finish} /> : <Navigate to={APP_ROUTES.GAME_SELECT} replace />;
  else if (PATH === APP_ROUTES.GAME_RESULT) CONTENT = GAME ? <ResultFeature game={GAME} onRestart={restart} onNew={quit} /> : <Navigate to={APP_ROUTES.GAME_SELECT} replace />;
  else CONTENT = <Navigate to={APP_ROUTES.GAME_SELECT} replace />;

  return <><div className="game-bg" data-active={BACKGROUND_GAME ?? undefined}/><AccountMenuFeature profile={PROFILE} guest={GUEST} />
    <div className="container"><header><button className={`account-status ${PROFILE ? 'signed-in' : ''}`}>{PROFILE?.display_name ?? '게스트'}</button><h1>🎲 보드게임 점수 계산기</h1><p>보드게임 점수를 쉽고 정확하게</p></header>{CONTENT}</div>
  </>;
}
