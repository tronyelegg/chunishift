/** @type {import('tailwindcss').Config} */
module.exports = {
  // 🚀 다크모드 버튼 활성화
  darkMode: 'class', 
  
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};