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
  onClick?: () => void;
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
  onClick,
}: SongCardProps) {
  const [imgError, setImgError] = useState(false);

  const style = diffStyles[song.difficulty] || {
    bg: "bg-zinc-700",
    text: "text-zinc-300",
    border: "border-zinc-700",
    glow: "hover:border-zinc-500",
  };

  const { rank, badgeBg: rankBadge } = getScoreRank(song.score);
  const displayRating = trackRating.toFixed(2);
  const diffShort = song.difficulty.substring(0, 3).toUpperCase();

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group relative flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border ${style.border} ${style.glow} shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer select-none`}
    >
      {/* 순번 표시 */}
      {index != null && (
        <span className="absolute top-1 left-1.5 text-[8.5px] font-mono font-bold text-zinc-400/80 dark:text-zinc-500/80 z-10 pointer-events-none">
          #{index + 1}
        </span>
      )}

      {/* 좌측: 자켓 앨범 아트 */}
      <div className="relative w-14 h-14 sm:w-15 sm:h-15 shrink-0 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-inner border border-zinc-200 dark:border-zinc-800/80">
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
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-zinc-700 to-zinc-900 text-zinc-400 text-lg font-black">
            ♪
          </div>
        )}

        {/* 자켓 하단 난이도 라벨 */}
        <span
          className={`absolute bottom-0 inset-x-0 text-center text-[7.5px] font-black tracking-wider text-white py-0.2 ${style.bg} opacity-95`}
        >
          {diffShort}
        </span>
      </div>

      {/* 우측: 곡 메타 정보 및 성과 (여유 공간 확보) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-14 sm:h-15">
        {/* 상단 라인: 난이도/상수 & 단일 레이팅 */}
        <div className="flex items-center justify-between gap-1 w-full">
          <span
            className={`shrink-0 inline-flex items-center text-[9.5px] font-extrabold tracking-tight px-1.5 py-0.2 rounded-md ${style.bg} text-white shadow-xs`}
          >
            {diffShort} {constant ? constant.toFixed(1) : "?"}
          </span>

          <div className="flex items-baseline gap-0.5 shrink-0 bg-zinc-100 dark:bg-zinc-800/90 px-1.5 py-0.2 rounded-md border border-zinc-200 dark:border-zinc-700/60">
            <span className="text-[8.5px] font-bold text-zinc-400 tracking-tighter">
              RT
            </span>
            <span className="text-[11.5px] font-black text-amber-500 dark:text-amber-400 tracking-tight leading-none">
              {displayRating}
            </span>
          </div>
        </div>

        {/* 중앙: 곡 제목 */}
        <div
          title={song.title}
          className="text-[11.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight my-0.2 leading-tight"
        >
          {song.title}
        </div>

        {/* 하단 라인: 스코어 & 랭크 & 판정 뱃지 (절대 잘리지 않도록 넉넉한 공간 배치) */}
        <div className="flex items-center justify-between gap-1 w-full mt-auto">
          <span className="text-[11px] font-mono font-bold tracking-tighter text-zinc-700 dark:text-zinc-300 shrink-0">
            {song.score.toLocaleString()}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {/* 랭크 뱃지 (SSS+, SSS, SS 등) */}
            <span
              className={`shrink-0 inline-flex items-center text-[8.5px] font-black px-1.5 py-0.2 rounded-md shadow-xs tracking-tighter leading-tight ${rankBadge}`}
            >
              {rank}
            </span>

            {/* 판정 뱃지 (AJ / FC) */}
            {song.isAllJustice ? (
              <span className="shrink-0 inline-flex items-center text-[8.5px] font-black px-1.5 py-0.2 rounded-md bg-linear-to-r from-amber-400 to-yellow-300 text-zinc-950 shadow-xs tracking-tighter leading-tight">
                AJ
              </span>
            ) : song.isFullCombo ? (
              <span className="shrink-0 inline-flex items-center text-[8.5px] font-black px-1.5 py-0.2 rounded-md bg-emerald-500 text-white shadow-xs tracking-tighter leading-tight">
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
