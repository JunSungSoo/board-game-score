export function TichuModeSelectFeature({ onSelect, onBack }: { onSelect: (mode: 'together' | 'single') => void; onBack: () => void }) {
  return <section className="screen active"><div className="mode-buttons">
    <button className="mode-btn" onClick={() => onSelect('together')}>팀전<small>두 팀으로 나누어 1000점까지 기록</small></button>
    <button className="mode-btn" onClick={() => onSelect('single')}>쟁상유<small>개인별 순위를 11점까지 기록</small></button>
  </div><button className="btn ghost block" onClick={onBack}>← 게임 선택</button></section>;
}
