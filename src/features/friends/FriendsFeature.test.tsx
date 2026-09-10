import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFriendMutation, useFriendResponseMutation, useFriendsQuery, useFriendSearchQuery } from '../../shared/api/account';
import type { Profile } from '../../shared/data/types';
import { FriendsFeature } from './FriendsFeature';

vi.mock('../../shared/api/account', () => ({
  useFriendMutation: vi.fn(),
  useFriendResponseMutation: vi.fn(),
  useFriendsQuery: vi.fn(),
  useFriendSearchQuery: vi.fn(),
}));
vi.mock('../../shared/hooks/useDebouncedValue', () => ({ useDebouncedValue: (value: string) => value }));

const PROFILE: Profile = { id: 'me', login_id: 'member', display_name: '회원' };

afterEach(cleanup);

describe('friend search', () => {
  it('shows up to five prefix results as ID(name)', async () => {
    vi.mocked(useFriendsQuery).mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() } as unknown as ReturnType<typeof useFriendsQuery>);
    vi.mocked(useFriendSearchQuery).mockReturnValue({ data: [{ user_id: 'admin-id', login_id: 'admin', display_name: '관리자' }], isFetching: false } as unknown as ReturnType<typeof useFriendSearchQuery>);
    vi.mocked(useFriendMutation).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useFriendMutation>);
    vi.mocked(useFriendResponseMutation).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useFriendResponseMutation>);

    render(<FriendsFeature profile={PROFILE} />);
    await userEvent.type(screen.getByPlaceholderText('아이디 입력'), 'adm');

    expect(screen.getByRole('option', { name: 'admin(관리자)' })).toBeInTheDocument();
  });

  it('always renders an outgoing request as offline and waiting', () => {
    vi.mocked(useFriendsQuery).mockReturnValue({ data: [{ id: 'admin-id', user_id: 'admin-id', login_id: 'admin', display_name: '관리자', friendship_id: 1, relationship: 'outgoing', presence_status: 'playing' }], isLoading: false, refetch: vi.fn() } as unknown as ReturnType<typeof useFriendsQuery>);
    vi.mocked(useFriendSearchQuery).mockReturnValue({ data: [], isFetching: false } as unknown as ReturnType<typeof useFriendSearchQuery>);
    vi.mocked(useFriendMutation).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useFriendMutation>);
    vi.mocked(useFriendResponseMutation).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useFriendResponseMutation>);

    render(<FriendsFeature profile={PROFILE} />);

    const PENDING = screen.getByText('요청 대기중');
    expect(PENDING).toHaveClass('offline');
    expect(PENDING.closest('.friend-row')).not.toHaveTextContent('게임 중');
  });
});
