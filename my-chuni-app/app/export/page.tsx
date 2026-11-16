"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { toPng } from "html-to-image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

import { auth, db } from "../../firebase";
import SongCard from "../../components/SongCard";
import { useDarkMode } from "../../hooks/useDarkMode";
import {
  getConstant,
  calculateTrackRating,
  findSongMeta,
  getRatingTier,
  calculateAverageRating,
} from "../../lib/rating";
import { getProxyUrl } from "../../lib/proxy";
import type { PlayerData, ChartScore } from "../../lib/types";

export default function ExportPage() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [showRating, setShowRating] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showPlayCount, setShowPlayCount] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setPlayerData(docSnap.data() as PlayerData);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const ratingTier = useMemo(() => {
    return getRatingTier(playerData?.rating || 0);
  }, [playerData?.rating]);

  const avgRating = useMemo(() => {
    if (!playerData) return 0;
    const all = [...(playerData.best || []), ...(playerData.new || [])];
    return calculateAverageRating(all);
  }, [playerData]);

  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const bgColor = isDarkMode ? "#090a0f" : "#f8fafc";
      const dataUrl = await toPng(printRef.current, {
        backgroundColor: bgColor,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `chunishift_${playerData?.name || "rating"}_${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error("캡처 에러:", error);
      alert("이미지를 생성하는 데 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-zinc-950/75 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-black text-sky-600 dark:text-sky-400 hover:text-sky-700 transition"
          >
            <span>←</span>
            <span>메인 대시보드로 돌아가기</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 hidden sm:inline">📸 사진관 (성과표 이미지 생성)</span>
            <button
              onClick={toggleDarkMode}
              className="p-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
              aria-label="테마 전환"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* 좌측 사이드바: 옵션 제어 패널 */}
        <aside className="w-full lg:w-72 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-zinc-200/90 dark:border-zinc-800/90 shrink-0 lg:sticky lg:top-24 z-10">
          <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⚙️</span>
            <span>출력 옵션</span>
          </h2>

          <div className="flex flex-col gap-3.5 mb-6 text-sm">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">레이팅 표시</span>
              <input
                type="checkbox"
                checked={showRating}
                onChange={(e) => setShowRating(e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">닉네임 표시</span>
              <input
                type="checkbox"
                checked={showName}
                onChange={(e) => setShowName(e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">플레이 카운트</span>
              <input
                type="checkbox"
                checked={showPlayCount}
                onChange={(e) => setShowPlayCount(e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>
          </div>

          <button
            onClick={handleDownload}
            disabled={isExporting || !playerData}
            className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>{isExporting ? "⏳ 캡처 중..." : "📥 고화질 이미지 다운로드"}</span>
          </button>

          <p className="text-[11px] text-zinc-400 text-center mt-3 leading-relaxed">
            2배율(Retina) 고해상도 PNG 파일로 렌더링됩니다.
          </p>
        </aside>

        {/* 우측: 캔버스 출력 뷰포트 */}
        {!playerData ? (
          <div className="flex-1 p-16 text-center text-zinc-500">데이터를 불러오는 중입니다...</div>
        ) : (
          <div className="flex-1 overflow-x-auto pb-6 w-full">
            <div className="w-fit mx-auto">
              {/* 이미지로 캡처되는 실제 영역 */}
              <div
                ref={printRef}
                style={{ width: "1200px" }}
                className="shrink-0 bg-slate-50 dark:bg-zinc-950 p-8 rounded-2xl relative border border-zinc-300/80 dark:border-zinc-800 shadow-xl transition-colors"
              >
                {/* 헤더 플레이트 배너 */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 mb-8 shadow-sm">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-sky-400 via-indigo-500 to-amber-400" />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex justify-center items-center shadow-md">
                        {playerData.characterImage ? (
                          <img
                            src={getProxyUrl(playerData.characterImage)}
                            crossOrigin="anonymous"
                            alt="Character"
                            className="w-full h-full object-cover scale-110"
                          />
                        ) : (
                          <span className="text-4xl">👤</span>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-black tracking-widest text-sky-500 uppercase">
                            CHUNITHM RECORD
                          </span>
                          {playerData.honor && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                              {playerData.honor}
                            </span>
                          )}
                        </div>

                        {showName && (
                          <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-black tracking-wider text-zinc-900 dark:text-white">
                              {playerData.name}
                            </h1>
                            {playerData.classEmblem && (
                              <img
                                src={getProxyUrl(playerData.classEmblem)}
                                crossOrigin="anonymous"
                                alt="Class"
                                className="h-7 object-contain drop-shadow-md"
                              />
                            )}
                          </div>
                        )}

                        {showPlayCount && (
                          <div className="flex items-center gap-3 text-xs text-zinc-500 font-semibold">
                            <span>Lv. {playerData.level}</span>
                            <span>•</span>
                            <span>Play Count: {playerData.playCount || 0}</span>
                            <span>•</span>
                            <span>Avg Rating: {avgRating.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right bg-zinc-50 dark:bg-zinc-950/70 px-7 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-end gap-1.5 mb-1">
                        <span className="text-[10px] font-black text-zinc-400 tracking-widest">MAX RATING</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${ratingTier.badgeClass}`}>
                          {ratingTier.tierName}
                        </span>
                      </div>
                      <div className={`text-4xl font-black tracking-tighter ${ratingTier.textClass}`}>
                        {showRating && playerData.rating ? playerData.rating.toFixed(2) : "**.**"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BEST 30 섹션 */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-lg font-black flex items-center gap-2 text-zinc-900 dark:text-white">
                      <span className="w-2.5 h-6 bg-amber-500 rounded-full" />
                      <span>BEST 30</span>
                    </h3>
                    <span className="text-xs font-bold text-zinc-400">
                      Top 30 Records
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2.5">
                    {playerData.best?.map((song: ChartScore, index: number) => {
                      const constant = getConstant(song);
                      const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                      const songMeta = findSongMeta(song);

                      return (
                        <SongCard
                          key={`export-best-${index}`}
                          song={song}
                          constant={constant}
                          trackRating={trackRating}
                          songId={songMeta?.img || null}
                          index={index}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* NEW 20 섹션 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-lg font-black flex items-center gap-2 text-zinc-900 dark:text-white">
                      <span className="w-2.5 h-6 bg-sky-500 rounded-full" />
                      <span>NEW 20</span>
                    </h3>
                    <span className="text-xs font-bold text-zinc-400">
                      Recent / New Version Records
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2.5">
                    {playerData.new?.map((song: ChartScore, index: number) => {
                      const constant = getConstant(song);
                      const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                      const songMeta = findSongMeta(song);

                      return (
                        <SongCard
                          key={`export-new-${index}`}
                          song={song}
                          constant={constant}
                          trackRating={trackRating}
                          songId={songMeta?.img || null}
                          index={index}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 티켓 감성의 푸터 라벨 */}
                <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs font-mono text-zinc-400 dark:text-zinc-600">
                  <span>GENERATED BY CHUNITHM SHIFT (chunishift.vercel.app)</span>
                  <span>{new Date().toISOString().replace("T", " ").substring(0, 19)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
