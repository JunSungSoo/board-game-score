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
