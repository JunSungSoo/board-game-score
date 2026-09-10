import { useRankingsQuery } from '../../shared/api/account';
import type { Profile } from '../../shared/data/types';

export function RankingFeature({ profile }: { profile: Profile | null }) {
  const RANKINGS = useRankingsQuery(Boolean(profile));
  if (!profile) return <section className="card account-page-card"><p className="empty-state">랭킹은 계정으로 로그인한 뒤 확인할 수 있어요.</p></section>;
  return <section className="card account-page-card"><div className="account-list standalone">
    {RANKINGS.isLoading && <p className="empty-state">랭킹을 불러오는 중…</p>}
    {RANKINGS.error && <p className="empty-state">랭킹을 불러오지 못했어요.</p>}
    {!RANKINGS.isLoading && !RANKINGS.error && !RANKINGS.data?.length && <p className="empty-state">아직 집계된 게임 기록이 없어요.</p>}
    {(RANKINGS.data ?? []).map((ITEM, INDEX) => { const LOSSES = ITEM.games - ITEM.wins; return <div className={`ranking-row ranking-position-${INDEX + 1}`} key={ITEM.user_id}><span className="ranking-number">{INDEX + 1}</span><div><strong>{ITEM.display_name}</strong><small>@{ITEM.login_id} · {ITEM.games}게임</small></div><div className="ranking-record">{ITEM.wins > 0 && <b>{ITEM.wins}승</b>}{LOSSES > 0 && <span>{LOSSES}패</span>}</div></div>; })}
  </div></section>;
}
