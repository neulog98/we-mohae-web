"use client";

import { FormEvent, useState } from "react";
import { KeyRound, X } from "lucide-react";
import { changePassword, getAuthErrorMessage } from "@/features/auth/authService";

export function PasswordChangeForm({
  onSuccess,
  onCancel
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 서로 일치하지 않아요.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      onSuccess();
    } catch (nextError) {
      const code =
        typeof nextError === "object" && nextError !== null && "code" in nextError && typeof nextError.code === "string"
          ? nextError.code
          : null;
      setError(code === "auth/invalid-credential" ? "현재 비밀번호가 일치하지 않아요." : getAuthErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="password-change-title" className="fixed inset-0 z-40 overflow-y-auto bg-cloud">
      <form onSubmit={handleSubmit} className="mx-auto min-h-screen w-full max-w-md pb-28">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <h2 id="password-change-title" className="text-lg font-bold text-ink">비밀번호 변경</h2>
          <button type="button" aria-label="비밀번호 변경 닫기" onClick={onCancel} className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-100 p-2 text-neutral-600">
            <X size={19} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-6">
          <div className="rounded-md bg-white p-4 text-sm leading-6 text-neutral-600 shadow-soft">
            <KeyRound className="mb-2 text-rosewood" size={20} />
            본인 확인을 위해 현재 비밀번호를 먼저 입력해주세요.
          </div>
          <PasswordField label="현재 비밀번호" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <PasswordField label="새 비밀번호" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <PasswordField label="새 비밀번호 확인" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-2 gap-2 border-t border-neutral-200 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 py-3 text-sm font-semibold text-ink">
            취소
          </button>
          <button disabled={saving} className="rounded-md bg-rosewood py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "변경 중..." : "비밀번호 변경"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block text-sm font-semibold text-neutral-700">
      {label}
      <input
        required
        minLength={6}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="mt-2 block min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-base text-ink shadow-sm outline-none focus:border-rosewood focus:ring-2 focus:ring-rosewood/15"
      />
    </label>
  );
}
