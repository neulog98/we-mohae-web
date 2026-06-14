"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyView, LoadingView } from "@/components/common/StateView";
import { useToast } from "@/components/common/Toast";
import { addGuest, deleteGuest, updateGuest, type GuestInput } from "@/features/guest/guestService";
import { useCouple } from "@/hooks/useCouple";
import { useGuests } from "@/hooks/useGuests";
import { formatCurrency } from "@/lib/date/format";
import type { Guest, GuestAttendanceStatus, GuestSide, UserProfile } from "@/types/domain";
import { getUserFacingErrorMessage } from "@/utils/errors";

export default function GuestsPage() {
  return (
    <AuthGate>
      {({ profile }) => <GuestsContent profile={profile} />}
    </AuthGate>
  );
}

function GuestsContent({ profile }: { profile: UserProfile }) {
  const { mode } = useCouple(profile);
  const { showToast } = useToast();
  const { guests, summary, loading } = useGuests(mode === "wedding" ? profile.coupleId : null);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [query, setQuery] = useState("");
  const visibleGuests = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    if (!keyword) return guests;
    return guests.filter((guest) => [guest.name, guest.relation, guest.phone, guest.memo].join(" ").toLocaleLowerCase().includes(keyword));
  }, [guests, query]);

  if (mode !== "wedding") {
    return (
      <AppShell mode="couple" title="하객 관리">
        <EmptyView label="하객 관리는 예비부부 모드에서 사용할 수 있어요" />
      </AppShell>
    );
  }

  return (
    <AppShell mode="wedding" title="하객 관리">
      <section className="space-y-5">
        <div className="grid gap-2 md:grid-cols-4">
          <Metric label="총 하객" value={`${summary.total}명`} />
          <Metric label="예상 식수" value={`${summary.expectedHeadcount}명`} />
          <Metric label="식권" value={`${summary.mealTickets}장`} />
          <Metric label="축의금" value={formatCurrency(summary.congratulatoryAmount)} />
        </div>

        <GuestForm
          key={editing?.guestId ?? "new"}
          guest={editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (input) => {
            if (!profile.coupleId) return;
            try {
              if (editing) {
                await updateGuest(profile.coupleId, editing.guestId, profile.uid, input);
                showToast("하객 정보를 수정했어요.", "success");
              } else {
                await addGuest(profile.coupleId, profile.uid, input);
                showToast("하객을 추가했어요.", "success");
              }
              setEditing(null);
            } catch (error) {
              showToast(getUserFacingErrorMessage(error, "하객 저장에 실패했어요."), "error");
            }
          }}
        />

        <div className="rounded-lg bg-white p-4 shadow-soft">
          <label className="block text-sm font-semibold text-neutral-700">
            하객 검색
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 min-h-12 w-full rounded-md border border-neutral-300 px-3 py-3" placeholder="이름, 관계, 연락처, 메모" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-neutral-500">
            <span>신랑측 {summary.groom}</span>
            <span>신부측 {summary.bride}</span>
            <span>공동 {summary.shared}</span>
            <span>참석 {summary.attending}</span>
            <span>미정 {summary.pending}</span>
            <span>불참 {summary.declined}</span>
          </div>
        </div>

        {loading ? (
          <LoadingView label="하객 목록을 불러오는 중이에요" />
        ) : visibleGuests.length === 0 ? (
          <EmptyView label="등록된 하객이 없어요" />
        ) : (
          <div className="space-y-2">
            {visibleGuests.map((guest) => (
              <article key={guest.guestId} className="rounded-md bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-ink">{guest.name}</h2>
                    <p className="mt-1 text-xs text-neutral-500">
                      {sideLabel(guest.side)} · {guest.relation || "관계 미입력"} · {attendanceLabel(guest.attendanceStatus)}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      동반 {guest.companionCount}명 · 식권 {guest.mealTicketCount}장 · 답례품 {guest.giftChecked ? "완료" : "미완료"} · {formatCurrency(guest.congratulatoryAmount)}
                    </p>
                    {guest.phone && <p className="mt-1 text-xs text-neutral-500">{guest.phone}</p>}
                    {guest.memo && <p className="mt-2 text-sm leading-6 text-neutral-600">{guest.memo}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button aria-label={`${guest.name} 하객 수정`} onClick={() => setEditing(guest)} className="flex min-h-10 min-w-10 items-center justify-center rounded-md bg-neutral-100">
                      <Edit size={15} />
                    </button>
                    <button aria-label={`${guest.name} 하객 삭제`} onClick={() => setDeleteTarget(guest)} className="flex min-h-10 min-w-10 items-center justify-center rounded-md bg-red-50 text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="하객 정보를 삭제할까요?"
        description="삭제한 하객 정보는 바로 복구할 수 없어요."
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!profile.coupleId || !deleteTarget) return;
          try {
            await deleteGuest(profile.coupleId, deleteTarget.guestId);
            setDeleteTarget(null);
            showToast("하객 정보를 삭제했어요.", "success");
          } catch (error) {
            showToast(getUserFacingErrorMessage(error, "하객 삭제에 실패했어요."), "error");
          }
        }}
      />
    </AppShell>
  );
}

function GuestForm({ guest, onSubmit, onCancel }: { guest: Guest | null; onSubmit: (input: GuestInput) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(guest?.name ?? "");
  const [side, setSide] = useState<GuestSide>(guest?.side ?? "groom");
  const [relation, setRelation] = useState(guest?.relation ?? "");
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [attendanceStatus, setAttendanceStatus] = useState<GuestAttendanceStatus>(guest?.attendanceStatus ?? "pending");
  const [companionCount, setCompanionCount] = useState(String(guest?.companionCount ?? 0));
  const [mealTicketCount, setMealTicketCount] = useState(String(guest?.mealTicketCount ?? 0));
  const [giftChecked, setGiftChecked] = useState(guest?.giftChecked ?? false);
  const [congratulatoryAmount, setCongratulatoryAmount] = useState(String(guest?.congratulatoryAmount ?? 0));
  const [memo, setMemo] = useState(guest?.memo ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name,
        side,
        relation,
        phone,
        attendanceStatus,
        companionCount: Number(companionCount) || 0,
        mealTicketCount: Number(mealTicketCount) || 0,
        giftChecked,
        congratulatoryAmount: Number(congratulatoryAmount) || 0,
        memo
      });
      if (!guest) {
        setName("");
        setRelation("");
        setPhone("");
        setMemo("");
        setCongratulatoryAmount("0");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-ink">{guest ? "하객 수정" : "하객 추가"}</h2>
        {guest && <button type="button" onClick={onCancel} className="text-sm font-semibold text-neutral-500">취소</button>}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="이름"><input required value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} /></Field>
        <Field label="구분"><select value={side} onChange={(event) => setSide(event.target.value as GuestSide)} className={inputClassName}><option value="groom">신랑측</option><option value="bride">신부측</option><option value="shared">공동</option></select></Field>
        <Field label="참석"><select value={attendanceStatus} onChange={(event) => setAttendanceStatus(event.target.value as GuestAttendanceStatus)} className={inputClassName}><option value="pending">미정</option><option value="attending">참석</option><option value="declined">불참</option></select></Field>
        <Field label="관계"><input value={relation} onChange={(event) => setRelation(event.target.value)} className={inputClassName} placeholder="친구, 직장, 가족" /></Field>
        <Field label="연락처"><input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClassName} /></Field>
        <Field label="축의금"><input type="number" min="0" value={congratulatoryAmount} onChange={(event) => setCongratulatoryAmount(event.target.value)} className={inputClassName} /></Field>
        <Field label="동반 인원"><input type="number" min="0" value={companionCount} onChange={(event) => setCompanionCount(event.target.value)} className={inputClassName} /></Field>
        <Field label="식권"><input type="number" min="0" value={mealTicketCount} onChange={(event) => setMealTicketCount(event.target.value)} className={inputClassName} /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700"><input type="checkbox" checked={giftChecked} onChange={(event) => setGiftChecked(event.target.checked)} /> 답례품 완료</label>
      </div>
      <Field label="메모"><textarea value={memo} onChange={(event) => setMemo(event.target.value)} className={`${inputClassName} min-h-20`} /></Field>
      <button disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-rosewood py-3 text-sm font-semibold text-white disabled:opacity-60">
        <Plus size={17} />
        {saving ? "저장 중..." : guest ? "하객 수정" : "하객 추가"}
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

function sideLabel(side: GuestSide) {
  if (side === "groom") return "신랑측";
  if (side === "bride") return "신부측";
  return "공동";
}

function attendanceLabel(status: GuestAttendanceStatus) {
  if (status === "attending") return "참석";
  if (status === "declined") return "불참";
  return "미정";
}

const inputClassName = "mt-2 min-h-11 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-rosewood";
