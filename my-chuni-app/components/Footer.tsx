import React from "react";
import Link from "next/link";
import { SDVX_BASE_URL, YOUTUBE_HUMEN_CHANNEL } from "../lib/chartLinks";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm text-zinc-600 dark:text-zinc-400 py-10 px-4 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* 브랜드 및 서비스 소개 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-linear-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                CS
              </div>
              <span className="text-sm font-black tracking-tighter bg-linear-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                CHUNITHM SHIFT
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              CHUNITHM 레이팅 분석기 및 보면·상수 데이터베이스.<br />
              Best 30 / New 20 성과표 생성 및 고해상도 이미지 내보내기를 지원합니다.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-1">
              <span>v1.2.0</span>
              <span>•</span>
              <a
                href="https://github.com/tronyelegg/chunishift"
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-500 transition underline underline-offset-2"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* 원본 출처 및 데이터 소스 (Attributions) */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
              <span>🔗</span>
              <span>데이터 출처 및 연동 (Credits)</span>
            </h4>
            <ul className="text-xs space-y-1.5">
              <li>
                <a
                  href="https://chunimaru.fuwamofu.net"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-500 dark:hover:text-sky-400 transition font-medium flex items-center justify-between group"
                >
                  <span>ChuniMaru (チュウニズム非公式ツール)</span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-sky-500">악곡 & 상수 API ↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://reiwa.f5.si"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-500 dark:hover:text-sky-400 transition font-medium flex items-center justify-between group"
                >
                  <span>Reiwa (CHUNITHM-NET Tools)</span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-sky-500">북마크릿 스크래퍼 베이스 ↗</span>
                </a>
              </li>
              <li>
                <a
                  href={SDVX_BASE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-500 dark:hover:text-sky-400 transition font-medium flex items-center justify-between group"
                >
                  <span>sdvx.in (CHUNITHM 譜面保管所)</span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-sky-500">채보 이미지 아카이브 ↗</span>
                </a>
              </li>
              <li>
                <a
                  href={YOUTUBE_HUMEN_CHANNEL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-500 dark:hover:text-red-400 transition font-medium flex items-center justify-between group"
                >
                  <span>チュウニズム譜面保管所 (@chunithm_humen)</span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-red-500">YouTube 채보 영상 ↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://maimai.shiftpsh.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-500 dark:hover:text-sky-400 transition font-medium flex items-center justify-between group"
                >
                  <span>maimai DX maishift</span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-sky-500">UI/UX 디자인 영감 ↗</span>
                </a>
              </li>
            </ul>
          </div>

          {/* 서비스 링크 & 안내 */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
              <span>⚡</span>
              <span>바로가기</span>
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <Link href="/" className="hover:text-sky-500 transition">
                🏠 대시보드
              </Link>
              <Link href="/songs" className="hover:text-sky-500 transition">
                🎵 악곡 상수표
              </Link>
              <Link href="/stats" className="hover:text-sky-500 transition">
                📊 플레이 통계
              </Link>
              <Link href="/level-distribution" className="hover:text-sky-500 transition">
                📈 레벨별 클리어 분포
              </Link>
              <Link href="/export" className="hover:text-sky-500 transition">
                📸 고화질 사진관
              </Link>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight mt-2">
              SEGA ID 비밀번호는 서버로 전송되거나 저장되지 않으며, 모든 동기화는 브라우저 내부에서 안전하게 실행됩니다.
            </p>
          </div>
        </div>

        {/* 저작권 및 면책 조항 */}
        <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500">
          <p className="text-center sm:text-left">
            CHUNITHM is a registered trademark of <strong>SEGA CORPORATION</strong>.<br className="hidden sm:inline" />
            CHUNITHM SHIFT is an unofficial non-commercial fan project and is not affiliated with or endorsed by SEGA.
          </p>
          <p className="font-mono text-center sm:text-right">
            © {new Date().getFullYear()} CHUNITHM SHIFT. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
