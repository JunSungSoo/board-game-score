import { expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthPage } from './AuthPage';
import { checkId, signUp } from './api';

vi.mock('../../lib/supabase', () => ({ supabase: null }));
vi.mock('./api', async importOriginal => ({
  ...await importOriginal<typeof import('./api')>(), checkId: vi.fn(), signUp: vi.fn(),
}));

it('does not submit signup without an ID availability check', async () => {
  const user = userEvent.setup();
  render(<QueryClientProvider client={new QueryClient()}><AuthPage signup /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: '회원가입' })).toBeEnabled());
  await user.type(screen.getByLabelText('아이디'), 'player');
  await user.click(screen.getByRole('button', { name: '회원가입' }));
  expect(screen.getByText('아이디 중복 확인을 먼저 진행해주세요.')).toBeInTheDocument();
  expect(signUp).not.toHaveBeenCalled();
});

it('discards an availability response for an ID edited while the request was pending', async () => {
  let resolve!: (value: boolean) => void;
  vi.mocked(checkId).mockImplementationOnce(() => new Promise<boolean>(done => { resolve = done; }));
  const user = userEvent.setup();
  render(<QueryClientProvider client={new QueryClient()}><AuthPage signup /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: '중복 확인' })).toBeEnabled());
  await user.type(screen.getByLabelText('아이디'), 'player');
  await user.click(screen.getByRole('button', { name: '중복 확인' }));
  await user.type(screen.getByLabelText('아이디'), '2');
  resolve(true);
  await user.click(screen.getByRole('button', { name: '회원가입' }));
  expect(screen.getByText('아이디 중복 확인을 먼저 진행해주세요.')).toBeInTheDocument();
  expect(signUp).not.toHaveBeenCalled();
});
