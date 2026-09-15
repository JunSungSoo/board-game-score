import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useGameGuidesQuery } from '../../shared/api/game-guides';
import type { GameGuideRow } from '../../shared/data/types';
import { GameGuideFeature } from './GameGuideFeature';

vi.mock('../../shared/api/game-guides', () => ({ useGameGuidesQuery: vi.fn() }));

const BASE: GameGuideRow = {
  id: 1, slug: 'love-letter', version_key: 'classic-2012', title_ko: '러브레터', title_en: 'Love Letter', aliases: ['러브 레터'], edition_label: '클래식 구성 · 2012', release_year: 2012, player_count: '2~4명', play_time: '약 20분', goal: '목표', setup: ['준비'], gameplay: ['진행'], special_rules: ['근위병: 상대 카드를 맞히면 탈락시킵니다.'], pirate_abilities: [], scoring: ['점수'], end_condition: '종료', source_name: '공식 규칙', source_url: 'https://example.com', sort_order: 20,
};
const GUIDES = [BASE, { ...BASE, id: 2, version_key: 'expanded-2019', edition_label: '확장 구성 · 2019 이후', release_year: 2019 }];
const SKULL_KING: GameGuideRow = {
  ...BASE,
  id: 3,
  slug: 'skull-king',
  version_key: 'ko-current',
  title_ko: '스컬킹',
  title_en: 'Skull King',
  aliases: ['스컬 킹'],
  edition_label: '한국어판',
  special_rules: ['탈출: 가장 약한 카드입니다.'],
  pirate_abilities: ['로지 드레이니: 트릭 승자가 다음 트릭의 선도자를 지정합니다.'],
};

afterEach(cleanup);

function renderAt(path: string, guides = GUIDES) {
  vi.mocked(useGameGuidesQuery).mockReturnValue({ data: guides, isLoading: false, error: null } as ReturnType<typeof useGameGuidesQuery>);
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/game-guide" element={<GameGuideFeature/>}/><Route path="/game-guide/:slug" element={<GameGuideFeature/>}/><Route path="/game-guide/:slug/:versionKey" element={<GameGuideFeature/>}/></Routes></MemoryRouter>);
}

it('searches games by a registered alias', async () => {
  renderAt('/game-guide');
  await userEvent.type(screen.getByLabelText('보드게임 이름 검색'), '러브 레터');
  expect(screen.getByRole('button', { name: /러브레터/ })).toBeInTheDocument();
});

it('asks for an edition before showing a game with multiple versions', async () => {
  renderAt('/game-guide/love-letter');
  expect(screen.getByRole('button', { name: /클래식 구성 · 2012/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /확장 구성 · 2019 이후/ })).toBeInTheDocument();
  expect(screen.queryByText('게임 종료')).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /확장 구성 · 2019 이후/ }));
  expect(screen.getByText('게임 종료')).toBeInTheDocument();
  expect(screen.getByText('카드·역할별 효과')).toBeInTheDocument();
});

it('shows named pirate abilities separately from Skull King special cards', () => {
  renderAt('/game-guide/skull-king', [SKULL_KING]);

  expect(screen.getByRole('heading', { name: '카드·역할별 효과' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '해적별 고유 능력' })).toBeInTheDocument();
  expect(screen.getByText(/로지 드레이니/)).toBeInTheDocument();
});
