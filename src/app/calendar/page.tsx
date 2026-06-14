"use client";

import { isSameDay } from "date-fns";
import { Copy, Edit, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyView, LoadingView } from "@/components/common/StateView";
import { useToast } from "@/components/common/Toast";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { ScheduleForm } from "@/components/calendar/ScheduleForm";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { addSchedule, deleteSchedule, updateSchedule } from "@/features/schedule/scheduleService";
import type { ScheduleInput } from "@/features/schedule/scheduleService";
import { useCouple } from "@/hooks/useCouple";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useMonthSchedules } from "@/hooks/useSchedules";
import { formatKoreanDate, formatKoreanDateTime } from "@/lib/date/format";
import type { CoupleMode, Schedule, UserProfile } from "@/types/domain";
import { getUserFacingErrorMessage } from "@/utils/errors";

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
  const [copySource, setCopySource] = useState<Schedule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
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
  const dialogSchedule = editing ?? copySource;
  const activeScheduleType = dialogSchedule?.type ?? (mode === "wedding" ? scheduleType : "couple");
  const formIntent = editing ? "edit" : copySource ? "copy" : "create";

  return (
    <AppShell mode={mode ?? "couple"} title="캘린더">
      <section className="space-y-5">
        {mode === "wedding" && (
          <div className="grid grid-cols-2 gap-1 rounded-md bg-neutral-100 p-1 md:max-w-xl">
	            <button
	              type="button"
	              onClick={() => {
	                setScheduleType("couple");
	                setEditing(null);
	                setCopySource(null);
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
	                setCopySource(null);
	              }}
              className={`min-h-11 rounded-md text-sm font-semibold ${
                scheduleType === "wedding" ? "bg-white text-mint shadow-sm" : "text-neutral-500"
              }`}
            >
              결혼 준비 일정
            </button>
          </div>
        )}

        <div className="space-y-5 md:grid md:grid-cols-[minmax(0,560px)_minmax(360px,1fr)] md:items-start md:gap-5 md:space-y-0">
          <MonthCalendar
            monthDate={monthDate}
            selectedDate={selectedDate}
            schedules={visibleSchedules}
            onMonthChange={setMonthDate}
            onSelectDate={setSelectedDate}
          />

          <div className="space-y-5">
            <ScheduleList
              loading={loading}
              mode={mode}
              scheduleType={scheduleType}
              selectedDate={selectedDate}
              schedules={selectedSchedules}
              onEdit={(schedule) => {
                setEditing(schedule);
                setCopySource(null);
                setFormOpen(true);
              }}
              onCopy={(schedule) => {
                setCopySource(schedule);
                setEditing(null);
                setFormOpen(true);
              }}
              onDelete={setDeleteTarget}
            />

	            <button
	              type="button"
	              onClick={() => {
	                setEditing(null);
	                setCopySource(null);
	                setFormOpen(true);
	              }}
	              className="flex w-full items-center justify-center gap-2 rounded-md bg-rosewood py-3 text-sm font-semibold text-white"
	            >
	              <Plus size={18} />
	              일정 추가
	            </button>
	          </div>
	        </div>
	      </section>
        {formOpen && (
          <ScheduleDialog
            key={`${formIntent}-${dialogSchedule?.scheduleId ?? selectedDate.toISOString()}`}
            intent={formIntent}
            scheduleType={activeScheduleType}
            selectedDate={selectedDate}
            schedule={dialogSchedule}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
              setCopySource(null);
            }}
            onSubmit={async (input) => {
              try {
                if (!profile.coupleId) return;
                if (editing) {
                  await updateSchedule(profile.coupleId, editing.scheduleId, profile.uid, input);
                  showToast("일정을 수정했어요.", "success");
                } else {
                  await addSchedule(profile.coupleId, profile.uid, activeScheduleType, input);
                  showToast(copySource ? "일정을 복사했어요." : "일정을 추가했어요.", "success");
                }
                setFormOpen(false);
                setEditing(null);
                setCopySource(null);
              } catch (error) {
                showToast(getUserFacingErrorMessage(error, "일정 저장에 실패했어요."), "error");
              }
            }}
          />
        )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="일정을 삭제할까요?"
        description="삭제한 일정은 바로 복구할 수 없어요."
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!profile.coupleId || !deleteTarget) return;
          try {
            await deleteSchedule(profile.coupleId, deleteTarget.scheduleId);
            setDeleteTarget(null);
            showToast("일정을 삭제했어요.", "success");
          } catch (error) {
            showToast(getUserFacingErrorMessage(error, "일정 삭제에 실패했어요."), "error");
          }
        }}
      />
    </AppShell>
  );
}

function ScheduleList({
  loading,
  mode,
  scheduleType,
  selectedDate,
  schedules,
  onEdit,
  onCopy,
  onDelete
}: {
  loading: boolean;
  mode: CoupleMode | null;
  scheduleType: CoupleMode;
  selectedDate: Date;
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onCopy: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
}) {
  if (loading) {
    return <LoadingView label="월간 일정을 불러오는 중이에요" />;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-ink">{formatKoreanDate(selectedDate)}</h2>
        {mode === "wedding" && (
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${scheduleType === "couple" ? "bg-rosewood/10 text-rosewood" : "bg-mint/10 text-mint"}`}>
            {scheduleType === "couple" ? "커플 일정" : "결혼 준비"}
          </span>
        )}
      </div>
      {schedules.length === 0 ? (
        <EmptyView label="두 분의 첫 일정을 추가해보세요" />
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <article key={schedule.scheduleId} className="rounded-md bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink">{schedule.title}</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatKoreanDateTime(schedule.startAt.toDate(), schedule.allDay)} · {schedule.category}
                  </p>
                  {schedule.type === "wedding" && (
                    <p className="mt-1 text-xs text-neutral-500">
                      담당 {assigneeLabel(schedule.assignee)}{schedule.vendorName ? ` · ${schedule.vendorName}` : ""}{schedule.vendorContact ? ` · ${schedule.vendorContact}` : ""}
                    </p>
                  )}
                  {schedule.description && <p className="mt-2 text-sm leading-6 text-neutral-600">{schedule.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    aria-label="일정 수정"
                    onClick={() => {
                      onEdit(schedule);
                    }}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button aria-label="일정 복사" onClick={() => onCopy(schedule)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-2">
                    <Copy size={16} />
                  </button>
                  <button aria-label="일정 삭제" onClick={() => onDelete(schedule)} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-red-50 p-2 text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function assigneeLabel(assignee: Schedule["assignee"]) {
  if (assignee === "groom") return "신랑";
  if (assignee === "bride") return "신부";
  return "공동";
}

function ScheduleDialog({
  intent,
  scheduleType,
  selectedDate,
  schedule,
  onSubmit,
  onCancel
}: {
  intent: "create" | "edit" | "copy";
  scheduleType: CoupleMode;
  selectedDate: Date;
  schedule?: Schedule | null;
  onSubmit: (input: ScheduleInput) => Promise<void>;
  onCancel: () => void;
}) {
  useLockBodyScroll();

  const title = intent === "edit" ? "일정 수정" : intent === "copy" ? "일정 복사" : "일정 추가";

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title" className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/40 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-soft">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <h2 id="schedule-dialog-title" className="text-lg font-bold text-ink">{title}</h2>
          <button type="button" aria-label="일정 폼 닫기" onClick={onCancel} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-2 text-neutral-600">
            <X size={19} />
          </button>
        </header>
        <div className="p-5">
          <ScheduleForm
            intent={intent}
            scheduleType={scheduleType}
            selectedDate={selectedDate}
            schedule={schedule}
            onCancel={onCancel}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}
