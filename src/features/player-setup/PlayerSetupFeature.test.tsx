import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFriendsQuery } from '../../shared/api/account';
import type { FriendRow, Profile } from '../../shared/data/types';
import { PlayerSetupFeature } from './PlayerSetupFeature';

vi.mock('../../shared/api/account', () => ({ useFriendsQuery: vi.fn() }));

const PROFILE: Profile = { id: 'me', login_id: 'me', display_name: '나' };
const FRIENDS: FriendRow[] = [
  { id: 'one', user_id: 'one', login_id: 'online-id', display_name: '온라인 친구', friendship_id: 1, relationship: 'accepted', presence_status: 'online' },
  { id: 'two', user_id: 'two', login_id: 'offline-id', display_name: '오프라인 친구', friendship_id: 2, relationship: 'accepted', presence_status: 'offline' },
];

afterEach(cleanup);

describe('participant friend suggestions', () => {
  it('shows active friends by default and includes a matching offline friend while searching', async () => {
    vi.mocked(useFriendsQuery).mockReturnValue({ data: FRIENDS, isLoading: false } as ReturnType<typeof useFriendsQuery>);
    render(<PlayerSetupFeature profile={PROFILE} guestOnly={false} team={false} min={2} max={8} onStart={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByText('온라인 친구')).toBeInTheDocument();
    expect(screen.queryByText('오프라인 친구')).not.toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('참가자 이름 입력'), '오프라인');
    expect(screen.getByText('오프라인 친구')).toBeInTheDocument();
    expect(screen.getByText('오프라인')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /“오프라인” 게스트로 추가/ })).toBeEnabled();
  });

  it('adds a selected friend with its user id', async () => {
    const ON_START = vi.fn();
    vi.mocked(useFriendsQuery).mockReturnValue({ data: FRIENDS, isLoading: false } as ReturnType<typeof useFriendsQuery>);
    render(<PlayerSetupFeature profile={PROFILE} guestOnly={false} team={false} min={1} max={8} onStart={ON_START} onBack={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /온라인 친구/ }));
    await userEvent.click(screen.getByRole('button', { name: '게임 시작' }));

    expect(ON_START).toHaveBeenCalledWith(expect.objectContaining({ names: ['온라인 친구'], participantUserIds: { '온라인 친구': 'one' } }));
  });
});
