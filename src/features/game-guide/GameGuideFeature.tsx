import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameGuidesQuery } from '../../shared/api/game-guides';
import { APP_ROUTES } from '../../shared/data/routes';
import type { GameGuideRow } from '../../shared/data/types';
import { LoadingScreen } from '../../shared/ui/LoadingScreen';

const NORMALIZE = (value: string) => value.toLocaleLowerCase('ko').replace(/\s+/g, '');

export function GameGuideFeature() {
  const GUIDES = useGameGuidesQuery();
  const NAVIGATE = useNavigate();
  const { slug, versionKey } = useParams();
  const [QUERY, SET_QUERY] = useState('');
  const GROUPS = useMemo(() => {
    const MAP = new Map<string, GameGuideRow[]>();
    for (const GUIDE of GUIDES.data ?? []) MAP.set(GUIDE.slug, [...(MAP.get(GUIDE.slug) ?? []), GUIDE]);
    return [...MAP.values()];
  }, [GUIDES.data]);

  if (GUIDES.isLoading) return <LoadingScreen />;
  if (GUIDES.error) return <section className="card account-page-card"><p className="empty-state">보드게임 설명서를 불러오지 못했어요.</p></section>;

  if (!slug) {
    const TERM = NORMALIZE(QUERY);
    const FILTERED = GROUPS.filter(VERSIONS => {
      const GUIDE = VERSIONS[0];
      return !TERM || [GUIDE.title_ko, GUIDE.title_en, ...GUIDE.aliases].some(NAME => NORMALIZE(NAME).includes(TERM));
    });
    return <section className="game-guide-list">
      <div className="card game-guide-search"><label htmlFor="game-guide-query">보드게임 이름 검색</label><input id="game-guide-query" value={QUERY} onChange={EVENT => SET_QUERY(EVENT.target.value)} placeholder="예: 스컬킹, 러브레터" autoComplete="off" /></div>
      <div className="game-guide-results">{FILTERED.map(VERSIONS => { const GUIDE = VERSIONS[0]; return <button className="game-guide-card" key={GUIDE.slug} onClick={() => NAVIGATE(`${APP_ROUTES.GAME_GUIDE}/${GUIDE.slug}`)}><span><strong>{GUIDE.title_ko}</strong><small>{GUIDE.title_en} · {GUIDE.player_count} · {GUIDE.play_time}</small></span><span className="game-guide-arrow">›</span></button>; })}</div>
      {!FILTERED.length && <div className="card"><p className="empty-state">일치하는 게임이 없어요.</p></div>}
    </section>;
  }

  const VERSIONS = GROUPS.find(ITEMS => ITEMS[0]?.slug === slug);
  if (!VERSIONS) return <section className="card account-page-card"><p className="empty-state">등록되지 않은 게임이에요.</p><button className="btn ghost block" onClick={() => NAVIGATE(APP_ROUTES.GAME_GUIDE)}>목록으로</button></section>;
  if (VERSIONS.length > 1 && !versionKey) return <section className="game-guide-detail"><button className="btn ghost game-guide-back" onClick={() => NAVIGATE(APP_ROUTES.GAME_GUIDE)}>← 게임 목록</button><div className="card"><h2>{VERSIONS[0].title_ko}</h2><p className="hint">사용 중인 카드 구성과 일치하는 판본을 선택하세요.</p><div className="edition-options">{VERSIONS.map(GUIDE => <button className="game-guide-card" key={GUIDE.version_key} onClick={() => NAVIGATE(`${APP_ROUTES.GAME_GUIDE}/${GUIDE.slug}/${GUIDE.version_key}`)}><span><strong>{GUIDE.edition_label}</strong><small>{GUIDE.player_count} · {GUIDE.play_time}</small></span><span className="game-guide-arrow">›</span></button>)}</div></div></section>;

  const GUIDE = versionKey ? VERSIONS.find(ITEM => ITEM.version_key === versionKey) : VERSIONS[0];
  if (!GUIDE) return <section className="card account-page-card"><p className="empty-state">등록되지 않은 판본이에요.</p><button className="btn ghost block" onClick={() => NAVIGATE(`${APP_ROUTES.GAME_GUIDE}/${slug}`)}>판본 선택으로</button></section>;
  return <GuideDetail guide={GUIDE} multiVersion={VERSIONS.length > 1} onBack={() => NAVIGATE(VERSIONS.length > 1 ? `${APP_ROUTES.GAME_GUIDE}/${slug}` : APP_ROUTES.GAME_GUIDE)} />;
}

function GuideDetail({ guide, multiVersion, onBack }: { guide: GameGuideRow; multiVersion: boolean; onBack: () => void }) {
  return <section className="game-guide-detail"><button className="btn ghost game-guide-back" onClick={onBack}>← {multiVersion ? '판본 선택' : '게임 목록'}</button>
    <article className="card game-guide-article"><div className="game-guide-title"><div><h2>{guide.title_ko}</h2><p>{guide.title_en}</p></div><span>{guide.edition_label}</span></div><div className="game-guide-meta"><span>👥 {guide.player_count}</span><span>⏱ {guide.play_time}</span></div>
      <GuideSection title="목표" text={guide.goal} />
      <GuideList title="준비" items={guide.setup} />
      <GuideList title="진행" items={guide.gameplay} />
      {(guide.special_rules ?? []).length > 0 && <GuideList title="카드·역할별 효과" items={guide.special_rules ?? []} />}
      {(guide.pirate_abilities ?? []).length > 0 && <GuideList title="해적별 고유 능력" items={guide.pirate_abilities ?? []} />}
      <GuideList title="점수" items={guide.scoring} />
      <GuideSection title="게임 종료" text={guide.end_condition} />
      <a className="game-guide-source" href={guide.source_url} target="_blank" rel="noreferrer">출처: {guide.source_name} ↗</a>
    </article>
  </section>;
}

function GuideSection({ title, text }: { title: string; text: string }) {
  return <section className="game-guide-section"><h3>{title}</h3><p>{text}</p></section>;
}

function GuideList({ title, items }: { title: string; items: string[] }) {
  return <section className="game-guide-section"><h3>{title}</h3><ul>{items.map(ITEM => {
    const SEPARATOR = ITEM.indexOf(':');
    if (SEPARATOR < 0) return <li key={ITEM}>{ITEM}</li>;
    return <li key={ITEM}><strong>{ITEM.slice(0, SEPARATOR)}</strong>{ITEM.slice(SEPARATOR)}</li>;
  })}</ul></section>;
}
