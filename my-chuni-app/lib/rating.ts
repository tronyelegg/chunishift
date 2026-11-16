import type { ChartScore, DiffKey, Difficulty, SongItem } from "./types";
import rawSongDB from "../data/chunimaru_db.json";

export const difficultyMap: Record<Difficulty | string, DiffKey> = {
  Basic: "BAS",
  Advanced: "ADV",
  Expert: "EXP",
  Master: "MAS",
  Ultima: "ULT",
};

// 곡 DB 배열 추출
const songList: SongItem[] = Array.isArray(rawSongDB)
  ? (rawSongDB as any)
  : (rawSongDB as any).songs || [];

// 빠른 조회를 위한 O(1) Map 인덱스 캐싱
const songByIdxMap = new Map<number, SongItem>();
const songByTitleMap = new Map<string, SongItem>();

songList.forEach((song) => {
  if (song.idx != null) songByIdxMap.set(song.idx, song);
  if (song.title) songByTitleMap.set(song.title, song);
});

/**
 * 곡 메타데이터 조회 (idx 우선, 제목 보조)
 */
export function findSongMeta(song: { idx?: number; title: string }): SongItem | undefined {
  if (song.idx != null && songByIdxMap.has(song.idx)) {
    return songByIdxMap.get(song.idx);
  }
  return songByTitleMap.get(song.title);
}

/**
 * 곡 보면 상수(Internal Constant) 또는 표기 레벨 조회
 */
export function getConstant(songData: { idx?: number; title: string; difficulty: Difficulty | string }): number | null {
  const song = findSongMeta(songData);
  if (!song || !song.charts) return null;

  const diffKey = difficultyMap[songData.difficulty];
  if (!diffKey) return null;

  const diffData = song.charts[diffKey];
  if (diffData) {
    if (diffData.const > 0) return diffData.const;
    if (diffData.level > 0) return diffData.level;
  }
  return null;
}

/**
 * CHUNITHM 레이팅 공식에 따른 단일 곡 레이팅(Track Rating) 계산
 */
export function calculateTrackRating(constant: number, score: number): number {
  const base = Math.round(constant * 100);
  let bonus = 0;

  if (score >= 1009000) bonus = 215;
  else if (score >= 1007500) bonus = 200 + Math.floor((score - 1007500) / 100);
  else if (score >= 1005000) bonus = 150 + Math.floor((score - 1005000) / 50);
  else if (score >= 1000000) bonus = 100 + Math.floor((score - 1000000) / 100);
  else if (score >= 990000) bonus = 60 + Math.floor((score - 990000) / 250);
  else if (score >= 975000) bonus = 0 + Math.floor((score - 975000) / 250);
  else if (score >= 950000) bonus = -167 + Math.floor((score - 950000) / 150);
  else if (score >= 925000) bonus = -334 + Math.floor((score - 925000) / 150);
  else if (score >= 900000) bonus = -500 + Math.floor((score - 900000) / 150);

  return Math.max(0, base + bonus) / 100;
}

/**
 * 전체 곡들의 평균 레이팅 계산
 */
export function calculateAverageRating(songs: ChartScore[]): number {
  if (!songs || songs.length === 0) return 0;
  let total = 0;
  let count = 0;

  for (const song of songs) {
    const constant = getConstant(song);
    if (constant != null) {
      total += calculateTrackRating(constant, song.score);
      count++;
    }
  }

  return count > 0 ? Math.floor((total / count) * 100) / 100 : 0;
}

