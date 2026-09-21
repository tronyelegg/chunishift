"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { onAuthStateChanged } from 'firebase/auth';

// 💡 수정됨: app을 가져와서 다시 세팅할 필요 없이, 이미 세팅 완료된 auth를 바로 가져옵니다.
import { auth } from '../../firebase'; 
import songData from '../../data/chunimaru_db.json';

export default function ProtectedSongListPage() {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // 💡 수정됨: const auth = getAuth(app); 줄을 삭제했습니다.
    
    // Firebase 인증 상태 리스너 등록
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        // 인증되지 않은 유저는 메인(로그인) 페이지로 이동
        router.push('/'); 
      }
      setIsAuthLoading(false);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [router]);

  // 인증 상태를 확인하는 동안 보여줄 로딩 화면
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-semibold">인증 정보를 확인 중입니다...</p>
      </div>
    );
  }

  // 로그인되지 않은 경우 (리다이렉트 처리 중 깜빡임 방지)
  if (!isAuthenticated) return null;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">CHUNITHM Song List</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {songData.songs && songData.songs.map((song: any) => (
          <div key={song.idx || song.id} className="border rounded-lg p-4 flex flex-col items-center shadow-sm">
            <Image
              src={`https://chunithm-net-eng.com/mobile/img/${song.img}.jpg`}
              alt={song.title}
              width={120}
              height={120}
              className="rounded-md"
              priority={song.idx <= 10}
            />
            <h2 className="mt-4 text-center text-sm font-semibold truncate w-full">
              {song.title}
            </h2>
            <p className="text-xs text-gray-500 truncate w-full text-center">
              {song.artist}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}