"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { ErrorView, LoadingView } from "@/components/common/StateView";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import type { UserProfile } from "@/types/domain";
import { hasCompletedOnboarding } from "@/utils/guards";
import { signOutUser } from "@/features/auth/authService";
import { NativePushTokenSync } from "@/components/notification/NativePushTokenSync";

type AuthGateContext = Omit<ReturnType<typeof useAuthProfile>, "profile"> & {
  profile: UserProfile;
};

export function AuthGate({
  children,
  requireOnboarding = true
}: {
  children: (context: AuthGateContext) => ReactNode;
  requireOnboarding?: boolean;
}) {
  const authContext = useAuthProfile();
  const { user, profile, loading, error } = authContext;
  const router = useRouter();
  const pathname = usePathname();
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireOnboarding && !hasCompletedOnboarding(profile)) {
      router.replace("/onboarding");
      return;
    }
    if (!requireOnboarding && hasCompletedOnboarding(profile) && normalizedPathname === "/onboarding") {
      router.replace("/home");
    }
  }, [loading, normalizedPathname, profile, requireOnboarding, router, user]);

  if (loading || !user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center p-4">
        <LoadingView />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 p-5">
        <ErrorView label={error ?? "사용자 프로필을 불러오지 못했어요."} />
        <p className="text-sm leading-6 text-neutral-600">
          Firebase Console에서 Firestore Database를 생성하고 프로젝트의 Security Rules를 배포했는지 확인해주세요.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-rosewood py-3 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
        <button
          type="button"
          onClick={() => signOutUser()}
          className="rounded-md border border-neutral-200 bg-white py-3 text-sm font-semibold text-ink"
        >
          로그아웃
        </button>
      </main>
    );
  }

  return (
    <>
      <NativePushTokenSync profile={profile} />
      {children({ ...authContext, profile })}
    </>
  );
}
