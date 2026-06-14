"use client";

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { BudgetCategory, BudgetItem, PayerType } from "@/types/domain";
import { weddingBudgetTemplate } from "./budgetTemplates";

export interface BudgetInput {
  title: string;
  category: BudgetCategory;
  subCategory: string;
  estimatedAmount: number;
  contractAmount: number;
  paidAmount: number;
  groomShareAmount: number | null;
  brideShareAmount: number | null;
  payer: PayerType;
  contractPaymentDate: Date | null;
  balancePaymentDate: Date | null;
  memo: string;
  vendorName: string;
  vendorContact: string;
  accountInfo: string;
  familySupportAmount: number;
  refundAmount: number;
  cardHolder: string;
  relatedScheduleId: string | null;
}

export function budgetsQuery(coupleId: string) {
  return collection(db, "couples", coupleId, "budgets");
}

function serializeBudgetInput(input: BudgetInput) {
  return {
    ...input,
    contractPaymentDate: input.contractPaymentDate ? Timestamp.fromDate(input.contractPaymentDate) : null,
    balancePaymentDate: input.balancePaymentDate ? Timestamp.fromDate(input.balancePaymentDate) : null,
    // 기존 홈 화면과 결제일 알림 worker가 잔금일을 계속 사용할 수 있도록 유지한다.
    paymentDate: input.balancePaymentDate ? Timestamp.fromDate(input.balancePaymentDate) : null
  };
}

export async function addBudgetItem(coupleId: string, uid: string, input: BudgetInput) {
  const ref = await addDoc(collection(db, "couples", coupleId, "budgets"), {
    ...serializeBudgetInput(input),
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(ref, { budgetId: ref.id });
}

export async function updateBudgetItem(coupleId: string, budgetId: string, uid: string, input: BudgetInput) {
  await updateDoc(doc(db, "couples", coupleId, "budgets", budgetId), {
    ...serializeBudgetInput(input),
    updatedBy: uid,
    updatedAt: serverTimestamp()
  });
}

export async function deleteBudgetItem(coupleId: string, budgetId: string) {
  await deleteDoc(doc(db, "couples", coupleId, "budgets", budgetId));
}

export async function createBudgetItemsFromTemplate(coupleId: string, uid: string) {
  const existing = await getDocs(collection(db, "couples", coupleId, "budgets"));
  if (!existing.empty) return 0;

  const batch = writeBatch(db);
  weddingBudgetTemplate.forEach((item) => {
    const ref = doc(collection(db, "couples", coupleId, "budgets"));
    batch.set(ref, {
      budgetId: ref.id,
      title: item.title,
      category: item.category,
      subCategory: item.subCategory,
      estimatedAmount: item.estimatedAmount,
      contractAmount: 0,
      paidAmount: 0,
      groomShareAmount: item.payer === "shared" ? 0 : null,
      brideShareAmount: item.payer === "shared" ? 0 : null,
      payer: item.payer,
      contractPaymentDate: null,
      balancePaymentDate: null,
      paymentDate: null,
      memo: "",
      vendorName: "",
      vendorContact: "",
      accountInfo: "",
      familySupportAmount: 0,
      refundAmount: 0,
      cardHolder: "",
      relatedScheduleId: null,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
  await batch.commit();
  return weddingBudgetTemplate.length;
}

export function summarizeBudgets(items: BudgetItem[]) {
  return items.reduce(
    (summary, item) => {
      summary.estimatedAmount += item.estimatedAmount;
      summary.contractAmount += item.contractAmount;
      summary.paidAmount += item.paidAmount;
      if (item.payer === "groom") summary.groomPaidAmount += item.paidAmount;
      if (item.payer === "bride") summary.bridePaidAmount += item.paidAmount;
      if (item.payer === "shared") {
        summary.sharedPaidAmount += item.paidAmount;
        summary.groomPaidAmount += item.groomShareAmount ?? 0;
        summary.bridePaidAmount += item.brideShareAmount ?? 0;
      }
      summary.familySupportAmount += item.familySupportAmount ?? 0;
      summary.refundAmount += item.refundAmount ?? 0;
      return summary;
    },
    {
      estimatedAmount: 0,
      contractAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      groomPaidAmount: 0,
      bridePaidAmount: 0,
      sharedPaidAmount: 0,
      familySupportAmount: 0,
      refundAmount: 0
    }
  );
}
