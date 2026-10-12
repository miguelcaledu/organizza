"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// Modal confirmation for destructive actions (replaces window.confirm).
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancelar",
  danger = true,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const latest = useRef({ busy, onCancel });
  useLayoutEffect(() => {
    latest.current = { busy, onCancel };
  });

  useEffect(() => {
    if (!open) return;
    // focus the safe choice; Escape cancels
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !latest.current.busy && latest.current.onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/35 p-4" onClick={() => !busy && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-[420px] rounded-lg border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-serif-display text-[19px] font-medium">
          {title}
        </h2>
        {children && <div className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} className="rounded border border-border px-4 py-2 text-sm hover:bg-canvas disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${danger ? "bg-terracotta hover:bg-terracotta-hover" : "bg-sage hover:bg-sage-hover"}`}
          >
            {busy ? "Um momento…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
