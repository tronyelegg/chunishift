import React, { useState } from "react";
import type { ChartScore } from "../lib/types";
import { getProxyUrl } from "../lib/proxy";

interface SongCardProps {
  song: ChartScore;
  constant: number | null;
  trackRating: number;
  songId?: string | null;
}

const diffColors: Record<string, string> = {
  Master: "bg-purple-600",
  Expert: "bg-red-500",
  Ultima: "bg-black",
  Advanced: "bg-amber-500",
  Basic: "bg-emerald-500",
};

function SongCardComponent({ song, constant, trackRating, songId }: SongCardProps) {
  const [imgError, setImgError] = useState(false);

  const diffBg = diffColors[song.difficulty] || "bg-zinc-700";
  const displayRating = trackRating.toFixed(2);

  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 shadow-md border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-28 transition-transform hover:scale-[1.03] duration-200 cursor-pointer">
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30">
        {songId && !imgError ? (
          <img
            src={getProxyUrl(`https://chunithm-net-eng.com/mobile/img/${songId}.jpg`)}
            crossOrigin="anonymous"
            alt={song.title}
            className="w-full h-full object-cover filter blur-[2px]"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-zinc-400 to-zinc-600" />
        )}
      </div>

      <div className="relative z-10 flex justify-between items-start p-2">
        <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow-sm ${diffBg}`}>
          {song.difficulty.substring(0, 3).toUpperCase()} {constant ? constant.toFixed(1) : "?"}
        </span>
        <span className="text-xs font-black tracking-tighter px-1.5 py-0.5 bg-zinc-900/80 text-amber-400 rounded shadow-sm">
          {displayRating}
        </span>
      </div>

      <div className="relative z-10 p-2 bg-linear-to-t from-white dark:from-zinc-900 via-white/90 dark:via-zinc-900/80 to-transparent">
        <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
          {song.title}
        </div>
        <div className="flex justify-between items-end mt-1">
          <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-none">
            {song.score.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 leading-none">
            {song.isAllJustice ? "AJ" : song.isFullCombo ? "FC" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SongCardComponent);
