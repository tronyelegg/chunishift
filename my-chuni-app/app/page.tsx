"use client";

import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithRedirect, User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ⚠️ 본인의 구조에 맞게 경로 확인
import { auth, db } from '../firebase'; 
import chunirecDB from '../data/chunimaru_db.json';
import SongCard from '../components/SongCard';

const difficultyMap: Record<string, string> = {
  "Basic": "BAS",
  "Advanced": "ADV",
  "Expert": "EXP",
  "Master": "MAS",
  "Ultima": "ULT"
};

function getConstant(songData: any) {
  const dbArray = Array.isArray(chunirecDB) ? chunirecDB : (chunirecDB as any).songs || [];
  const song = dbArray.find((s: any) => (songData.idx && s.idx === songData.idx) || (s.title === songData.title));
  if (!song) return null; 
  
  const diffKey = difficultyMap[songData.difficulty];
  const diffData = song.charts ? song.charts[diffKey] : null;

  if (diffData) {
    if (diffData.const > 0) return diffData.const;
    else if (diffData.level > 0) return diffData.level;
  }
  return null;
}

function calculateTrackRating(constant: number, score: number) {
  let base = Math.round(constant * 100);
  let bonus = 0;
  if (score >= 1009000) bonus = 215;
  else if (score >= 1007500) bonus = 200 + Math.floor((score - 1007500) / 100);
  else if (score >= 1005000) bonus = 150 + Math.floor((score - 1005000) / 50);
  else if (score >= 1000000) bonus = 100 + Math.floor((score - 1000000) / 100);
  else if (score >= 990000) bonus = 60 + Math.floor((score - 990000) / 250);
  else if (score >= 975000) bonus = 0 + Math.floor((score - 975000) / 250);
  else if (score >= 950000) bonus = -167 + Math.floor((score - 950000) / 150);
  else if (score >= 925000) bonus = -334 + Math.floor((score - 925000) / 150);
  else if (score >= 900000) bonus = -500 + Math.floor((score - 900000) / 150);
  
  return Math.max(0, base + bonus) / 100;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null); 
  const [playerData, setPlayerData] = useState<any>(null);
  const [calculatedTotalRating, setCalculatedTotalRating] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 다크모드 초기 세팅
  useEffect(() => {
    if (document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return; 
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setPlayerData(docSnap.data());
      } catch (error) {}
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (!playerData) return;
    let totalSum = 0;
    let validSongCount = 0;
    const processSongs = (songs: any[]) => {
      if(!songs) return;
      songs.forEach((song) => {
        const constant = getConstant(song); 
        if (constant) {
          totalSum += calculateTrackRating(constant, song.score);
          validSongCount++;
        }
      });
    };

  // ⭐️ 새로 추가할 부분: 페이지가 열릴 때 로그인 상태를 감지하는 안테나
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // 방금 로그인하고 돌아왔거나, 이미 로그인되어 있는 경우
        setUser(currentUser);
      } else {
        // 로그인되어 있지 않은 경우
        setUser(null);
      }
    });

    // 컴포넌트가 꺼질 때 안테나 해제 (메모리 누수 방지)
    return () => unsubscribe();
  }, []);

    processSongs(playerData.best);
    processSongs(playerData.new);
    if (validSongCount > 0) setCalculatedTotalRating(Math.floor((totalSum / validSongCount) * 100) / 100);
  }, [playerData]);

  // 북마크릿 자동 저장 로직
  useEffect(() => {
    const receiveMessage = async (event: MessageEvent) => {
      if (!event.origin.includes("chunithm-net")) return;
      try {
        const parsedData = JSON.parse(event.data);
        if (parsedData && parsedData.appVersion) {
          setPlayerData(parsedData);
          if (user) await setDoc(doc(db, "users", user.uid), parsedData, { merge: true });
        }
      } catch (e) {}
    };
    window.addEventListener("message", receiveMessage);
    if (window.opener) {
      window.opener.postMessage("ready", "*");
      setTimeout(() => { window.opener.postMessage("ready", "*"); }, 300);
      setTimeout(() => { window.opener.postMessage("ready", "*"); }, 800);
    }
    return () => window.removeEventListener("message", receiveMessage);
  }, [user]);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      
      {/* 상단 네비게이션 & 다크모드 버튼 */}
      <nav className="w-full max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tight">CHUNITHM SHIFT</h1>
        <div className="flex gap-4 items-center">
          <a href="/export" className="text-sm font-bold hover:text-blue-500 transition">📸 사진관</a>
          <button onClick={toggleDarkMode} className="px-3 py-1.5 text-sm font-semibold rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition">
            {isDarkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      <main className="w-full max-w-6xl mx-auto px-4 pb-12">
        {!user ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <p className="mb-4 text-zinc-500">기록을 연동하려면 로그인하세요.</p>
            <button onClick={() => signInWithRedirect(auth, new GoogleAuthProvider())} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition">
              Google로 시작하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* 프로필 요약 카드 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 gap-6">
              
              {/* 왼쪽: 아바타 및 유저 정보 */}
              <div className="flex items-center gap-5">
                {/* 🌟 1. 캐릭터(아바타) 렌더링 부분 */}
                <div className="w-24 h-24 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex justify-center items-center border border-zinc-200 dark:border-zinc-700 shadow-inner overflow-hidden relative">
                  {playerData?.characterImage ? (
                    <img src={playerData.characterImage} alt="Avatar" className="w-full h-full object-cover scale-110" />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
                
                <div className="flex flex-col">
                  {/* 🏆 칭호 */}
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
                  
                  {/* 📛 닉네임 & 클래스 */}
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-3xl font-black tracking-widest text-zinc-900 dark:text-white leading-none">
                      {playerData?.name || "PLAYER"}
                    </h2>
                    {playerData?.classEmblem && (
                      <img src={playerData.classEmblem} alt="Class" className="h-8 object-contain drop-shadow-md" />
                    )}
                  </div>
                  
                  {/* 📊 하단 추가 정보 */}
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-400 tracking-wider">LEVEL</span>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        Lv. {playerData?.level || "?"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-400 tracking-wider">PLAY COUNT</span>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {playerData?.playCount || "0"} <span className="text-zinc-400 font-medium">({playerData?.currentPlayCount || "0"})</span>
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-400 tracking-wider">LAST PLAY</span>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {playerData?.lastPlayed ? playerData.lastPlayed.split('T')[0] : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 레이팅 스코어보드 */}
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

            {/* 데이터가 없을 때 */}
            {!playerData && (
              <div className="text-center py-20 text-zinc-500">
                저장된 기록이 없습니다.<br/>츄니즘 넷에서 북마크릿을 실행해 주세요.
              </div>
            )}

            {/* NEW & BEST 리스트 */}
            {playerData && (
              <>
                <section>
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span> NEW 20
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {playerData.new?.map((song: any, index: number) => {
                      const constant = getConstant(song);
                      const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                      const dbArray = Array.isArray(chunirecDB) ? chunirecDB : (chunirecDB as any).songs || [];
                      const songMeta = dbArray.find((s: any) => (song.idx && s.idx === song.idx) || (s.title === song.title));
                      
                      return <SongCard key={`new-${index}`} song={song} constant={constant} trackRating={trackRating} songId={songMeta?.img || null} />;
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-amber-500 rounded-full"></span> OTHERS (BEST 30)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {playerData.best?.map((song: any, index: number) => {
                      const constant = getConstant(song);
                      const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                      const dbArray = Array.isArray(chunirecDB) ? chunirecDB : (chunirecDB as any).songs || [];
                      const songMeta = dbArray.find((s: any) => (song.idx && s.idx === song.idx) || (s.title === song.title));
                      
                      return <SongCard key={`best-${index}`} song={song} constant={constant} trackRating={trackRating} songId={songMeta?.img || null} />;
                    })}
                  </div>
                </section>
              </>
            )}
            
          </div>
        )}
      </main>
    </div>
  );
}