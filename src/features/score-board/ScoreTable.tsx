import type { GameState, ScoreEntity } from '../../shared/data/types';

export function entityLabel(entity: ScoreEntity) {
  return entity.members?.length ? `${entity.name} (${entity.members.join('·')})` : entity.name;
}

export function ScoreTable({ game, ranked = false }: { game: GameState; ranked?: boolean }) {
  const ENTITIES = game.teams ?? game.players ?? [];
  const ROWS = ranked ? [...ENTITIES].sort((FIRST, SECOND) => SECOND.total - FIRST.total) : ENTITIES;
  const ROUND_COUNT = ENTITIES[0]?.rounds.length ?? 0;
  return <div className="score-scroll"><table className={`score-board ${ranked && game.gameId === 'skullking' ? 'skullking-ranking' : ''}`}><thead><tr>
    <th>{ranked ? '순위' : ''}</th><th>이름</th>
    {Array.from({ length: ROUND_COUNT }, (_, INDEX) => <th key={INDEX}>R{INDEX + 1}{game.roundLabels?.[INDEX] !== undefined && game.roundLabels[INDEX] !== INDEX + 1 ? `(${game.roundLabels[INDEX]})` : ''}</th>)}<th>합계</th>
  </tr></thead><tbody>{ROWS.map((ENTITY, INDEX) => <tr key={ENTITY.name} className={ranked && INDEX === 0 ? 'rank-1' : ''}>
    <td>{ranked ? (game.gameId === 'skullking' && INDEX < 3 ? <span className={`rank-medal rank-medal-${INDEX + 1}`}><span className="rank-crown">♛</span>{INDEX + 1}등</span> : `${INDEX + 1}등`) : ''}</td>
    <td className="name">{entityLabel(ENTITY)}</td>{ENTITY.rounds.map((SCORE, ROUND) => <td key={ROUND}>{SCORE}</td>)}<td className={ENTITY.total >= 0 ? 'total-pos' : 'total-neg'}>{ENTITY.total}</td>
  </tr>)}</tbody></table></div>;
}

