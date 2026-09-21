"use client";

import { useEffect, useState } from 'react';

// 1. Firebase 인증 및 DB 관련 모듈 (GoogleAuthProvider 에러 해결)
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// 2. 최상위 폴더에 있는 firebase.js 파일 불러오기
import { auth, db } from '../firebase'; 

// 3. 곡 DB 불러오기 (chunirecDB is not defined 에러 해결)
// (주의: 파일명이 다르다면 실제 JSON 파일명으로 수정해 주세요)
import chunirecDB from '../data/chunimaru_db.json';

// 4. SongCard 컴포넌트 불러오기 (components 폴더 내에 있다고 가정)
import SongCard from '../components/SongCard';

// 💡 난이도 약자 변환기
const difficultyMap: Record<string, string> = {
  "Basic": "BAS",
  "Advanced": "ADV",
  "Expert": "EXP",
  "Master": "MAS",
  "Ultima": "ULT"
};

// 💡 곡 제목과 난이도로 상수(const)를 찾는 함수 (상수 불명 예외 처리)
function getConstant(title: string, difficulty: string) {
  // JSON 구조가 배열인지, { songs: [...] } 객체 형태인지에 따라 유연하게 대응
  const dbArray = Array.isArray(chunirecDB) ? chunirecDB : (chunirecDB as any).songs || [];
  const song = dbArray.find((s: any) => s.meta?.title === title || s.title === title);
  
  if (!song) return null; 
  
  const diffKey = difficultyMap[difficulty];
  const diffData = song.charts ? song.charts[diffKey] : null;

  if (diffData) {
    if (diffData.const > 0) {
      return diffData.const; // 정확한 상수가 있으면 반환
    } else if (diffData.level > 0) {
      return diffData.level; // 정확한 상수가 없으면 임시로 표기 레벨(level)을 반환
    }
  }
  return null;
}

