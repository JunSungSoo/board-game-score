import { beforeEach, expect, it } from 'vitest';
import { createGameStore, GAME_STORAGE_KEY } from './game-store';
beforeEach(() => localStorage.clear());
it('restores the existing static app JSON without losing rounds or room IDs', () => {
  const old = { gameId: 'skullking', round: 1, roundLabels: [1, 1], skullkingAutoAdvance: false, remoteRoomId: 'room', players: [{ name: 'A', rounds: [10, -20], total: -10 }] };
  localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(old));
  const store = createGameStore();
  expect(store.getState().game).toEqual(old);
  store.getState().setGame({ ...old, round: 2 });
  expect(JSON.parse(localStorage.getItem(GAME_STORAGE_KEY)!)).toEqual({ ...old, round: 2 });
  store.getState().clear();
  expect(localStorage.getItem(GAME_STORAGE_KEY)).toBeNull();
});
it('ignores corrupt saved data and can save a fresh game', () => {
  localStorage.setItem(GAME_STORAGE_KEY, '{broken');
  const store = createGameStore();
  expect(store.getState().game).toBeNull();
  store.getState().setGame({ gameId: 'generic' });
  expect(JSON.parse(localStorage.getItem(GAME_STORAGE_KEY)!)).toEqual({ gameId: 'generic' });
});
