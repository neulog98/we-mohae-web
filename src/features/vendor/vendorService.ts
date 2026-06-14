"use client";

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { BudgetCategory, Vendor, VendorAttachment, VendorQuote, VendorStatus } from "@/types/domain";

export interface VendorQuoteInput {
  title: string;
  amount: number;
  includedItems: string;
  extraCostMemo: string;
  validUntil: Date | null;
}

export interface VendorInput {
  name: string;
  category: BudgetCategory;
  status: VendorStatus;
  contactName: string;
  phone: string;
  address: string;
  contractAmount: number;
  depositAmount: number;
  balanceAmount: number;
  paymentDueDate: Date | null;
  memo: string;
  attachments: VendorAttachment[];
  quotes: VendorQuoteInput[];
  relatedBudgetId: string | null;
  relatedScheduleId: string | null;
}

export function vendorsQuery(coupleId: string) {
  return collection(db, "couples", coupleId, "vendors");
}

export async function addVendor(coupleId: string, uid: string, input: VendorInput) {
  const ref = await addDoc(vendorsQuery(coupleId), {
    ...serializeVendorInput(input),
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(ref, { vendorId: ref.id });
}

export async function updateVendor(coupleId: string, vendorId: string, uid: string, input: VendorInput) {
  await updateDoc(doc(db, "couples", coupleId, "vendors", vendorId), {
    ...serializeVendorInput(input),
    updatedBy: uid,
    updatedAt: serverTimestamp()
  });
}

export async function deleteVendor(coupleId: string, vendorId: string) {
  await deleteDoc(doc(db, "couples", coupleId, "vendors", vendorId));
}

function serializeVendorInput(input: VendorInput) {
  return {
    ...input,
    paymentDueDate: input.paymentDueDate ? Timestamp.fromDate(input.paymentDueDate) : null,
    quotes: input.quotes.map((quote) => ({
      ...quote,
      quoteId: crypto.randomUUID(),
      validUntil: quote.validUntil ? Timestamp.fromDate(quote.validUntil) : null,
      createdAt: Timestamp.fromDate(new Date())
    }))
  };
}

export function asVendor(documentId: string, data: unknown): Vendor {
  const vendor = data as Vendor;
  return {
    ...vendor,
    vendorId: vendor.vendorId ?? documentId,
    attachments: vendor.attachments ?? [],
    quotes: (vendor.quotes ?? []) as VendorQuote[]
  };
}
