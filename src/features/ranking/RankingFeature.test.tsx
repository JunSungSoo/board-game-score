import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useRankingsQuery } from '../../shared/api/account';
import type { Profile } from '../../shared/data/types';
import { RankingFeature } from './RankingFeature';

vi.mock('../../shared/api/account', () => ({ useRankingsQuery: vi.fn() }));

const PROFILE: Profile = { id: 'me', login_id: 'member', display_name: '회원' };

afterEach(cleanup);

it('shows non-zero wins and losses only', () => {
  vi.mocked(useRankingsQuery).mockReturnValue({ data: [
    { user_id: 'one', login_id: 'winner', display_name: '승자', wins: 2, games: 2 },
    { user_id: 'two', login_id: 'loser', display_name: '패자', wins: 0, games: 3 },
  ], isLoading: false } as unknown as ReturnType<typeof useRankingsQuery>);

  render(<RankingFeature profile={PROFILE} />);

  expect(screen.getByText('2승')).toBeInTheDocument();
  expect(screen.getByText('3패')).toBeInTheDocument();
  expect(screen.queryByText('0승')).not.toBeInTheDocument();
  expect(screen.queryByText('0패')).not.toBeInTheDocument();
});
