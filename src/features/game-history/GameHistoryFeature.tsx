import { useState } from 'react';
import dayjs from 'dayjs';
import { useGameHistoryDetailQuery, useHistoryQuery } from '../../shared/api/account';
import { GAME_NAME_BY_ID } from '../../shared/data/game';
import type { GameHistoryRow, Profile } from '../../shared/data/types';

export function GameHistoryFeature({ profile }: { profile: Profile | null }) {
  const [SELECTED_HISTORY, SET_SELECTED_HISTORY] = useState<GameHistoryRow | null>(null);
  const HISTORY = useHistoryQuery(Boolean(profile));
  const DETAIL = useGameHistoryDetailQuery(SELECTED_HISTORY?.room_id ?? null, Boolean(profile && SELECTED_HISTORY));
  if (!profile) return <section className="card account-page-card"><p className="empty-state">게임 기록은 계정으로 로그인한 뒤 확인할 수 있어요.</p></section>;
  return <><section className="card account-page-card"><div className="account-list standalone">
    {HISTORY.isLoading && <p className="empty-state">게임 기록을 불러오는 중…</p>}
    {HISTORY.error && <p className="empty-state">게임 기록을 불러오지 못했어요.</p>}
    {!HISTORY.isLoading && !HISTORY.error && !HISTORY.data?.length && <p className="empty-state">아직 완료된 게임 기록이 없어요.</p>}
    {(HISTORY.data ?? []).map(ITEM => <div className="history-row" key={`${ITEM.room_id}-${ITEM.display_name}`}><div><strong>{GAME_NAME_BY_ID[ITEM.game_id] ?? ITEM.game_id}</strong><small>{dayjs(ITEM.ended_at).format('YYYY.MM.DD HH:mm')}</small></div><div className="history-score-area"><div><b>{ITEM.final_score}점 · {ITEM.final_rank}등</b><button className="btn ghost small" onClick={() => SET_SELECTED_HISTORY(ITEM)}>보기</button></div>{ITEM.team_name && <span>{ITEM.team_name}</span>}</div></div>)}
  </div></section>
  {SELECTED_HISTORY && <div className="modal-overlay show" role="dialog" aria-modal="true" aria-labelledby="history-detail-title" onClick={() => SET_SELECTED_HISTORY(null)}><div className="modal-box history-detail-box" onClick={EVENT => EVENT.stopPropagation()}><div className="modal-title-row"><div><h2 id="history-detail-title">{GAME_NAME_BY_ID[SELECTED_HISTORY.game_id] ?? SELECTED_HISTORY.game_id} 최종 점수</h2><small>{dayjs(SELECTED_HISTORY.ended_at).format('YYYY.MM.DD HH:mm')}</small></div><button className="modal-close" aria-label="닫기" onClick={() => SET_SELECTED_HISTORY(null)}>×</button></div>
    {DETAIL.isLoading && <p className="empty-state">참가자 점수를 불러오는 중…</p>}
    {DETAIL.error && <p className="empty-state">참가자 점수를 불러오지 못했어요.</p>}
    {!DETAIL.isLoading && !DETAIL.error && !DETAIL.data?.length && <p className="empty-state">저장된 참가자 점수가 없어요.</p>}
    <div className="history-detail-list">{(DETAIL.data ?? []).map(PARTICIPANT => <div className={`history-detail-row rank-${PARTICIPANT.final_rank}`} key={PARTICIPANT.participant_id}><span className="history-detail-rank">{PARTICIPANT.final_rank}등</span><div><strong>{PARTICIPANT.display_name}</strong>{PARTICIPANT.team_name && <small>{PARTICIPANT.team_name}</small>}</div><b>{PARTICIPANT.final_score}점</b></div>)}</div>
  </div></div>}
  </>;
}
