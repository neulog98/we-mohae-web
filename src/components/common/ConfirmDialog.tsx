"use client";

import { X } from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "삭제",
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  useLockBodyScroll(open);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="fixed inset-0 z-40 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-neutral-200 py-3 text-sm font-medium">
            취소
          </button>
          <button type="button" onClick={onConfirm} className="rounded-md bg-red-600 py-3 text-sm font-semibold text-white">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
