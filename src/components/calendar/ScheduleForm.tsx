"use client";

import { FormEvent, useMemo, useState } from "react";
import { formatInputDateTime } from "@/lib/date/format";
import {
  coupleScheduleCategories,
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
  onSubmit,
  onCancel
}: {
  scheduleType: CoupleMode;
  selectedDate: Date;
  schedule?: Schedule | null;
  onSubmit: (input: ScheduleInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const categories = scheduleType === "wedding" ? weddingScheduleCategories : coupleScheduleCategories;
  const initialStart = schedule?.startAt.toDate() ?? selectedDate;
  const [title, setTitle] = useState(schedule?.title ?? "");
  const [description, setDescription] = useState(schedule?.description ?? "");
  const [startAt, setStartAt] = useState(formatInputDateTime(initialStart));
  const [endAt, setEndAt] = useState(schedule?.endAt ? formatInputDateTime(schedule.endAt.toDate()) : "");
  const [allDay, setAllDay] = useState(schedule?.allDay ?? false);
  const [category, setCategory] = useState<ScheduleCategory>(schedule?.category ?? categories[0]);
  const [reminderEnabled, setReminderEnabled] = useState(schedule?.reminderEnabled ?? false);
  const [saving, setSaving] = useState(false);

  const submitLabel = useMemo(() => {
    if (schedule) return "일정 수정";
    return scheduleType === "wedding" ? "결혼 준비 일정 추가" : "커플 일정 추가";
  }, [schedule, scheduleType]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onSubmit({
      title,
      description,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      allDay,
      category,
      reminderEnabled,
      reminderMinutesBefore: null
    });
    setSaving(false);
    if (!schedule) {
      setTitle("");
      setDescription("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-white p-5 shadow-soft">
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
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={reminderEnabled} onChange={(event) => setReminderEnabled(event.target.checked)} />
        하루 전·당일 오전 9시에 일정 알림 받기
      </label>
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
