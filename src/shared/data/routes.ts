export const APP_ROUTES = {
  FRIENDS: '/friends',
  RANK: '/rank',
  GAME_HISTORY: '/game-history',
  GAME_SELECT: '/game/select',
  GAME_WRITE: '/game/write',
  GAME_RESULT: '/game/result',
  SKULL_KING: '/game/skullking',
  TICHU: '/game/tichu',
  GENERIC: '/game/generic',
} as const;

export const GAME_MODE_ROUTES = {
  SKULL_KING_TOGETHER: `${APP_ROUTES.SKULL_KING}/together`,
  SKULL_KING_SINGLE: `${APP_ROUTES.SKULL_KING}/single`,
  TICHU_TOGETHER: `${APP_ROUTES.TICHU}/together`,
  TICHU_SINGLE: `${APP_ROUTES.TICHU}/single`,
  GENERIC_TOGETHER: `${APP_ROUTES.GENERIC}/together`,
  GENERIC_SINGLE: `${APP_ROUTES.GENERIC}/single`,
} as const;
