import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { GameRulesFeature } from './GameRulesFeature';

afterEach(cleanup);

it('dims a floating rules panel after focus moves back to the page', async () => {
  const VIEW = render(<><button>외부 영역</button><GameRulesFeature gameId="skullking" /></>);

  await userEvent.click(screen.getAllByRole('button', { name: '플로팅' })[0]);
  const PANEL = VIEW.container.querySelector('[data-floating-panel="score"]');
  expect(PANEL).toHaveClass('focused');

  fireEvent.pointerDown(screen.getByRole('button', { name: '외부 영역' }));
  expect(PANEL).not.toHaveClass('focused');
});