// 💡 도달 레이팅에 따른 배경색과 글자색을 반환하는 함수
function getRatingStyle(rating: number) {
  if (rating >= 16.00) return { background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 20%, #a1c4fd 50%, #c2e9fb 100%)", color: "#333" }; 
  if (rating >= 15.25) return { background: "linear-gradient(135deg, #e5e5eb 0%, #ffffff 50%, #c2c2c8 100%)", color: "#333" }; 
  if (rating >= 14.50) return { background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)", color: "#fff" }; 
  if (rating >= 13.25) return { background: "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)", color: "#333" }; 
  if (rating >= 12.00) return { background: "linear-gradient(135deg, #d38312 0%, #a83279 100%)", color: "#fff" }; 
  if (rating >= 10.00) return { background: "linear-gradient(135deg, #9c27b0, #6a1b9a)", color: "#fff" }; 
  if (rating >= 7.00) return { background: "linear-gradient(135deg, #f44336, #c62828)", color: "#fff" }; 
  if (rating >= 4.00) return { background: "linear-gradient(135deg, #ff9800, #ef6c00)", color: "#fff" }; 
  return { background: "linear-gradient(135deg, #4caf50, #2e7d32)", color: "#fff" }; 
}

// 💡 단일 곡 레이팅(Track Rating) 정수 계산 함수 (부동소수점 오류 해결)
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

  // 데이터가 세팅될 때마다 평균 레이팅 계산
  useEffect(() => {
    if (!playerData) return;

    let totalSum = 0;
    let validSongCount = 0;

    const processSongs = (songs: any[]) => {
      if(!songs) return;
      songs.forEach((song) => {
        const constant = getConstant(song.title, song.difficulty);
        if (constant) {
          totalSum += calculateTrackRating(constant, song.score);
          validSongCount++;
        }
      });
    };

    processSongs(playerData.best);
    processSongs(playerData.new);

    if (validSongCount > 0) {
      setCalculatedTotalRating(Math.floor((totalSum / validSongCount) * 100) / 100);
    }
  }, [playerData]);

  // DB 연동 및 유저 데이터 호출
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return; 
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setPlayerData(docSnap.data());
      } catch (error) {
        console.error("데이터 불러오기 실패:", error);
      }
    };
    fetchUserData();
  }, [user]);

  // 북마크릿 데이터 수신 대기
  useEffect(() => {
    const receiveMessage = (event: MessageEvent) => {
      if (!event.origin.includes("chunithm-net")) return;
      if (typeof event.data === "string" && event.data.includes("appVersion")) {
        setPlayerData(JSON.parse(event.data));
      }
    };
    window.addEventListener("message", receiveMessage);
    if (window.opener) {
      setTimeout(() => { window.opener.postMessage("ready", "*"); }, 1000);
    }
    return () => window.removeEventListener("message", receiveMessage);
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
       await signInWithPopup(auth, provider);
       } catch (error) {
       // 사용자가 팝업을 닫았거나 에러가 났을 때 강제 종료되는 것을 방지
     console.log("로그인이 취소되었거나 에러가 발생했습니다.", error);
   }
  };

  const saveToDatabase = async () => {
    if (!user || !playerData) return;
    try {
      await setDoc(doc(db, "users", user.uid), playerData);
      alert("데이터베이스에 갱신되었습니다!");
    } catch (error) {
      alert("저장에 실패했습니다.");
    }
  };

  const handleManualDataRequest = () => {
    if (window.opener) window.opener.postMessage("ready", "*");
    else alert("츄니즘 넷 창과 연결이 끊어졌습니다.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", backgroundColor: "#f5f5f5", padding: "20px" }}>
      <div style={{ padding: "40px", backgroundColor: "white", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center", width: "100%", maxWidth: "600px" }}>
        <h1 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>마이 츄니즘 레이팅 계산기</h1>
        
        {!user ? (
          <div>
            <p style={{ marginBottom: "20px", color: "#666" }}>기록을 연동하려면 로그인하세요.</p>
            <button onClick={handleLogin} style={{ width: "100%", padding: "12px", fontSize: "16px", cursor: "pointer", backgroundColor: "#4285F4", color: "white", border: "none", borderRadius: "5px" }}>
              Google로 로그인
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>{user.displayName}님</h2>
              <button onClick={handleManualDataRequest} style={{ padding: "8px 12px", fontSize: "12px", cursor: "pointer", backgroundColor: "#34a853", color: "white", border: "none", borderRadius: "5px" }}>
                데이터 강제로 가져오기
              </button>
            </div>

            {playerData ? (
              <div style={{ marginTop: "20px", width: "100%" }}>
                <div style={{ padding: "20px", background: getRatingStyle(calculatedTotalRating || playerData.rating).background, color: getRatingStyle(calculatedTotalRating || playerData.rating).color, borderRadius: "10px", textAlign: "left", marginBottom: "30px", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <span style={{ fontSize: "14px", opacity: 0.9 }}>도달 레이팅 (공식)</span>
                      <div style={{ fontSize: "32px", fontWeight: "900", letterSpacing: "-1px" }}>{playerData.rating.toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "12px", opacity: 0.8 }}>DB 산출 평균 (Best+New)</span>
                      <div style={{ fontSize: "20px", fontWeight: "bold" }}>{calculatedTotalRating.toFixed(2)}</div>
                    </div>
                  </div>
                  <button onClick={saveToDatabase} style={{ width: "100%", marginTop: "20px", padding: "12px", cursor: "pointer", backgroundColor: "rgba(0,0,0,0.1)", color: "inherit", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", fontWeight: "bold", backdropFilter: "blur(5px)" }}>
                    현재 상태를 DB에 덮어쓰기
                  </button>
                </div>

                {/* Best 30 리스트 */}
                <h3 style={{ borderBottom: "2px solid #ddd", paddingBottom: "10px", marginBottom: "15px", textAlign: "left" }}>🏆 My Best 30</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {playerData.best && playerData.best.map((song: any, index: number) => {
                  const constant = getConstant(song.title, song.difficulty);
                  const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                  
                  const dbArray = Array.isArray(chunirecDB) ? chunirecDB : (chunirecDB as any).songs || [];
                  const songMeta = dbArray.find((s: any) => s.meta?.title === song.title || s.title === song.title);
                  const songId = songMeta ? (songMeta.meta?.img || songMeta.img) : null;
                  
                  return <SongCard key={`best-${index}`} song={song} constant={constant} trackRating={trackRating} songId={songId} />;
                })}
                </div>
                
                {/* New 20 리스트 */}
                <h3 style={{ borderBottom: "2px solid #ddd", paddingBottom: "10px", margin: "30px 0 15px 0", textAlign: "left" }}>🔥 New 20</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {playerData.new && playerData.new.map((song: any, index: number) => {
                  const constant = getConstant(song.title, song.difficulty);
                  const trackRating = constant ? calculateTrackRating(constant, song.score) : 0;
                  
                  const dbArray = Array.isArray(chunirecDB) ? chunirecDB : (chunirecDB as any).songs || [];
                  const songMeta = dbArray.find((s: any) => s.meta?.title === song.title || s.title === song.title);
                  const songId = songMeta ? (songMeta.meta?.img || songMeta.img) : null;
                  
                  return <SongCard key={`new-${index}`} song={song} constant={constant} trackRating={trackRating} songId={songId} />;
                })}
                </div>
              </div>
            ) : (
              <p style={{ color: "#888" }}>저장된 기록이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}