import { createStore } from 'zustand/vanilla';
import { persist, type PersistStorage } from 'zustand/middleware';
import { GAME_STORAGE_KEY } from '../shared/data/game';
import type { GameState, ScoreEntity } from '../shared/data/types';

export { GAME_STORAGE_KEY } from '../shared/data/game';

interface GameStore {
  game: GameState | null;
  setGame: (game: GameState | Record<string, unknown>) => void;
  updateGame: (update: (game: GameState) => GameState) => void;
  clear: () => void;
}

function cloneGame(game: GameState): GameState {
  return structuredClone(game);
}

const COMPATIBLE_STORAGE: PersistStorage<Pick<GameStore, 'game'>> = {
  getItem: name => {
    try {
      const RAW_VALUE = localStorage.getItem(name);
      return RAW_VALUE ? { state: { game: JSON.parse(RAW_VALUE) }, version: 0 } : null;
    } catch { return null; }
  },
  setItem: (name, value) => {
    try {
      if (value.state.game) localStorage.setItem(name, JSON.stringify(value.state.game));
      else localStorage.removeItem(name);
    } catch { /* Scoring remains available without persistence. */ }
  },
  removeItem: name => { try { localStorage.removeItem(name); } catch { /* unavailable */ } },
};

export function entitiesOf(game: GameState): ScoreEntity[] {
  return game.teams ?? game.players ?? [];
}

export function createGameStore() {
  return createStore<GameStore>()(persist<GameStore, [], [], Pick<GameStore, 'game'>>(set => ({
    game: null,
    setGame: game => set({ game: cloneGame(game as GameState) }),
    updateGame: update => set(state => ({ game: state.game ? cloneGame(update(cloneGame(state.game))) : null })),
    clear: () => set({ game: null }),
  }), { name: GAME_STORAGE_KEY, storage: COMPATIBLE_STORAGE, partialize: state => ({ game: state.game }) }));
}

export const GAME_STORE = createGameStore();
