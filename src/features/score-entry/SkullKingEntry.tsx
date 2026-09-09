import { useEffect, useState } from 'react';
import { SKULL_KING_BONUS_LIMIT, SKULL_KING_BONUS_STEP } from '../../shared/data/game';
import type { GameState } from '../../shared/data/types';
import { calculateSkullkingScore, remainingTricks } from '../games/scoring';
import { Stepper } from './Stepper';

interface Draft { bid: number; tricks: number; bonus: number; }
export function SkullKingEntry({ game, onSubmit }: { game: GameState; onSubmit: (scores: number[]) => void }) {
  const PLAYERS = game.players ?? [];
  const [DRAFTS, SET_DRAFTS] = useState<Draft[]>([]);
  const [ERROR, SET_ERROR] = useState('');
  useEffect(() => SET_DRAFTS(PLAYERS.map(() => ({ bid: 0, tricks: 0, bonus: 0 }))), [game.round, PLAYERS.length]);
  const USED_TRICKS = DRAFTS.reduce((SUM, DRAFT) => SUM + DRAFT.tricks, 0);
  function update(index: number, value: Partial<Draft>) { SET_DRAFTS(CURRENT => CURRENT.map((DRAFT, DRAFT_INDEX) => DRAFT_INDEX === index ? { ...DRAFT, ...value } : DRAFT)); }
  function submit() {
    if (game.mode === 'all' && USED_TRICKS !== game.round) { SET_ERROR(`전체 획득 트릭 합계(${USED_TRICKS})가 이번 라운드 트릭 수(${game.round})와 달라요.`); return; }
    onSubmit(DRAFTS.map(DRAFT => calculateSkullkingScore(game.round, DRAFT.bid, DRAFT.tricks, DRAFT.bonus).total));
  }
  return <>
    {game.mode === 'all' && <p className="shared-trick-limit">전체 남은 획득 트릭: <b>{remainingTricks(game.round, DRAFTS.map(DRAFT => DRAFT.tricks))}</b> / {game.round}</p>}
    {PLAYERS.map((PLAYER, INDEX) => { const DRAFT = DRAFTS[INDEX] ?? { bid: 0, tricks: 0, bonus: 0 }; const SCORE = calculateSkullkingScore(game.round, DRAFT.bid, DRAFT.tricks, DRAFT.bonus); return <div className="player-entry" key={PLAYER.name}>
      <div className="p-name">{PLAYER.name}</div><div className="entry-grid">
        <label>비드<Stepper value={DRAFT.bid} min={0} max={game.round} onChange={bid => update(INDEX, { bid })} /></label>
        <label>획득 트릭<Stepper value={DRAFT.tricks} min={0} max={game.mode === 'all' ? DRAFT.tricks + Math.max(0, game.round - USED_TRICKS) : game.round} onChange={tricks => update(INDEX, { tricks })} /></label>
        <label className="bonus-field">보너스 점수<Stepper value={DRAFT.bonus} min={-SKULL_KING_BONUS_LIMIT} max={SKULL_KING_BONUS_LIMIT} step={SKULL_KING_BONUS_STEP} onChange={bonus => update(INDEX, { bonus })} /></label>
      </div><p className="bonus-note">비드 성공 시만 반영되며 음수 입력도 가능해요.</p><p className="preview">이번 라운드: <b className={SCORE.total >= 0 ? 'pos' : 'neg'}>{SCORE.total > 0 ? '+' : ''}{SCORE.total}점</b></p>
    </div>; })}
    <p className={`error ${ERROR ? 'show' : ''}`}>{ERROR}</p><button className="btn block" onClick={submit}>라운드 점수 계산</button>
  </>;
}

