export const GAME_STORAGE_KEY = 'board-game-score-v2';
export const GUEST_SESSION_KEY = 'board-game-guest-session-v1';
export const AUTH_DOMAIN = import.meta.env.VITE_AUTH_DOMAIN || 'danbi-score.pages.dev';
export const SKULL_KING_TOTAL_ROUNDS = 10;
export const SKULL_KING_MAX_PLAYERS = 8;
export const SKULL_KING_BONUS_STEP = 10;
export const SKULL_KING_BONUS_LIMIT = 300;
export const TICHU_TEAM_TARGET = 1000;
export const TICHU_ZHENG_TARGET = 11;
export const GENERIC_SCORE_UNITS = [1, 5, 10, 50] as const;
export const MAX_GENERIC_SCORE_UNIT = 1_000_000;
export const GAME_NAME_BY_ID = { skullking: '스컬킹', tichu: '티츄', generic: '기타 스코어' } as const;

export const GAME_OPTIONS = [
  { id: 'skullking', label: '스컬킹', description: '트릭 예측 게임 · 2~8명' },
  { id: 'tichu-team', label: '티츄 · 팀전', description: '팀 대항 · 1000점 선착' },
  { id: 'tichu-zheng', label: '티츄 · 쟁상유', description: '개인전 · 11점 선착' },
  { id: 'generic', label: '기타 스코어', description: '특정 규칙 없이 팀 또는 내 점수 기록' },
] as const;

export const TICHU_CALL_OPTIONS = [
  { id: 'none', label: '선언 없음', points: 0 },
  { id: 'small-ok', label: '스몰 성공 +100', points: 100 },
  { id: 'small-fail', label: '스몰 실패 -100', points: -100 },
  { id: 'large-ok', label: '라지 성공 +200', points: 200 },
  { id: 'large-fail', label: '라지 실패 -200', points: -200 },
] as const;

export const SKULL_KING_SCORE_RULES = [
  '비드를 정확히 맞추면 획득 트릭 × 20점',
  '비드를 못 맞추면 차이 나는 트릭당 -10점',
  '0 비드 성공은 라운드 × +10점, 실패는 라운드 × -10점',
] as const;
