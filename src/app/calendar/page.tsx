"use client";

import { isSameDay } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyView, LoadingView } from "@/components/common/StateView";
import { useToast } from "@/components/common/Toast";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { ScheduleForm } from "@/components/calendar/ScheduleForm";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { addSchedule, deleteSchedule, updateSchedule } from "@/features/schedule/scheduleService";
import { useCouple } from "@/hooks/useCouple";
import { useMonthSchedules } from "@/hooks/useSchedules";
import { formatKoreanDate, formatKoreanDateTime } from "@/lib/date/format";
import type { CoupleMode, Schedule, UserProfile } from "@/types/domain";

export default function CalendarPage() {
  return (
    <AuthGate>
      {({ profile }) => <CalendarContent profile={profile} />}
    </AuthGate>
  );
}

function CalendarContent({ profile }: { profile: UserProfile }) {
  const { showToast } = useToast();
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [scheduleType, setScheduleType] = useState<CoupleMode>("couple");
  const { mode } = useCouple(profile);
  const { schedules, loading } = useMonthSchedules(profile.coupleId, monthDate);
  const visibleSchedules = useMemo(
    () => schedules.filter((schedule) => schedule.type === (mode === "wedding" ? scheduleType : "couple")),
    [mode, scheduleType, schedules]
  );
  const selectedSchedules = useMemo(
    () => visibleSchedules.filter((schedule) => isSameDay(schedule.startAt.toDate(), selectedDate)),
    [visibleSchedules, selectedDate]
  );
  const activeScheduleType = editing?.type ?? (mode === "wedding" ? scheduleType : "couple");

  return (
    <AppShell mode={mode ?? "couple"} title="캘린더">
      <section className="space-y-5">
        {mode === "wedding" && (
          <div className="grid grid-cols-2 gap-1 rounded-md bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => {
                setScheduleType("couple");
                setEditing(null);
              }}
              className={`min-h-11 rounded-md text-sm font-semibold ${
                scheduleType === "couple" ? "bg-white text-rosewood shadow-sm" : "text-neutral-500"
              }`}
            >
              커플 일정
            </button>
            <button
              type="button"
              onClick={() => {
                setScheduleType("wedding");
                setEditing(null);
              }}
              className={`min-h-11 rounded-md text-sm font-semibold ${
                scheduleType === "wedding" ? "bg-white text-mint shadow-sm" : "text-neutral-500"
              }`}
            >
              결혼 준비 일정
            </button>
          </div>
        )}

        <MonthCalendar
          monthDate={monthDate}
          selectedDate={selectedDate}
          schedules={visibleSchedules}
          onMonthChange={setMonthDate}
          onSelectDate={setSelectedDate}
        />

        {loading ? (
          <LoadingView label="월간 일정을 불러오는 중이에요" />
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-ink">{formatKoreanDate(selectedDate)}</h2>
              {mode === "wedding" && (
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${scheduleType === "couple" ? "bg-rosewood/10 text-rosewood" : "bg-mint/10 text-mint"}`}>
                  {scheduleType === "couple" ? "커플 일정" : "결혼 준비"}
                </span>
              )}
            </div>
            {selectedSchedules.length === 0 ? (
              <EmptyView label="두 분의 첫 일정을 추가해보세요" />
            ) : (
              <div className="space-y-2">
                {selectedSchedules.map((schedule) => (
                  <article key={schedule.scheduleId} className="rounded-md bg-white p-4 shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-ink">{schedule.title}</h3>
                        <p className="mt-1 text-xs text-neutral-500">
                          {formatKoreanDateTime(schedule.startAt.toDate(), schedule.allDay)} · {schedule.category}
                        </p>
                        {schedule.description && <p className="mt-2 text-sm leading-6 text-neutral-600">{schedule.description}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button aria-label="일정 수정" onClick={() => setEditing(schedule)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-2">
                          <Edit size={16} />
                        </button>
                        <button aria-label="일정 삭제" onClick={() => setDeleteTarget(schedule)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-red-50 p-2 text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        <ScheduleForm
          key={editing?.scheduleId ?? selectedDate.toISOString()}
          scheduleType={activeScheduleType}
          selectedDate={selectedDate}
          schedule={editing}
          onCancel={editing ? () => setEditing(null) : undefined}
          onSubmit={async (input) => {
            try {
              if (!profile.coupleId) return;
              if (editing) {
                await updateSchedule(profile.coupleId, editing.scheduleId, profile.uid, input);
                setEditing(null);
                showToast("일정을 수정했어요.", "success");
              } else {
                await addSchedule(profile.coupleId, profile.uid, activeScheduleType, input);
                showToast("일정을 추가했어요.", "success");
              }
            } catch (error) {
              showToast(error instanceof Error ? error.message : "일정 저장에 실패했어요.", "error");
            }
          }}
        />
      </section>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="일정을 삭제할까요?"
        description="삭제한 일정은 바로 복구할 수 없어요."
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!profile.coupleId || !deleteTarget) return;
          await deleteSchedule(profile.coupleId, deleteTarget.scheduleId);
          setDeleteTarget(null);
          showToast("일정을 삭제했어요.", "success");
        }}
      />
    </AppShell>
  );
}
