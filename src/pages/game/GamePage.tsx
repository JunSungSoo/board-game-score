import { useState } from 'react';
import { useStore } from 'zustand';
import { GameSelectFeature } from '../../features/game-select/GameSelectFeature';
import { ModeSelectFeature } from '../../features/mode-select/ModeSelectFeature';
import { PlayerSetupFeature, type SetupResult } from '../../features/player-setup/PlayerSetupFeature';
import { ScoreBoardFeature } from '../../features/score-board/ScoreBoardFeature';
import { ResultFeature } from '../../features/result/ResultFeature';
import { AccountMenuFeature } from '../../features/account/AccountMenuFeature';
import { GAME_STORE, entitiesOf } from '../../stores/game-store';
import type { GameMode, GameState, ScoreEntity } from '../../shared/data/types';
import { useAuthSession } from '../../features/auth/api/hooks';
import { useFinishGameMutation, useStartGameMutation } from '../../shared/api/account';
import { SUPABASE_CLIENT } from '../../shared/api/supabase';

type Stage = 'select' | 'mode' | 'setup' | 'score' | 'result';
const MAKE_ENTITY = (name: string): ScoreEntity => ({ name, total: 0, rounds: [] });

export function GamePage() {
  const GAME = useStore(GAME_STORE, STATE => STATE.game); const SET_GAME = useStore(GAME_STORE, STATE => STATE.setGame); const CLEAR_GAME = useStore(GAME_STORE, STATE => STATE.clear);
  const [STAGE, SET_STAGE] = useState<Stage>(GAME ? 'score' : 'select'); const [CHOICE, SET_CHOICE] = useState(''); const [MODE, SET_MODE] = useState<GameMode>('all');
  const AUTH = useAuthSession(); const START_REMOTE = useStartGameMutation(); const FINISH_REMOTE = useFinishGameMutation();
  const PROFILE = AUTH.data?.profile ?? null; const GUEST = AUTH.data?.guest ?? false;

  function selectGame(choice: string) {
    SET_CHOICE(choice);
    if (choice.startsWith('tichu-')) { SET_MODE('all'); SET_STAGE('setup'); }
    else SET_STAGE('mode');
  }
  function chooseMode(mode: GameMode) { SET_MODE(mode); if (mode === 'me') start({ names: ['나'], membersA: [], membersB: [], participantUserIds: {} }, mode); else SET_STAGE('setup'); }
  function start(setup: SetupResult, forcedMode = MODE) {
    const GAME_ID = CHOICE.startsWith('tichu') ? 'tichu' : CHOICE as 'skullking' | 'generic';
    let NEXT: GameState;
    if (GAME_ID === 'skullking') NEXT = { gameId: GAME_ID, mode: forcedMode, round: 1, players: forcedMode === 'me' ? [MAKE_ENTITY('나')] : setup.names.map(MAKE_ENTITY), participantUserIds: setup.participantUserIds, roundLabels: [], skullkingCustomMode: false, skullkingAutoAdvance: true };
    else if (GAME_ID === 'tichu' && CHOICE === 'tichu-team') NEXT = { gameId: GAME_ID, mode: 'all', round: 1, tichuMode: 'team', teams: [{ ...MAKE_ENTITY('팀 A'), members: setup.membersA }, { ...MAKE_ENTITY('팀 B'), members: setup.membersB }], participantUserIds: setup.participantUserIds };
    else if (GAME_ID === 'tichu') NEXT = { gameId: GAME_ID, mode: 'all', round: 1, tichuMode: 'zheng', players: setup.names.map(MAKE_ENTITY), participantUserIds: setup.participantUserIds };
    else if (forcedMode === 'me') NEXT = { gameId: 'generic', mode: 'me', round: 1, genericMode: 'me', players: [MAKE_ENTITY('나')], scoreUnit: 1, scoreUnitSource: 'preset' };
    else NEXT = { gameId: 'generic', mode: 'all', round: 1, genericMode: 'team', teams: [{ ...MAKE_ENTITY('팀 A'), members: setup.membersA }, { ...MAKE_ENTITY('팀 B'), members: setup.membersB }], scoreUnit: 1, scoreUnitSource: 'preset' };
    SET_GAME(NEXT); SET_STAGE('score');
    if (PROFILE && SUPABASE_CLIENT) START_REMOTE.mutate(NEXT, { onSuccess: RESULT => GAME_STORE.getState().updateGame(CURRENT => ({ ...CURRENT, remoteRoomId: RESULT.roomId, remoteParticipants: RESULT.participants })) });
  }
  function quit() { if (GAME?.remoteRoomId) FINISH_REMOTE.mutate({ game: GAME, cancel: true }); CLEAR_GAME(); SET_STAGE('select'); }
  function finish() { if (!GAME) return; if (GAME.remoteRoomId) FINISH_REMOTE.mutate({ game: GAME, cancel: false }); SET_STAGE('result'); }
  function restart() { if (!GAME) return; const RESET = entitiesOf(GAME).map(ENTITY => ({ ...ENTITY, total: 0, rounds: [] })); SET_GAME({ ...GAME, round: 1, roundLabels: GAME.gameId === 'skullking' ? [] : undefined, ...(GAME.teams ? { teams: RESET } : { players: RESET }), remoteRoomId: null, remoteParticipants: [] }); SET_STAGE('score'); }
  const BACKGROUND_GAME = GAME?.gameId ?? (CHOICE.startsWith('tichu') ? 'tichu' : CHOICE === 'skullking' ? 'skullking' : null);
  return <><div className="game-bg" data-active={BACKGROUND_GAME ?? undefined}/><AccountMenuFeature profile={PROFILE} guest={GUEST} />
    <div className="container"><header><button className={`account-status ${PROFILE ? 'signed-in' : ''}`}>{PROFILE?.display_name ?? '게스트'}</button><h1>🎲 보드게임 점수 계산기</h1><p>보드게임 점수를 쉽고 정확하게</p></header>
      {STAGE === 'select' && <GameSelectFeature onSelect={selectGame} />}
      {STAGE === 'mode' && <ModeSelectFeature generic={CHOICE === 'generic'} onSelect={chooseMode} onBack={() => SET_STAGE('select')} />}
      {STAGE === 'setup' && <PlayerSetupFeature profile={PROFILE} guestOnly={CHOICE === 'generic'} team={CHOICE === 'generic' || CHOICE === 'tichu-team'} min={CHOICE === 'tichu-zheng' ? 3 : 2} max={CHOICE === 'generic' ? 20 : CHOICE === 'tichu-zheng' ? 6 : 8} onStart={start} onBack={() => SET_STAGE(CHOICE.startsWith('tichu') ? 'select' : 'mode')} />}
      {STAGE === 'score' && <ScoreBoardFeature onQuit={quit} onFinish={finish} />}
      {STAGE === 'result' && GAME && <ResultFeature game={GAME} onRestart={restart} onNew={quit} />}
    </div></>;
}
