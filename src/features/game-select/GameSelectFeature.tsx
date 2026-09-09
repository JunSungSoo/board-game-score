import { GAME_OPTIONS } from '../../shared/data/game';

export function GameSelectFeature({ onSelect }: { onSelect: (id: string) => void }) {
  return <section className="screen active"><div className="card"><h2>게임 선택</h2><div className="mode-buttons">
    {GAME_OPTIONS.map(GAME => <button className="mode-btn" key={GAME.id} onClick={() => onSelect(GAME.id)}>{GAME.label}<small>{GAME.description}</small></button>)}
  </div></div></section>;
}

