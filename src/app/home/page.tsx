"use client";

import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { SchedulePreviewList } from "@/components/calendar/SchedulePreviewList";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { updateChecklistCompletion, updateChecklistStatus } from "@/features/checklist/checklistService";
import { getNextPaymentDate, sortBudgets, useBudgets } from "@/hooks/useBudgets";
import { useChecklist } from "@/hooks/useChecklist";
import { useCouple } from "@/hooks/useCouple";
import { useUpcomingSchedules } from "@/hooks/useSchedules";
import { ddayLabel, formatKoreanDate, formatKoreanDateTime } from "@/lib/date/format";
import { EmptyView } from "@/components/common/StateView";
import type { AssigneeType, ChecklistStatus, UserProfile } from "@/types/domain";

export default function HomePage() {
  return (
    <AuthGate>
      {({ profile }) => <HomeContent profile={profile} />}
    </AuthGate>
  );
}

function HomeContent({ profile }: { profile: UserProfile }) {
  const { couple, partner, connected, mode } = useCouple(profile);
  const { schedules, loading } = useUpcomingSchedules(profile.coupleId, 5);
  const { budgets, summary } = useBudgets(mode === "wedding" ? profile.coupleId : null);
  const { items: checklistItems, summary: checklistSummary } = useChecklist(mode === "wedding" ? profile.coupleId : null);
  const upcomingPayments = sortBudgets(budgets, "dueDate")
    .filter((item) => getNextPaymentDate(item))
    .slice(0, 3);
  const nextChecklistItems = checklistItems.filter((item) => !item.completed).slice(0, 4);

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
            {couple?.weddingDate && (
              <div className="rounded-lg bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold text-rosewood">결혼식까지</p>
                <p className="mt-1 text-3xl font-bold text-ink">{ddayLabel(couple.weddingDate.toDate())}</p>
                <p className="mt-2 text-sm text-neutral-500">{formatKoreanDateTime(couple.weddingDate.toDate(), true)}</p>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <DashboardMetric label="미완료 준비" value={`${checklistSummary.remaining}개`} />
              <DashboardMetric label="예산 잔액" value={`${summary.remainingAmount.toLocaleString("ko-KR")}원`} />
              <DashboardMetric label="다가오는 결제" value={`${upcomingPayments.length}건`} />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-ink">결혼 준비 체크리스트</h3>
                <span className="text-sm font-semibold text-rosewood">{checklistSummary.progress}%</span>
              </div>
              <div className="rounded-md bg-white p-4 shadow-soft">
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-rosewood" style={{ width: `${checklistSummary.progress}%` }} />
                </div>
                {nextChecklistItems.length === 0 ? (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-mint/10 px-3 py-3 text-sm font-semibold text-mint">
                    <CheckCircle2 size={17} />
                    준비 체크리스트를 모두 완료했어요
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {nextChecklistItems.map((item) => (
                      <label key={item.checklistId} className="flex items-start gap-3 rounded-md border border-neutral-100 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => {
                            if (!profile.coupleId) return;
                            updateChecklistCompletion(profile.coupleId, item.checklistId, profile.uid, !item.completed);
                          }}
                          className="mt-1"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink">{item.title}</span>
                          <span className="mt-1 block text-xs text-neutral-500">
                            {item.dueDate ? formatKoreanDateTime(item.dueDate.toDate(), true) : "기한 미정"} · {assigneeLabel(item.assignee)}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-neutral-500">{item.description}</span>
                          <select
                            aria-label={`${item.title} 상태`}
                            value={item.status ?? (item.completed ? "done" : "todo")}
                            onChange={(event) => {
                              if (!profile.coupleId) return;
                              updateChecklistStatus(profile.coupleId, item.checklistId, profile.uid, event.target.value as ChecklistStatus);
                            }}
                            className="mt-2 min-h-10 rounded-md border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-700"
                          >
                            <option value="todo">예정</option>
                            <option value="inProgress">진행중</option>
                            <option value="vendorCheck">업체 확인 필요</option>
                            <option value="blocked">보류</option>
                            <option value="done">완료</option>
                          </select>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

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

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function assigneeLabel(assignee: AssigneeType) {
  if (assignee === "groom") return "신랑";
  if (assignee === "bride") return "신부";
  return "공동";
}
