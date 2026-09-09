export function ModeSelectFeature({ generic, onSelect, onBack }: { generic: boolean; onSelect: (mode: 'all' | 'me') => void; onBack: () => void }) {
  return <section className="screen active"><div className="mode-buttons">
    <button className="mode-btn" onClick={() => onSelect('all')}>{generic ? '팀' : '모두'}<small>{generic ? '참가자를 등록하고 두 팀으로 기록' : '여럿이서 함께 점수 계산'}</small></button>
    <button className="mode-btn" onClick={() => onSelect('me')}>나<small>내 점수만 기록</small></button>
  </div><button className="btn ghost block" onClick={onBack}>← 게임 선택</button></section>;
}

