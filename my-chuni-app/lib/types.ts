export type Difficulty = "Basic" | "Advanced" | "Expert" | "Master" | "Ultima";
export type DiffKey = "BAS" | "ADV" | "EXP" | "MAS" | "ULT";

export interface ChartScore {
  title: string;
  difficulty: Difficulty;
  score: number;
  isAllJustice?: boolean;
  isFullCombo?: boolean;
  fullChainLv?: number;
  idx?: number;
}

export interface PlayerData {
  appVersion?: string;
  name: string;
  level: number;
  rating: number;
  playCount?: string | number;
  currentPlayCount?: string | number;
  lastPlayed?: string;
  characterImage?: string | null;
  classEmblem?: string;
  honor?: string;
  subHonor?: string;
  updatedAt?: string;
  best?: ChartScore[];
  new?: ChartScore[];
  score?: ChartScore[];
}

export interface ChartMeta {
  const: number;
  level: number;
  levelDisplay?: string;
  maxCombo?: number;
  isConstUnknown?: boolean;
}

export interface SongItem {
  idx: number;
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm?: number;
  img?: string;
  charts?: Partial<Record<DiffKey, ChartMeta>>;
}

export interface SongDB {
  format?: string;
  gameVersion?: string;
  songs: SongItem[];
}

