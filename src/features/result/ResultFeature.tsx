import type { GameState } from '../../shared/data/types';
import { ScoreTable } from '../score-board/ScoreTable';

export function ResultFeature({ game, onRestart, onNew }: { game: GameState; onRestart: () => void; onNew: () => void }) {
  const RANKED = [...(game.teams ?? game.players ?? [])].sort((FIRST, SECOND) => SECOND.total - FIRST.total);
  return <section className="screen active"><div className="card result-banner"><p>🏆 최종 우승</p><p className="winner">{RANKED[0]?.name}</p></div><div className="card"><h2>최종 순위</h2><ScoreTable game={game} ranked /></div><div className="footer-actions"><button className="btn" onClick={onRestart}>같은 멤버로 다시</button><button className="btn ghost" onClick={onNew}>게임 선택으로</button></div></section>;
}
