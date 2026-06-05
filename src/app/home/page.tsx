"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { SchedulePreviewList } from "@/components/calendar/SchedulePreviewList";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { getNextPaymentDate, sortBudgets, useBudgets } from "@/hooks/useBudgets";
import { useCouple } from "@/hooks/useCouple";
import { useUpcomingSchedules } from "@/hooks/useSchedules";
import { formatKoreanDate, formatKoreanDateTime } from "@/lib/date/format";
import { EmptyView } from "@/components/common/StateView";
import type { UserProfile } from "@/types/domain";

export default function HomePage() {
  return (
    <AuthGate>
      {({ profile }) => <HomeContent profile={profile} />}
    </AuthGate>
  );
}

function HomeContent({ profile }: { profile: UserProfile }) {
  const { partner, connected, mode } = useCouple(profile);
  const { schedules, loading } = useUpcomingSchedules(profile.coupleId, 5);
  const { budgets, summary } = useBudgets(mode === "wedding" ? profile.coupleId : null);
  const upcomingPayments = sortBudgets(budgets, "dueDate")
    .filter((item) => getNextPaymentDate(item))
    .slice(0, 3);

  return (
    <AppShell mode={mode ?? "couple"} title="우리뭐해">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-rosewood">{formatKoreanDate(new Date())}</p>
          <h2 className="mt-2 text-3xl font-bold text-ink">우리 이번 주 뭐해?</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            {connected && partner ? `${partner.displayName}님과 함께 일정을 보고 있어요.` : "초대코드로 파트너를 연결해보세요."}
          </p>
        </div>

        <Link href="/calendar" className="flex items-center justify-center gap-2 rounded-md bg-rosewood py-3 text-sm font-semibold text-white">
          <Plus size={18} />
          일정 추가하기
        </Link>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink">다가오는 일정이에요</h3>
            <Link href="/calendar" className="flex min-h-11 items-center text-sm font-medium text-rosewood">전체보기</Link>
          </div>
          <SchedulePreviewList schedules={schedules} loading={loading} />
        </div>

        {mode === "wedding" && (
          <>
            <div>
              <h3 className="mb-3 font-semibold text-ink">결혼 준비 예산</h3>
              <BudgetSummary summary={summary} compact />
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-ink">다가오는 결제일이 있어요</h3>
              {upcomingPayments.length === 0 ? (
                <EmptyView label="예정된 결제일이 없어요" />
              ) : (
                <div className="space-y-2">
                  {upcomingPayments.map((item) => {
                    const nextPaymentDate = getNextPaymentDate(item);
                    return (
                    <article key={item.budgetId} className="rounded-md bg-white p-4 shadow-soft">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="truncate text-sm font-semibold text-ink">{item.title}</h4>
                        <span className="text-sm font-bold text-rosewood">{item.paidAmount.toLocaleString("ko-KR")}원</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {nextPaymentDate ? formatKoreanDateTime(nextPaymentDate, true) : ""} · {item.category}{item.subCategory ? ` · ${item.subCategory}` : ""}
                      </p>
                    </article>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
