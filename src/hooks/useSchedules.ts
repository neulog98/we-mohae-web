"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, endOfMonth, startOfMonth } from "date-fns";
import { limit, onSnapshot, query } from "firebase/firestore";
import { schedulesQuery, upcomingSchedulesQuery } from "@/features/schedule/scheduleService";
import type { Schedule } from "@/types/domain";

export function useMonthSchedules(coupleId: string | null | undefined, monthDate: Date) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = useMemo(() => startOfMonth(monthDate), [monthDate]);
  const end = useMemo(() => endOfMonth(monthDate), [monthDate]);

  useEffect(() => {
    if (!coupleId) {
      setSchedules([]);
      return;
    }
    setLoading(true);
    return onSnapshot(
      schedulesQuery(coupleId, start, end),
      (snapshot) => {
        setSchedules(snapshot.docs.map((document) => document.data() as Schedule));
        setLoading(false);
      },
      (nextError) => {
        setError(nextError.message);
        setLoading(false);
      }
    );
  }, [coupleId, start, end]);

  return { schedules, loading, error };
}

export function useUpcomingSchedules(coupleId: string | null | undefined, count = 5) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coupleId) {
      setSchedules([]);
      return;
    }
    setLoading(true);
    return onSnapshot(query(upcomingSchedulesQuery(coupleId), limit(count)), (snapshot) => {
      setSchedules(snapshot.docs.map((document) => document.data() as Schedule));
      setLoading(false);
    });
  }, [coupleId, count]);

  return { schedules, loading };
}

export function useUpcomingWindowSchedules(coupleId: string | null | undefined, days = 30) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    if (!coupleId) {
      setSchedules([]);
      return;
    }
    const now = new Date();
    return onSnapshot(schedulesQuery(coupleId, now, addDays(now, days)), (snapshot) => {
      setSchedules(snapshot.docs.map((document) => document.data() as Schedule));
    });
  }, [coupleId, days]);

  return schedules;
}
