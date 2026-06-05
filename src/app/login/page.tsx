"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarHeart } from "lucide-react";
import {
  ensureUserProfile,
  getAuthErrorMessage,
  signInWithEmail,
  signUpWithEmail,
  subscribeAuth
} from "@/features/auth/authService";
import { PasswordResetForm } from "@/components/auth/PasswordResetForm";
import { ErrorView } from "@/components/common/StateView";
import { useToast } from "@/components/common/Toast";
import type { UserProfile } from "@/types/domain";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);

  const moveAfterLogin = useCallback((profile: UserProfile) => {
    const nextPath = profile.mode && profile.coupleId ? "/home" : "/onboarding";
    router.replace(nextPath);
  }, [router]);

  useEffect(() => {
    let active = true;
    let routedUserId: string | null = null;

    const unsubscribe = subscribeAuth(async (user) => {
      if (!active || !user || routedUserId === user.uid) return;
      routedUserId = user.uid;
      setLoading(true);
      try {
        const profile = await ensureUserProfile(user);
        if (!active) return;
        setAuthError(null);
        moveAfterLogin(profile);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "사용자 프로필 생성에 실패했어요.";
        setLoading(false);
        routedUserId = null;
        setAuthError(message);
        showToast(message, "error");
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [moveAfterLogin, showToast]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const profile = isSignUp
        ? await signUpWithEmail(email, password, displayName || email.split("@")[0])
        : await signInWithEmail(email, password);
      showToast("로그인됐어요.", "success");
      moveAfterLogin(profile);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-8">
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-rosewood text-white">
          <CalendarHeart size={28} />
        </div>
        <h1 className="text-3xl font-bold text-ink">우리뭐해</h1>
        <p className="mt-3 text-base leading-7 text-neutral-600">우리 둘의 일정과 결혼 준비를 함께 관리하는 캘린더</p>
      </div>

      {authError && <div className="mb-4"><ErrorView label={authError} /></div>}

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-white p-5 shadow-soft">
        {isSignUp && (
          <label className="block text-sm font-medium text-neutral-700">
            이름
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3 outline-none focus:border-rosewood"
              placeholder="표시할 이름"
            />
          </label>
        )}
        <label className="block text-sm font-medium text-neutral-700">
          이메일
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3 outline-none focus:border-rosewood"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          비밀번호
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-md border border-neutral-200 px-3 py-3 outline-none focus:border-rosewood"
            placeholder="6자 이상"
          />
        </label>
        {!isSignUp && (
          <button
            type="button"
            onClick={() => setPasswordResetOpen(true)}
            className="ml-auto block py-1 text-sm font-medium text-rosewood"
          >
            비밀번호를 잊으셨나요?
          </button>
        )}
        <button disabled={loading} className="w-full rounded-md bg-rosewood py-3 text-sm font-semibold text-white disabled:opacity-60">
          {isSignUp ? "회원가입" : "로그인"}
        </button>
        <button type="button" onClick={() => setIsSignUp((current) => !current)} className="w-full py-2 text-sm text-neutral-500">
          {isSignUp ? "이미 계정이 있어요" : "처음이에요. 계정 만들기"}
        </button>
      </form>
      {passwordResetOpen && (
        <PasswordResetForm
          initialEmail={email}
          onCancel={() => setPasswordResetOpen(false)}
          onSent={(sentEmail) => {
            setEmail(sentEmail);
            setPasswordResetOpen(false);
            showToast("가입된 계정이라면 비밀번호 재설정 메일을 보냈어요.", "success");
          }}
        />
      )}
    </main>
  );
}
