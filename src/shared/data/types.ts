export type GameId = 'skullking' | 'tichu' | 'generic';
export type GameMode = 'all' | 'me';
export type TichuMode = 'team' | 'zheng' | 'me';
export type GenericMode = 'team' | 'me';

export interface ScoreEntity {
  name: string;
  total: number;
  rounds: number[];
  members?: string[];
}

export interface GameState {
  gameId: GameId;
  mode: GameMode;
  round: number;
  players?: ScoreEntity[];
  teams?: ScoreEntity[];
  tichuMode?: TichuMode;
  genericMode?: GenericMode;
  roundLabels?: number[];
  skullkingCustomMode?: boolean;
  skullkingAutoAdvance?: boolean;
  scoreUnit?: number;
  scoreUnitSource?: 'preset' | 'custom';
  remoteRoomId?: number | string | null;
  remoteParticipants?: RemoteParticipant[];
  participantUserIds?: Record<string, string>;
}

export interface RemoteParticipant {
  id: number;
  user_id: string | null;
  display_name: string;
  team_name: string | null;
}

export interface Profile {
  id: string;
  login_id: string;
  display_name: string;
}

export interface FriendRow extends Profile {
  friendship_id: number;
  relationship: 'incoming' | 'outgoing' | 'accepted';
  presence_status: 'online' | 'offline' | 'playing';
  user_id: string;
}

export interface FriendSearchRow {
  user_id: string;
  login_id: string;
  display_name: string;
}

export interface GameHistoryRow {
  room_id: string;
  game_id: GameId;
  game_mode: string;
  started_at: string;
  ended_at: string;
  display_name: string;
  team_name: string | null;
  final_score: number;
  final_rank: number;
}

export interface RankingRow {
  user_id: string;
  login_id: string;
  display_name: string;
  wins: number;
  games: number;
}
