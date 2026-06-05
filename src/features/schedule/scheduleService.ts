"use client";

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CoupleMode, Schedule, ScheduleCategory } from "@/types/domain";

export interface ScheduleInput {
  title: string;
  description: string;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  category: ScheduleCategory;
  reminderEnabled: boolean;
  reminderMinutesBefore: number | null;
}

export function schedulesQuery(coupleId: string, start: Date, end: Date) {
  return query(
    collection(db, "couples", coupleId, "schedules"),
    where("startAt", ">=", Timestamp.fromDate(start)),
    where("startAt", "<=", Timestamp.fromDate(end)),
    orderBy("startAt", "asc")
  );
}

export function upcomingSchedulesQuery(coupleId: string, count = 5) {
  return query(
    collection(db, "couples", coupleId, "schedules"),
    where("startAt", ">=", Timestamp.fromDate(new Date())),
    orderBy("startAt", "asc")
  );
}

export async function addSchedule(coupleId: string, uid: string, type: CoupleMode, input: ScheduleInput) {
  const ref = await addDoc(collection(db, "couples", coupleId, "schedules"), {
    ...input,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: input.endAt ? Timestamp.fromDate(input.endAt) : null,
    type,
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await updateDoc(ref, { scheduleId: ref.id });
}

export async function updateSchedule(coupleId: string, scheduleId: string, uid: string, input: ScheduleInput) {
  await updateDoc(doc(db, "couples", coupleId, "schedules", scheduleId), {
    ...input,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: input.endAt ? Timestamp.fromDate(input.endAt) : null,
    updatedBy: uid,
    updatedAt: serverTimestamp()
  });
}

export async function deleteSchedule(coupleId: string, scheduleId: string) {
  await deleteDoc(doc(db, "couples", coupleId, "schedules", scheduleId));
}

export function asSchedule(data: unknown) {
  return data as Schedule;
}
