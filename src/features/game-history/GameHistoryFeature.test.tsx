import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { useGameHistoryDetailQuery, useHistoryQuery } from '../../shared/api/account';
import type { Profile } from '../../shared/data/types';
import { GameHistoryFeature } from './GameHistoryFeature';

vi.mock('../../shared/api/account', () => ({ useHistoryQuery: vi.fn(), useGameHistoryDetailQuery: vi.fn() }));

const PROFILE: Profile = { id: 'me', login_id: 'member', display_name: '회원' };

afterEach(cleanup);

it('opens every participant final score in the history detail modal', async () => {
  vi.mocked(useHistoryQuery).mockReturnValue({ data: [{ room_id: 'room', game_id: 'skullking', game_mode: 'all', started_at: '2026-09-10T00:00:00Z', ended_at: '2026-09-10T01:00:00Z', display_name: '회원', team_name: null, final_score: 120, final_rank: 1 }], isLoading: false } as unknown as ReturnType<typeof useHistoryQuery>);
  vi.mocked(useGameHistoryDetailQuery).mockReturnValue({ data: [
    { participant_id: 1, display_name: '회원', team_name: null, final_score: 120, final_rank: 1 },
    { participant_id: 2, display_name: '친구', team_name: null, final_score: 80, final_rank: 2 },
  ], isLoading: false } as unknown as ReturnType<typeof useGameHistoryDetailQuery>);

  render(<GameHistoryFeature profile={PROFILE} />);
  await userEvent.click(screen.getByRole('button', { name: '보기' }));

  expect(screen.getByRole('dialog', { name: '스컬킹 최종 점수' })).toBeInTheDocument();
  expect(screen.getByText('친구')).toBeInTheDocument();
  expect(screen.getByText('80점')).toBeInTheDocument();
});
