"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { budgetsQuery, summarizeBudgets } from "@/features/budget/budgetService";
import type { BudgetCategory, BudgetItem } from "@/types/domain";

export function useBudgets(coupleId: string | null | undefined) {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coupleId) {
      setBudgets([]);
      return;
    }
    setLoading(true);
    return onSnapshot(budgetsQuery(coupleId), (snapshot) => {
      setBudgets(snapshot.docs.map((document) => document.data() as BudgetItem));
      setLoading(false);
    });
  }, [coupleId]);

  const summary = useMemo(() => {
    const nextSummary = summarizeBudgets(budgets);
    nextSummary.remainingAmount = Math.max(nextSummary.estimatedAmount - nextSummary.paidAmount, 0);
    return nextSummary;
  }, [budgets]);

  return { budgets, summary, loading };
}

export function filterBudgets(items: BudgetItem[], category: BudgetCategory | "전체") {
  if (category === "전체") return items;
  return items.filter((item) => item.category === category);
}

export type BudgetSort = "dueDate" | "createdAt";

export function sortBudgets(items: BudgetItem[], sort: BudgetSort) {
  return [...items].sort((left, right) => {
    if (sort === "createdAt") {
      return (right.createdAt?.toMillis?.() ?? 0) - (left.createdAt?.toMillis?.() ?? 0);
    }

    const leftDate = getNextPaymentDate(left);
    const rightDate = getNextPaymentDate(right);
    if (!leftDate && !rightDate) return 0;
    if (!leftDate) return 1;
    if (!rightDate) return -1;
    return leftDate.getTime() - rightDate.getTime();
  });
}

export function getNextPaymentDate(item: BudgetItem) {
  const dates = [item.contractPaymentDate, item.balancePaymentDate, item.paymentDate]
    .filter((date): date is NonNullable<typeof date> => Boolean(date))
    .map((date) => date.toDate());
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = dates.filter((date) => date >= now).sort((left, right) => left.getTime() - right.getTime());
  return upcoming[0] ?? null;
}
