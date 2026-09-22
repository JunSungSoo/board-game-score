import { useState } from 'react';
import { TICHU_CALL_OPTIONS } from '../../shared/data/game';
import type { GameState } from '../../shared/data/types';
import { calculateTichuTeamScore } from '../games/scoring';
import { Stepper } from './Stepper';

export function TichuEntry({ game, onSubmit }: { game: GameState; onSubmit: (scores: number[]) => void }) {
  if (game.tichuMode === 'team') return <TeamEntry game={game} onSubmit={onSubmit} />;
  return <ZhengEntry onSubmit={onSubmit} />;
}

function TeamEntry({ game, onSubmit }: { game: GameState; onSubmit: (scores: number[]) => void }) {
  const [ONE_TWO, SET_ONE_TWO] = useState<'none' | 'A' | 'B'>('none');
  const [CARD_A, SET_CARD_A] = useState(0);
  const [CALLS, SET_CALLS] = useState<Record<string, string>>({});
  const CALL_POINTS = (members: string[]) => members.reduce((SUM, MEMBER) => SUM + (TICHU_CALL_OPTIONS.find(CALL => CALL.id === CALLS[MEMBER])?.points ?? 0), 0);
  const SCORE = calculateTichuTeamScore(CARD_A, ONE_TWO, CALL_POINTS(game.teams?.[0].members ?? []), CALL_POINTS(game.teams?.[1].members ?? []));
  return <><div className="player-entry tichu-entry"><label>원투 피니시 (한 팀이 1·2등)</label><div className="chip-list one-two-chips">
    {(['none', 'A', 'B'] as const).map(OPTION => { const TEAM = OPTION === 'none' ? null : game.teams?.[OPTION === 'A' ? 0 : 1]; const OTHERS = Math.max(0, (TEAM?.members?.length ?? 1) - 1); return <button key={OPTION} className={`chip ${ONE_TWO === OPTION ? 'selected' : ''}`} onClick={() => SET_ONE_TWO(OPTION)}>{OPTION === 'none' ? '없음' : `팀 ${OPTION}`} {TEAM && <small className="team-chip-meta">({TEAM.members?.[0]}{OTHERS > 0 ? ` 외 ${OTHERS}명` : ''})</small>}</button>; })}
  </div>{ONE_TWO === 'none' && <div className="tichu-entry-section"><label>팀 A 카드 점수 (팀 B는 자동으로 100 - A)</label><Stepper value={CARD_A} min={-25} max={125} step={5} onChange={SET_CARD_A} /></div>}
    <div className="tichu-entry-section"><label>티츄 선언</label>{game.teams?.flatMap(TEAM => (TEAM.members ?? []).map(MEMBER => <div className="call-row" key={MEMBER}><span className="call-name">{MEMBER} ({TEAM.name})</span><select className="call-select" value={CALLS[MEMBER] ?? 'none'} onChange={event => SET_CALLS(CURRENT => ({ ...CURRENT, [MEMBER]: event.target.value }))}>{TICHU_CALL_OPTIONS.map(CALL => <option key={CALL.id} value={CALL.id}>{CALL.label}</option>)}</select></div>))}</div>
    <p className="preview">이번 라운드: 팀 A <b>{SCORE.a}점</b> · 팀 B <b>{SCORE.b}점</b></p></div><button className="btn block" onClick={() => { onSubmit([SCORE.a, SCORE.b]); SET_ONE_TWO('none'); SET_CARD_A(0); SET_CALLS({}); }}>라운드 점수 계산</button></>;
}

function ZhengEntry({ onSubmit }: { onSubmit: (scores: number[]) => void }) {
  const [SCORE, SET_SCORE] = useState<number | null>(null);
  const [ERROR, SET_ERROR] = useState('');
  const OPTIONS = [{ label: '1등 (+2점)', score: 2 }, { label: '2등 (+1점)', score: 1 }, { label: '그 외 (0점)', score: 0 }];
  return <><div className="player-entry"><div className="rank-picker"><label>이번 판 나의 순위</label><div className="chip-list">{OPTIONS.map(OPTION => <button className={`chip ${SCORE === OPTION.score ? 'selected' : ''}`} key={OPTION.score} onClick={() => { SET_SCORE(OPTION.score); SET_ERROR(''); }}>{OPTION.label}</button>)}</div></div></div><p className={`error ${ERROR ? 'show' : ''}`}>{ERROR}</p><button className="btn block" onClick={() => { if (SCORE === null) { SET_ERROR('나의 순위를 선택해주세요.'); return; } onSubmit([SCORE]); SET_SCORE(null); SET_ERROR(''); }}>이번 판 기록</button></>;
}
