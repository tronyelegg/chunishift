npm install firebase

&

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJoT0WeAmw-12ONOe0KRTzR1UatJtWC0w",
  authDomain: "chunishift.vercel.app", // ⭐️ 메인 웹사이트 주소로 변경
  projectId: "chunishift",
  storageBucket: "chunishift.firebasestorage.app",
  messagingSenderId: "558872664217",
  appId: "1:558872664217:web:fc28dcfaa796a8cea5c008"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);