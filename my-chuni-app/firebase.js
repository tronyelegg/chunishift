// ⚠️ 이 부분을 본인의 파이어베이스 설정 코드로 교체하세요!
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// 💡 [추가 1] Firestore 불러오기
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyDJoT0WeAmw-12ONOe0KRTzR1UatJtWC0w",
  authDomain: "chunishift.firebaseapp.com",
  projectId: "chunishift",
  storageBucket: "chunishift.firebasestorage.app",
  messagingSenderId: "558872664217",
  appId: "1:558872664217:web:fc28dcfaa796a8cea5c008"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// 💡 [추가 2] DB 내보내기
export const db = getFirestore(app);