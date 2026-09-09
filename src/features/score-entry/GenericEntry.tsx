import { useState } from 'react';
import { GENERIC_SCORE_UNITS, MAX_GENERIC_SCORE_UNIT } from '../../shared/data/game';
import type { GameState } from '../../shared/data/types';
import { entityLabel } from '../score-board/ScoreTable';
import { Stepper } from './Stepper';

export function GenericEntry({ game, onSubmit, onUnitChange }: { game: GameState; onSubmit: (scores: number[]) => void; onUnitChange: (unit: number, source: 'preset' | 'custom') => void }) {
  const ENTITIES = game.teams ?? game.players ?? [];
  const [SCORES, SET_SCORES] = useState(ENTITIES.map(() => 0));
  const UNIT = game.scoreUnit ?? 1;
  return <><div className="generic-unit-panel"><label>점수 증감 단위</label><div className="generic-unit-controls"><div className="chip-list">{GENERIC_SCORE_UNITS.map(VALUE => <button className={`chip ${game.scoreUnitSource !== 'custom' && UNIT === VALUE ? 'selected' : ''}`} key={VALUE} onClick={() => onUnitChange(VALUE, 'preset')}>{VALUE}</button>)}</div><input className="generic-unit-input" type="number" min={1} max={MAX_GENERIC_SCORE_UNIT} placeholder="직접 입력" onChange={event => { const VALUE = Number(event.target.value); if (Number.isSafeInteger(VALUE) && VALUE > 0) onUnitChange(VALUE, 'custom'); }} /></div></div>
    {ENTITIES.map((ENTITY, INDEX) => <div className="player-entry" key={ENTITY.name}><div className="p-name">{entityLabel(ENTITY)}</div><Stepper value={SCORES[INDEX]} step={UNIT} onChange={VALUE => SET_SCORES(CURRENT => CURRENT.map((SCORE, SCORE_INDEX) => SCORE_INDEX === INDEX ? VALUE : SCORE))} /></div>)}
    <button className="btn block" onClick={() => onSubmit(SCORES)}>라운드 종료</button></>;
}
