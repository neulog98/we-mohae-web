"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Guest, GuestAttendanceStatus, GuestSide } from "@/types/domain";

export interface GuestInput {
  name: string;
  side: GuestSide;
  relation: string;
  phone: string;
  attendanceStatus: GuestAttendanceStatus;
  companionCount: number;
  mealTicketCount: number;
  giftChecked: boolean;
  congratulatoryAmount: number;
  memo: string;
}

export function guestsQuery(coupleId: string) {
  return collection(db, "couples", coupleId, "guests");
}

export async function addGuest(coupleId: string, uid: string, input: GuestInput) {
  const ref = await addDoc(guestsQuery(coupleId), {
    ...input,
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(ref, { guestId: ref.id });
}

export async function updateGuest(coupleId: string, guestId: string, uid: string, input: GuestInput) {
  await updateDoc(doc(db, "couples", coupleId, "guests", guestId), {
    ...input,
    updatedBy: uid,
    updatedAt: serverTimestamp()
  });
}

export async function deleteGuest(coupleId: string, guestId: string) {
  await deleteDoc(doc(db, "couples", coupleId, "guests", guestId));
}

export function asGuest(documentId: string, data: unknown): Guest {
  const guest = data as Guest;
  return {
    ...guest,
    guestId: guest.guestId ?? documentId
  };
}
