import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AccountMenuFeature } from './AccountMenuFeature';

afterEach(cleanup);

function CurrentPath() {
  return <output aria-label="현재 경로">{useLocation().pathname}</output>;
}

it('shows the renamed guide menu and sends Home to the friends page', async () => {
  render(
    <MemoryRouter initialEntries={['/game-guide']}>
      <AccountMenuFeature profile={null} guest />
      <CurrentPath />
    </MemoryRouter>,
  );

  await userEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));
  expect(screen.getByRole('button', { name: '보드게임 설명서' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '⌂ 홈' }));
  expect(screen.getByLabelText('현재 경로')).toHaveTextContent('/friends');
});
