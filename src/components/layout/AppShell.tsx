"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BriefcaseBusiness, CalendarDays, Home, Settings, UsersRound, WalletCards } from "lucide-react";
import type { CoupleMode } from "@/types/domain";

const tabs = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/budget", label: "예산관리", icon: WalletCards, weddingOnly: true },
  { href: "/guests", label: "하객관리", icon: UsersRound, weddingOnly: true },
  { href: "/vendors", label: "업체관리", icon: BriefcaseBusiness, weddingOnly: true },
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
    <div className="mx-auto min-h-screen w-full max-w-md pb-24 md:flex md:max-w-7xl md:gap-6 md:pb-0">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-neutral-200 bg-white px-4 py-5 md:block">
        <div className="px-2">
          <p className="text-xs font-medium text-rosewood">{mode === "wedding" ? "예비부부 모드" : "커플 모드"}</p>
          <p className="mt-1 text-xl font-bold text-ink">우리뭐해</p>
        </div>
        <nav className="mt-8 space-y-1">
          {visibleTabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold ${
                  active ? "bg-rosewood/10 text-rosewood" : "text-neutral-500 hover:bg-neutral-50 hover:text-ink"
                }`}
              >
                <Icon size={19} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-cloud/90 px-5 py-4 backdrop-blur md:static md:border-b-neutral-200 md:bg-cloud md:px-0 md:py-5 md:backdrop-blur-0">
          <p className="text-xs font-medium text-rosewood md:hidden">{mode === "wedding" ? "예비부부 모드" : "커플 모드"}</p>
          <h1 className="mt-1 text-xl font-bold text-ink md:mt-0 md:text-2xl">{title ?? "우리뭐해"}</h1>
        </header>
        <main className="px-5 py-5 md:px-0 md:pb-8 md:pt-0">{children}</main>
      </div>
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white px-3 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden">
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
