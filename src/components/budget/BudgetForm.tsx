"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  budgetCategories,
  budgetSubCategorySuggestions,
  type BudgetCategory,
  type BudgetItem,
  type PayerType,
  type Schedule
} from "@/types/domain";
import type { BudgetInput } from "@/features/budget/budgetService";
import { formatCurrency } from "@/lib/date/format";

function dateInputValue(date?: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function formatMoneyInput(value: string) {
  const digits = normalizeMoneyInput(value);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function BudgetForm({
  item,
  schedules,
  onSubmit,
  onCancel
}: {
  item?: BudgetItem | null;
  schedules: Schedule[];
  onSubmit: (input: BudgetInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [category, setCategory] = useState<BudgetCategory>(item?.category ?? "웨딩홀");
  const [subCategory, setSubCategory] = useState(item?.subCategory ?? "");
  const [estimatedAmount, setEstimatedAmount] = useState(String(item?.estimatedAmount ?? 0));
  const [contractAmount, setContractAmount] = useState(String(item?.contractAmount ?? 0));
  const [paidAmount, setPaidAmount] = useState(String(item?.paidAmount ?? 0));
  const [payer, setPayer] = useState<PayerType>(item?.payer ?? "shared");
  const [contractPaymentDate, setContractPaymentDate] = useState(dateInputValue(item?.contractPaymentDate?.toDate()));
  const [balancePaymentDate, setBalancePaymentDate] = useState(
    dateInputValue(item?.balancePaymentDate?.toDate() ?? item?.paymentDate?.toDate())
  );
  const [memo, setMemo] = useState(item?.memo ?? "");
  const [relatedScheduleId, setRelatedScheduleId] = useState(item?.relatedScheduleId ?? "");
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");
  const estimatedAmountNumber = Number(estimatedAmount) || 0;
  const contractAmountNumber = Number(contractAmount) || 0;
  const paidAmountNumber = Number(paidAmount) || 0;
  const remainingAmount = estimatedAmountNumber - paidAmountNumber;
  const isOverBudget = remainingAmount < 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    if (contractAmountNumber > paidAmountNumber) {
      setValidationError("계약금은 현재까지 결제 금액보다 클 수 없어요.");
      return;
    }
    if (contractPaymentDate && balancePaymentDate && new Date(`${contractPaymentDate}T00:00:00`) > new Date(`${balancePaymentDate}T00:00:00`)) {
      setValidationError("잔금 결제일은 계약금 결제일보다 빠를 수 없어요.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title,
        category,
        subCategory,
        estimatedAmount: estimatedAmountNumber,
        contractAmount: contractAmountNumber,
        paidAmount: paidAmountNumber,
        payer,
        contractPaymentDate: contractPaymentDate ? new Date(`${contractPaymentDate}T00:00:00`) : null,
        balancePaymentDate: balancePaymentDate ? new Date(`${balancePaymentDate}T00:00:00`) : null,
        memo,
        relatedScheduleId: relatedScheduleId || null
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="budget-form-title" className="fixed inset-0 z-40 overflow-y-auto bg-cloud">
      <form onSubmit={handleSubmit} className="mx-auto min-h-screen w-full max-w-md pb-28">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <h2 id="budget-form-title" className="text-lg font-bold text-ink">{item ? "예산 항목 수정" : "예산 항목 추가"}</h2>
          <button type="button" aria-label="예산 폼 닫기" onClick={onCancel} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-2 text-neutral-600">
            <X size={19} />
          </button>
        </header>

        <div className="space-y-7 px-5 py-5">
          <FormSection title="기본 정보">
            <FieldLabel label="항목명" required>
              <input required value={title} onChange={(event) => setTitle(event.target.value)} className={inputClassName} placeholder="예: 웨딩홀 계약" />
            </FieldLabel>
            <FieldLabel label="카테고리">
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as BudgetCategory);
                  setSubCategory("");
                }}
                className={inputClassName}
              >
                {budgetCategories.map((nextCategory) => (
                  <option key={nextCategory} value={nextCategory}>{nextCategory}</option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="세부 카테고리">
              <input
                value={subCategory}
                onChange={(event) => setSubCategory(event.target.value)}
                className={inputClassName}
                placeholder="직접 입력하거나 아래 항목을 선택하세요"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {(budgetSubCategorySuggestions[category] ?? []).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setSubCategory(suggestion)}
                    className={`rounded-md border px-3 py-2 text-xs font-medium ${
                      subCategory === suggestion
                        ? "border-rosewood bg-rosewood/10 text-rosewood"
                        : "border-neutral-200 bg-white text-neutral-600"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </FieldLabel>
          </FormSection>

          <FormSection title="금액 정보">
            <MoneyField
              label="예상 예산"
              description="이 항목에 사용할 계획인 전체 금액이에요."
              value={estimatedAmount}
              onChange={setEstimatedAmount}
            />
            <MoneyField
              label="계약금"
              description="계약할 때 먼저 지불한 금액이에요."
              value={contractAmount}
              onChange={setContractAmount}
            />
            <MoneyField
              label="현재까지 결제 금액"
              description="계약금을 포함해 현재까지 실제로 결제한 누적 금액이에요."
              value={paidAmount}
              onChange={setPaidAmount}
            />
            <div className={`rounded-md p-4 ${isOverBudget ? "bg-red-50" : "bg-mint/10"}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-neutral-600">{isOverBudget ? "예산 초과 금액" : "남은 예상 금액"}</span>
                <strong className={isOverBudget ? "text-red-600" : "text-mint"}>
                  {formatCurrency(Math.abs(remainingAmount))}
                </strong>
              </div>
              {isOverBudget && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle size={14} />
                  결제 금액이 예상 예산보다 커요.
                </p>
              )}
            </div>
            {validationError && (
              <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {validationError}
              </p>
            )}
          </FormSection>

          <FormSection title="결제 정보">
            <FieldLabel label="결제자">
              <div className="grid grid-cols-3 gap-1 rounded-md bg-neutral-100 p-1">
                {([
                  ["groom", "신랑"],
                  ["bride", "신부"],
                  ["shared", "공동"]
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPayer(value)}
                    className={`min-h-11 rounded-md text-sm font-semibold ${
                      payer === value ? "bg-white text-rosewood shadow-sm" : "text-neutral-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FieldLabel>
            <FieldLabel label="계약금 결제일">
              <input type="date" value={contractPaymentDate} onChange={(event) => setContractPaymentDate(event.target.value)} className={inputClassName} />
            </FieldLabel>
            <FieldLabel label="잔금 결제일">
              <input type="date" value={balancePaymentDate} onChange={(event) => setBalancePaymentDate(event.target.value)} className={inputClassName} />
            </FieldLabel>
            <FieldLabel label="관련 결혼 준비 일정">
              <select value={relatedScheduleId} onChange={(event) => setRelatedScheduleId(event.target.value)} className={inputClassName}>
                <option value="">관련 일정 없음</option>
                {schedules.map((schedule) => (
                  <option key={schedule.scheduleId} value={schedule.scheduleId}>{schedule.title}</option>
                ))}
              </select>
            </FieldLabel>
          </FormSection>

          <FormSection title="메모">
            <FieldLabel label="메모" visuallyHidden>
              <textarea value={memo} onChange={(event) => setMemo(event.target.value)} className={`${inputClassName} min-h-28 resize-none`} placeholder="업체 연락처, 결제 조건 등 필요한 내용을 적어주세요." />
            </FieldLabel>
          </FormSection>
        </div>

        <div className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-2 gap-2 border-t border-neutral-200 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 py-3 text-sm font-semibold text-ink">
            취소
          </button>
          <button disabled={saving} className="rounded-md bg-rosewood py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "저장 중..." : item ? "수정 저장" : "예산 항목 저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClassName =
  "mt-2 block min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-base text-ink shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-rosewood focus:ring-2 focus:ring-rosewood/15";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-4 text-base font-bold text-ink">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({
  label,
  required,
  visuallyHidden,
  children
}: {
  label: string;
  required?: boolean;
  visuallyHidden?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={visuallyHidden ? "sr-only" : "text-sm font-semibold text-neutral-700"}>
        {label}{required && <span className="text-rosewood"> *</span>}
      </span>
      {children}
    </label>
  );
}

function MoneyField({
  label,
  description,
  value,
  onChange
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldLabel label={label}>
      <div className="relative mt-2">
        <input
          type="text"
          inputMode="numeric"
          value={formatMoneyInput(value)}
          onChange={(event) => onChange(normalizeMoneyInput(event.target.value))}
          onFocus={(event) => event.currentTarget.select()}
          placeholder="0"
          className="block min-h-12 w-full rounded-md border border-neutral-300 bg-white py-3 pl-3 pr-10 text-right text-base font-semibold tabular-nums text-ink shadow-sm outline-none transition placeholder:font-normal placeholder:text-neutral-400 focus:border-rosewood focus:ring-2 focus:ring-rosewood/15"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">원</span>
      </div>
      <span className="mt-1 block text-xs leading-5 text-neutral-500">{description}</span>
    </FieldLabel>
  );
}
