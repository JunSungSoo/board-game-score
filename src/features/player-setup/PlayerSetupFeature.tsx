import { useMemo, useState } from 'react';
import { PRESET_PLAYER_NAMES } from '../../shared/data/game';

export interface SetupResult { names: string[]; membersA: string[]; membersB: string[]; }

export function PlayerSetupFeature({ guestOnly, team, min, max, onStart, onBack }: {
  guestOnly: boolean; team: boolean; min: number; max: number;
  onStart: (result: SetupResult) => void; onBack: () => void;
}) {
  const [SELECTED, SET_SELECTED] = useState<string[]>([]);
  const [GUESTS, SET_GUESTS] = useState<string[]>([]);
  const [INPUT, SET_INPUT] = useState('');
  const [TEAM_A, SET_TEAM_A] = useState<string[]>([]);
  const [ERROR, SET_ERROR] = useState('');
  const NAMES = useMemo(() => [...SELECTED, ...GUESTS], [SELECTED, GUESTS]);
  const MEMBERS_A = NAMES.filter(NAME => TEAM_A.includes(NAME));
  const MEMBERS_B = NAMES.filter(NAME => !TEAM_A.includes(NAME));

  function addName() {
    const NAME = INPUT.trim();
    if (!NAME || NAMES.includes(NAME) || PRESET_PLAYER_NAMES.includes(NAME as never)) { SET_ERROR('비어 있거나 이미 있는 이름이에요.'); return; }
    if (NAMES.length >= max) { SET_ERROR(`최대 ${max}명까지 참가할 수 있어요.`); return; }
    SET_GUESTS(CURRENT => [...CURRENT, NAME]);
    SET_TEAM_A(CURRENT => MEMBERS_A.length <= MEMBERS_B.length ? [...CURRENT, NAME] : CURRENT);
    SET_INPUT(''); SET_ERROR('');
  }

  function togglePreset(name: string) {
    SET_SELECTED(CURRENT => CURRENT.includes(name) ? CURRENT.filter(ITEM => ITEM !== name) : [...CURRENT, name]);
    if (!NAMES.includes(name) && MEMBERS_A.length <= MEMBERS_B.length) SET_TEAM_A(CURRENT => [...CURRENT, name]);
    else SET_TEAM_A(CURRENT => CURRENT.filter(ITEM => ITEM !== name));
  }

  function start() {
    if (NAMES.length < min || NAMES.length > max) { SET_ERROR(`${min}~${max}명의 참가자가 필요해요.`); return; }
    if (team && (!MEMBERS_A.length || !MEMBERS_B.length)) { SET_ERROR('각 팀에 최소 1명씩 있어야 해요.'); return; }
    onStart({ names: NAMES, membersA: MEMBERS_A, membersB: MEMBERS_B });
  }

  return <section className="screen active">
    <div className="card"><h2>{guestOnly ? '참가 인원 등록' : '참가 인원 선택'}</h2>
      <div className="chip-list">
        {!guestOnly && PRESET_PLAYER_NAMES.map(NAME => <button key={NAME} className={`chip ${SELECTED.includes(NAME) ? 'selected' : ''}`} onClick={() => togglePreset(NAME)}>{NAME}</button>)}
        {GUESTS.map(NAME => <button key={NAME} className="chip selected" onClick={() => { SET_GUESTS(CURRENT => CURRENT.filter(ITEM => ITEM !== NAME)); SET_TEAM_A(CURRENT => CURRENT.filter(ITEM => ITEM !== NAME)); }}>👤 {NAME} ✕</button>)}
      </div>
      <div className="guest-row"><input value={INPUT} maxLength={20} placeholder="참가자 이름 입력" onChange={event => SET_INPUT(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') addName(); }} /><button className="btn" onClick={addName}>추가</button></div>
      <p className={`error ${ERROR ? 'show' : ''}`}>{ERROR}</p>
    </div>
    {team && <div className="card"><h2>팀 나누기</h2><div className="team-cols">
      {[['팀 A', MEMBERS_A], ['팀 B', MEMBERS_B]].map(([LABEL, MEMBERS]) => <div className="team-box" key={LABEL as string}><h3>{LABEL}</h3>{(MEMBERS as string[]).map(NAME => <button key={NAME} className="chip selected" onClick={() => SET_TEAM_A(CURRENT => CURRENT.includes(NAME) ? CURRENT.filter(ITEM => ITEM !== NAME) : [...CURRENT, NAME])}>{NAME}</button>)}</div>)}
    </div><p className="hint">이름을 누르면 반대 팀으로 이동해요.</p></div>}
    <button className="btn block" onClick={start}>게임 시작</button><button className="btn ghost block" onClick={onBack}>← 이전</button>
  </section>;
}
