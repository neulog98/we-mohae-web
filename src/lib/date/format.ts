import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek
} from "date-fns";
import { ko } from "date-fns/locale";

export function formatKoreanDate(date: Date) {
  return format(date, "M월 d일 EEEE", { locale: ko });
}

export function formatKoreanDateTime(date: Date, allDay?: boolean) {
  if (allDay) return format(date, "M월 d일 EEEE", { locale: ko });
  return format(date, "M월 d일 EEEE a h:mm", { locale: ko });
}

export function formatTime(date: Date) {
  return format(date, "a h:mm", { locale: ko });
}

export function formatInputDateTime(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(amount);
}

export function ddayLabel(date: Date, now = new Date()) {
  const diff = differenceInCalendarDays(date, now);
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function buildMonthDays(monthDate: Date) {
  const first = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const last = endOfMonth(monthDate);
  const days: Date[] = [];
  let cursor = first;
  while (days.length < 42) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return {
    days,
    isCurrentMonth: (date: Date) => date.getMonth() === monthDate.getMonth(),
    isSelected: (date: Date, selected: Date) => isSameDay(date, selected),
    monthStart: startOfMonth(monthDate),
    monthEnd: last
  };
}
