"use client";

import { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

import { auth, db } from "../../firebase";
import SongCard from "../../components/SongCard";
import { useDarkMode } from "../../hooks/useDarkMode";
import { getConstant, calculateTrackRating, findSongMeta } from "../../lib/rating";
import { getProxyUrl } from "../../lib/proxy";
import type { PlayerData, ChartScore } from "../../lib/types";

export default function ExportPage() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [showRating, setShowRating] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showPlayCount, setShowPlayCount] = useState(true);
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

  const handleDownload = async () => {
    if (!printRef.current) return;
    try {
      const bgColor = isDarkMode ? "#09090b" : "#f4f4f5";
      const dataUrl = await toPng(printRef.current, {
        backgroundColor: bgColor,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `chunithm_rating_${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error("캡처 에러:", error);
      alert("이미지를 생성하는 데 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <nav className="w-full max-w-7xl mx-auto px-4 py-4 md:px-8 flex justify-between items-center">
        <Link href="/" className="text-lg font-black hover:text-blue-500 transition">
          ← 메인으로
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 items-start">
        {/* 제어 패널 */}
        <div className="w-full md:w-72 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 shrink-0 sticky top-8 z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold dark:text-white">사진관 설정</h2>
            <button
              onClick={toggleDarkMode}
              className="text-xl p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition"
              aria-label="테마 전환"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showRating}
                onChange={(e) => setShowRating(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm font-medium dark:text-zinc-300">레이팅 표시</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showName}
                onChange={(e) => setShowName(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm font-medium dark:text-zinc-300">닉네임 표시</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPlayCount}
                onChange={(e) => setShowPlayCount(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm font-medium dark:text-zinc-300">플레이 카운트 표시</span>
            </label>
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            <span>📥 이미지 다운로드</span>
          </button>
        </div>

        {/* 출력 캔버스 */}
        {!playerData ? (
          <div className="flex-1 p-10 text-center text-zinc-500">데이터를 불러오는 중입니다...</div>
        ) : (
          <div className="flex-1 overflow-x-auto pb-4">
            <div className="w-fit">
              <div
                ref={printRef}
                style={{ width: "1100px" }}
                className="shrink-0 bg-zinc-100 dark:bg-zinc-950 p-10 rounded-xl relative transition-colors duration-300"
              >
                {/* 헤더 */}
                <div className="flex justify-between items-center border-b border-zinc-300 dark:border-zinc-800 pb-6 mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex justify-center items-center shadow-lg relative">
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

                    <div className="flex flex-col justify-center py-2">
                      <h1 className="text-4xl font-black tracking-widest text-zinc-900 dark:text-white mb-2">
                        CHUNITHM RECORD
                      </h1>
                      {showName && (
                        <div className="flex items-center gap-3">
                          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                            Player: <span className="font-bold text-zinc-900 dark:text-white">{playerData.name}</span>
                          </p>
                          {playerData.classEmblem && (
                            <img
                              src={getProxyUrl(playerData.classEmblem)}
                              crossOrigin="anonymous"
                              alt="Class"
                              className="h-6 object-contain drop-shadow-md"
                            />
                          )}
                        </div>
                      )}
                      {showPlayCount && (
                        <p className="text-zinc-500 text-sm mt-1">
                          Lv. {playerData.level} / Play Count: {playerData.playCount || 0}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right bg-white dark:bg-zinc-900 px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="text-sm font-bold text-amber-500 tracking-widest mb-1">MAX RATING</div>
                    <div className="text-5xl font-black text-zinc-900 dark:text-white">
                      {showRating && playerData.rating ? playerData.rating.toFixed(2) : "**.**"}
                    </div>
                  </div>
                </div>

                {/* BEST 30 */}
                <div className="mb-10">
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
                    <span className="w-2 h-6 bg-amber-500 rounded-full"></span> BEST 30
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {playerData.best?.map((song: ChartScore, index: number) => {
                      const constant = getConstant(song);
                      const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                      const songMeta = findSongMeta(song);

                      return (
                        <SongCard
                          key={`best-${index}`}
                          song={song}
                          constant={constant}
                          trackRating={trackRating}
                          songId={songMeta?.img || null}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* NEW 20 */}
                <div className="mb-6">
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span> NEW 20
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {playerData.new?.map((song: ChartScore, index: number) => {
                      const constant = getConstant(song);
                      const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                      const songMeta = findSongMeta(song);

                      return (
                        <SongCard
                          key={`new-${index}`}
                          song={song}
                          constant={constant}
                          trackRating={trackRating}
                          songId={songMeta?.img || null}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="mt-12 pt-4 border-t border-zinc-300 dark:border-zinc-800 text-right text-zinc-400 dark:text-zinc-600 text-sm font-bold tracking-widest">
                  Generated by CHUNITHM SHIFT
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
