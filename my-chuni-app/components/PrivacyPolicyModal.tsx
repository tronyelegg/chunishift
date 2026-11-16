"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";

interface PrivacyPolicyModalProps {
  userId: string;
  onAgreed: () => void;
}

export default function PrivacyPolicyModal({ userId, onAgreed }: PrivacyPolicyModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      alert("서비스를 이용하시려면 개인정보 처리방침에 동의해 주셔야 합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          termsAgreed: true,
          termsAgreedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      onAgreed();
    } catch (error) {
      console.error("약관 동의 저장 실패:", error);
      alert("약관 동의 저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (confirm("개인정보 처리방침에 동의하지 않으시면 서비스를 이용하실 수 없으며 로그아웃됩니다. 계속하시겠습니까?")) {
      await signOut(auth);
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50" />
            <span className="text-xs font-black tracking-wider uppercase text-sky-600 dark:text-sky-400">
              CHUNITHM SHIFT 이용 동의
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            개인정보 처리방침 동의
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            서비스를 계속 이용하려면 최신 이용약관 및 개인정보처리방침에 동의해야 합니다.
          </p>
        </div>

        {/* 스크롤 가능한 약관 내용 박스 (Chakra/ProseMirror 스타일) */}
        <div className="flex-1 overflow-y-auto pr-2 mb-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 p-5 border border-zinc-200 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans space-y-4">
          <p>
            <strong>츄니시프트(CHUNITHM SHIFT)</strong>는 이용자의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하며, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.
            <br />
            이에 「개인정보 보호법」 제30조에 따라 이용자에게 개인정보 처리에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">
            이 개인정보처리방침은 츄니시프트 웹사이트(https://chunishift.vercel.app)에 적용됩니다.
          </p>

          <h3 className="text-sm font-black text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
            1. 수집하는 개인정보의 항목
          </h3>
          <p>츄니시프트는 서비스 이용 시 필요한 최소한의 개인정보만을 수집합니다.</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>
              <strong>회원가입 (소셜 로그인)</strong>: (필수) Google 계정 고유 식별자(UID), 이메일 주소, 이름, 프로필 이미지
            </li>
            <li>
              <strong>CHUNITHM-NET 프로필 연동</strong>: (선택) CHUNITHM 플레이어명, 레이팅, 레벨, 칭호, 플레이 카운트, 최근 플레이 일시 및 플레이 기록 (Best 30 / New 20 / 전체 악곡 스코어)
            </li>
            <li>
              <strong>자동 생성 정보</strong>: 서비스 안정성 확보, 오류 분석 및 부정 이용 방지를 위한 접속 로그, 브라우저 및 OS 기기 환경 정보, 쿠키
            </li>
          </ul>

          <h3 className="text-sm font-black text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
            2. 개인정보의 이용 목적 및 파기
          </h3>
          <p>
            수집된 개인정보는 CHUNITHM 플레이어 레이팅 분석, 개인 성과표 카드 생성 및 이미지 내보내기, 서비스 품질 개선 목적으로만 이용됩니다.
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>이용자가 로그아웃하거나 계정 탈퇴를 요청할 경우, 수집된 개인정보는 즉시 안전하게 파기됩니다.</li>
            <li>전자적 파일 형태로 저장된 개인정보는 기술적으로 복원할 수 없도록 영구 삭제됩니다.</li>
          </ul>

          <h3 className="text-sm font-black text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
            3. 개인정보 처리의 위탁 및 클라우드 이용
          </h3>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong>Google Firebase</strong>: 클라우드 데이터베이스(Firestore) 및 Google 소셜 로그인 인증 처리</li>
            <li><strong>Vercel, Inc.</strong>: 프론트엔드 웹 애플리케이션 호스팅 및 전송 네트워크 운영</li>
          </ul>

          <h3 className="text-sm font-black text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
            4. 세가(SEGA) 계정 비밀번호 비저장 원칙
          </h3>
          <p className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800/60 text-sky-800 dark:text-sky-300">
            츄니시프트의 북마크릿은 이용자가 이미 CHUNITHM-NET에 로그인한 상태에서 브라우저 내부의 공개 성과 페이지만을 안전하게 파싱합니다.
            <br />
            <strong>츄니시프트는 SEGA ID의 비밀번호나 민감한 로그인 비밀번호를 일체 열람하거나 서버에 저장하지 않습니다.</strong>
          </p>

          <p className="text-[11px] text-zinc-400 pt-2">
            공고일자: 2026년 11월 16일 | 시행일자: 2026년 11월 16일
          </p>
        </div>

        {/* 체크박스 & 액션 버튼 */}
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 cursor-pointer hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white">
              [필수] 개인정보 수집 및 이용에 동의합니다.
            </span>
          </label>

          <div className="flex gap-2.5">
            <button
              onClick={handleDecline}
              className="px-4 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
            >
              동의하지 않음 (로그아웃)
            </button>
            <button
              onClick={handleSubmit}
              disabled={!agreed || isSubmitting}
              className="flex-1 py-3 px-5 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-40 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? "처리 중..." : "동의하고 계속하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
