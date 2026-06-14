"use client";

import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ChecklistStatus, WeddingChecklistItem } from "@/types/domain";
import { weddingChecklistTemplate } from "./checklistTemplates";

export function checklistQuery(coupleId: string) {
  return query(collection(db, "couples", coupleId, "checklist"), where("order", ">=", 0));
}

export async function createChecklistFromTemplate(coupleId: string, uid: string, weddingDate: Date) {
  const existing = await getDocs(collection(db, "couples", coupleId, "checklist"));
  if (!existing.empty) return;

  const batch = writeBatch(db);
  weddingChecklistTemplate.forEach((item, index) => {
    const ref = doc(collection(db, "couples", coupleId, "checklist"));
    const dueDate = new Date(weddingDate);
    dueDate.setDate(dueDate.getDate() - item.daysBeforeWedding);
    batch.set(ref, {
      checklistId: ref.id,
      title: item.title,
      description: item.description,
      dueDate: Timestamp.fromDate(dueDate),
      assignee: item.assignee,
      completed: false,
      status: "todo",
      completedAt: null,
      order: index,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
  await batch.commit();
}

export async function updateChecklistCompletion(
  coupleId: string,
  checklistId: string,
  uid: string,
  completed: boolean
) {
  await updateDoc(doc(db, "couples", coupleId, "checklist", checklistId), {
    completed,
    status: completed ? "done" : "todo",
    completedAt: completed ? serverTimestamp() : null,
    updatedBy: uid,
    updatedAt: serverTimestamp()
  });
}

export async function updateChecklistStatus(
  coupleId: string,
  checklistId: string,
  uid: string,
  status: ChecklistStatus
) {
  await updateDoc(doc(db, "couples", coupleId, "checklist", checklistId), {
    status,
    completed: status === "done",
    completedAt: status === "done" ? serverTimestamp() : null,
    updatedBy: uid,
    updatedAt: serverTimestamp()
  });
}

export function asChecklistItem(documentId: string, data: unknown): WeddingChecklistItem {
  const item = data as WeddingChecklistItem;
  return {
    ...item,
    checklistId: item.checklistId ?? documentId
  };
}
