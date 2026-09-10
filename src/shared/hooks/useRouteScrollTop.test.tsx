import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { useRouteScrollTop } from './useRouteScrollTop';

function RouteHarness() {
  const NAVIGATE = useNavigate();
  useRouteScrollTop();
  return <button onClick={() => NAVIGATE('/next')}>다음 화면</button>;
}

afterEach(cleanup);

it('scrolls to the top whenever the pathname changes', async () => {
  const SCROLL_TO = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  render(<MemoryRouter initialEntries={['/first']}><RouteHarness/></MemoryRouter>);
  await waitFor(() => expect(SCROLL_TO).toHaveBeenCalled());
  SCROLL_TO.mockClear();

  await userEvent.click(screen.getByRole('button', { name: '다음 화면' }));

  await waitFor(() => expect(SCROLL_TO).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' }));
});
