import { useState } from 'react';
import { useStore } from 'zustand';
import { GAME_STORE, entitiesOf } from '../../stores/game-store';
import { SKULL_KING_TOTAL_ROUNDS, TICHU_TEAM_TARGET, TICHU_ZHENG_TARGET } from '../../shared/data/game';
import { ScoreTable } from './ScoreTable';
import { EditRoundsModal } from './EditRoundsModal';
import { SkullKingEntry } from '../score-entry/SkullKingEntry';
import { TichuEntry } from '../score-entry/TichuEntry';
import { GenericEntry } from '../score-entry/GenericEntry';
import { GameRulesFeature } from '../game-rules/GameRulesFeature';

export function ScoreBoardFeature({ onQuit, onFinish }: { onQuit: () => void; onFinish: () => void }) {
  const GAME = useStore(GAME_STORE, STATE => STATE.game);
  const UPDATE_GAME = useStore(GAME_STORE, STATE => STATE.updateGame);
  const [EDITING, SET_EDITING] = useState(false);
  const [CONFIRM_QUIT, SET_CONFIRM_QUIT] = useState(false);
  const [CONFIRM_END, SET_CONFIRM_END] = useState(false);
  if (!GAME) return null;
  const ENTITIES = entitiesOf(GAME);

  function addRound(scores: number[]) {
    let SHOULD_FINISH = false;
    UPDATE_GAME(CURRENT => {
      const UPDATED_ENTITIES = entitiesOf(CURRENT).map((ENTITY, INDEX) => ({ ...ENTITY, rounds: [...ENTITY.rounds, scores[INDEX]], total: ENTITY.total + scores[INDEX] }));
      const NEXT = { ...CURRENT, ...(CURRENT.teams ? { teams: UPDATED_ENTITIES } : { players: UPDATED_ENTITIES }) };
      if (NEXT.gameId === 'skullking') {
        NEXT.roundLabels = [...(NEXT.roundLabels ?? []), NEXT.round];
        SHOULD_FINISH = NEXT.round >= SKULL_KING_TOTAL_ROUNDS;
        if (!SHOULD_FINISH && (!NEXT.skullkingCustomMode || NEXT.skullkingAutoAdvance !== false)) NEXT.round += 1;
      } else {
        const RANKED = [...UPDATED_ENTITIES].sort((FIRST, SECOND) => SECOND.total - FIRST.total);
        SHOULD_FINISH = NEXT.gameId === 'tichu' && ((NEXT.tichuMode === 'team' && RANKED[0].total >= TICHU_TEAM_TARGET && RANKED[0].total !== RANKED[1].total) || (NEXT.tichuMode === 'zheng' && RANKED[0].total >= TICHU_ZHENG_TARGET && RANKED[0].total !== RANKED[1].total));
        NEXT.round += 1;
      }
      return NEXT;
    });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    if (SHOULD_FINISH) onFinish();
  }

  return <section className="screen active">
    <div className="top-row"><div><div className="round-badge">라운드 <span>{GAME.round}</span>{GAME.gameId === 'skullking' ? ` / ${SKULL_KING_TOTAL_ROUNDS}` : ''}</div><div className="round-sub">{GAME.gameId === 'skullking' ? `이번 라운드는 ${GAME.round}장씩 받아요` : GAME.tichuMode === 'team' ? '1000점에 먼저 도달하는 팀이 승리해요' : GAME.tichuMode === 'zheng' ? '11점에 먼저 도달하면 승리해요' : ''}</div></div><button className="btn ghost" onClick={() => SET_CONFIRM_QUIT(true)}>그만하기</button></div>
    {GAME.gameId === 'skullking' && <div className="custom-mode-panel"><label className="custom-check-row"><input type="checkbox" checked={GAME.skullkingCustomMode === true} onChange={event => UPDATE_GAME(CURRENT => ({ ...CURRENT, skullkingCustomMode: event.target.checked, skullkingAutoAdvance: true }))} /> 커스텀 모드</label>{GAME.skullkingCustomMode && <div className="custom-mode-options"><div className="custom-round-row"><span>현재 라운드</span><div className="stepper"><button disabled={GAME.round <= 1} onClick={() => UPDATE_GAME(CURRENT => ({ ...CURRENT, round: Math.max(1, CURRENT.round - 1) }))}>−</button><div className="val">{GAME.round}</div><button disabled={GAME.round >= SKULL_KING_TOTAL_ROUNDS} onClick={() => UPDATE_GAME(CURRENT => ({ ...CURRENT, round: Math.min(SKULL_KING_TOTAL_ROUNDS, CURRENT.round + 1) }))}>+</button></div></div><label className="custom-check-row"><input type="checkbox" checked={GAME.skullkingAutoAdvance !== false} onChange={event => UPDATE_GAME(CURRENT => ({ ...CURRENT, skullkingAutoAdvance: event.target.checked }))} /> 점수 계산 후 라운드 상승</label></div>}</div>}
    <div className="card"><h2>누적 점수</h2><ScoreTable game={GAME} /></div>
    {ENTITIES[0]?.rounds.length > 0 && <button className="btn ghost block" onClick={() => SET_EDITING(true)}>이전 라운드 점수 수정</button>}
    <div className="card"><h2>라운드 {GAME.round} 결과 입력</h2>
      {GAME.gameId === 'skullking' && <SkullKingEntry game={GAME} onSubmit={addRound} />}
      {GAME.gameId === 'tichu' && <TichuEntry game={GAME} onSubmit={addRound} />}
      {GAME.gameId === 'generic' && <GenericEntry game={GAME} onSubmit={addRound} onUnitChange={(scoreUnit, scoreUnitSource) => UPDATE_GAME(CURRENT => ({ ...CURRENT, scoreUnit, scoreUnitSource }))} />}
      {((GAME.gameId === 'skullking' && GAME.mode === 'all' && ENTITIES[0]?.rounds.length > 0) || GAME.gameId === 'tichu') && <button className="btn ghost block" onClick={() => SET_CONFIRM_END(true)}>게임 종료</button>}
    </div><GameRulesFeature gameId={GAME.gameId} />
    <EditRoundsModal game={GAME} open={EDITING} onClose={() => SET_EDITING(false)} onSave={VALUES => { UPDATE_GAME(CURRENT => { const UPDATED = entitiesOf(CURRENT).map((ENTITY, INDEX) => ({ ...ENTITY, rounds: VALUES[INDEX], total: VALUES[INDEX].reduce((SUM, VALUE) => SUM + VALUE, 0) })); return { ...CURRENT, ...(CURRENT.teams ? { teams: UPDATED } : { players: UPDATED }) }; }); SET_EDITING(false); }} />
    {CONFIRM_QUIT && <Confirm text="게임을 중지하고 게임 선택으로 넘어갈까요?" onCancel={() => SET_CONFIRM_QUIT(false)} onConfirm={onQuit} />}
    {CONFIRM_END && <Confirm text="현재까지 기록된 게임 점수로 종료합니까?" onCancel={() => SET_CONFIRM_END(false)} onConfirm={onFinish} />}
  </section>;
}

function Confirm({ text, onCancel, onConfirm }: { text: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-overlay show"><div className="modal-box"><p>{text}</p><div className="modal-actions"><button className="btn ghost" onClick={onCancel}>취소</button><button className="btn" onClick={onConfirm}>확인</button></div></div></div>;
}
