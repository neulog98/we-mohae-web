"use client";

import { useRouter } from "next/navigation";
import { ArrowUpDown, Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyView, LoadingView } from "@/components/common/StateView";
import { useToast } from "@/components/common/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { addBudgetItem, deleteBudgetItem, updateBudgetItem } from "@/features/budget/budgetService";
import { filterBudgets, getNextPaymentDate, sortBudgets, useBudgets, type BudgetSort } from "@/hooks/useBudgets";
import { useCouple } from "@/hooks/useCouple";
import { useUpcomingWindowSchedules } from "@/hooks/useSchedules";
import { formatCurrency, formatKoreanDate } from "@/lib/date/format";
import { budgetCategories, type BudgetCategory, type BudgetItem, type UserProfile } from "@/types/domain";

export default function BudgetPage() {
  return (
    <AuthGate>
      {({ profile }) => <BudgetContent profile={profile} />}
    </AuthGate>
  );
}

function BudgetContent({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [category, setCategory] = useState<BudgetCategory | "전체">("전체");
  const [sort, setSort] = useState<BudgetSort>("dueDate");
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { mode } = useCouple(profile);
  const { budgets, summary, loading } = useBudgets(mode === "wedding" ? profile.coupleId : null);
  const schedules = useUpcomingWindowSchedules(profile.coupleId, 365).filter((schedule) => schedule.type === "wedding");
  const visibleBudgets = useMemo(() => sortBudgets(filterBudgets(budgets, category), sort), [budgets, category, sort]);

  useEffect(() => {
    if (mode && mode !== "wedding") router.replace("/home");
  }, [mode, router]);

  if (mode !== "wedding") {
    return (
      <AppShell mode="couple" title="예산관리">
        <EmptyView label="예산관리는 예비부부 모드에서만 사용할 수 있어요" />
      </AppShell>
    );
  }

  return (
    <AppShell mode="wedding" title="예산관리">
      <section className="space-y-5">
        <BudgetSummary summary={summary} />

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">카테고리</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as BudgetCategory | "전체")} className="mt-2 min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm">
              <option value="전체">전체</option>
              {budgetCategories.map((nextCategory) => (
                <option key={nextCategory} value={nextCategory}>{nextCategory}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="flex items-center gap-1 text-sm font-semibold text-neutral-700"><ArrowUpDown size={14} /> 정렬</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as BudgetSort)} className="mt-2 min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm">
              <option value="dueDate">결제일 임박 순</option>
              <option value="createdAt">최근 추가 순</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-rosewood py-3 text-sm font-semibold text-white"
        >
          <Plus size={18} />
          예산 항목 추가
        </button>

        <div>
          <h2 className="mb-3 font-semibold text-ink">예산 항목</h2>
          {loading ? (
            <LoadingView label="예산 항목을 불러오는 중이에요" />
          ) : visibleBudgets.length === 0 ? (
            <EmptyView label="결혼 준비, 하나씩 정리해볼까요?" />
          ) : (
            <div className="space-y-2">
              {visibleBudgets.map((item) => {
                const nextPaymentDate = getNextPaymentDate(item);
                const balancePaymentDate = item.balancePaymentDate ?? item.paymentDate;
                return (
                <article key={item.budgetId} className="rounded-md bg-white p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        {item.category}{item.subCategory ? ` · ${item.subCategory}` : ""}
                      </p>
                      <div className="mt-3 space-y-1 rounded-md bg-cloud px-3 py-2 text-xs text-neutral-600">
                        <p>계약금일 <strong className="text-ink">{item.contractPaymentDate ? formatKoreanDate(item.contractPaymentDate.toDate()) : "미정"}</strong></p>
                        <p>잔금일 <strong className="text-ink">{balancePaymentDate ? formatKoreanDate(balancePaymentDate.toDate()) : "미정"}</strong></p>
                        {nextPaymentDate && <p className="font-semibold text-rosewood">다음 결제 {formatKoreanDate(nextPaymentDate)}</p>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <span className="text-neutral-500">예상 <strong className="text-ink">{formatCurrency(item.estimatedAmount)}</strong></span>
                        <span className="text-neutral-500">결제 <strong className="text-rosewood">{formatCurrency(item.paidAmount)}</strong></span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        aria-label="예산 수정"
                        onClick={() => {
                          setEditing(item);
                          setFormOpen(true);
                        }}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-2"
                      >
                        <Edit size={16} />
                      </button>
                      <button aria-label="예산 삭제" onClick={() => setDeleteTarget(item)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-red-50 p-2 text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </div>

      </section>
      {formOpen && (
        <BudgetForm
          key={editing?.budgetId ?? "new"}
          item={editing}
          schedules={schedules}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={async (input) => {
            try {
              if (!profile.coupleId) return;
              if (editing) {
                await updateBudgetItem(profile.coupleId, editing.budgetId, profile.uid, input);
                showToast("예산 항목을 수정했어요.", "success");
              } else {
                await addBudgetItem(profile.coupleId, profile.uid, input);
                showToast("예산 항목을 추가했어요.", "success");
              }
              setFormOpen(false);
              setEditing(null);
            } catch (error) {
              showToast(error instanceof Error ? error.message : "예산 저장에 실패했어요.", "error");
            }
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="예산 항목을 삭제할까요?"
        description="삭제한 예산 항목은 바로 복구할 수 없어요."
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!profile.coupleId || !deleteTarget) return;
          await deleteBudgetItem(profile.coupleId, deleteTarget.budgetId);
          setDeleteTarget(null);
          showToast("예산 항목을 삭제했어요.", "success");
        }}
      />
    </AppShell>
  );
}
