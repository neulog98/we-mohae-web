"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { useCouple } from "@/hooks/useCouple";
import { joinCoupleByInviteCode, refreshInviteCode } from "@/features/couple/coupleService";
import { useToast } from "@/components/common/Toast";
import type { UserProfile } from "@/types/domain";
import { copyTextToClipboard } from "@/utils/clipboard";
import { getUserFacingErrorMessage } from "@/utils/errors";

export default function InvitePage() {
  return (
    <AuthGate>
      {({ profile }) => <InviteContent profile={profile} />}
    </AuthGate>
  );
}

function InviteContent({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { couple, partner, connected, mode } = useCouple(profile);
  const [inviteCode, setInviteCode] = useState("");

  async function copyCode() {
    if (!couple?.inviteCode) return;
    try {
      await copyTextToClipboard(couple.inviteCode);
      showToast("초대코드를 복사했어요.", "success");
    } catch (error) {
      showToast(getUserFacingErrorMessage(error, "초대코드 복사에 실패했어요."), "error");
    }
  }

  async function handleRefresh() {
    if (!profile.coupleId) return;
    const code = await refreshInviteCode(profile.coupleId);
    showToast(`새 초대코드 ${code}를 만들었어요.`, "success");
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await joinCoupleByInviteCode(profile.uid, inviteCode);
      showToast("파트너와 연결됐어요.", "success");
      router.replace("/home");
    } catch (error) {
      showToast(getUserFacingErrorMessage(error, "초대코드 연결에 실패했어요."), "error");
    }
  }

  return (
    <AppShell mode={mode ?? "couple"} title="초대 연결">
      <section className="space-y-4">
        {!connected && (
          <>
            <div className="rounded-lg bg-white p-5 shadow-soft">
              <p className="text-sm text-neutral-500">내 초대코드</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <strong className="text-3xl tracking-[0.18em] text-ink">{couple?.inviteCode ?? "--------"}</strong>
                <div className="flex gap-2">
                  <button aria-label="초대코드 복사" onClick={copyCode} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-3 text-ink">
                    <Copy size={18} />
                  </button>
                  <button aria-label="초대코드 재생성" onClick={handleRefresh} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-3 text-ink">
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleJoin} className="rounded-lg bg-white p-5 shadow-soft">
              <label className="text-sm font-medium text-neutral-700">
                받은 초대코드 입력
                <input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3 uppercase outline-none focus:border-rosewood"
                  placeholder="ABCD1234"
                />
              </label>
              <button className="mt-3 w-full rounded-md bg-rosewood py-3 text-sm font-semibold text-white">연결하기</button>
            </form>
          </>
        )}

        <div className="rounded-lg bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-ink">{connected ? "연결 완료" : "파트너를 기다리는 중이에요"}</p>
          <p className="mt-2 text-sm text-neutral-500">{partner ? `${partner.displayName}님과 함께 쓰고 있어요.` : "상대방이 초대코드를 입력하면 일정이 공유돼요."}</p>
        </div>
      </section>
    </AppShell>
  );
}
