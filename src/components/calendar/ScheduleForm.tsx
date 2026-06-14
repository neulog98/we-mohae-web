"use client";

import { FormEvent, useMemo, useState } from "react";
import { addMilliseconds } from "date-fns";
import { formatInputDateTime } from "@/lib/date/format";
import {
  coupleScheduleCategories,
  type AssigneeType,
  type CoupleMode,
  type Schedule,
  type ScheduleCategory,
  weddingScheduleCategories
} from "@/types/domain";
import type { ScheduleInput } from "@/features/schedule/scheduleService";

export function ScheduleForm({
  scheduleType,
  selectedDate,
  schedule,
  intent = "create",
  onSubmit,
  onCancel
}: {
  scheduleType: CoupleMode;
  selectedDate: Date;
  schedule?: Schedule | null;
  intent?: "create" | "edit" | "copy";
  onSubmit: (input: ScheduleInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const categories = scheduleType === "wedding" ? weddingScheduleCategories : coupleScheduleCategories;
  const initialStart = getInitialStart(schedule, selectedDate, intent);
  const initialEnd = getInitialEnd(schedule, initialStart, intent);
  const [title, setTitle] = useState(schedule?.title ?? "");
  const [description, setDescription] = useState(schedule?.description ?? "");
  const [startAt, setStartAt] = useState(formatInputDateTime(initialStart));
  const [endAt, setEndAt] = useState(initialEnd ? formatInputDateTime(initialEnd) : "");
  const [allDay, setAllDay] = useState(schedule?.allDay ?? false);
  const [category, setCategory] = useState<ScheduleCategory>(schedule?.category ?? categories[0]);
  const [assignee, setAssignee] = useState<AssigneeType>(schedule?.assignee ?? "shared");
  const [vendorName, setVendorName] = useState(schedule?.vendorName ?? "");
  const [vendorContact, setVendorContact] = useState(schedule?.vendorContact ?? "");
  const [reminderEnabled, setReminderEnabled] = useState(schedule?.reminderEnabled ?? false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submitLabel = useMemo(() => {
    if (intent === "edit") return "일정 수정";
    if (intent === "copy") return "일정 복사";
    return scheduleType === "wedding" ? "결혼 준비 일정 추가" : "커플 일정 추가";
  }, [intent, scheduleType]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const nextStartAt = new Date(startAt);
    const nextEndAt = endAt ? new Date(endAt) : null;
    if (nextEndAt && nextEndAt < nextStartAt) {
      setError("종료일은 시작일보다 빠를 수 없어요.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title,
        description,
        startAt: nextStartAt,
        endAt: nextEndAt,
        allDay,
        category,
        assignee,
        vendorName,
        vendorContact,
        reminderEnabled,
        reminderMinutesBefore: null
      });
      if (intent === "create") {
        setTitle("");
        setDescription("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form aria-label={submitLabel} onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-semibold text-ink">{submitLabel}</h3>
      <label className="block text-sm font-medium text-neutral-700">
        일정 제목
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3 outline-none focus:border-rosewood"
          placeholder="일정 제목"
        />
      </label>
      <label className="block text-sm font-medium text-neutral-700">
        설명
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 min-h-20 w-full rounded-md border border-neutral-200 px-3 py-3 outline-none focus:border-rosewood"
          placeholder="설명"
        />
      </label>
      <label className="block text-sm font-medium text-neutral-700">
        시작일
        <input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3" />
      </label>
      <label className="block text-sm font-medium text-neutral-700">
        종료일
        <input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3" />
      </label>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />
        종일 일정
      </label>
      <label className="block text-sm font-medium text-neutral-700">
        카테고리
        <select value={category} onChange={(event) => setCategory(event.target.value as ScheduleCategory)} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3">
          {categories.map((nextCategory) => (
            <option key={nextCategory} value={nextCategory}>{nextCategory}</option>
          ))}
        </select>
      </label>
      {scheduleType === "wedding" && (
        <>
          <label className="block text-sm font-medium text-neutral-700">
            담당
            <select value={assignee} onChange={(event) => setAssignee(event.target.value as AssigneeType)} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3">
              <option value="shared">공동</option>
              <option value="groom">신랑</option>
              <option value="bride">신부</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            업체명
            <input value={vendorName} onChange={(event) => setVendorName(event.target.value)} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3 outline-none focus:border-rosewood" placeholder="예: 모해스튜디오" />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            업체 연락처
            <input value={vendorContact} onChange={(event) => setVendorContact(event.target.value)} className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3 outline-none focus:border-rosewood" placeholder="전화번호, 담당자명, 카카오톡 채널" />
          </label>
        </>
      )}
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={reminderEnabled} onChange={(event) => setReminderEnabled(event.target.checked)} />
        하루 전·당일 오전 9시에 일정 알림 받기
      </label>
      {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 py-3 text-sm font-semibold text-ink">
            취소
          </button>
        )}
        <button disabled={saving} className="rounded-md bg-rosewood py-3 text-sm font-semibold text-white disabled:opacity-60">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function getInitialStart(schedule: Schedule | null | undefined, selectedDate: Date, intent: "create" | "edit" | "copy") {
  if (!schedule || intent === "create") return selectedDate;
  const sourceStart = schedule.startAt.toDate();
  if (intent === "edit") return sourceStart;

  const nextStart = new Date(selectedDate);
  nextStart.setHours(sourceStart.getHours(), sourceStart.getMinutes(), 0, 0);
  return nextStart;
}

function getInitialEnd(schedule: Schedule | null | undefined, initialStart: Date, intent: "create" | "edit" | "copy") {
  if (!schedule?.endAt) return null;
  const sourceStart = schedule.startAt.toDate();
  const sourceEnd = schedule.endAt.toDate();
  if (intent === "edit") return sourceEnd;
  return addMilliseconds(initialStart, sourceEnd.getTime() - sourceStart.getTime());
}
