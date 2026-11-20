"use client";

import { useState } from "react";
import type { SongItem, ChartScore, DiffKey } from "../lib/types";
import { getProxyUrl } from "../lib/proxy";
import { SONG_ALIASES, ARTIST_ALIASES } from "../lib/koreanSearch";
import { getScoreRank, calculateTrackRating } from "../lib/rating";
import {
  getYoutubeHumenVideoUrl,
  SDVX_BASE_URL,
  YOUTUBE_HUMEN_CHANNEL,
} from "../lib/chartLinks";

interface SongDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: SongItem | null;
  userScore?: ChartScore | null;
  initialDiff?: string;
}

const diffColorMap: Record<
  DiffKey,
  { bg: string; text: string; border: string; name: string }
> = {
  BAS: {
    bg: "bg-emerald-600 text-white",
    text: "text-emerald-500",
    border: "border-emerald-500/40",
    name: "Basic",
  },
  ADV: {
    bg: "bg-amber-500 text-zinc-950 font-black",
    text: "text-amber-500",
    border: "border-amber-500/40",
    name: "Advanced",
  },
  EXP: {
    bg: "bg-red-500 text-white",
    text: "text-red-500",
    border: "border-red-500/40",
    name: "Expert",
  },
  MAS: {
    bg: "bg-purple-600 text-white",
    text: "text-purple-400",
    border: "border-purple-500/40",
    name: "Master",
  },
  ULT: {
    bg: "bg-zinc-950 text-amber-400 border border-amber-400/60 font-black",
    text: "text-amber-400",
    border: "border-amber-400/40",
    name: "Ultima",
  },
};

const diffOrder: DiffKey[] = ["BAS", "ADV", "EXP", "MAS", "ULT"];

