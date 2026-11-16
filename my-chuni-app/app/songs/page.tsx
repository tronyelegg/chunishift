"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useDarkMode } from "../../hooks/useDarkMode";
import { getProxyUrl } from "../../lib/proxy";
import { matchSongSearch, SONG_ALIASES } from "../../lib/koreanSearch";
import rawSongDB from "../../data/chunimaru_db.json";
import type { SongItem, DiffKey } from "../../lib/types";

const ALL_GENRES = [
  "ALL",
  "POPS&ANIME",
  "niconico",
  "東方Project",
  "VARIETY",
  "イロドリミドリ",
  "ゲキマイ",
  "ORIGINAL",
];

const ALL_LEVELS = [
  "ALL",
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
  "10+",
];

type TargetDiff = "ALL" | "MAS" | "ULT" | "EXP" | "ADV" | "BAS";
type SortOption = "const_desc" | "const_asc" | "title" | "bpm";

const diffColorMap: Record<DiffKey, { bg: string; text: string; label: string }> = {
  BAS: { bg: "bg-emerald-600 text-white", text: "text-emerald-500", label: "BASIC" },
  ADV: { bg: "bg-amber-500 text-zinc-950 font-black", text: "text-amber-500", label: "ADVANCED" },
  EXP: { bg: "bg-red-500 text-white", text: "text-red-500", label: "EXPERT" },
  MAS: { bg: "bg-purple-600 text-white", text: "text-purple-400", label: "MASTER" },
  ULT: { bg: "bg-zinc-950 text-amber-400 border border-amber-400/60 font-black", text: "text-amber-400", label: "ULTIMA" },
};

