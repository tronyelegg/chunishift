"use client";

import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase.js'; // 🔥 본인의 firebase 설정 경로로 맞춰주세요

export default function DataImportPage() {
  const [status, setStatus] = useState("대기 중...");

  useEffect(() => {
    // 1. 나를 열어준 부모 창(츄니즘넷 북마크릿)에게 "준비완료(ready)" 신호 보내기
    if (window.opener) {
      setStatus("츄니즘넷과 연결 중... 데이터를 요청합니다.");
      // 북마크릿의 e.data !== "ready" 조건 통과를 위해 메시지 전송
      window.opener.postMessage("ready", "*"); 
    } else {
      setStatus("단독으로 실행되었습니다. 츄니즘넷 북마크릿을 통해 접근해주세요.");
    }

    // 2. 츄니즘넷 북마크릿으로부터 오는 JSON 데이터 받기
    const handleMessage = async (event: MessageEvent) => {
      // 보안을 위해 츄니즘넷 도메인에서 온 데이터인지 확인
      if (!event.origin.includes("chunithm-net.com")) return;

      try {
        const parsedData = JSON.parse(event.data);
        
        // 데이터가 정상적인지 확인 (reiwamain_2.js는 appVersion을 포함함)
        if (parsedData && parsedData.appVersion) {
          setStatus("데이터 수신 완료! Firebase에 저장 중입니다...");
          await saveToFirebase(parsedData);
        }
      } catch (error) {
        console.error("데이터 파싱 에러:", error);
      }
    };

    window.addEventListener("message", handleMessage);
    
    // 컴포넌트 언마운트 시 리스너 해제
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 3. 수신한 데이터를 Firebase Firestore에 저장하는 함수
  const saveToFirebase = async (data: any) => {
    const user = auth.currentUser;
    if (!user) {
      setStatus("❌ 오류: 로그인이 필요합니다. 앱에 먼저 로그인해주세요.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      
      // setDoc과 { merge: true } 옵션을 사용하여 기존 데이터를 덮어쓰지 않고 업데이트합니다.
      await setDoc(userDocRef, {
        profile: {
          nickname: data.name,
          rating: data.rating,
          level: data.level,
          lastPlayed: data.lastPlayed,
        },
        best: data.best, // Best 30 리스트
        new: data.new,   // New 20 리스트
        
        // 주의: 전체 기록(data.score)은 용량이 꽤 클 수 있습니다. 
        // 필요에 따라 주석을 해제하여 저장하세요.
        // allScores: data.score 
      }, { merge: true });

      setStatus("✅ Firebase 저장 성공! 창을 닫고 앱을 새로고침해보세요.");
    } catch (error) {
      console.error("Firebase 저장 에러:", error);
      setStatus("❌ Firebase 저장 실패. 콘솔을 확인해주세요.");
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>데이터 동기화</h2>
      <p style={{ marginTop: "20px", fontSize: "1.2rem", fontWeight: "bold" }}>
        {status}
      </p>
    </div>
  );
}
