import { useState } from 'react';
import { TICHU_CALL_OPTIONS } from '../../shared/data/game';
import type { GameState } from '../../shared/data/types';
import { calculateTichuTeamScore } from '../games/scoring';
import { Stepper } from './Stepper';

export function TichuEntry({ game, onSubmit }: { game: GameState; onSubmit: (scores: number[]) => void }) {
  if (game.tichuMode === 'team') return <TeamEntry game={game} onSubmit={onSubmit} />;
  return <ZhengEntry game={game} onSubmit={onSubmit} />;
}

function TeamEntry({ game, onSubmit }: { game: GameState; onSubmit: (scores: number[]) => void }) {
  const [ONE_TWO, SET_ONE_TWO] = useState<'none' | 'A' | 'B'>('none');
  const [CARD_A, SET_CARD_A] = useState(50);
  const [CALLS, SET_CALLS] = useState<Record<string, string>>({});
  const CALL_POINTS = (members: string[]) => members.reduce((SUM, MEMBER) => SUM + (TICHU_CALL_OPTIONS.find(CALL => CALL.id === CALLS[MEMBER])?.points ?? 0), 0);
  const SCORE = calculateTichuTeamScore(CARD_A, ONE_TWO, CALL_POINTS(game.teams?.[0].members ?? []), CALL_POINTS(game.teams?.[1].members ?? []));
  return <><div className="player-entry tichu-entry"><label>원투 피니시 (한 팀이 1·2등)</label><div className="chip-list one-two-chips">
    {(['none', 'A', 'B'] as const).map(OPTION => { const TEAM = OPTION === 'none' ? null : game.teams?.[OPTION === 'A' ? 0 : 1]; const OTHERS = Math.max(0, (TEAM?.members?.length ?? 1) - 1); return <button key={OPTION} className={`chip ${ONE_TWO === OPTION ? 'selected' : ''}`} onClick={() => SET_ONE_TWO(OPTION)}>{OPTION === 'none' ? '없음' : `팀 ${OPTION}`} {TEAM && <small className="team-chip-meta">({TEAM.members?.[0]}{OTHERS > 0 ? ` 외 ${OTHERS}명` : ''})</small>}</button>; })}
  </div>{ONE_TWO === 'none' && <div className="tichu-entry-section"><label>팀 A 카드 점수 (팀 B는 자동으로 100 - A)</label><Stepper value={CARD_A} min={-25} max={125} step={5} onChange={SET_CARD_A} /></div>}
    <div className="tichu-entry-section"><label>티츄 선언</label>{game.teams?.flatMap(TEAM => (TEAM.members ?? []).map(MEMBER => <div className="call-row" key={MEMBER}><span className="call-name">{MEMBER} ({TEAM.name})</span><select className="call-select" value={CALLS[MEMBER] ?? 'none'} onChange={event => SET_CALLS(CURRENT => ({ ...CURRENT, [MEMBER]: event.target.value }))}>{TICHU_CALL_OPTIONS.map(CALL => <option key={CALL.id} value={CALL.id}>{CALL.label}</option>)}</select></div>))}</div>
    <p className="preview">이번 라운드: 팀 A <b>{SCORE.a}점</b> · 팀 B <b>{SCORE.b}점</b></p></div><button className="btn block" onClick={() => onSubmit([SCORE.a, SCORE.b])}>라운드 점수 계산</button></>;
}

function ZhengEntry({ game, onSubmit }: { game: GameState; onSubmit: (scores: number[]) => void }) {
  const [FIRST, SET_FIRST] = useState(''); const [SECOND, SET_SECOND] = useState(''); const [ERROR, SET_ERROR] = useState('');
  const PLAYERS = game.players ?? [];
  const picker = (label: string, selected: string, select: (name: string) => void) => <div className="rank-picker"><label>{label}</label><div className="chip-list">{PLAYERS.map(PLAYER => <button className={`chip ${selected === PLAYER.name ? 'selected' : ''}`} key={PLAYER.name} onClick={() => select(PLAYER.name)}>{PLAYER.name}</button>)}</div></div>;
  return <><div className="player-entry">{picker('1등 (+2점)', FIRST, NAME => { SET_FIRST(NAME); if (SECOND === NAME) SET_SECOND(''); })}{picker('2등 (+1점)', SECOND, NAME => { SET_SECOND(NAME); if (FIRST === NAME) SET_FIRST(''); })}</div><p className={`error ${ERROR ? 'show' : ''}`}>{ERROR}</p><button className="btn block" onClick={() => { if (!FIRST || !SECOND) { SET_ERROR('1등과 2등을 모두 선택해주세요.'); return; } onSubmit(PLAYERS.map(PLAYER => PLAYER.name === FIRST ? 2 : PLAYER.name === SECOND ? 1 : 0)); }}>이번 판 기록</button></>;
}
