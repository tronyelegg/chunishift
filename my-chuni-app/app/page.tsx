"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  User,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";
import SongCard from "../components/SongCard";
import { useDarkMode } from "../hooks/useDarkMode";
import {
  getConstant,
  calculateTrackRating,
  calculateAverageRating,
  findSongMeta,
  getRatingTier,
} from "../lib/rating";
import type { PlayerData, ChartScore } from "../lib/types";

// 북마크릿 코드
const BOOKMARKLET_CODE = `javascript:(function(){const s=document.createElement('script');s.src='https://chunishift.vercel.app/chunimain.js?t='+Date.now();document.body.appendChild(s);})();`;

type TabType = "all" | "best" | "new";
type SortType = "rating" | "score" | "constant";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showBookmarkletModal, setShowBookmarkletModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // 탭 및 정렬 상태 (maishift 스타일 컨트롤)
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [sortBy, setSortBy] = useState<SortType>("rating");

  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // 로그인 상태 및 리다이렉트 결과 확인
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setUser(result.user);
        }
      } catch (error) {
        console.error("리다이렉트 로그인 에러:", error);
      }
    };
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore에서 사용자 기록 로드
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setPlayerData(docSnap.data() as PlayerData);
        }
      } catch (error) {
        console.error("데이터 로드 에러:", error);
      }
    };
    fetchUserData();
  }, [user]);

  // 츄니즘넷 북마크릿 연동 (postMessage)
  useEffect(() => {
    const allowedOrigins = [
      "https://chunithm-net-eng.com",
      "https://new.chunithm-net.com",
    ];

    const receiveMessage = async (event: MessageEvent) => {
      if (!allowedOrigins.includes(event.origin)) return;

      try {
        const parsedData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (parsedData && parsedData.appVersion) {
          setPlayerData(parsedData);
          if (user) {
            await setDoc(doc(db, "users", user.uid), parsedData, { merge: true });
          }
        }
      } catch (e) {
        console.error("postMessage 파싱 실패:", e);
      }
    };

    window.addEventListener("message", receiveMessage);

    if (window.opener) {
      window.opener.postMessage("ready", "*");
      setTimeout(() => { window.opener?.postMessage("ready", "*"); }, 300);
      setTimeout(() => { window.opener?.postMessage("ready", "*"); }, 800);
    }

    return () => window.removeEventListener("message", receiveMessage);
  }, [user]);

  // 전체 평균 레이팅
  const calculatedTotalRating = useMemo(() => {
    if (!playerData) return 0;
    const allRecent = [...(playerData.best || []), ...(playerData.new || [])];
    return calculateAverageRating(allRecent);
  }, [playerData]);

  // 탭 및 정렬에 따른 표시 곡 리스트
  const displayedSongs = useMemo(() => {
    if (!playerData) return [];
    let list: ChartScore[] = [];

    if (activeTab === "all") {
      list = [...(playerData.best || []), ...(playerData.new || [])];
    } else if (activeTab === "best") {
      list = [...(playerData.best || [])];
    } else {
      list = [...(playerData.new || [])];
    }

    return list.sort((a, b) => {
      const constA = getConstant(a) || 0;
      const constB = getConstant(b) || 0;
      const ratingA = calculateTrackRating(constA, a.score);
      const ratingB = calculateTrackRating(constB, b.score);

      if (sortBy === "rating") {
        return ratingB - ratingA;
      } else if (sortBy === "score") {
        return b.score - a.score;
      } else {
        return constB - constA;
      }
    });
  }, [playerData, activeTab, sortBy]);

  // 현재 탭의 통계 요약 (평균 상수, AJ/FC 카운트 등)
  const tabStats = useMemo(() => {
    if (displayedSongs.length === 0) return null;
    let totalScore = 0;
    let totalConst = 0;
    let constCount = 0;
    let ajCount = 0;
    let fcCount = 0;

    for (const song of displayedSongs) {
      totalScore += song.score;
      const c = getConstant(song);
      if (c) {
        totalConst += c;
        constCount++;
      }
      if (song.isAllJustice) ajCount++;
      if (song.isFullCombo) fcCount++;
    }

    return {
      avgScore: Math.round(totalScore / displayedSongs.length),
      avgConst: constCount > 0 ? (totalConst / constCount).toFixed(2) : "-",
      ajCount,
      fcCount,
      totalCount: displayedSongs.length,
    };
  }, [displayedSongs]);

  const ratingTier = useMemo(() => {
    return getRatingTier(playerData?.rating || 0);
  }, [playerData?.rating]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("로그인 시작 에러:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setPlayerData(null);
      alert("로그아웃 되었습니다.");
    } catch (error) {
      console.error("로그아웃 에러:", error);
    }
  };

  const handleCopyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  return (
    <div className="min-h-screen font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* 상단 Sticky Glassmorphism 네비게이션 바 */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-zinc-950/75 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-sky-500/20">
              CS
            </div>
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-black tracking-tighter bg-linear-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                CHUNITHM SHIFT
              </span>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                SCORE TRACKER
              </span>
            </Link>
          </div>

          <div className="flex gap-2 sm:gap-3 items-center">
            <button
              onClick={() => setShowBookmarkletModal(true)}
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>🔖</span>
              <span>북마크릿</span>
            </button>

            <Link
              href="/export"
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>📸</span>
              <span>사진관</span>
            </Link>

            <button
              onClick={toggleDarkMode}
              className="p-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              aria-label="테마 전환"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {user && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs sm:text-sm font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                로그아웃
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[55vh]">
            <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 font-bold text-sm animate-pulse">데이터를 불러오는 중입니다...</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center h-[55vh] text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-sky-500/20 mb-6">
              🎮
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">CHUNITHM 성과 트래커</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              CHUNITHM-NET 플레이 기록을 동기화하고,<br />
              Best 30 / New 20 레이팅 분석과 고화질 성과표를 생성해 보세요.
            </p>
            <button
              onClick={handleLogin}
              className="w-full py-3.5 px-6 bg-linear-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Google 계정으로 시작하기</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* 플레이어 프로필 네임플레이트 (maishift 아케이드 배너 스타일) */}
            <div className="relative overflow-hidden rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800/90 p-5 sm:p-7 shadow-lg shadow-zinc-900/5">
              {/* 상단 네온 스트라이프 라인 */}
              <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-sky-400 via-indigo-500 to-amber-400" />

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* 좌측: 아바타 + 칭호 + 닉네임 + 플레이 정보 */}
                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                  {/* 아바타 캐릭터 이미지 */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700/80 shadow-md">
                    {playerData?.characterImage ? (
                      <img
                        src={playerData.characterImage}
                        alt="Character"
                        className="w-full h-full object-cover scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    {/* 칭호 배너 (Honor) */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      {playerData?.honor ? (
                        <div className="px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-tight bg-linear-to-r from-amber-50 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-900/40 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 shadow-xs truncate max-w-xs">
                          {playerData.honor}
                        </div>
                      ) : null}
                      {playerData?.subHonor ? (
                        <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 truncate max-w-[200px]">
                          {playerData.subHonor}
                        </span>
                      ) : null}
                    </div>

                    {/* 플레이어 닉네임 + 클래스 엠블럼 */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-zinc-900 dark:text-white truncate">
                        {playerData?.name || "PLAYER"}
                      </h2>
                      {playerData?.classEmblem && (
                        <img
                          src={playerData.classEmblem}
                          alt="Class"
                          className="h-7 sm:h-8 object-contain drop-shadow-md"
                        />
                      )}
                    </div>

                    {/* 플레이 통계 뱃지 바 */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700/60">
                        Lv. {playerData?.level ?? "?"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700/60">
                        PLAY: {playerData?.playCount || 0}{" "}
                        <span className="text-zinc-400 font-normal">
                          ({playerData?.currentPlayCount || 0})
                        </span>
                      </span>
                      <span className="text-zinc-400 text-[11px] font-medium hidden sm:inline">
                        최근 플레이: {playerData?.lastPlayed ? playerData.lastPlayed.split("T")[0] : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 우측: 대형 레이팅 박스 */}
                <div className="flex items-center gap-4 sm:gap-6 bg-zinc-50/90 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 px-5 sm:px-7 py-4 rounded-xl shadow-inner w-full lg:w-auto justify-around lg:justify-end">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">
                        MAX RATING
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${ratingTier.badgeClass}`}>
                        {ratingTier.tierName}
                      </span>
                    </div>
                    <div className={`text-3xl sm:text-4xl font-black tracking-tighter ${ratingTier.textClass}`}>
                      {playerData?.rating ? playerData.rating.toFixed(2) : "0.00"}
                    </div>
                  </div>

                  <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800" />

                  <div className="text-center">
                    <div className="text-[10px] font-black text-zinc-400 tracking-widest mb-1 uppercase">
                      AVG RATING
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-sky-500 tracking-tighter">
                      {calculatedTotalRating.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!playerData ? (
              <div className="text-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                  아직 동기화된 플레이 데이터가 없습니다.<br />
                  CHUNITHM-NET에서 북마크릿을 실행해 데이터를 가져와 보세요.
                </p>
                <button
                  onClick={() => setShowBookmarkletModal(true)}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  북마크릿 가이드 보기
                </button>
              </div>
            ) : (
              <>
                {/* 탭 및 정렬 컨트롤러 바 (maishift 스타일) */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                  {/* 세그먼트 탭 */}
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950/80 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`px-3 py-1.5 text-xs font-black rounded-md transition-all cursor-pointer ${
                        activeTab === "all"
                          ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      전체 ({((playerData.best?.length || 0) + (playerData.new?.length || 0))})
                    </button>
                    <button
                      onClick={() => setActiveTab("best")}
                      className={`px-3 py-1.5 text-xs font-black rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "best"
                          ? "bg-amber-500 text-zinc-950 shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span>BEST 30</span>
                      <span className="text-[10px] opacity-80">({playerData.best?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("new")}
                      className={`px-3 py-1.5 text-xs font-black rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "new"
                          ? "bg-sky-500 text-white shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span>NEW 20</span>
                      <span className="text-[10px] opacity-80">({playerData.new?.length || 0})</span>
                    </button>
                  </div>

                  {/* 정렬 드롭다운 & 요약 미니 태그 */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {tabStats && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                        <span>평균 상수 <strong className="text-zinc-800 dark:text-zinc-200">{tabStats.avgConst}</strong></span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span>AJ <strong className="text-amber-500">{tabStats.ajCount}</strong></span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span>FC <strong className="text-emerald-500">{tabStats.fcCount}</strong></span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
                      <span className="text-[11px] font-bold text-zinc-400">정렬</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortType)}
                        className="bg-transparent text-xs font-bold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
                      >
                        <option value="rating" className="dark:bg-zinc-900">레이팅 순</option>
                        <option value="score" className="dark:bg-zinc-900">스코어 순</option>
                        <option value="constant" className="dark:bg-zinc-900">상수 순</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 곡 카드 반응형 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                  {displayedSongs.map((song: ChartScore, index: number) => {
                    const constant = getConstant(song);
                    const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                    const songMeta = findSongMeta(song);

                    return (
                      <SongCard
                        key={`${song.title}-${song.difficulty}-${index}`}
                        song={song}
                        constant={constant}
                        trackRating={trackRating}
                        songId={songMeta?.img || null}
                        index={index}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* 북마크릿 안내 모달 */}
      {showBookmarkletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <h3 className="text-base sm:text-lg font-black">CHUNITHM SHIFT 북마크릿 등록</h3>
              </div>
              <button
                onClick={() => setShowBookmarkletModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <ol className="text-xs sm:text-sm space-y-2.5 text-zinc-600 dark:text-zinc-300 list-decimal list-inside mb-4">
              <li>아래의 북마크릿 코드를 복사합니다.</li>
              <li>브라우저 북마크바에서 아무 페이지나 북마크한 후, <strong>[수정]</strong>을 누릅니다.</li>
              <li>이름을 <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sky-500 font-bold">CHUNITHM SHIFT</code>로 변경하고, <strong>URL에 복사한 코드를 붙여넣기</strong>합니다.</li>
              <li>
                <strong>CHUNITHM-NET</strong>에 로그인한 상태에서 해당 북마크를 클릭하면 즉시 동기화가 시작됩니다!
              </li>
            </ol>

            <div className="relative mb-4">
              <textarea
                readOnly
                value={BOOKMARKLET_CODE}
                rows={3}
                className="w-full text-xs font-mono bg-zinc-100 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 resize-none select-all focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyBookmarklet}
                className="flex-1 py-2.5 px-4 bg-linear-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
              >
                {copied ? "✅ 복사 완료!" : "📋 북마크릿 코드 복사"}
              </button>
              <button
                onClick={() => setShowBookmarkletModal(false)}
                className="py-2.5 px-4 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
