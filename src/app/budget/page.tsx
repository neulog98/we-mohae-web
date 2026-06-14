"use client";

import { useRouter } from "next/navigation";
import { ArrowUpDown, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyView, LoadingView } from "@/components/common/StateView";
import { useToast } from "@/components/common/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { addBudgetItem, createBudgetItemsFromTemplate, deleteBudgetItem, updateBudgetItem } from "@/features/budget/budgetService";
import { filterBudgets, getNextPaymentDate, sortBudgets, useBudgets, type BudgetSort } from "@/hooks/useBudgets";
import { useCouple } from "@/hooks/useCouple";
import { useUpcomingWindowSchedules } from "@/hooks/useSchedules";
import { formatCurrency, formatKoreanDate } from "@/lib/date/format";
import { budgetCategories, type BudgetCategory, type BudgetItem, type PayerType, type UserProfile } from "@/types/domain";
import { getUserFacingErrorMessage } from "@/utils/errors";

type PayerFilter = PayerType | "전체";
type BudgetStatusFilter = "전체" | "초과" | "결제예정" | "날짜미정";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<BudgetCategory | "전체">("전체");
  const [payer, setPayer] = useState<PayerFilter>("전체");
  const [status, setStatus] = useState<BudgetStatusFilter>("전체");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [sort, setSort] = useState<BudgetSort>("dueDate");
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { couple, mode } = useCouple(profile);
  const { budgets, summary, loading } = useBudgets(mode === "wedding" ? profile.coupleId : null);
  const schedules = useUpcomingWindowSchedules(profile.coupleId, 365).filter((schedule) => schedule.type === "wedding");
  const visibleBudgets = useMemo(
    () =>
      sortBudgets(
        filterBudgetItems(budgets, {
          searchQuery,
          category,
          payer,
          status,
          dueFrom,
          dueTo
        }),
        sort
      ),
    [budgets, category, dueFrom, dueTo, payer, searchQuery, sort, status]
  );
  const hasActiveFilters = Boolean(searchQuery.trim()) || category !== "전체" || payer !== "전체" || status !== "전체" || Boolean(dueFrom) || Boolean(dueTo);

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
        <BudgetReport summary={summary} budgetGoalAmount={couple?.budgetGoalAmount ?? 0} itemCount={budgets.length} />

        <div className="rounded-lg bg-white p-4 shadow-soft">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={17} />
            <label className="sr-only" htmlFor="budget-search">예산 검색</label>
            <input
              id="budget-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="항목명, 카테고리, 메모 검색"
              className="min-h-12 w-full rounded-md border border-neutral-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/15"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
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
              <span className="text-sm font-semibold text-neutral-700">결제자</span>
              <select value={payer} onChange={(event) => setPayer(event.target.value as PayerFilter)} className="mt-2 min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm">
                <option value="전체">전체</option>
                <option value="groom">신랑</option>
                <option value="bride">신부</option>
                <option value="shared">공동</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">상태</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as BudgetStatusFilter)} className="mt-2 min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm">
                <option value="전체">전체</option>
                <option value="결제예정">결제예정</option>
                <option value="초과">예산초과</option>
                <option value="날짜미정">날짜미정</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">결제일 시작</span>
              <input type="date" value={dueFrom} onChange={(event) => setDueFrom(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">결제일 종료</span>
              <input type="date" value={dueTo} onChange={(event) => setDueTo(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm" />
            </label>
            <label className="block">
              <span className="flex items-center gap-1 text-sm font-semibold text-neutral-700"><ArrowUpDown size={14} /> 정렬</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as BudgetSort)} className="mt-2 min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm">
                <option value="dueDate">결제일 임박 순</option>
                <option value="createdAt">최근 추가 순</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-neutral-500">표시 항목 <strong className="text-ink">{visibleBudgets.length}</strong>건</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategory("전체");
                  setPayer("전체");
                  setStatus("전체");
                  setDueFrom("");
                  setDueTo("");
                }}
                className="min-h-10 rounded-md border border-neutral-200 px-3 text-sm font-semibold text-ink"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {budgets.length === 0 && (
            <button
              type="button"
              onClick={async () => {
                if (!profile.coupleId) return;
                try {
                  const count = await createBudgetItemsFromTemplate(profile.coupleId, profile.uid);
                  showToast(count > 0 ? "예산 템플릿을 불러왔어요." : "이미 예산 항목이 있어요.", "success");
                } catch (error) {
                  showToast(getUserFacingErrorMessage(error, "예산 템플릿을 불러오지 못했어요."), "error");
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-rosewood bg-white py-3 text-sm font-semibold text-rosewood"
            >
              예산 템플릿 불러오기
            </button>
          )}
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
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-ink">예산 항목</h2>
          {loading ? (
            <LoadingView label="예산 항목을 불러오는 중이에요" />
          ) : visibleBudgets.length === 0 ? (
            <EmptyView label={hasActiveFilters ? "조건에 맞는 예산 항목이 없어요" : "결혼 준비, 하나씩 정리해볼까요?"} />
          ) : (
            <>
                <div className="space-y-2 md:hidden">
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
                            <BudgetShareText item={item} />
                            <BudgetVendorText item={item} />
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
                <BudgetTable
                  items={visibleBudgets}
                  onEdit={(item) => {
                    setEditing(item);
                    setFormOpen(true);
                  }}
                  onDelete={setDeleteTarget}
                />
            </>
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
              showToast(getUserFacingErrorMessage(error, "예산 저장에 실패했어요."), "error");
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
          try {
            await deleteBudgetItem(profile.coupleId, deleteTarget.budgetId);
            setDeleteTarget(null);
            showToast("예산 항목을 삭제했어요.", "success");
          } catch (error) {
            showToast(getUserFacingErrorMessage(error, "예산 항목 삭제에 실패했어요."), "error");
          }
        }}
      />
    </AppShell>
  );
}

function BudgetTable({
  items,
  onEdit,
  onDelete
}: {
  items: BudgetItem[];
  onEdit: (item: BudgetItem) => void;
  onDelete: (item: BudgetItem) => void;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-md bg-white shadow-soft md:block">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-500">
          <tr>
            <th className="px-4 py-3">항목명</th>
            <th className="px-4 py-3">카테고리</th>
            <th className="px-4 py-3">결제자</th>
            <th className="px-4 py-3 text-right">예상</th>
            <th className="px-4 py-3 text-right">결제</th>
            <th className="px-4 py-3 text-right">남은 금액</th>
            <th className="px-4 py-3">다음 결제</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3 text-right">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {items.map((item) => {
            const nextPaymentDate = getNextPaymentDate(item);
            const remainingAmount = item.estimatedAmount - item.paidAmount;
            const isOverBudget = remainingAmount < 0;
            return (
              <tr key={item.budgetId} className="align-top">
                <td className="max-w-[220px] px-4 py-3">
                  <p className="truncate font-semibold text-ink">{item.title}</p>
                  {item.memo && <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{item.memo}</p>}
                  <BudgetVendorText item={item} />
                </td>
                <td className="px-4 py-3 text-neutral-600">{item.category}{item.subCategory ? ` · ${item.subCategory}` : ""}</td>
                <td className="px-4 py-3 text-neutral-600">
                  <span>{payerLabel(item.payer)}</span>
                  <BudgetShareText item={item} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-neutral-700">{formatCurrency(item.estimatedAmount)}</td>
	                <td className="px-4 py-3 text-right tabular-nums font-semibold text-rosewood">{formatCurrency(item.paidAmount)}</td>
                <td className={`px-4 py-3 text-right tabular-nums font-semibold ${isOverBudget ? "text-red-600" : "text-ink"}`}>
                  {formatCurrency(Math.abs(remainingAmount))}
                </td>
	                <td className="px-4 py-3 text-neutral-600">{nextPaymentDate ? formatKoreanDate(nextPaymentDate) : "미정"}</td>
                <td className="px-4 py-3">
                  <BudgetStatusBadge item={item} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button aria-label={`${item.title} 예산 수정`} onClick={() => onEdit(item)} className="flex min-h-10 min-w-10 items-center justify-center rounded-md bg-neutral-100 p-2">
                      <Edit size={15} />
                    </button>
                    <button aria-label={`${item.title} 예산 삭제`} onClick={() => onDelete(item)} className="flex min-h-10 min-w-10 items-center justify-center rounded-md bg-red-50 p-2 text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BudgetShareText({ item }: { item: BudgetItem }) {
  if (item.payer !== "shared") return null;
  if ((item.groomShareAmount ?? 0) === 0 && (item.brideShareAmount ?? 0) === 0) return null;

  return (
    <p className="mt-2 text-xs text-neutral-500">
      신랑 {formatCurrency(item.groomShareAmount ?? 0)} · 신부 {formatCurrency(item.brideShareAmount ?? 0)}
    </p>
  );
}

function BudgetVendorText({ item }: { item: BudgetItem }) {
  if (!item.vendorName && !item.vendorContact && !item.accountInfo && !item.cardHolder) return null;

  return (
    <p className="mt-2 line-clamp-2 text-xs text-neutral-500">
      {[item.vendorName, item.vendorContact, item.accountInfo, item.cardHolder].filter(Boolean).join(" · ")}
    </p>
  );
}

function BudgetReport({
  summary,
  budgetGoalAmount,
  itemCount
}: {
  summary: ReturnType<typeof useBudgets>["summary"];
  budgetGoalAmount: number;
  itemCount: number;
}) {
  const targetAmount = budgetGoalAmount || summary.estimatedAmount;
  const overTargetAmount = Math.max(summary.estimatedAmount - targetAmount, 0);
  const paidRate = targetAmount > 0 ? Math.min(Math.round((summary.paidAmount / targetAmount) * 100), 999) : 0;
  const remainingToPay = Math.max(summary.estimatedAmount - summary.paidAmount, 0);
  const netPaidAmount = Math.max(summary.paidAmount - summary.familySupportAmount - summary.refundAmount, 0);

  return (
    <section className="rounded-lg bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">예산 리포트</h2>
          <p className="mt-1 text-sm text-neutral-500">{itemCount}개 항목 기준으로 정산 현황을 계산했어요.</p>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
          목표 대비 {paidRate}%
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-rosewood" style={{ width: `${Math.min(paidRate, 100)}%` }} />
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-4">
        <ReportMetric label="목표 예산" value={targetAmount ? formatCurrency(targetAmount) : "미설정"} />
        <ReportMetric label="앞으로 결제" value={formatCurrency(remainingToPay)} />
        <ReportMetric label="신랑 부담" value={formatCurrency(summary.groomPaidAmount)} />
        <ReportMetric label="신부 부담" value={formatCurrency(summary.bridePaidAmount)} />
        <ReportMetric label="실제 부담" value={formatCurrency(netPaidAmount)} />
        <ReportMetric label="가족 지원" value={formatCurrency(summary.familySupportAmount)} />
        <ReportMetric label="환급/취소" value={formatCurrency(summary.refundAmount)} />
      </div>
      {overTargetAmount > 0 && (
        <p className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          목표 예산보다 {formatCurrency(overTargetAmount)} 높게 계획되어 있어요.
        </p>
      )}
    </section>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-cloud px-3 py-3">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function BudgetStatusBadge({ item }: { item: BudgetItem }) {
  const nextPaymentDate = getNextPaymentDate(item);
  const isOverBudget = item.paidAmount > item.estimatedAmount;
  if (isOverBudget) {
    return <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">예산초과</span>;
  }
  if (!nextPaymentDate) {
    return <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">날짜미정</span>;
  }
  return <span className="rounded-full bg-mint/10 px-2 py-1 text-xs font-semibold text-mint">결제예정</span>;
}

function filterBudgetItems(
  items: BudgetItem[],
  filters: {
    searchQuery: string;
    category: BudgetCategory | "전체";
    payer: PayerFilter;
    status: BudgetStatusFilter;
    dueFrom: string;
    dueTo: string;
  }
) {
  const query = filters.searchQuery.trim().toLocaleLowerCase();
  const from = parseDateFilter(filters.dueFrom);
  const to = parseDateFilter(filters.dueTo);

  return filterBudgets(items, filters.category).filter((item) => {
    const nextPaymentDate = getNextPaymentDate(item);
    const searchable = [
      item.title,
      item.category,
      item.subCategory,
      item.memo,
      item.vendorName,
      item.vendorContact,
      item.accountInfo,
      item.cardHolder,
      payerLabel(item.payer)
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    const matchesSearch = !query || searchable.includes(query);
    const matchesPayer = filters.payer === "전체" || item.payer === filters.payer;
    const matchesStatus =
      filters.status === "전체" ||
      (filters.status === "초과" && item.paidAmount > item.estimatedAmount) ||
      (filters.status === "결제예정" && Boolean(nextPaymentDate)) ||
      (filters.status === "날짜미정" && !nextPaymentDate);
    const matchesFrom = !from || Boolean(nextPaymentDate && nextPaymentDate >= from);
    const matchesTo = !to || Boolean(nextPaymentDate && nextPaymentDate <= to);

    return matchesSearch && matchesPayer && matchesStatus && matchesFrom && matchesTo;
  });
}

function parseDateFilter(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function payerLabel(payer: PayerType) {
  if (payer === "groom") return "신랑";
  if (payer === "bride") return "신부";
  return "공동";
}
