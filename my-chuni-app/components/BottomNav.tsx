"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/songs", label: "상수표", icon: "🎵" },
  { href: "/stats", label: "통계", icon: "📊" },
  { href: "/level-distribution", label: "분포", icon: "📈" },
  { href: "/export", label: "사진관", icon: "📸" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 transition-colors shadow-lg shadow-black/10">
      <div className="grid grid-cols-5 h-15 max-w-lg mx-auto px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive
                  ? "text-sky-500 dark:text-sky-400 font-black"
                  : "text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <span className={`text-lg transition-transform ${isActive ? "scale-110" : ""}`}>
                {item.icon}
              </span>
              <span className="text-[10.5px] tracking-tight mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-sky-500 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
