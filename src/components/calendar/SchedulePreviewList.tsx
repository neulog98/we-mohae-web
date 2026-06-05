"use client";

import { CalendarClock } from "lucide-react";
import { EmptyView, LoadingView } from "@/components/common/StateView";
import { ddayLabel, formatKoreanDateTime } from "@/lib/date/format";
import type { Schedule } from "@/types/domain";

export function SchedulePreviewList({ schedules, loading }: { schedules: Schedule[]; loading?: boolean }) {
  if (loading) return <LoadingView label="다가오는 일정을 불러오는 중이에요" />;
  if (schedules.length === 0) return <EmptyView label="아직 등록된 일정이 없어요" />;

  return (
    <div className="space-y-2">
      {schedules.map((schedule) => {
        const startAt = schedule.startAt.toDate();
        return (
          <article key={schedule.scheduleId} className="flex items-center gap-3 rounded-md bg-white p-4 shadow-soft">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rosewood/10 text-rosewood">
              <CalendarClock size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-semibold text-ink">{schedule.title}</h3>
                <span className="shrink-0 rounded-full bg-mint/15 px-2 py-1 text-xs font-semibold text-mint">{ddayLabel(startAt)}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{formatKoreanDateTime(startAt, schedule.allDay)} · {schedule.category}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
