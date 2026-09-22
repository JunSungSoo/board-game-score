import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import type { GameState } from '../../shared/data/types';
import { EditRoundsModal } from './EditRoundsModal';

const GAME: GameState = {
  gameId: 'generic',
  mode: 'all',
  round: 2,
  players: [{ name: '파비', rounds: [10], total: 10 }],
};

afterEach(cleanup);

it('accepts only digit characters and saves the numeric score', async () => {
  const ON_SAVE = vi.fn();
  render(<EditRoundsModal game={GAME} open onClose={vi.fn()} onSave={ON_SAVE} />);
  const INPUT = screen.getByRole('textbox');

  expect(INPUT).toHaveAttribute('type', 'text');
  expect(INPUT).toHaveAttribute('inputmode', 'numeric');

  await userEvent.clear(INPUT);
  await userEvent.type(INPUT, '2a-5');
  expect(INPUT).toHaveValue('25');

  await userEvent.click(screen.getByRole('button', { name: '수정' }));
  expect(ON_SAVE).toHaveBeenCalledWith([[25]]);
});
