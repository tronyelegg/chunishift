import { useState } from "react";

export default function SongGridCard({ song, constant, trackRating, songId }: { song: any, constant: number | null, trackRating: number, songId: string | null }) {
  const [imgError, setImgError] = useState(false);

  // 츄니즘 난이도별 색상 뱃지
  let diffBg = "bg-zinc-800";
  if (song.difficulty === "Master") diffBg = "bg-purple-600"; 
  if (song.difficulty === "Expert") diffBg = "bg-red-600"; 
  if (song.difficulty === "Ultima") diffBg = "bg-black"; 
  if (song.difficulty === "Advanced") diffBg = "bg-amber-500"; 
  if (song.difficulty === "Basic") diffBg = "bg-emerald-600"; 

  // 레이팅 숫자에 100을 곱해 maishift처럼 정수형태로 표시 (예: 14.25 -> 1425 또는 간이 표기)
  const displayRating = Math.round(trackRating * 10); 

  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 shadow-md border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-28 transition-transform hover:scale-[1.02]">
      
      {/* 배경 자켓 이미지 (없거나 에러 시 그라데이션) */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20">
        {songId && !imgError ? (
          <img 
            src={`https://db.chunithm.net/img/music/${songId}.png`} 
            alt="jacket" 
            className="w-full h-full object-cover filter blur-[1px]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-400 to-zinc-600" />
        )}
      </div>

      {/* 상단 바: 난이도 & 단일 레이팅 뱃지 */}
      <div className="relative z-10 flex justify-between items-center p-2.5 bg-gradient-to-b from-black/60 to-transparent text-white">
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded shadow ${diffBg}`}>
          {song.difficulty.toUpperCase()} {constant ? `(${constant})` : ""}
        </span>
        <span className="text-sm font-black tracking-tight px-1.5 py-0.5 bg-black/70 rounded text-amber-400">
          {displayRating}
        </span>
      </div>

      {/* 하단 정보: 곡 제목 및 스코어 */}
      <div className="relative z-10 p-2.5 bg-gradient-to-t from-white dark:from-zinc-900 via-white/90 dark:via-zinc-900/90 to-transparent flex flex-col justify-end">
        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
          {song.title}
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            {song.score.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
            {song.isAllJustice ? "AJ" : song.isFullCombo ? "FC" : ""}
          </span>
        </div>
      </div>

    </div>
  );
}