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
 * 스코어에 따른 랭크(Rank) 문자열 및 스타일 반환
 */
export function getScoreRank(score: number): { rank: string; colorClass: string; badgeBg: string } {
  if (score >= 1009000) {
    return {
      rank: "SSS+",
      colorClass: "text-amber-300 font-black",
      badgeBg: "bg-linear-to-r from-amber-400 via-pink-400 to-indigo-400 text-black font-black",
    };
  }
  if (score >= 1007500) {
    return {
      rank: "SSS",
      colorClass: "text-amber-400 font-extrabold",
      badgeBg: "bg-amber-400 text-zinc-950 font-black shadow-amber-500/30",
    };
  }
  if (score >= 1005000) {
    return {
      rank: "SS+",
      colorClass: "text-yellow-300 font-extrabold",
      badgeBg: "bg-linear-to-r from-yellow-300 to-amber-500 text-zinc-950 font-black",
    };
  }
  if (score >= 1000000) {
    return {
      rank: "SS",
      colorClass: "text-yellow-400 font-extrabold",
      badgeBg: "bg-yellow-400 text-zinc-950 font-black",
    };
  }
  if (score >= 990000) {
    return {
      rank: "S+",
      colorClass: "text-emerald-400 font-bold",
      badgeBg: "bg-emerald-500 text-white font-bold",
    };
  }
  if (score >= 975000) {
    return {
      rank: "S",
      colorClass: "text-emerald-500 font-bold",
      badgeBg: "bg-emerald-600 text-white font-bold",
    };
  }
  if (score >= 950000) {
    return {
      rank: "AAA",
      colorClass: "text-sky-400 font-bold",
      badgeBg: "bg-sky-600 text-white font-bold",
    };
  }
  if (score >= 925000) {
    return {
      rank: "AA",
      colorClass: "text-sky-500 font-medium",
      badgeBg: "bg-sky-700 text-white font-medium",
    };
  }
  if (score >= 900000) {
    return {
      rank: "A",
      colorClass: "text-blue-400 font-medium",
      badgeBg: "bg-blue-700 text-white font-medium",
    };
  }
  if (score >= 800000) {
    return {
      rank: "BBB",
      colorClass: "text-zinc-400",
      badgeBg: "bg-zinc-700 text-zinc-200",
    };
  }
  return {
    rank: "C",
    colorClass: "text-zinc-500",
    badgeBg: "bg-zinc-800 text-zinc-400",
  };
}

/**
 * 레이팅 수치에 따른 등급(티어) 스타일 반환 (Rainbow, Platinum, Gold 등)
 */
export function getRatingTier(rating: number): { tierName: string; textClass: string; badgeClass: string } {
  if (rating >= 16.0) {
    return {
      tierName: "Rainbow",
      textClass: "bg-linear-to-r from-red-400 via-yellow-300 via-emerald-400 via-sky-400 to-purple-400 bg-clip-text text-transparent drop-shadow-md",
      badgeClass: "bg-linear-to-r from-red-500 via-yellow-400 via-emerald-400 to-purple-500 text-zinc-950 shadow-lg shadow-purple-500/20",
    };
  }
  if (rating >= 15.25) {
    return {
      tierName: "Platinum",
      textClass: "text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]",
      badgeClass: "bg-linear-to-r from-slate-200 via-white to-slate-300 text-zinc-950 shadow-md shadow-white/20",
    };
  }
  if (rating >= 14.5) {
    return {
      tierName: "Gold",
      textClass: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]",
      badgeClass: "bg-linear-to-r from-amber-400 via-yellow-300 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/30",
    };
  }
  if (rating >= 13.25) {
    return {
      tierName: "Silver",
      textClass: "text-zinc-300",
      badgeClass: "bg-zinc-300 text-zinc-900",
    };
  }
  if (rating >= 12.0) {
    return {
      tierName: "Bronze",
      textClass: "text-amber-700 dark:text-amber-600",
      badgeClass: "bg-amber-700 text-white",
    };
  }
  return {
    tierName: "Standard",
    textClass: "text-purple-400",
    badgeClass: "bg-purple-600 text-white",
  };
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
