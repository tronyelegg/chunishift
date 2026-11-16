import React, { useState } from "react";
import type { ChartScore } from "../lib/types";
import { getProxyUrl } from "../lib/proxy";
import { getScoreRank } from "../lib/rating";

interface SongCardProps {
  song: ChartScore;
  constant: number | null;
  trackRating: number;
  songId?: string | null;
  index?: number;
}

const diffStyles: Record<
  string,
  { bg: string; text: string; border: string; glow: string }
> = {
  Master: {
    bg: "bg-purple-600",
    text: "text-purple-300",
    border: "border-purple-500/40",
    glow: "hover:border-purple-500 hover:shadow-purple-500/20",
  },
  Ultima: {
    bg: "bg-zinc-950 text-amber-400 border border-amber-400/50",
    text: "text-amber-400",
    border: "border-amber-500/40",
    glow: "hover:border-amber-500 hover:shadow-amber-500/20",
  },
  Expert: {
    bg: "bg-red-500",
    text: "text-red-300",
    border: "border-red-500/40",
    glow: "hover:border-red-500 hover:shadow-red-500/20",
  },
  Advanced: {
    bg: "bg-amber-500",
    text: "text-amber-300",
    border: "border-amber-500/40",
    glow: "hover:border-amber-500 hover:shadow-amber-500/20",
  },
  Basic: {
    bg: "bg-emerald-500",
    text: "text-emerald-300",
    border: "border-emerald-500/40",
    glow: "hover:border-emerald-500 hover:shadow-emerald-500/20",
  },
};

function SongCardComponent({
  song,
  constant,
  trackRating,
  songId,
  index,
}: SongCardProps) {
  const [imgError, setImgError] = useState(false);

  const style = diffStyles[song.difficulty] || {
    bg: "bg-zinc-700",
    text: "text-zinc-300",
    border: "border-zinc-700",
    glow: "hover:border-zinc-500",
  };

  const { rank, colorClass: rankColor, badgeBg: rankBadge } = getScoreRank(
    song.score
  );
  const displayRating = trackRating.toFixed(2);
  const diffShort = song.difficulty.substring(0, 3).toUpperCase();

  return (
    <div
      className={`group relative flex items-center gap-3 p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border ${style.border} ${style.glow} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer`}
    >
      {/* 순번 표시 (옵션) */}
      {index != null && (
        <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 z-10 pointer-events-none">
          #{index + 1}
        </span>
      )}

      {/* 좌측: 자켓 앨범 아트 */}
      <div className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-inner border border-zinc-200 dark:border-zinc-800/80">
        {songId && !imgError ? (
          <img
            src={getProxyUrl(
              `https://chunithm-net-eng.com/mobile/img/${songId}.jpg`
            )}
            crossOrigin="anonymous"
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-zinc-700 to-zinc-900 text-zinc-400 text-xl font-black">
            ♪
          </div>
        )}

        {/* 자켓 좌측 상단 작은 난이도 라벨 */}
        <span
          className={`absolute bottom-0 inset-x-0 text-center text-[8px] font-black tracking-wider text-white py-0.5 ${style.bg} opacity-95`}
        >
          {diffShort}
        </span>
      </div>

      {/* 우측: 곡 메타 정보 및 성과 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-16 sm:h-18">
        {/* 상단 라인: 난이도/상수 & 단일 레이팅 */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`text-[10px] font-extrabold tracking-tight px-1.5 py-0.5 rounded ${style.bg} text-white shadow-xs`}
            >
              {diffShort} {constant ? constant.toFixed(1) : "?"}
            </span>
          </div>

          <div className="flex items-baseline gap-0.5 shrink-0 bg-zinc-100 dark:bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60">
            <span className="text-[9px] font-bold text-zinc-400 tracking-tighter">
              RT
            </span>
            <span className="text-[12px] font-black text-amber-500 dark:text-amber-400 tracking-tight leading-none">
              {displayRating}
            </span>
          </div>
        </div>

        {/* 중앙: 곡 제목 */}
        <div
          title={song.title}
          className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight my-0.5"
        >
          {song.title}
        </div>

        {/* 하단 라인: 스코어 & 랭크 & 판정 뱃지 */}
        <div className="flex items-center justify-between gap-1 mt-auto">
          <span className="text-[12px] font-mono font-bold tracking-tight text-zinc-700 dark:text-zinc-300">
            {song.score.toLocaleString()}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {/* 랭크 뱃지 (SSS+, SSS, SS 등) */}
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs tracking-tighter ${rankBadge}`}
            >
              {rank}
            </span>

            {/* 판정 뱃지 (AJ / FC) */}
            {song.isAllJustice ? (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-linear-to-r from-amber-400 to-yellow-300 text-zinc-950 shadow-xs tracking-tighter">
                AJ
              </span>
            ) : song.isFullCombo ? (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-white shadow-xs tracking-tighter">
                FC
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SongCardComponent);
