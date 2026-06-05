"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, HeartHandshake } from "lucide-react";
import { AuthGate } from "@/components/layout/AuthGate";
import { createCouple } from "@/features/couple/coupleService";
import type { CoupleMode } from "@/types/domain";
import { useToast } from "@/components/common/Toast";
import { getUserFacingErrorMessage } from "@/utils/errors";

export default function OnboardingPage() {
  return (
    <AuthGate requireOnboarding={false}>
      {({ profile }) => <OnboardingContent uid={profile.uid} />}
    </AuthGate>
  );
}

function OnboardingContent({ uid }: { uid: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  async function selectMode(mode: CoupleMode) {
    try {
      await createCouple(uid, mode);
      showToast("모드가 설정됐어요.", "success");
      router.replace("/invite");
    } catch (error) {
      showToast(getUserFacingErrorMessage(error, "온보딩에 실패했어요."), "error");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-8">
      <h1 className="text-2xl font-bold text-ink">어떤 일정부터 함께 정리할까요?</h1>
      <p className="mt-3 text-sm leading-6 text-neutral-600">선택한 모드에 따라 탭과 기능이 달라져요. 설정값은 추후 마이그레이션 가능한 구조로 분리해두었습니다.</p>

      <div className="mt-8 space-y-3">
        <button onClick={() => selectMode("couple")} className="w-full rounded-lg bg-white p-5 text-left shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-coral/15 text-coral">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-ink">커플 모드</h2>
              <p className="mt-1 text-sm text-neutral-500">데이트, 약속, 기념일 중심</p>
            </div>
          </div>
        </button>

        <button onClick={() => selectMode("wedding")} className="w-full rounded-lg bg-white p-5 text-left shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-mint/15 text-mint">
              <CalendarDays size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-ink">예비부부 모드</h2>
              <p className="mt-1 text-sm text-neutral-500">결혼 준비 일정과 예산 관리</p>
            </div>
          </div>
        </button>
      </div>
    </main>
  );
}
