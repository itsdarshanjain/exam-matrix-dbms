/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' },
        ink: { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',400:'#94a3b8',600:'#475569',800:'#1e293b',900:'#0f172a' }
      },
      fontFamily: { sans:['Inter','system-ui','-apple-system','sans-serif'], mono:['JetBrains Mono','Consolas','monospace'] },
      boxShadow: { card:'0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.06)', soft:'0 8px 24px rgba(15,23,42,0.06)' },
      borderRadius: { '2xl':'16px', '3xl':'20px' }
    },
  },
  plugins: [],
}
