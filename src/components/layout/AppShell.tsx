"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarDays, Home, Settings, WalletCards } from "lucide-react";
import type { CoupleMode } from "@/types/domain";

const tabs = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/budget", label: "예산관리", icon: WalletCards, weddingOnly: true },
  { href: "/settings", label: "설정", icon: Settings }
];

export function AppShell({
  title,
  mode,
  children
}: {
  title?: string;
  mode: CoupleMode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const visibleTabs = tabs.filter((tab) => !tab.weddingOnly || mode === "wedding");

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-24 md:max-w-6xl">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-cloud/90 px-5 py-4 backdrop-blur">
        <p className="text-xs font-medium text-rosewood">{mode === "wedding" ? "예비부부 모드" : "커플 모드"}</p>
        <h1 className="mt-1 text-xl font-bold text-ink">{title ?? "우리뭐해"}</h1>
      </header>
      <main className="px-5 py-5">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white px-3 pb-[env(safe-area-inset-bottom)] pt-2">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}>
          {visibleTabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium ${
                  active ? "bg-rosewood/10 text-rosewood" : "text-neutral-500"
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
