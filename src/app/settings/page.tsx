"use client";

import Link from "next/link";
import { Bell, CalendarDays, Copy, HeartHandshake, KeyRound, LogOut, Unlink, UserRound } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { AuthGate } from "@/components/layout/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { signOutUser } from "@/features/auth/authService";
import { changeCoupleMode, disconnectCouple } from "@/features/couple/coupleService";
import { removeCurrentNativeFcmToken, requestAndSaveFcmToken } from "@/features/notification/notificationService";
import { useCouple } from "@/hooks/useCouple";
import { useToast } from "@/components/common/Toast";
import type { CoupleMode, UserProfile } from "@/types/domain";

export default function SettingsPage() {
  return (
    <AuthGate>
      {({ profile }) => <SettingsContent profile={profile} />}
    </AuthGate>
  );
}

function SettingsContent({ profile }: { profile: UserProfile }) {
  const { showToast } = useToast();
  const { couple, partner, connected, mode } = useCouple(profile);
  const [pendingMode, setPendingMode] = useState<CoupleMode | null>(null);
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  async function handleCopyCode() {
    if (!couple?.inviteCode) return;
    await navigator.clipboard.writeText(couple.inviteCode);
    showToast("초대코드를 복사했어요.", "success");
  }

  async function handleRequestNotification() {
    if (!profile.coupleId) return;
    try {
      await requestAndSaveFcmToken(profile.coupleId, profile.uid);
      showToast("알림 권한과 FCM 토큰을 저장했어요.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "알림 설정에 실패했어요.", "error");
    }
  }

  async function handleLogout() {
    if (profile.coupleId) {
      await removeCurrentNativeFcmToken(profile.coupleId).catch(() => {
        // 브라우저 또는 토큰 조회 실패 시에도 로그아웃은 계속 진행한다.
      });
    }
    await signOutUser();
  }

  return (
    <AppShell mode={mode ?? "couple"} title="설정">
      <section className="space-y-4">
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-ink">내 정보</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">이름</dt>
              <dd className="font-medium text-ink">{profile.displayName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">이메일</dt>
              <dd className="break-all text-right font-medium text-ink">{profile.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">현재 모드</dt>
              <dd className="font-medium text-ink">{mode === "wedding" ? "예비부부 모드" : "커플 모드"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-ink">사용 모드 변경</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            모드를 변경해도 기존 일정과 예산 데이터는 삭제되지 않아요.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => mode !== "couple" && setPendingMode("couple")}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                mode === "couple" ? "border-rosewood bg-rosewood/10 text-rosewood" : "border-neutral-200 text-neutral-600"
              }`}
            >
              <HeartHandshake size={21} />
              커플 모드
            </button>
            <button
              type="button"
              onClick={() => mode !== "wedding" && setPendingMode("wedding")}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                mode === "wedding" ? "border-mint bg-mint/10 text-mint" : "border-neutral-200 text-neutral-600"
              }`}
            >
              <CalendarDays size={21} />
              예비부부 모드
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-ink">파트너 연결</h2>
          {connected ? (
            <>
              {partner ? (
                <div className="mt-4 flex items-center gap-3 rounded-md bg-cloud p-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-rosewood">
                    <UserRound size={21} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{partner.displayName}</p>
                    <p className="mt-1 truncate text-sm text-neutral-500">{partner.email}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">파트너 정보를 불러오는 중이에요.</p>
              )}
              <button
                type="button"
                onClick={() => setDisconnectConfirmOpen(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-red-200 py-3 text-sm font-semibold text-red-600"
              >
                <Unlink size={17} />
                커플 연결 해제
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-neutral-500">아직 파트너가 연결되지 않았어요.</p>
              <div className="mt-4 flex items-center justify-between rounded-md bg-cloud px-4 py-3">
                <span className="text-lg font-bold tracking-[0.18em]">{couple?.inviteCode ?? "--------"}</span>
                <button aria-label="초대코드 복사" onClick={handleCopyCode} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-white p-2 text-ink">
                  <Copy size={18} />
                </button>
              </div>
              <Link href="/invite" className="mt-3 block rounded-md border border-neutral-200 py-3 text-center text-sm font-semibold text-ink">
                초대코드 입력하기
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPasswordFormOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white py-3 text-sm font-semibold text-ink"
        >
          <KeyRound size={18} />
          비밀번호 변경
        </button>
        <button onClick={handleRequestNotification} className="flex w-full items-center justify-center gap-2 rounded-md bg-rosewood py-3 text-sm font-semibold text-white">
          <Bell size={18} />
          알림 권한 요청
        </button>
        <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white py-3 text-sm font-semibold text-ink">
          <LogOut size={18} />
          로그아웃
        </button>
      </section>
      {passwordFormOpen && (
        <PasswordChangeForm
          onCancel={() => setPasswordFormOpen(false)}
          onSuccess={() => {
            setPasswordFormOpen(false);
            showToast("비밀번호를 변경했어요.", "success");
          }}
        />
      )}
      <ConfirmDialog
        open={disconnectConfirmOpen}
        title="커플 연결을 해제할까요?"
        description="현재 공유 일정과 예산은 상대방 공간에 보존되며, 내 계정에서는 더 이상 볼 수 없어요."
        confirmLabel="연결 해제"
        onClose={() => setDisconnectConfirmOpen(false)}
        onConfirm={async () => {
          if (!profile.coupleId) return;
          try {
            await disconnectCouple(profile.coupleId, profile.uid);
            setDisconnectConfirmOpen(false);
            showToast("커플 연결을 해제했어요.", "success");
          } catch (error) {
            showToast(error instanceof Error ? error.message : "커플 연결 해제에 실패했어요.", "error");
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingMode)}
        title={`${pendingMode === "wedding" ? "예비부부" : "커플"} 모드로 변경할까요?`}
        description={
          pendingMode === "couple"
            ? "예산관리 탭과 결혼 준비 일정은 숨겨지지만 데이터는 보존돼요."
            : "예산관리와 커플 일정·결혼 준비 일정 분리 기능을 사용할 수 있어요."
        }
        confirmLabel="모드 변경"
        onClose={() => setPendingMode(null)}
        onConfirm={async () => {
          if (!pendingMode || !profile.coupleId) return;
          try {
            await changeCoupleMode(profile.coupleId, profile.uid, pendingMode);
            showToast("사용 모드를 변경했어요.", "success");
            setPendingMode(null);
          } catch (error) {
            showToast(error instanceof Error ? error.message : "모드 변경에 실패했어요.", "error");
          }
        }}
      />
    </AppShell>
  );
}
