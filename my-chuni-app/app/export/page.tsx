"use client";

import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// ⚠️ 본인의 경로에 맞게 확인
import { auth, db } from "../../firebase";
import chunirecDB from "../../data/chunimaru_db.json";
import SongCard from "../../components/SongCard"; 

const difficultyMap: Record<string, string> = { "Basic": "BAS", "Advanced": "ADV", "Expert": "EXP", "Master": "MAS", "Ultima": "ULT" };

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

export default function ExportPage() {
  const [playerData, setPlayerData] = useState<any>(null);
  const [showRating, setShowRating] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showPlayCount, setShowPlayCount] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setPlayerData(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDownload = async () => {
    if (!printRef.current) return;
    try {
      const bgColor = isDarkMode ? "#09090b" : "#f4f4f5";
      
      // 💡 [수정] 캡처 잘림 방지를 위해 가로축 옵션(windowWidth) 강제 고정
      const canvas = await html2canvas(printRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: bgColor,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200 
      });
      
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `chunithm_rating_${new Date().getTime()}.png`;
      link.click();
    } catch (error) {
      alert("이미지를 생성하는 데 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      <nav className="w-full max-w-7xl mx-auto px-4 py-4 md:px-8 flex justify-between items-center">
        <a href="/" className="text-lg font-black hover:text-blue-500 transition">← 메인으로</a>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 items-start">
        
        {/* 좌측: 설정 패널 */}
        <div className="w-full md:w-72 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 shrink-0 sticky top-8 z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold dark:text-white">사진관 설정</h2>
            <button onClick={toggleDarkMode} className="text-xl p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition">
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
          
          <div className="flex flex-col gap-4 mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={showRating} onChange={(e) => setShowRating(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium dark:text-zinc-300">레이팅 보여짐</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium dark:text-zinc-300">닉네임 보여짐</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={showPlayCount} onChange={(e) => setShowPlayCount(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium dark:text-zinc-300">플레이 카운트 보여짐</span>
            </label>
          </div>
          <button onClick={handleDownload} className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">
            <span>📥 이미지 다운로드</span>
          </button>
        </div>

        {/* 우측: 캡처 프리뷰 영역 */}
        {!playerData ? (
          <div className="flex-1 p-10 text-center text-zinc-500">데이터를 불러오는 중입니다...</div>
        ) : (
          <div className="flex-1 overflow-x-auto pb-4">
            {/* 💡 [수정] w-fit을 추가하여 가로 스크롤 부모 안에서도 자식 크기가 1100px로 완벽히 펴지도록 강제 */}
            <div className="w-fit">
              <div ref={printRef} style={{ width: "1100px" }} className="shrink-0 bg-zinc-100 dark:bg-zinc-950 p-10 rounded-xl relative transition-colors duration-300">
                
                {/* 헤더 */}
                <div className="flex justify-between items-center border-b border-zinc-300 dark:border-zinc-800 pb-6 mb-8">
                  <div className="flex items-center gap-6">
                    {/* 캐릭터 아바타 (crossOrigin 속성 제거됨) */}
                    <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex justify-center items-center shadow-lg relative">
                      {playerData.characterImage ? (
                        <img src={playerData.characterImage} alt="Character" className="w-full h-full object-cover scale-110" />
                      ) : (
                        <span className="text-4xl">👤</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-center py-2">
                      <h1 className="text-4xl font-black tracking-widest text-zinc-900 dark:text-white mb-2">CHUNITHM RECORD</h1>
                      {showName && (
                        <div className="flex items-center gap-3">
                          <p className="text-zinc-500 dark:text-zinc-400 text-lg">Player: <span className="font-bold text-zinc-900 dark:text-white">{playerData.name}</span></p>
                          {/* 클래스 휘장 (crossOrigin 속성 제거됨) */}
                          {playerData.classEmblem && <img src={playerData.classEmblem} alt="Class" className="h-6 object-contain drop-shadow-md" />}
                        </div>
                      )}
                      {showPlayCount && <p className="text-zinc-500 text-sm mt-1">Lv. {playerData.level} / Play Count: {playerData.playCount || 0}</p>}
                    </div>
                  </div>
                  
                  {/* 레이팅 */}
                  <div className="text-right bg-white dark:bg-zinc-900 px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="text-sm font-bold text-amber-500 tracking-widest mb-1">MAX RATING</div>
                    <div className="text-5xl font-black text-zinc-900 dark:text-white">
                      {showRating && playerData.rating ? playerData.rating.toFixed(2) : "**.**"}
                    </div>
                  </div>
                </div>

                {/* BEST 30 */}cd
                <div className="mb-10">
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
                    <span className="w-2 h-6 bg-amber-500 rounded-full"></span> BEST 30
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {playerData.best?.map((song: any, index: number) => {
                      const constant = getConstant(song);
                      const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                      const dbArray = Array.isArray(chunirecDB) ? chunirecDB : (chunirecDB as any).songs || [];
                      const songMeta = dbArray.find((s: any) => (song.idx && s.idx === song.idx) || (s.title === song.title));
                      
                      return <SongCard key={`best-${index}`} song={song} constant={constant} trackRating={trackRating} songId={songMeta?.img || null} />;
                    })}
                  </div>
                </div>

                {/* NEW FRAME */}
                <div className="mb-6">
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span> NEW 20
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {playerData.new?.map((song: any, index: number) => {
                      const constant = getConstant(song);
                      const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                      const dbArray = Array.isArray(chunirecDB) ? chunirecDB : (chunirecDB as any).songs || [];
                      const songMeta = dbArray.find((s: any) => (song.idx && s.idx === song.idx) || (s.title === song.title));
                      
                      return <SongCard key={`new-${index}`} song={song} constant={constant} trackRating={trackRating} songId={songMeta?.img || null} />;
                    })}
                  </div>
                </div>

                <div className="mt-12 pt-4 border-t border-zinc-300 dark:border-zinc-800 text-right text-zinc-400 dark:text-zinc-600 text-sm font-bold tracking-widest">
                  Generated by my-chuni-app
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}