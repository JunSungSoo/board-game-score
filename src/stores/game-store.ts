import { createStore } from 'zustand/vanilla';
import { persist, type PersistStorage } from 'zustand/middleware';

export const GAME_STORAGE_KEY = 'board-game-score-v2';
type SavedState = { game: unknown; setGame: (game: unknown) => void; clear: () => void };

// Keep the existing plain JSON format while screens are migrated incrementally.
// Game-specific validation still runs in the game module before restoration.
const compatibleStorage: PersistStorage<Pick<SavedState, 'game'>> = {
  getItem: name => {
    try {
      const raw = localStorage.getItem(name);
      return raw ? { state: { game: JSON.parse(raw) }, version: 0 } : null;
    } catch { return null; }
  },
  setItem: (name, value) => {
    try {
      if (value.state.game == null) localStorage.removeItem(name);
      else localStorage.setItem(name, JSON.stringify(value.state.game));
    } catch { /* Scoring remains available when storage is unavailable. */ }
  },
  removeItem: name => { try { localStorage.removeItem(name); } catch { /* unavailable */ } },
};

export function createGameStore() {
  return createStore<SavedState>()(persist<SavedState, [], [], Pick<SavedState, 'game'>>(set => ({
    game: null,
    setGame: game => set({ game: JSON.parse(JSON.stringify(game)) }),
    clear: () => set({ game: null }),
  }), { name: GAME_STORAGE_KEY, storage: compatibleStorage, partialize: state => ({ game: state.game }) }));
}

export const gameStore = createGameStore();
