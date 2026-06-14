"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyView, LoadingView } from "@/components/common/StateView";
import { useToast } from "@/components/common/Toast";
import { addVendor, deleteVendor, updateVendor, type VendorInput } from "@/features/vendor/vendorService";
import { useBudgets } from "@/hooks/useBudgets";
import { useCouple } from "@/hooks/useCouple";
import { useUpcomingWindowSchedules } from "@/hooks/useSchedules";
import { useVendors } from "@/hooks/useVendors";
import { formatCurrency, formatKoreanDate } from "@/lib/date/format";
import { budgetCategories, type BudgetCategory, type UserProfile, type Vendor, type VendorAttachment, type VendorStatus } from "@/types/domain";
import { getUserFacingErrorMessage } from "@/utils/errors";

export default function VendorsPage() {
  return (
    <AuthGate>
      {({ profile }) => <VendorsContent profile={profile} />}
    </AuthGate>
  );
}

function VendorsContent({ profile }: { profile: UserProfile }) {
  const { mode } = useCouple(profile);
  const { showToast } = useToast();
  const { vendors, summary, loading } = useVendors(mode === "wedding" ? profile.coupleId : null);
  const { budgets } = useBudgets(mode === "wedding" ? profile.coupleId : null);
  const schedules = useUpcomingWindowSchedules(profile.coupleId, 365).filter((schedule) => schedule.type === "wedding");
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [category, setCategory] = useState<BudgetCategory | "전체">("전체");
  const visibleVendors = useMemo(() => {
    return category === "전체" ? vendors : vendors.filter((vendor) => vendor.category === category);
  }, [category, vendors]);

  if (mode !== "wedding") {
    return (
      <AppShell mode="couple" title="업체 관리">
        <EmptyView label="업체 관리는 예비부부 모드에서 사용할 수 있어요" />
      </AppShell>
    );
  }

  return (
    <AppShell mode="wedding" title="업체 관리">
      <section className="space-y-5">
        <div className="grid gap-2 md:grid-cols-4">
          <Metric label="관리 업체" value={`${summary.total}곳`} />
          <Metric label="계약 완료" value={`${summary.contracted}곳`} />
          <Metric label="계약 합계" value={formatCurrency(summary.contractAmount)} />
          <Metric label="잔금 합계" value={formatCurrency(summary.balanceAmount)} />
        </div>

        <VendorForm
          key={editing?.vendorId ?? "new"}
          vendor={editing}
          budgets={budgets}
          schedules={schedules}
          onCancel={() => setEditing(null)}
          onSubmit={async (input) => {
            if (!profile.coupleId) return;
            try {
              if (editing) {
                await updateVendor(profile.coupleId, editing.vendorId, profile.uid, input);
                showToast("업체 정보를 수정했어요.", "success");
              } else {
                await addVendor(profile.coupleId, profile.uid, input);
                showToast("업체를 추가했어요.", "success");
              }
              setEditing(null);
            } catch (error) {
              showToast(getUserFacingErrorMessage(error, "업체 저장에 실패했어요."), "error");
            }
          }}
        />

        <div className="rounded-lg bg-white p-4 shadow-soft">
          <label className="block text-sm font-semibold text-neutral-700">
            카테고리 필터
            <select value={category} onChange={(event) => setCategory(event.target.value as BudgetCategory | "전체")} className="mt-2 min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3">
              <option value="전체">전체</option>
              {budgetCategories.map((nextCategory) => <option key={nextCategory} value={nextCategory}>{nextCategory}</option>)}
            </select>
          </label>
        </div>

        {loading ? (
          <LoadingView label="업체 목록을 불러오는 중이에요" />
        ) : visibleVendors.length === 0 ? (
          <EmptyView label="등록된 업체가 없어요" />
        ) : (
          <div className="space-y-2">
            {visibleVendors.map((vendor) => (
              <article key={vendor.vendorId} className="rounded-md bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-ink">{vendor.name}</h2>
                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">{statusLabel(vendor.status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">{vendor.category} · {vendor.contactName || "담당자 미입력"} · {vendor.phone || "연락처 미입력"}</p>
                    <p className="mt-2 text-xs text-neutral-500">계약 {formatCurrency(vendor.contractAmount)} · 계약금 {formatCurrency(vendor.depositAmount)} · 잔금 {formatCurrency(vendor.balanceAmount)}</p>
                    {vendor.paymentDueDate && <p className="mt-1 text-xs font-semibold text-rosewood">잔금일 {formatKoreanDate(vendor.paymentDueDate.toDate())}</p>}
                    {vendor.quotes.length > 0 && (
                      <div className="mt-3 overflow-x-auto rounded-md border border-neutral-100">
                        <table className="w-full min-w-[560px] text-left text-xs">
                          <thead className="bg-neutral-50 text-neutral-500"><tr><th className="px-3 py-2">견적</th><th className="px-3 py-2 text-right">금액</th><th className="px-3 py-2">포함</th><th className="px-3 py-2">추가금</th></tr></thead>
                          <tbody>
                            {vendor.quotes.map((quote) => (
                              <tr key={quote.quoteId} className="border-t border-neutral-100">
                                <td className="px-3 py-2 font-semibold text-ink">{quote.title}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(quote.amount)}</td>
                                <td className="px-3 py-2">{quote.includedItems}</td>
                                <td className="px-3 py-2">{quote.extraCostMemo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {vendor.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {vendor.attachments.map((attachment) => (
                          <a key={attachment.attachmentId} href={attachment.url} target="_blank" rel="noreferrer" className="rounded-md border border-neutral-200 px-3 py-2 text-xs font-semibold text-rosewood">
                            {attachment.name}
                          </a>
                        ))}
                      </div>
                    )}
                    {vendor.memo && <p className="mt-3 text-sm leading-6 text-neutral-600">{vendor.memo}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button aria-label={`${vendor.name} 업체 수정`} onClick={() => setEditing(vendor)} className="flex min-h-10 min-w-10 items-center justify-center rounded-md bg-neutral-100"><Edit size={15} /></button>
                    <button aria-label={`${vendor.name} 업체 삭제`} onClick={() => setDeleteTarget(vendor)} className="flex min-h-10 min-w-10 items-center justify-center rounded-md bg-red-50 text-red-600"><Trash2 size={15} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="업체 정보를 삭제할까요?"
        description="삭제한 업체와 견적 정보는 바로 복구할 수 없어요."
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!profile.coupleId || !deleteTarget) return;
          try {
            await deleteVendor(profile.coupleId, deleteTarget.vendorId);
            setDeleteTarget(null);
            showToast("업체 정보를 삭제했어요.", "success");
          } catch (error) {
            showToast(getUserFacingErrorMessage(error, "업체 삭제에 실패했어요."), "error");
          }
        }}
      />
    </AppShell>
  );
}

function VendorForm({
  vendor,
  budgets,
  schedules,
  onSubmit,
  onCancel
}: {
  vendor: Vendor | null;
  budgets: { budgetId: string; title: string }[];
  schedules: { scheduleId: string; title: string }[];
  onSubmit: (input: VendorInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(vendor?.name ?? "");
  const [category, setCategory] = useState<BudgetCategory>(vendor?.category ?? "웨딩홀");
  const [status, setStatus] = useState<VendorStatus>(vendor?.status ?? "candidate");
  const [contactName, setContactName] = useState(vendor?.contactName ?? "");
  const [phone, setPhone] = useState(vendor?.phone ?? "");
  const [address, setAddress] = useState(vendor?.address ?? "");
  const [contractAmount, setContractAmount] = useState(String(vendor?.contractAmount ?? 0));
  const [depositAmount, setDepositAmount] = useState(String(vendor?.depositAmount ?? 0));
  const [balanceAmount, setBalanceAmount] = useState(String(vendor?.balanceAmount ?? 0));
  const [paymentDueDate, setPaymentDueDate] = useState(vendor?.paymentDueDate ? vendor.paymentDueDate.toDate().toISOString().slice(0, 10) : "");
  const [memo, setMemo] = useState(vendor?.memo ?? "");
  const [relatedBudgetId, setRelatedBudgetId] = useState(vendor?.relatedBudgetId ?? "");
  const [relatedScheduleId, setRelatedScheduleId] = useState(vendor?.relatedScheduleId ?? "");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachments, setAttachments] = useState<VendorAttachment[]>(vendor?.attachments ?? []);
  const [quoteTitle, setQuoteTitle] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteIncludedItems, setQuoteIncludedItems] = useState("");
  const [quoteExtraCostMemo, setQuoteExtraCostMemo] = useState("");
  const [quotes, setQuotes] = useState(vendor?.quotes.map((quote) => ({
    title: quote.title,
    amount: quote.amount,
    includedItems: quote.includedItems,
    extraCostMemo: quote.extraCostMemo,
    validUntil: quote.validUntil ? quote.validUntil.toDate() : null
  })) ?? []);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name,
        category,
        status,
        contactName,
        phone,
        address,
        contractAmount: Number(contractAmount) || 0,
        depositAmount: Number(depositAmount) || 0,
        balanceAmount: Number(balanceAmount) || 0,
        paymentDueDate: paymentDueDate ? new Date(`${paymentDueDate}T00:00:00`) : null,
        memo,
        attachments,
        quotes,
        relatedBudgetId: relatedBudgetId || null,
        relatedScheduleId: relatedScheduleId || null
      });
      if (!vendor) {
        setName("");
        setContactName("");
        setPhone("");
        setAddress("");
        setMemo("");
        setAttachments([]);
        setQuotes([]);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-ink">{vendor ? "업체 수정" : "업체 추가"}</h2>
        {vendor && <button type="button" onClick={onCancel} className="text-sm font-semibold text-neutral-500">취소</button>}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="업체명"><input required value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} /></Field>
        <Field label="카테고리"><select value={category} onChange={(event) => setCategory(event.target.value as BudgetCategory)} className={inputClassName}>{budgetCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
        <Field label="상태"><select value={status} onChange={(event) => setStatus(event.target.value as VendorStatus)} className={inputClassName}><option value="candidate">후보</option><option value="contacted">상담중</option><option value="quoted">견적확인</option><option value="contracted">계약완료</option><option value="rejected">제외</option></select></Field>
        <Field label="담당자"><input value={contactName} onChange={(event) => setContactName(event.target.value)} className={inputClassName} /></Field>
        <Field label="연락처"><input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClassName} /></Field>
        <Field label="잔금일"><input type="date" value={paymentDueDate} onChange={(event) => setPaymentDueDate(event.target.value)} className={inputClassName} /></Field>
        <Field label="계약 금액"><input type="number" min="0" value={contractAmount} onChange={(event) => setContractAmount(event.target.value)} className={inputClassName} /></Field>
        <Field label="계약금"><input type="number" min="0" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} className={inputClassName} /></Field>
        <Field label="잔금"><input type="number" min="0" value={balanceAmount} onChange={(event) => setBalanceAmount(event.target.value)} className={inputClassName} /></Field>
        <Field label="관련 예산"><select value={relatedBudgetId} onChange={(event) => setRelatedBudgetId(event.target.value)} className={inputClassName}><option value="">없음</option>{budgets.map((budget) => <option key={budget.budgetId} value={budget.budgetId}>{budget.title}</option>)}</select></Field>
        <Field label="관련 일정"><select value={relatedScheduleId} onChange={(event) => setRelatedScheduleId(event.target.value)} className={inputClassName}><option value="">없음</option>{schedules.map((schedule) => <option key={schedule.scheduleId} value={schedule.scheduleId}>{schedule.title}</option>)}</select></Field>
        <Field label="주소"><input value={address} onChange={(event) => setAddress(event.target.value)} className={inputClassName} /></Field>
      </div>
      <Field label="메모"><textarea value={memo} onChange={(event) => setMemo(event.target.value)} className={`${inputClassName} min-h-20`} /></Field>

      <div className="mt-4 rounded-md border border-neutral-200 p-3">
        <h3 className="text-sm font-bold text-ink">견적 비교</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input value={quoteTitle} onChange={(event) => setQuoteTitle(event.target.value)} className={inputClassName} placeholder="견적명" />
          <input type="number" min="0" value={quoteAmount} onChange={(event) => setQuoteAmount(event.target.value)} className={inputClassName} placeholder="금액" />
          <input value={quoteIncludedItems} onChange={(event) => setQuoteIncludedItems(event.target.value)} className={inputClassName} placeholder="포함 항목" />
          <input value={quoteExtraCostMemo} onChange={(event) => setQuoteExtraCostMemo(event.target.value)} className={inputClassName} placeholder="추가금" />
        </div>
        <button type="button" onClick={() => {
          if (!quoteTitle) return;
          setQuotes((current) => [...current, { title: quoteTitle, amount: Number(quoteAmount) || 0, includedItems: quoteIncludedItems, extraCostMemo: quoteExtraCostMemo, validUntil: null }]);
          setQuoteTitle("");
          setQuoteAmount("");
          setQuoteIncludedItems("");
          setQuoteExtraCostMemo("");
        }} className="mt-2 rounded-md border border-neutral-200 px-3 py-2 text-sm font-semibold text-ink">견적 추가</button>
        {quotes.length > 0 && <p className="mt-2 text-xs text-neutral-500">{quotes.map((quote) => `${quote.title} ${formatCurrency(quote.amount)}`).join(" · ")}</p>}
      </div>

      <div className="mt-4 rounded-md border border-neutral-200 p-3">
        <h3 className="text-sm font-bold text-ink">첨부 링크</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input value={attachmentName} onChange={(event) => setAttachmentName(event.target.value)} className={inputClassName} placeholder="계약서, 견적서, 사진명" />
          <input value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} className={inputClassName} placeholder="https://..." />
        </div>
        <button type="button" onClick={() => {
          if (!attachmentName || !attachmentUrl) return;
          setAttachments((current) => [...current, { attachmentId: crypto.randomUUID(), name: attachmentName, url: attachmentUrl, type: "etc" }]);
          setAttachmentName("");
          setAttachmentUrl("");
        }} className="mt-2 rounded-md border border-neutral-200 px-3 py-2 text-sm font-semibold text-ink">첨부 추가</button>
        {attachments.length > 0 && <p className="mt-2 text-xs text-neutral-500">{attachments.map((attachment) => attachment.name).join(" · ")}</p>}
      </div>

      <button disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-rosewood py-3 text-sm font-semibold text-white disabled:opacity-60">
        <Plus size={17} />
        {saving ? "저장 중..." : vendor ? "업체 수정" : "업체 추가"}
      </button>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-white p-4 shadow-soft"><p className="text-xs font-semibold text-neutral-500">{label}</p><p className="mt-1 text-lg font-bold text-ink">{value}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mt-3 block text-sm font-semibold text-neutral-700">{label}{children}</label>;
}

function statusLabel(status: VendorStatus) {
  if (status === "contacted") return "상담중";
  if (status === "quoted") return "견적확인";
  if (status === "contracted") return "계약완료";
  if (status === "rejected") return "제외";
  return "후보";
}

const inputClassName = "mt-2 min-h-11 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-rosewood";
