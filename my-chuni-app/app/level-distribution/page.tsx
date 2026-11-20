"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../firebase";
import { useDarkMode } from "../../hooks/useDarkMode";
import { getProxyUrl } from "../../lib/proxy";
import { getScoreRank, getConstant } from "../../lib/rating";
import rawSongDB from "../../data/chunimaru_db.json";
import type { PlayerData, ChartScore, SongItem } from "../../lib/types";
import SongDetailModal from "../../components/SongDetailModal";
import Footer from "../../components/Footer";
import BottomNav from "../../components/BottomNav";

const TARGET_LEVELS = [
  "15+",
  "15",
  "14+",
  "14",
  "13+",
  "13",
  "12+",
  "12",
  "11+",
  "11",
];

interface LevelSummary {
  levelDisplay: string;
  totalCharts: number;
  playedCount: number;
  sssPlusCount: number;
  sssCount: number;
  ajCount: number;
  fcCount: number;
  songs: {
    song: SongItem;
    chartConst: number;
    diff: "MAS" | "ULT" | "EXP";
    userScore?: ChartScore;
  }[];
}

export default function LevelDistributionPage() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("14+");
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // 모달 상태
  const [modalSong, setModalSong] = useState<SongItem | null>(null);
  const [modalScore, setModalScore] = useState<ChartScore | null>(null);
  const [modalDiff, setModalDiff] = useState<string>("MAS");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            setPlayerData(docSnap.data() as PlayerData);
          }
        } catch (e) {
          console.error("데이터 로드 에러:", e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const allSongs: SongItem[] = useMemo(() => {
    return Array.isArray(rawSongDB)
      ? (rawSongDB as any)
      : (rawSongDB as any).songs || [];
  }, []);

  // 유저의 플레이 곡 Map (제목+난이도 키)
  const userScoreMap = useMemo(() => {
    const map = new Map<string, ChartScore>();
    if (!playerData) return map;

    const all = [...(playerData.best || []), ...(playerData.new || [])];
    all.forEach((song) => {
      map.set(`${song.title}_${song.difficulty}`, song);
      if (song.idx) {
        map.set(`${song.idx}_${song.difficulty}`, song);
      }
    });
    return map;
  }, [playerData]);

  // 각 레벨별 통계 집계 (주로 MASTER, ULTIMA, EXPERT 고난이도 채보 기준)
  const levelDataMap = useMemo(() => {
    const map: Record<string, LevelSummary> = {};

    TARGET_LEVELS.forEach((lvl) => {
      map[lvl] = {
        levelDisplay: lvl,
        totalCharts: 0,
        playedCount: 0,
        sssPlusCount: 0,
        sssCount: 0,
        ajCount: 0,
        fcCount: 0,
        songs: [],
      };
    });

    allSongs.forEach((song) => {
      if (!song.charts) return;

      const diffsToCheck: ("MAS" | "ULT" | "EXP")[] = ["MAS", "ULT", "EXP"];
      diffsToCheck.forEach((diff) => {
        const chart = song.charts ? song.charts[diff] : null;
        if (!chart || !chart.levelDisplay) return;

        const lvl = chart.levelDisplay;
        if (map[lvl]) {
          const fullDiffName = diff === "MAS" ? "Master" : diff === "ULT" ? "Ultima" : "Expert";
          const userScore = userScoreMap.get(`${song.title}_${fullDiffName}`) ||
            (song.idx ? userScoreMap.get(`${song.idx}_${fullDiffName}`) : undefined);

          map[lvl].totalCharts++;
          if (userScore) {
            map[lvl].playedCount++;
            if (userScore.score >= 1009000) map[lvl].sssPlusCount++;
            if (userScore.score >= 1007500) map[lvl].sssCount++;
            if (userScore.isAllJustice) map[lvl].ajCount++;
            if (userScore.isFullCombo) map[lvl].fcCount++;
          }

          map[lvl].songs.push({
            song,
            chartConst: chart.const || chart.level || 0,
            diff,
            userScore,
          });
        }
      });
    });

    // 각 레벨별 곡들을 보면 상수 높은순으로 정렬
    Object.values(map).forEach((summary) => {
      summary.songs.sort((a, b) => b.chartConst - a.chartConst);
    });

    return map;
  }, [allSongs, userScoreMap]);

  const activeLevelSummary = levelDataMap[selectedLevel];

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 flex flex-col pb-20 sm:pb-0">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-zinc-950/75 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-lg font-black tracking-tighter bg-linear-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent"
            >
              CHUNITHM SHIFT
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-black border border-emerald-200 dark:border-emerald-800/60">
              레벨별 분포
            </span>
          </div>

          <div className="flex gap-2 sm:gap-3 items-center">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-sky-500 transition hidden md:inline-flex"
            >
              대시보드
            </Link>
            <Link
              href="/songs"
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-sky-500 transition hidden md:inline-flex"
            >
              상수표
            </Link>
            <Link
              href="/stats"
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-sky-500 transition hidden md:inline-flex"
            >
              통계
            </Link>
            <Link
              href="/export"
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-sky-500 transition hidden md:inline-flex"
            >
              사진관
            </Link>

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

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            레벨별 달성 현황 및 서열표 (Level Distribution)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            CHUNITHM 각 레벨 구간(11 ~ 15+)별 채보 달성률과 보면 상수별 서열표를 한눈에 파악하세요.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 font-bold text-sm">레벨별 통계를 집계하고 있습니다...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* 1. 레벨별 달성률 매트릭스 카드 그리드 (maishift 스타일) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {TARGET_LEVELS.map((lvl) => {
                const data = levelDataMap[lvl];
                const isSelected = selectedLevel === lvl;
                const sssPct = data.totalCharts > 0 ? ((data.sssCount / data.totalCharts) * 100).toFixed(0) : "0";
                const ajPct = data.totalCharts > 0 ? ((data.ajCount / data.totalCharts) * 100).toFixed(0) : "0";

                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-500/30"
                        : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xl font-black text-zinc-900 dark:text-white">
                        Lv. {lvl}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {data.totalCharts}곡
                      </span>
                    </div>

                    <div className="space-y-1 mb-3 text-[11px] font-bold">
                      <div className="flex justify-between text-amber-500">
                        <span>AJ</span>
                        <span>{data.ajCount}곡 ({ajPct}%)</span>
                      </div>
                      <div className="flex justify-between text-yellow-500">
                        <span>SSS 이상</span>
                        <span>{data.sssCount}곡 ({sssPct}%)</span>
                      </div>
                    </div>

                    {/* 프로그레스 바 */}
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${ajPct}%` }}
                        className="bg-amber-400 h-full"
                        title={`AJ: ${ajPct}%`}
                      />
                      <div
                        style={{ width: `${Math.max(0, Number(sssPct) - Number(ajPct))}%` }}
                        className="bg-yellow-400 h-full"
                        title={`SSS: ${sssPct}%`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 2. 선택된 레벨의 세부 곡 서열표 (상수 높은순 정렬) */}
            {activeLevelSummary && (
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <h2 className="text-xl font-black flex items-center gap-2">
                      <span className="text-sky-500 font-mono">Lv. {activeLevelSummary.levelDisplay}</span>
                      <span>상세 서열표</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      총 {activeLevelSummary.totalCharts}개 채보 • 상수 높은순으로 정렬됨 • 본인의 최고 기록이 자동 표시됩니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
                      <span>AJ: {activeLevelSummary.ajCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-yellow-400 inline-block" />
                      <span>SSS: {activeLevelSummary.sssCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-zinc-300 dark:bg-zinc-700 inline-block" />
                      <span>미플레이: {activeLevelSummary.totalCharts - activeLevelSummary.playedCount}</span>
                    </span>
                  </div>
                </div>

                {/* 서열표 곡 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {activeLevelSummary.songs.map(({ song, chartConst, diff, userScore }, index) => {
                    const isPlayed = !!userScore;
                    const { rank, badgeBg } = userScore ? getScoreRank(userScore.score) : { rank: "-", badgeBg: "" };

                    return (
                      <div
                        key={`${song.id || song.idx}-${diff}-${index}`}
                        onClick={() => {
                          setModalSong(song);
                          setModalScore(userScore || null);
                          setModalDiff(diff);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                          isPlayed
                            ? "bg-zinc-50/90 dark:bg-zinc-950/60 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs"
                            : "bg-white/40 dark:bg-zinc-900/40 border-zinc-200/40 dark:border-zinc-800/40 opacity-70 hover:opacity-100"
                        }`}
                      >
                        {/* 자켓 이미지 */}
                        <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative">
                          {song.img ? (
                            <img
                              src={getProxyUrl(
                                `https://chunithm-net-eng.com/mobile/img/${song.img}.jpg`
                              )}
                              crossOrigin="anonymous"
                              alt={song.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400">
                              ♪
                            </div>
                          )}
                          <span
                            className={`absolute bottom-0 inset-x-0 text-[7px] text-center font-black text-white ${
                              diff === "MAS"
                                ? "bg-purple-600"
                                : diff === "ULT"
                                ? "bg-zinc-950 text-amber-400 border-t border-amber-400/50"
                                : "bg-red-500"
                            }`}
                          >
                            {diff}
                          </span>
                        </div>

                        {/* 곡 메타 및 내 성과 */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-12">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black text-amber-500 font-mono">
                              상수 {chartConst.toFixed(1)}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-400 truncate max-w-[80px]">
                              {song.genre}
                            </span>
                          </div>

                          <div
                            title={song.title}
                            className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate"
                          >
                            {song.title}
                          </div>

                          {/* 내 기록 표시 라인 */}
                          <div className="flex items-center justify-between mt-auto">
                            {isPlayed ? (
                              <>
                                <span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                  {userScore.score.toLocaleString()}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className={`text-[8px] font-black px-1 rounded ${badgeBg}`}>
                                    {rank}
                                  </span>
                                  {userScore.isAllJustice ? (
                                    <span className="text-[8px] font-black px-1 rounded bg-amber-400 text-zinc-950">
                                      AJ
                                    </span>
                                  ) : userScore.isFullCombo ? (
                                    <span className="text-[8px] font-black px-1 rounded bg-emerald-500 text-white">
                                      FC
                                    </span>
                                  ) : null}
                                </div>
                              </>
                            ) : (
                              <span className="text-[10px] text-zinc-400 font-semibold">
                                아직 플레이 기록 없음
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 곡 상세 모달 (SDVX.in 및 YouTube @chunithm_humen 연동) */}
      <SongDetailModal
        isOpen={!!modalSong}
        onClose={() => {
          setModalSong(null);
          setModalScore(null);
        }}
        song={modalSong}
        userScore={modalScore}
        initialDiff={modalDiff}
      />

      {/* 데이터 출처 및 저작권 푸터 */}
      <Footer />

      {/* 모바일 하단 네비게이션 바 */}
      <BottomNav />
    </div>
  );
}
