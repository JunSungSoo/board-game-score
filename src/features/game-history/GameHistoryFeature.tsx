import dayjs from 'dayjs';
import { useHistoryQuery } from '../../shared/api/account';
import { GAME_NAME_BY_ID } from '../../shared/data/game';
import type { Profile } from '../../shared/data/types';

export function GameHistoryFeature({ profile }: { profile: Profile | null }) {
  const HISTORY = useHistoryQuery(Boolean(profile));
  if (!profile) return <section className="card account-page-card"><p className="empty-state">게임 기록은 계정으로 로그인한 뒤 확인할 수 있어요.</p></section>;
  return <section className="card account-page-card"><div className="account-list standalone">
    {HISTORY.isLoading && <p className="empty-state">게임 기록을 불러오는 중…</p>}
    {HISTORY.error && <p className="empty-state">게임 기록을 불러오지 못했어요.</p>}
    {!HISTORY.isLoading && !HISTORY.error && !HISTORY.data?.length && <p className="empty-state">아직 완료된 게임 기록이 없어요.</p>}
    {(HISTORY.data ?? []).map(ITEM => <div className="history-row" key={`${ITEM.room_id}-${ITEM.display_name}`}><div><strong>{GAME_NAME_BY_ID[ITEM.game_id] ?? ITEM.game_id}</strong><small>{dayjs(ITEM.ended_at).format('YYYY.MM.DD HH:mm')}</small></div><div><b>{ITEM.final_score}점 · {ITEM.final_rank}등</b>{ITEM.team_name && <span>{ITEM.team_name}</span>}</div></div>)}
  </div></section>;
}
