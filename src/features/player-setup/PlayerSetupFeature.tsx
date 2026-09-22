import { useMemo, useState } from 'react';
import { PRESET_PLAYER_NAMES } from '../../shared/data/game';

export interface SetupResult { names: string[]; membersA: string[]; membersB: string[]; }

export function PlayerSetupFeature({ team, min, max, starting = false, onStart, onBack }: {
  team: boolean; min: number; max: number; starting?: boolean;
  onStart: (result: SetupResult) => void; onBack: () => void;
}) {
  const [SELECTED_PRESETS, SET_SELECTED_PRESETS] = useState<string[]>([]);
  const [GUESTS, SET_GUESTS] = useState<string[]>([]);
  const [INPUT, SET_INPUT] = useState('');
  const [TEAM_A, SET_TEAM_A] = useState<string[]>([]);
  const [ERROR, SET_ERROR] = useState('');
  const NAMES = useMemo(() => [...SELECTED_PRESETS, ...GUESTS], [GUESTS, SELECTED_PRESETS]);
  const MEMBERS_A = NAMES.filter(NAME => TEAM_A.includes(NAME));
  const MEMBERS_B = NAMES.filter(NAME => !TEAM_A.includes(NAME));

  function addToSmallerTeam(name: string) {
    if (MEMBERS_A.length <= MEMBERS_B.length) SET_TEAM_A(CURRENT => [...CURRENT, name]);
  }

  function togglePreset(name: string) {
    if (SELECTED_PRESETS.includes(name)) {
      SET_SELECTED_PRESETS(CURRENT => CURRENT.filter(ITEM => ITEM !== name));
      SET_TEAM_A(CURRENT => CURRENT.filter(ITEM => ITEM !== name));
      return;
    }
    if (NAMES.length >= max) { SET_ERROR(`최대 ${max}명까지 참가할 수 있어요.`); return; }
    SET_SELECTED_PRESETS(CURRENT => [...CURRENT, name]);
    addToSmallerTeam(name);
    SET_ERROR('');
  }

  function addGuest() {
    const NAME = INPUT.trim();
    if (!NAME) { SET_ERROR('게스트 이름을 입력해주세요.'); return; }
    if (PRESET_PLAYER_NAMES.includes(NAME as typeof PRESET_PLAYER_NAMES[number]) || NAMES.includes(NAME)) { SET_ERROR('이미 있는 이름이에요. 다른 이름을 입력해주세요.'); return; }
    if (NAMES.length >= max) { SET_ERROR(`최대 ${max}명까지 참가할 수 있어요.`); return; }
    SET_GUESTS(CURRENT => [...CURRENT, NAME]);
    addToSmallerTeam(NAME);
    SET_INPUT('');
    SET_ERROR('');
  }

  function removeGuest(name: string) {
    SET_GUESTS(CURRENT => CURRENT.filter(ITEM => ITEM !== name));
    SET_TEAM_A(CURRENT => CURRENT.filter(ITEM => ITEM !== name));
  }

  function start() {
    if (NAMES.length < min || NAMES.length > max) { SET_ERROR(`${min}~${max}명의 참가자가 필요해요.`); return; }
    if (team && (!MEMBERS_A.length || !MEMBERS_B.length)) { SET_ERROR('각 팀에 최소 1명씩 있어야 해요.'); return; }
    onStart({ names: NAMES, membersA: MEMBERS_A, membersB: MEMBERS_B });
  }

  return <section className="screen active">
    <div className="card"><h2>참가 인원 선택</h2>
      <p className="field-label">고정 인원</p>
      <div className="chip-list preset-player-list">
        {PRESET_PLAYER_NAMES.map(NAME => <button key={NAME} className={`chip ${SELECTED_PRESETS.includes(NAME) ? 'selected' : ''}`} onClick={() => togglePreset(NAME)}>{NAME}</button>)}
        {GUESTS.map(NAME => <button key={NAME} className="chip selected" onClick={() => removeGuest(NAME)}>👤 {NAME} ✕</button>)}
      </div>
      <div className="guest-row participant-search-row"><input value={INPUT} maxLength={20} placeholder="게스트 이름 입력" onChange={EVENT => { SET_INPUT(EVENT.target.value); SET_ERROR(''); }} onKeyDown={EVENT => { if (EVENT.key === 'Enter') addGuest(); }} /></div>
      <button className="btn ghost block guest-add-button" disabled={!INPUT.trim()} onClick={addGuest}>👤 {INPUT.trim() ? `“${INPUT.trim()}” 게스트로 추가` : '게스트 이름을 입력해 추가'}</button>
      <p className={`error ${ERROR ? 'show' : ''}`}>{ERROR}</p>
    </div>
    {team && <div className="card"><h2>팀 나누기</h2><div className="team-cols">
      {[['팀 A', MEMBERS_A], ['팀 B', MEMBERS_B]].map(([LABEL, MEMBERS]) => <div className="team-box" key={LABEL as string}><h3>{LABEL}</h3>{(MEMBERS as string[]).map(NAME => <button key={NAME} className="chip selected" onClick={() => SET_TEAM_A(CURRENT => CURRENT.includes(NAME) ? CURRENT.filter(ITEM => ITEM !== NAME) : [...CURRENT, NAME])}>{NAME}</button>)}</div>)}
    </div><p className="hint">이름을 누르면 반대 팀으로 이동해요.</p></div>}
    <button className="btn block" disabled={starting} onClick={start}>{starting ? '게임을 시작하는 중…' : '게임 시작'}</button><button className="btn ghost block" disabled={starting} onClick={onBack}>← 이전</button>
  </section>;
}
