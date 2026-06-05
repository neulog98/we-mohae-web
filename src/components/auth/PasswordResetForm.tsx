"use client";

import { FormEvent, useState } from "react";
import { MailCheck, X } from "lucide-react";
import { getAuthErrorMessage, sendPasswordResetEmailToUser } from "@/features/auth/authService";

export function PasswordResetForm({
  initialEmail,
  onSent,
  onCancel
}: {
  initialEmail: string;
  onSent: (email: string) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      await sendPasswordResetEmailToUser(email);
      onSent(email.trim());
    } catch (nextError) {
      setError(getPasswordResetErrorMessage(nextError));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-cloud">
      <form onSubmit={handleSubmit} className="mx-auto min-h-screen w-full max-w-md pb-28">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-ink">비밀번호 재설정</h2>
          <button type="button" aria-label="비밀번호 재설정 닫기" onClick={onCancel} className="rounded-md bg-neutral-100 p-2 text-neutral-600">
            <X size={19} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-6">
          <div className="rounded-md bg-white p-4 text-sm leading-6 text-neutral-600 shadow-soft">
            <MailCheck className="mb-2 text-rosewood" size={21} />
            가입한 이메일로 비밀번호 재설정 링크를 보내드려요. 메일의 링크에서 본인 인증 후 새 비밀번호를 설정할 수 있어요.
          </div>
          <label className="block text-sm font-semibold text-neutral-700">
            가입 이메일
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-2 block min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-base text-ink shadow-sm outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/15"
              placeholder="you@example.com"
            />
          </label>
          {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <p className="text-xs leading-5 text-neutral-500">메일이 보이지 않으면 스팸 메일함도 확인해주세요.</p>
        </div>

        <div className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-2 gap-2 border-t border-neutral-200 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 py-3 text-sm font-semibold text-ink">
            취소
          </button>
          <button disabled={sending} className="rounded-md bg-rosewood py-3 text-sm font-semibold text-white disabled:opacity-60">
            {sending ? "발송 중..." : "재설정 메일 받기"}
          </button>
        </div>
      </form>
    </div>
  );
}

function getPasswordResetErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : null;

  if (code === "auth/invalid-email") return "올바른 이메일 주소를 입력해주세요.";
  if (code === "auth/too-many-requests") return "요청이 너무 많아요. 잠시 후 다시 시도해주세요.";
  return getAuthErrorMessage(error);
}
