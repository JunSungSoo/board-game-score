import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GameGuideFeature } from './GameGuideFeature';

afterEach(cleanup);

function renderAt(path: string) {
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
  renderAt('/game-guide/skull-king');

  expect(screen.getByRole('heading', { name: '카드·역할별 효과' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '해적별 고유 능력' })).toBeInTheDocument();
  expect(screen.getByText(/로지 드레이니/)).toBeInTheDocument();
});
