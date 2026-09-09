import { useEffect, useState } from 'react';
import type { GameState } from '../../shared/data/types';

export function EditRoundsModal({ game, open, onClose, onSave }: { game: GameState; open: boolean; onClose: () => void; onSave: (scores: number[][]) => void }) {
  const ENTITIES = game.teams ?? game.players ?? [];
  const [VALUES, SET_VALUES] = useState<number[][]>([]);
  useEffect(() => { if (open) SET_VALUES(ENTITIES.map(ENTITY => [...ENTITY.rounds])); }, [open]);
  if (!open) return null;
  return <div className="modal-overlay show" role="dialog" aria-modal="true"><div className="modal-box edit-rounds-box">
    <h2>이전 라운드 점수 수정</h2><p className="sub">수정하면 누적 점수도 다시 계산돼요.</p>
    <div className="round-edit-scroll"><table className="round-edit-table"><thead><tr><th>이름</th>{Array.from({ length: VALUES[0]?.length ?? 0 }, (_, INDEX) => <th key={INDEX}>R{INDEX + 1}</th>)}</tr></thead><tbody>
      {ENTITIES.map((ENTITY, ENTITY_INDEX) => <tr key={ENTITY.name}><th>{ENTITY.name}</th>{VALUES[ENTITY_INDEX]?.map((VALUE, ROUND_INDEX) => <td key={ROUND_INDEX}><input type="number" value={VALUE} onChange={event => SET_VALUES(CURRENT => CURRENT.map((ROW, ROW_INDEX) => ROW_INDEX === ENTITY_INDEX ? ROW.map((CELL, CELL_INDEX) => CELL_INDEX === ROUND_INDEX ? Number(event.target.value) : CELL) : ROW))} /></td>)}</tr>)}
    </tbody></table></div><div className="modal-actions"><button className="btn ghost" onClick={onClose}>취소</button><button className="btn" onClick={() => onSave(VALUES)}>수정</button></div>
  </div></div>;
}

