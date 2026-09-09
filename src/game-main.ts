import '../style.css';
import { supabase } from './lib/supabase';
import { gameStore } from './stores/game-store';
import { formatGameDate } from './lib/dates';
import { calculateSkullkingScore, remainingTricks } from './features/games/scoring';
import { accountRows, invalidateAccount, clearAccountCache } from './features/account/queries';

// Temporary adapter: legacy game screens share the new services until converted to React.
Object.assign(window, {
  ScoreServices: {
    supabase, formatGameDate, calculateSkullkingScore, remainingTricks,
    accountRows, invalidateAccount, clearAccountCache,
    saveGame: (game: unknown) => gameStore.getState().setGame(game),
    loadGame: () => gameStore.getState().game,
    clearGame: () => gameStore.getState().clear(),
  },
});

// Start account restoration only after all game modules have registered.
async function bootstrap() {
  await import('../account.js');
  await import('../common.js');
  await import('../game-skullking.js');
  await import('../game-tichu.js');
  await import('../game-generic.js');
  document.dispatchEvent(new Event('score-modules-ready'));
}
bootstrap().catch(() => {
  document.body.classList.remove('auth-checking');
  document.body.textContent = '화면을 불러오지 못했어요. 새로고침해주세요.';
});
