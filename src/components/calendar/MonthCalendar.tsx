"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { buildMonthDays } from "@/lib/date/format";
import type { Schedule } from "@/types/domain";

export function MonthCalendar({
  monthDate,
  selectedDate,
  schedules,
  onMonthChange,
  onSelectDate
}: {
  monthDate: Date;
  selectedDate: Date;
  schedules: Schedule[];
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
}) {
  const month = buildMonthDays(monthDate);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="rounded-lg bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <button aria-label="이전 달" onClick={() => onMonthChange(addMonths(monthDate, -1))} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-2">
          <ChevronLeft size={18} />
        </button>
        <strong className="text-lg text-ink">{format(monthDate, "yyyy년 M월", { locale: ko })}</strong>
        <button aria-label="다음 달" onClick={() => onMonthChange(addMonths(monthDate, 1))} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-2">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
        {weekDays.map((day) => (
          <div key={day} className="py-2 font-medium">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {month.days.map((day) => {
          const hasSchedule = schedules.some((schedule) => isSameDay(schedule.startAt.toDate(), day));
          const selected = month.isSelected(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-md text-sm ${
                selected
                  ? "bg-rosewood text-white"
                  : month.isCurrentMonth(day)
                    ? "bg-cloud text-ink"
                    : "bg-neutral-50 text-neutral-300"
              }`}
            >
              {format(day, "d")}
              {hasSchedule && <span className={`absolute bottom-2 h-1 w-1 rounded-full ${selected ? "bg-white" : "bg-rosewood"}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