export default function SongsPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [targetDiff, setTargetDiff] = useState<TargetDiff>("MAS");
  const [sortOption, setSortOption] = useState<SortOption>("const_desc");
  const [pageLimit, setPageLimit] = useState(36);
  const [selectedSong, setSelectedSong] = useState<SongItem | null>(null);

  // 전체 곡 목록 추출
  const songs: SongItem[] = useMemo(() => {
    return Array.isArray(rawSongDB)
      ? (rawSongDB as any)
      : (rawSongDB as any).songs || [];
  }, []);

  // 필터 및 검색 적용
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      // 1. 장르 필터
      if (selectedGenre !== "ALL" && song.genre !== selectedGenre) {
        return false;
      }

      // 2. 레벨 필터
      if (selectedLevel !== "ALL" && song.charts) {
        if (targetDiff !== "ALL") {
          const chart = song.charts[targetDiff];
          if (!chart || chart.levelDisplay !== selectedLevel) return false;
        } else {
          // 어느 한 난이도라도 해당 레벨이 있는지 확인
          const hasLevel = Object.values(song.charts).some(
            (c) => c && c.levelDisplay === selectedLevel
          );
          if (!hasLevel) return false;
        }
      }

      // 3. 한글/영어/일어 및 음차 통합 검색
      if (searchQuery.trim() !== "") {
        if (!matchSongSearch(song, searchQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [songs, selectedGenre, selectedLevel, targetDiff, searchQuery]);

  // 정렬 적용
  const sortedSongs = useMemo(() => {
    const list = [...filteredSongs];

    const getCompareConst = (song: SongItem) => {
      if (!song.charts) return 0;
      if (targetDiff !== "ALL" && song.charts[targetDiff]) {
        return song.charts[targetDiff]?.const || 0;
      }
      // targetDiff가 ALL이면 MAS 상수 우선
      return song.charts.MAS?.const || song.charts.EXP?.const || 0;
    };

    return list.sort((a, b) => {
      if (sortOption === "const_desc") {
        return getCompareConst(b) - getCompareConst(a);
      }
      if (sortOption === "const_asc") {
        return getCompareConst(a) - getCompareConst(b);
      }
      if (sortOption === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortOption === "bpm") {
        return (b.bpm || 0) - (a.bpm || 0);
      }
      return 0;
    });
  }, [filteredSongs, sortOption, targetDiff]);

  // 페이지네이션 슬라이스
  const visibleSongs = useMemo(() => {
    return sortedSongs.slice(0, pageLimit);
  }, [sortedSongs, pageLimit]);

  // 검색 조건 변경 시 페이지 리셋
  useEffect(() => {
    setPageLimit(36);
  }, [searchQuery, selectedGenre, selectedLevel, targetDiff, sortOption]);

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      {/* 상단 Sticky 헤더 */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-zinc-950/75 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-lg font-black tracking-tighter bg-linear-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent"
            >
              CHUNITHM SHIFT
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-black border border-sky-200 dark:border-sky-800/60">
              상수표
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
        {/* 상단 타이틀 & 검색창 */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            CHUNITHM 보면 상수표
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            CHUNITHM 전체 1,500여 곡의 난이도별 세부 상수(Internal Constant)를 검색하세요.
            <br className="hidden sm:inline" />
            나무위키 한국어 번역명, 약칭 및 발음 음차(예: <strong>엔드마크, 천본앵, 프다, 샤를, 이카즈치</strong>)로도 검색 가능합니다.
          </p>

          {/* 대형 검색창 */}
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-400">
              🔍
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="곡 제목, 아티스트, 한국어 번역명, 발음 음차로 검색..."
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 outline-none text-sm font-bold shadow-xs transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 필터 컨트롤 패널 (maishift 스타일) */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm mb-6 flex flex-col gap-4">
          {/* 1. 난이도 기준 선택 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-400 w-16 shrink-0">난이도</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["MAS", "ULT", "EXP", "ADV", "BAS", "ALL"] as TargetDiff[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setTargetDiff(diff)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    targetDiff === diff
                      ? diff === "MAS"
                        ? "bg-purple-600 text-white shadow-xs"
                        : diff === "ULT"
                        ? "bg-zinc-950 text-amber-400 border border-amber-400 shadow-xs"
                        : diff === "EXP"
                        ? "bg-red-500 text-white shadow-xs"
                        : "bg-sky-500 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {diff === "ALL" ? "전체 난이도" : diff}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 레벨 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-400 w-16 shrink-0">레벨</span>
            <div className="flex items-center gap-1 flex-wrap">
              {ALL_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    selectedLevel === lvl
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 장르 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-400 w-16 shrink-0">장르</span>
            <div className="flex items-center gap-1 flex-wrap">
              {ALL_GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    selectedGenre === genre
                      ? "bg-indigo-600 text-white shadow-xs font-black"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {genre === "ALL" ? "전체 장르" : genre}
                </button>
              ))}
            </div>
          </div>

          {/* 하단 바: 정렬 옵션 & 검색 결과 수 */}
          <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-xs">
            <span className="text-zinc-500 font-semibold">
              총 <strong className="text-sky-500 font-black">{filteredSongs.length}</strong>개 곡 검색됨
            </span>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-bold">정렬:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="const_desc">상수 높은순</option>
                <option value="const_asc">상수 낮은순</option>
                <option value="title">곡명 가나다/ABC순</option>
                <option value="bpm">BPM 높은순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 곡 카드 목록 그리드 */}
        {sortedSongs.length === 0 ? (
          <div className="text-center py-24 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm font-bold text-zinc-500">
              일치하는 곡을 찾을 수 없습니다.
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              다른 검색어(한국어 음차, 원제)나 필터 조건을 변경해 보세요.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {visibleSongs.map((song) => {
                const aliases = SONG_ALIASES[song.title];
                const primaryAlias = aliases && aliases.length > 0 ? aliases[0] : null;

                return (
                  <div
                    key={song.id || song.idx}
                    onClick={() => setSelectedSong(song)}
                    className="group relative flex flex-col justify-between p-3 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200/90 dark:border-zinc-800/90 hover:border-sky-500/60 dark:hover:border-sky-500/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
                  >
                    {/* 상단: 자켓 + 곡 기본 정보 */}
                    <div className="flex gap-3 items-start mb-3">
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 shadow-sm relative">
                        {song.img ? (
                          <img
                            src={getProxyUrl(
                              `https://chunithm-net-eng.com/mobile/img/${song.img}.jpg`
                            )}
                            alt={song.title}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xl font-bold">
                            ♪
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {song.genre}
                          </span>
                          {song.bpm ? (
                            <span className="text-[10px] font-mono text-zinc-400">
                              BPM {song.bpm}
                            </span>
                          ) : null}
                        </div>

                        <h2
                          title={song.title}
                          className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white truncate leading-tight"
                        >
                          {song.title}
                        </h2>

                        {primaryAlias && (
                          <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 truncate mt-0.5">
                            {primaryAlias}
                          </p>
                        )}

                        <p
                          title={song.artist}
                          className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5"
                        >
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    {/* 하단: 난이도별 상수 뱃지 스트립 (maishift 스타일) */}
                    <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-4 sm:grid-cols-5 gap-1">
                      {(["BAS", "ADV", "EXP", "MAS", "ULT"] as DiffKey[]).map((diff) => {
                        const chart = song.charts ? song.charts[diff] : null;
                        if (!chart && diff === "ULT") return null;

                        const style = diffColorMap[diff];
                        const constVal = chart?.const ? chart.const.toFixed(1) : chart?.level ? `${chart.level}.0` : "-";

                        return (
                          <div
                            key={diff}
                            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg ${
                              chart ? "bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/60" : "opacity-30"
                            }`}
                          >
                            <span className="text-[8px] font-black tracking-tight text-zinc-400 uppercase">
                              {diff}
                            </span>
                            <span
                              className={`text-[11px] font-mono font-black ${
                                chart ? style.text : "text-zinc-400"
                              }`}
                            >
                              {constVal}
                            </span>
                            <span className="text-[8px] font-semibold text-zinc-400">
                              {chart?.levelDisplay || "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 더보기 버튼 */}
            {visibleSongs.length < sortedSongs.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setPageLimit((prev) => prev + 36)}
                  className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-md transition-all cursor-pointer"
                >
                  더 보기 ({visibleSongs.length} / {sortedSongs.length})
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 곡 상세 모달 */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedSong(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            {/* 모달 상단 곡 정보 */}
            <div className="flex gap-4 items-start mb-6">
              <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md">
                {selectedSong.img ? (
                  <img
                    src={getProxyUrl(
                      `https://chunithm-net-eng.com/mobile/img/${selectedSong.img}.jpg`
                    )}
                    crossOrigin="anonymous"
                    alt={selectedSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-400">
                    ♪
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 inline-block mb-1">
                  {selectedSong.genre}
                </span>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white truncate">
                  {selectedSong.title}
                </h3>
                {SONY_ALIASES_LIST(selectedSong.title) && (
                  <p className="text-xs font-bold text-sky-500 mt-0.5">
                    {SONY_ALIASES_LIST(selectedSong.title)}
                  </p>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                  {selectedSong.artist}
                </p>
              </div>
            </div>

            {/* 채보 난이도 상세 테이블 */}
            <div className="mb-6">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2.5">
                난이도별 보면 상세 (Chart Constants)
              </h4>
              <div className="space-y-2">
                {(["BAS", "ADV", "EXP", "MAS", "ULT"] as DiffKey[]).map((diff) => {
                  const chart = selectedSong.charts ? selectedSong.charts[diff] : null;
                  if (!chart && diff === "ULT") return null;

                  const style = diffColorMap[diff];

                  return (
                    <div
                      key={diff}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${style.bg}`}
                        >
                          {diff}
                        </span>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          표기 레벨: {chart?.levelDisplay || "-"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        {chart?.maxCombo ? (
                          <span className="text-zinc-400 text-[11px]">
                            {chart.maxCombo.toLocaleString()} Notes
                          </span>
                        ) : null}
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-zinc-400 font-sans font-bold">상수</span>
                          <span
                            className={`text-sm font-black ${
                              chart ? style.text : "text-zinc-400"
                            }`}
                          >
                            {chart?.const ? chart.const.toFixed(1) : chart?.level ? `${chart.level}.0` : "?"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setSelectedSong(null)}
              className="w-full py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-black transition cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SONY_ALIASES_LIST(title: string): string | null {
  const aliases = SONG_ALIASES[title];
  if (!aliases || aliases.length === 0) return null;
  return `한국어 통칭: ${aliases.join(", ")}`;
}
