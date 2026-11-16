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
} from "../lib/rating";
import type { PlayerData, ChartScore } from "../lib/types";

// 북마크릿 코드 (Vercel 배포 URL에서 최신 스크립트를 동적으로 로드하는 표준 방식)
const BOOKMARKLET_CODE = `javascript:(function(){const s=document.createElement('script');s.src='https://chunishift.vercel.app/chunimain.js?t='+Date.now();document.body.appendChild(s);})();`;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showBookmarkletModal, setShowBookmarkletModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

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

  // 평균 레이팅 계산 (useMemo로 메모이제이션)
  const calculatedTotalRating = useMemo(() => {
    if (!playerData) return 0;
    const allRecent = [...(playerData.best || []), ...(playerData.new || [])];
    return calculateAverageRating(allRecent);
  }, [playerData]);

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

    // 부모 창(츄니즘넷)이 있다면 준비 완료 신호 전송
    if (window.opener) {
      window.opener.postMessage("ready", "*");
      setTimeout(() => { window.opener?.postMessage("ready", "*"); }, 300);
      setTimeout(() => { window.opener?.postMessage("ready", "*"); }, 800);
    }

    return () => window.removeEventListener("message", receiveMessage);
  }, [user]);

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
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      <nav className="w-full max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tight">CHUNITHM SHIFT</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setShowBookmarkletModal(true)}
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            🔖 북마크릿 안내
          </button>

          <Link href="/export" className="text-sm font-bold hover:text-blue-500 transition">
            📸 사진관
          </Link>

          {user && (
            <button
              onClick={handleLogout}
              className="text-sm font-bold text-red-500 hover:text-red-600 transition cursor-pointer"
            >
              로그아웃
            </button>
          )}

          <button
            onClick={toggleDarkMode}
            className="px-3 py-1.5 text-sm font-semibold rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition cursor-pointer"
            aria-label="테마 전환"
          >
            {isDarkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      <main className="w-full max-w-6xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <p className="text-zinc-500 font-bold animate-pulse">로그인 상태를 확인하고 있습니다...</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <p className="mb-4 text-zinc-500">기록을 연동하려면 로그인하세요.</p>
            <button
              onClick={handleLogin}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition cursor-pointer"
            >
              Google로 시작하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* 프로필 카드 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 gap-6">
              <div className="flex items-center gap-5">
                <div className="w-24 h-24 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-center items-center border border-zinc-200 dark:border-zinc-700 shadow-inner overflow-hidden relative">
                  {playerData?.characterImage ? (
                    <img
                      src={playerData.characterImage}
                      alt="Avatar"
                      className="w-full h-full object-cover scale-110"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex flex-col gap-1 mb-2">
                    {playerData?.honor && (
                      <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 w-fit px-2 py-0.5 rounded-sm bg-zinc-50 dark:bg-zinc-800/50 shadow-sm">
                        {playerData.honor}
                      </div>
                    )}
                    {playerData?.subHonor && (
                      <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 w-fit px-1">
                        {playerData.subHonor}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-3xl font-black tracking-widest text-zinc-900 dark:text-white leading-none">
                      {playerData?.name || "PLAYER"}
                    </h2>
                    {playerData?.classEmblem && (
                      <img
                        src={playerData.classEmblem}
                        alt="Class"
                        className="h-8 object-contain drop-shadow-md"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-400 tracking-wider">LEVEL</span>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        Lv. {playerData?.level ?? "?"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-400 tracking-wider">PLAY COUNT</span>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {playerData?.playCount || "0"}{" "}
                        <span className="text-zinc-400 font-medium">
                          ({playerData?.currentPlayCount || "0"})
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-400 tracking-wider">LAST PLAY</span>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {playerData?.lastPlayed ? playerData.lastPlayed.split("T")[0] : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 레이팅 요약 */}
              <div className="flex items-center gap-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 px-7 py-5 rounded-2xl shadow-sm">
                <div className="text-center">
                  <div className="text-[10px] font-black text-zinc-400 tracking-widest mb-1">MAX RATING</div>
                  <div className="text-3xl font-black text-amber-500 tracking-tighter">
                    {playerData?.rating ? playerData.rating.toFixed(2) : "0.00"}
                  </div>
                </div>
                <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-800"></div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-zinc-400 tracking-widest mb-1">AVG RATING</div>
                  <div className="text-3xl font-black text-blue-500 tracking-tighter">
                    {calculatedTotalRating.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {!playerData && (
              <div className="text-center py-20 text-zinc-500">
                저장된 기록이 없습니다.<br />
                상단의 <strong>[🔖 북마크릿 안내]</strong>를 확인하여 츄니즘 넷에서 북마크릿을 실행해 주세요.
              </div>
            )}

            {playerData && (
              <>
                {/* NEW 20 */}
                <section>
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span> NEW 20
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                </section>

                {/* BEST 30 */}
                <section>
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-amber-500 rounded-full"></span> OTHERS (BEST 30)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                </section>
              </>
            )}
          </div>
        )}
      </main>

      {/* 북마크릿 설치 안내 모달 */}
      {showBookmarkletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black">CHUNITHM SHIFT 북마크릿 등록 방법</h3>
              <button
                onClick={() => setShowBookmarkletModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <ol className="text-sm space-y-3 text-zinc-600 dark:text-zinc-300 list-decimal list-inside mb-5">
              <li>아래의 북마크릿 코드를 복사합니다.</li>
              <li>브라우저 북마크바에서 아무 페이지나 북마크한 후, <strong>[수정]</strong>을 클릭합니다.</li>
              <li>이름을 <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">CHUNITHM SHIFT</code>로 지정하고, <strong>URL에 복사한 코드를 붙여넣기</strong>합니다.</li>
              <li>
                <strong>CHUNITHM-NET</strong>에 로그인한 상태에서 해당 북마크를 클릭하면 최신 CHUNITHM SHIFT 스크립트가 실행됩니다!
              </li>
            </ol>

            <div className="relative mb-4">
              <textarea
                readOnly
                value={BOOKMARKLET_CODE}
                rows={3}
                className="w-full text-xs font-mono bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 resize-none select-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyBookmarklet}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
              >
                {copied ? "✅ 복사 완료!" : "📋 북마크릿 코드 복사"}
              </button>
              <button
                onClick={() => setShowBookmarkletModal(false)}
                className="py-2.5 px-4 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-semibold rounded-xl text-sm transition cursor-pointer"
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
