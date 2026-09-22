import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlayerSetupFeature } from './PlayerSetupFeature';

afterEach(cleanup);

describe('fixed participant setup', () => {
  it('selects fixed players and adds only manually entered guests', async () => {
    const ON_START = vi.fn();
    render(<PlayerSetupFeature team={false} min={2} max={8} onStart={ON_START} onBack={vi.fn()} />);

    expect(screen.getByRole('button', { name: '파비' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '효명' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '엘라' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '파비' }));
    await userEvent.type(screen.getByPlaceholderText('게스트 이름 입력'), '게스트');
    await userEvent.click(screen.getByRole('button', { name: /게스트로 추가/ }));
    await userEvent.click(screen.getByRole('button', { name: '게임 시작' }));

    expect(ON_START).toHaveBeenCalledWith({ names: ['파비', '게스트'], membersA: ['파비'], membersB: ['게스트'] });
  });

  it('does not allow a fixed player name to be added as a guest', async () => {
    render(<PlayerSetupFeature team={false} min={1} max={8} onStart={vi.fn()} onBack={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText('게스트 이름 입력'), '파비');
    await userEvent.click(screen.getByRole('button', { name: /게스트로 추가/ }));

    expect(screen.getByText('이미 있는 이름이에요. 다른 이름을 입력해주세요.')).toBeVisible();
  });
});
