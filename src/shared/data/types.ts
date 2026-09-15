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

export interface GameHistoryParticipantRow {
  participant_id: number;
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

export interface GameGuideRow {
  id: number;
  slug: string;
  version_key: string;
  title_ko: string;
  title_en: string;
  aliases: string[];
  edition_label: string;
  release_year: number | null;
  player_count: string;
  play_time: string;
  goal: string;
  setup: string[];
  gameplay: string[];
  special_rules: string[];
  pirate_abilities: string[];
  scoring: string[];
  end_condition: string;
  source_name: string;
  source_url: string;
  sort_order: number;
}
