import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../shared/data/types';
import { GenericEntry } from './GenericEntry';
import { SkullKingEntry } from './SkullKingEntry';
import { TichuEntry } from './TichuEntry';

afterEach(cleanup);

describe('round score input reset', () => {
  it('resets Skull King bid, tricks and bonus after submitting', async () => {
    const ON_SUBMIT = vi.fn();
    const GAME: GameState = { gameId: 'skullking', mode: 'me', round: 1, players: [{ name: '나', total: 0, rounds: [] }] };
    const VIEW = render(<SkullKingEntry game={GAME} onSubmit={ON_SUBMIT} />);

    await userEvent.click(screen.getAllByRole('button', { name: '증가' })[0]);
    await userEvent.click(screen.getByRole('button', { name: '라운드 점수 계산' }));

    expect(ON_SUBMIT).toHaveBeenCalledTimes(1);
    expect([...VIEW.container.querySelectorAll('.stepper .val')].map(NODE => NODE.textContent)).toEqual(['0', '0', '0']);
  });

  it('resets Tichu card score and declarations after submitting', async () => {
    const ON_SUBMIT = vi.fn();
    const GAME: GameState = { gameId: 'tichu', mode: 'all', round: 1, tichuMode: 'team', teams: [{ name: '팀 A', members: ['파비'], total: 0, rounds: [] }, { name: '팀 B', members: ['효명'], total: 0, rounds: [] }] };
    const VIEW = render(<TichuEntry game={GAME} onSubmit={ON_SUBMIT} />);

    await userEvent.click(screen.getByRole('button', { name: '증가' }));
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'small-ok');
    await userEvent.click(screen.getByRole('button', { name: '라운드 점수 계산' }));

    expect(ON_SUBMIT).toHaveBeenCalledTimes(1);
    expect(VIEW.container.querySelector('.stepper .val')).toHaveTextContent('0');
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('none');
  });

  it('resets generic scores after ending the round', async () => {
    const ON_SUBMIT = vi.fn();
    const GAME: GameState = { gameId: 'generic', mode: 'all', round: 1, genericMode: 'team', teams: [{ name: '팀 A', members: ['파비'], total: 0, rounds: [] }, { name: '팀 B', members: ['효명'], total: 0, rounds: [] }], scoreUnit: 1, scoreUnitSource: 'preset' };
    const VIEW = render(<GenericEntry game={GAME} onSubmit={ON_SUBMIT} onUnitChange={vi.fn()} />);

    await userEvent.click(screen.getAllByRole('button', { name: '증가' })[0]);
    await userEvent.click(screen.getByRole('button', { name: '라운드 종료' }));

    expect(ON_SUBMIT).toHaveBeenCalledWith([1, 0]);
    expect([...VIEW.container.querySelectorAll('.stepper .val')].map(NODE => NODE.textContent)).toEqual(['0', '0']);
  });
});
