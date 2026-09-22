import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { SideMenuFeature } from './SideMenuFeature';

afterEach(cleanup);

function CurrentPath() {
  return <output aria-label="현재 경로">{useLocation().pathname}</output>;
}

it('moves Home to game selection and exposes only the guide navigation', async () => {
  render(<MemoryRouter initialEntries={['/game-guide']}><SideMenuFeature/><CurrentPath/></MemoryRouter>);

  await userEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));
  expect(screen.getByRole('button', { name: '보드게임 설명서' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '랭킹' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '게임 기록' })).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '⌂ 홈' }));
  expect(screen.getByLabelText('현재 경로')).toHaveTextContent('/game/select');
});
