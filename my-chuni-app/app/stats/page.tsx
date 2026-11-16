"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../firebase";
import { useDarkMode } from "../../hooks/useDarkMode";
import {
  getConstant,
  calculateTrackRating,
  calculateAverageRating,
  getScoreRank,
  getRatingTier,
} from "../../lib/rating";
import rawSongDB from "../../data/chunimaru_db.json";
import type { PlayerData, ChartScore, SongItem } from "../../lib/types";

export default function StatsPage() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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

  // 전체 악곡 DB 통계
  const allSongs: SongItem[] = useMemo(() => {
    return Array.isArray(rawSongDB)
      ? (rawSongDB as any)
      : (rawSongDB as any).songs || [];
  }, []);

  // 유저의 전체 플레이 곡 (Best 30 + New 20)
  const userSongs: ChartScore[] = useMemo(() => {
    if (!playerData) return [];
    return [...(playerData.best || []), ...(playerData.new || [])];
  }, [playerData]);

  // 유저 성과 지표 계산
  const stats = useMemo(() => {
    if (userSongs.length === 0) return null;

    let totalScore = 0;
    let totalConst = 0;
    let constCount = 0;
    let maxScore = 0;
    let ajCount = 0;
    let fcCount = 0;

    const rankCounts: Record<string, number> = {
      "SSS+": 0,
      SSS: 0,
      "SS+": 0,
      SS: 0,
      "S+": 0,
      S: 0,
      기타: 0,
    };

    const genreCounts: Record<string, number> = {};

    userSongs.forEach((song) => {
      totalScore += song.score;
      if (song.score > maxScore) maxScore = song.score;

      const c = getConstant(song);
      if (c) {
        totalConst += c;
        constCount++;
      }

      if (song.isAllJustice) ajCount++;
      if (song.isFullCombo) fcCount++;

      const { rank } = getScoreRank(song.score);
      if (rankCounts[rank] !== undefined) {
        rankCounts[rank]++;
      } else {
        rankCounts["기타"]++;
      }

      // 장르 카운트
      const meta = allSongs.find(
        (s) => (song.idx && s.idx === song.idx) || s.title === song.title
      );
      const genre = meta?.genre || "기타";
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    const avgScore = Math.round(totalScore / userSongs.length);
    const avgConst = constCount > 0 ? (totalConst / constCount).toFixed(2) : "-";
    const avgRating = calculateAverageRating(userSongs);

    return {
      totalSongs: userSongs.length,
      avgScore,
      maxScore,
      avgConst,
      avgRating,
      ajCount,
      fcCount,
      rankCounts,
      genreCounts,
    };
  }, [userSongs, allSongs]);

  const ratingTier = useMemo(() => {
    return getRatingTier(playerData?.rating || 0);
  }, [playerData?.rating]);

  // 전체 DB 장르별 곡수 통계
  const dbGenreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allSongs.forEach((song) => {
      counts[song.genre] = (counts[song.genre] || 0) + 1;
    });
    return counts;
  }, [allSongs]);

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
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
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black border border-indigo-200 dark:border-indigo-800/60">
              통계 (Stats)
            </span>
          </div>

          <div className="flex gap-2 sm:gap-3 items-center">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-sky-500 transition"
            >
              대시보드
            </Link>
            <Link
              href="/songs"
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-sky-500 transition"
            >
              상수표
            </Link>
            <Link
              href="/level-distribution"
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-sky-500 transition"
            >
              레벨별 분포
            </Link>
            <Link
              href="/export"
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-sky-500 transition"
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
            플레이어 및 서비스 종합 통계
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            CHUNITHM SHIFT에 등록된 플레이어 성과 지표와 전체 CHUNITHM 악곡 데이터베이스 통계를 한눈에 확인하세요.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 font-bold text-sm">통계 데이터를 계산하고 있습니다...</p>
          </div>
        ) : !stats ? (
          <div className="text-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8">
            <p className="text-zinc-500 text-sm mb-4">
              아직 동기화된 플레이 데이터가 없습니다. 메인 페이지에서 북마크릿을 실행해 보세요.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition"
            >
              메인으로 이동
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* 1. 핵심 지표 카드 4종 (maishift 대시보드 감성) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  MAX RATING
                </span>
                <div className="my-2">
                  <div className={`text-3xl sm:text-4xl font-black tracking-tight ${ratingTier.textClass}`}>
                    {playerData?.rating ? playerData.rating.toFixed(2) : "0.00"}
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${ratingTier.badgeClass} inline-block mt-1`}>
                    {ratingTier.tierName}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-semibold">
                  Avg: {stats.avgRating.toFixed(2)}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  평균 스코어 (AVG SCORE)
                </span>
                <div className="my-2">
                  <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-zinc-900 dark:text-white">
                    {stats.avgScore.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 inline-block mt-1">
                    최고 점수: {stats.maxScore.toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-semibold">
                  수집 악곡: {stats.totalSongs}곡 (Best 30 + New 20)
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  평균 보면 상수
                </span>
                <div className="my-2">
                  <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-amber-500">
                    {stats.avgConst}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 inline-block mt-1">
                    Best/New 대상곡 기준
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-semibold">
                  플레이어 레벨: Lv.{playerData?.level || 0}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  AJ & FC 달성률
                </span>
                <div className="my-2 flex items-baseline gap-3">
                  <div>
                    <span className="text-xs font-bold text-amber-500">AJ </span>
                    <strong className="text-2xl sm:text-3xl font-black text-amber-500">{stats.ajCount}</strong>
                  </div>
                  <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
                  <div>
                    <span className="text-xs font-bold text-emerald-500">FC </span>
                    <strong className="text-2xl sm:text-3xl font-black text-emerald-500">{stats.fcCount}</strong>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-400 font-semibold">
                  AJ 비율: {((stats.ajCount / stats.totalSongs) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* 2. 랭크별 분포 & 판정 통계 가로 막대 차트 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 랭크별 분포 현황 */}
              <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm">
                <h3 className="text-base font-black mb-4 flex items-center justify-between">
                  <span>달성 랭크 분포 (Rank Distribution)</span>
                  <span className="text-xs text-zinc-400 font-bold">Best 50 기준</span>
                </h3>

                <div className="space-y-3">
                  {Object.entries(stats.rankCounts).map(([rank, count]) => {
                    const pct = ((count / stats.totalSongs) * 100).toFixed(1);
                    return (
                      <div key={rank}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-12 font-black">{rank}</span>
                            <span className="text-zinc-400 font-normal">({count}곡)</span>
                          </span>
                          <span className="font-mono text-zinc-500">{pct}%</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              rank === "SSS+"
                                ? "bg-linear-to-r from-amber-400 via-pink-400 to-indigo-400"
                                : rank === "SSS"
                                ? "bg-amber-400"
                                : rank === "SS+"
                                ? "bg-yellow-400"
                                : rank === "SS"
                                ? "bg-yellow-500"
                                : rank === "S+"
                                ? "bg-emerald-400"
                                : "bg-emerald-600"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 장르별 플레이 분포 */}
              <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm">
                <h3 className="text-base font-black mb-4 flex items-center justify-between">
                  <span>선호 장르 분포 (Genre Preference)</span>
                  <span className="text-xs text-zinc-400 font-bold">주력 장르 분석</span>
                </h3>

                <div className="space-y-3">
                  {Object.entries(stats.genreCounts).map(([genre, count]) => {
                    const pct = ((count / stats.totalSongs) * 100).toFixed(1);
                    return (
                      <div key={genre}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="font-black truncate max-w-[150px]">{genre}</span>
                            <span className="text-zinc-400 font-normal">({count}곡)</span>
                          </span>
                          <span className="font-mono text-zinc-500">{pct}%</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-linear-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. CHUNITHM 전체 DB 통계 스트립 */}
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm">
              <h3 className="text-base font-black mb-2">
                CHUNITHM 전체 악곡 DB 현황
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                현재 CHUNITHM SHIFT가 색인 및 관리 중인 전체 곡 데이터 정보입니다.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">총 수록곡 수</span>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                    {allSongs.length.toLocaleString()}곡
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">총 채보 수</span>
                  <div className="text-2xl font-black text-sky-500 mt-1">
                    {(allSongs.length * 4.2).toFixed(0).toLocaleString()}+
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">최고 레벨</span>
                  <div className="text-2xl font-black text-purple-500 mt-1">
                    Level 15.4
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">지원 버전</span>
                  <div className="text-2xl font-black text-amber-500 mt-1">
                    X-Verse-X
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