export default function SongDetailModal({
  isOpen,
  onClose,
  song,
  userScore,
  initialDiff,
}: SongDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [sdvxCopied, setSdvxCopied] = useState(false);
  const [activeDiff, setActiveDiff] = useState<DiffKey>(() => {
    if (initialDiff) {
      const upper = initialDiff.toUpperCase();
      if (upper.startsWith("BAS")) return "BAS";
      if (upper.startsWith("ADV")) return "ADV";
      if (upper.startsWith("EXP")) return "EXP";
      if (upper.startsWith("MAS")) return "MAS";
      if (upper.startsWith("ULT")) return "ULT";
    }
    return "MAS";
  });

  if (!isOpen || !song) return null;

  const currentChart = song.charts ? song.charts[activeDiff] : null;
  const currentDiffName = diffColorMap[activeDiff]?.name || activeDiff;

  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(song.title);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("복사 실패:", e);
    }
  };

  const aliases = SONG_ALIASES[song.title];
  const artistAliases = ARTIST_ALIASES[song.artist];

  // 유저 점수 정보 파싱
  const scoreRankInfo = userScore ? getScoreRank(userScore.score) : null;
  const userTrackRating =
    userScore && currentChart?.const
      ? calculateTrackRating(currentChart.const, userScore.score)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition text-sm font-bold cursor-pointer"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 1. 상단 악곡 헤더 정보 */}
        <div className="flex gap-4 sm:gap-5 items-start mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700/80 shadow-md">
            {song.img ? (
              <img
                src={getProxyUrl(
                  `https://chunithm-net-eng.com/mobile/img/${song.img}.jpg`
                )}
                crossOrigin="anonymous"
                alt={song.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-400">
                ♪
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                {song.genre}
              </span>
              {song.bpm ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  BPM {song.bpm}
                </span>
              ) : null}
            </div>

            <h3
              className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white leading-snug break-words"
              title={song.title}
            >
              {song.title}
            </h3>

            {/* 한국어 통칭 또는 음차 */}
            {aliases && aliases.length > 0 && (
              <p className="text-xs font-bold text-sky-500 mt-1">
                🇰🇷 {aliases.join(", ")}
              </p>
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
              {song.artist}
              {artistAliases && (
                <span className="text-zinc-400 font-bold ml-1.5">
                  ({artistAliases[0]})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 2. 유저 기록 (있는 경우) */}
        {userScore && (
          <div className="mb-5 p-3.5 rounded-2xl bg-linear-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 dark:border-sky-500/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-500">
                내 플레이 성과 ({userScore.difficulty})
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-mono font-black text-zinc-900 dark:text-white">
                  {userScore.score.toLocaleString()}
                </span>
                {scoreRankInfo && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded ${scoreRankInfo.badgeBg}`}
                  >
                    {scoreRankInfo.rank}
                  </span>
                )}
                {userScore.isAllJustice ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-linear-to-r from-amber-400 to-yellow-300 text-zinc-950">
                    ALL JUSTICE
                  </span>
                ) : userScore.isFullCombo ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                    FULL COMBO
                  </span>
                ) : null}
              </div>
            </div>

            {userTrackRating != null && (
              <div className="text-right">
                <span className="text-[9px] font-bold text-zinc-400 block">
                  단일 레이팅
                </span>
                <span className="text-lg font-black text-amber-500">
                  {userTrackRating.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 3. 난이도 선택 탭 및 상수 정보 */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
              난이도별 보면 상수 (Charts)
            </h4>
            <span className="text-[11px] text-zinc-400">
              선택된 난이도: <strong className="text-zinc-700 dark:text-zinc-200">{currentDiffName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {diffOrder.map((diff) => {
              const chart = song.charts ? song.charts[diff] : null;
              const isSelected = activeDiff === diff;
              const style = diffColorMap[diff];

              if (!chart && diff === "ULT") {
                return (
                  <div
                    key={diff}
                    className="p-2 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/30 border border-transparent text-center opacity-40 text-xs font-bold text-zinc-400 cursor-not-allowed"
                  >
                    <span className="block text-[10px]">ULT</span>
                    <span className="text-[11px]">-</span>
                  </div>
                );
              }

              return (
                <button
                  key={diff}
                  onClick={() => setActiveDiff(diff)}
                  className={`p-2 rounded-xl text-center transition-all cursor-pointer border ${
                    isSelected
                      ? `${style.border} ring-2 ring-sky-500/50 dark:ring-sky-400/50 bg-zinc-100 dark:bg-zinc-800`
                      : "border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <span
                    className={`inline-block text-[9.5px] font-black px-1.5 py-0.2 rounded ${style.bg} mb-1`}
                  >
                    {diff}
                  </span>
                  <div className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                    {chart?.const ? chart.const.toFixed(1) : chart?.level ? `${chart.level}.0` : "?"}
                  </div>
                  <div className="text-[9px] font-semibold text-zinc-400 mt-0.5">
                    {chart?.levelDisplay || "-"}
                  </div>
                </button>
              );
            })}
          </div>

          {currentChart && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">
                표기 레벨: <strong className="text-zinc-900 dark:text-white">{currentChart.levelDisplay || "-"}</strong>
              </span>
              <span className="text-zinc-500">
                보면 상수: <strong className="text-sky-500">{currentChart.const ? currentChart.const.toFixed(1) : "-"}</strong>
              </span>
              {currentChart.maxCombo ? (
                <span className="text-zinc-500">
                  총 노트 수: <strong className="text-zinc-900 dark:text-white">{currentChart.maxCombo.toLocaleString()}</strong>
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* 4. 외부 채보 & 영상 연동 버튼 (SDVX.in & YouTube @chunithm_humen) */}
        <div className="space-y-2.5 mb-6">
          <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>채보 및 영상 외부 바로가기</span>
            <span className="text-[10px] text-zinc-400 font-normal">
              클릭 시 새 탭으로 연결됩니다
            </span>
          </h4>

          {/* YouTube @chunithm_humen 채널 내부 검색 (곡명으로 채널 내 직접 검색) */}
          <a
            href={getYoutubeHumenVideoUrl(song.title, currentDiffName)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-linear-to-r from-red-600/10 hover:from-red-600/20 to-red-500/5 dark:from-red-950/40 dark:hover:from-red-900/40 border border-red-500/30 hover:border-red-500/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-red-600/30">
                ▶
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-900 dark:text-white group-hover:text-red-500 transition">
                  YouTube 채보 영상 (@chunithm_humen)
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  チュウニズム譜面保管所 채널 내 &quot;{song.title.length > 20 ? song.title.substring(0, 20) + "…" : song.title}&quot; 검색
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-red-500 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-500/30 shrink-0">
              보기 ↗
            </span>
          </a>

          {/* SDVX.in 채보 시트 확인 (곡명 클립보드 복사 후 sdvx.in 열기) */}
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(song.title);
                setSdvxCopied(true);
                setTimeout(() => setSdvxCopied(false), 3000);
                window.open(SDVX_BASE_URL, "_blank", "noreferrer");
              } catch (e) {
                console.error("곡명 복사 실패:", e);
                window.open(SDVX_BASE_URL, "_blank", "noreferrer");
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-linear-to-r from-indigo-600/10 hover:from-indigo-600/20 to-purple-500/5 dark:from-indigo-950/40 dark:hover:from-indigo-900/40 border border-indigo-500/30 hover:border-indigo-500/60 transition group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/30">
                📑
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-900 dark:text-white group-hover:text-indigo-500 transition">
                  {sdvxCopied ? "✅ 곡명이 클립보드에 복사되었습니다!" : "SDVX.in CHUNITHM 채보 시트"}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {sdvxCopied
                    ? "sdvx.in 검색창에 붙여넣기(Ctrl+V)하세요"
                    : "곡명을 복사한 후 sdvx.in 검색창에 붙여넣기하여 보면 확인"}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-500 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/30 shrink-0">
              {sdvxCopied ? "복사됨 ✓" : "복사 & 열기 ↗"}
            </span>
          </button>
        </div>

        {/* 5. 모달 하단 보조 액션들 */}
        <div className="flex gap-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <button
            onClick={handleCopyTitle}
            className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{copied ? "✅" : "📋"}</span>
            <span>{copied ? "곡명 복사 완료!" : "곡명 복사"}</span>
          </button>

          <a
            href={YOUTUBE_HUMEN_CHANNEL}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-red-500 transition text-center"
            title="チュウニズム譜面保管所 채널 열기"
          >
            譜面保管所 채널
          </a>

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-black transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
