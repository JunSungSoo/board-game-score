import { useState, type ReactNode } from 'react';
import type { GameId } from '../../shared/data/types';
import { useFloatingPanels, type FloatingKey } from './hooks/useFloatingPanels';

const SCORE_CONTENT = <ul><li>비드를 정확히 맞추면 <b>획득 트릭 × 20점</b></li><li>못 맞추면 <b>차이 나는 트릭당 -10점</b></li><li>0 비드 성공 <b>라운드 × +10점</b> / 실패 <b>라운드 × -10점</b></li><li>보너스는 비드 성공 시에만 적용</li><li><b className="rule-pirate">해적</b>으로 <b className="rule-mermaid">인어</b> 포획: <b>장당 +20점</b></li><li><b className="rule-skullking">스컬킹</b>으로 <b className="rule-pirate">해적</b> 포획: <b>장당 +30점</b></li><li><b className="rule-mermaid">인어</b>로 <b className="rule-skullking">스컬킹</b> 포획: <b>+40점</b></li></ul>;
const PIRATE_CONTENT = <ul className="pirate-abilities"><li><b>로지 드레이니</b><br/>한 명을 골라 다음 트릭을 선도하게 해요.</li><li><b>강도 바히즈</b><br/>카드 2장을 가져온 뒤 손에서 2장을 버려요.</li><li><b>로아탄의 라스칼</b><br/>비드 성공에 10점 또는 20점을 걸며 실패하면 잃어요.</li><li><b>후아니타 하데</b><br/>나눠주지 않은 카드를 혼자 확인해요.</li><li><b>거인 해리</b><br/>비드를 +1, -1 또는 그대로 유지해요.</li></ul>;

export function GameRulesFeature({ gameId }: { gameId: GameId }) {
  const FLOATING = useFloatingPanels();
  if (gameId === 'generic') return null;
  if (gameId === 'tichu') return <><details className="rules" open><summary>📖 티츄 점수 규칙 보기</summary><ul><li>5는 5점, 10과 K는 10점, 용 +25점, 봉황 -25점</li><li>원투 피니시는 팀 +200점</li><li>스몰 티츄 ±100점, 라지 티츄 ±200점</li><li>팀전 1000점, 쟁상유 11점 선착</li></ul></details><details className="rules" open><summary>🀄 티츄 특수 카드 보기</summary><ul><li><b>1 카드(참새·마작)</b><br/>첫 트릭을 시작하고 숫자 소원을 선언할 수 있어요.</li><li><b>개 카드</b><br/>트릭 시작 권한을 파트너에게 넘겨요.</li><li><b>봉황</b><br/>와일드 카드이며 -25점이에요.</li><li><b>용</b><br/>가장 강한 단일 카드이며 +25점, 획득 트릭을 상대에게 줘요.</li></ul></details></>;
  return <>
    {!FLOATING.OPEN_KEYS.includes('score') && <RuleSection title="📖 스컬킹 점수 규칙 보기" content={SCORE_CONTENT} onFloat={() => FLOATING.show('score')} />}
    {!FLOATING.OPEN_KEYS.includes('pirate') && <RuleSection title="🏴‍☠️ 스컬킹 해적별 고유 능력 보기" content={PIRATE_CONTENT} onFloat={() => FLOATING.show('pirate')} />}
    <details className="rules" open><summary>🪙 크라켄·흰고래·약탈품 특수 카드 보기</summary><ul><li><b>크라켄</b><br/>해당 트릭은 승자가 없고 카드는 아무도 가져가지 않아요.</li><li><b>흰고래</b><br/>특수 카드는 탈출처럼 취급하고 가장 높은 숫자 카드가 승리해요.</li><li><b>약탈품</b><ul><li>약탈품을 낸 사람과 트릭 획득자가 동맹을 맺어요.</li><li>둘 다 비드를 맞히면 각각 +20점, 한 명이라도 실패하면 받지 못해요.</li></ul></li></ul></details>
    {FLOATING.OPEN_KEYS.map(KEY => <FloatingPanel key={KEY} panelKey={KEY} title={KEY === 'score' ? '📖 점수 규칙' : '🏴‍☠️ 해적별 능력'} content={KEY === 'score' ? SCORE_CONTENT : PIRATE_CONTENT} position={FLOATING.POSITIONS[KEY]} focused={FLOATING.FOCUSED_KEY === KEY || FLOATING.PAIRED} onFocus={() => FLOATING.show(KEY)} onDrag={FLOATING.beginDrag} onHide={FLOATING.hide} />)}
  </>;
}

function RuleSection({ title, content, onFloat }: { title: string; content: ReactNode; onFloat: () => void }) {
  return <details className="rules" open><summary className="floating-summary"><span>{title}</span><button className="rule-float-btn" type="button" onClick={event => { event.preventDefault(); onFloat(); }}>플로팅</button></summary>{content}</details>;
}

function FloatingPanel({ panelKey, title, content, position, focused, onFocus, onDrag, onHide }: { panelKey: FloatingKey; title: string; content: ReactNode; position: { x: number; y: number }; focused: boolean; onFocus: () => void; onDrag: (key: FloatingKey, event: React.PointerEvent<HTMLElement>) => void; onHide: (key: FloatingKey) => void }) {
  const [EXPANDED, SET_EXPANDED] = useState(true);
  return <aside data-floating-panel={panelKey} className={`floating-panel paired ${focused ? 'focused' : ''}`} style={{ display: 'block', left: position.x, top: position.y }} onPointerDown={onFocus}><div className="floating-header" onPointerDown={event => onDrag(panelKey, event)}><strong>{title}</strong><div className="floating-actions"><button onPointerDown={event => event.stopPropagation()} onClick={() => SET_EXPANDED(CURRENT => !CURRENT)}>{EXPANDED ? '접기' : '펼치기'}</button><button onPointerDown={event => event.stopPropagation()} onClick={() => onHide(panelKey)}>숨기기</button></div></div>{EXPANDED && <div className="floating-body">{content}</div>}</aside>;
}
