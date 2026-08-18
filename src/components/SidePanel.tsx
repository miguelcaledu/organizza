"use client";

import { Icon } from "@/lib/constants";

export function SidePanel({
  open,
  title,
  onClose,
  children,
  footer,
  width = 440,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/32 transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-screen flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-200"
        style={{ width, transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="font-serif-display text-[18px] font-medium">{title}</div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <Icon name="close" />
          </button>
        </div>
        <div className="om-scroll flex flex-1 flex-col gap-4.5 overflow-y-auto p-6">{children}</div>
        {footer && <div className="mt-auto flex gap-2.5 border-t border-border px-6 py-5">{footer}</div>}
      </div>
    </>
  );
}

export function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] text-ink-faint">
        {label} {required && <span className="text-terracotta">*</span>}
      </div>
      {children}
      {error && <div className="mt-1 text-[11px] text-terracotta">{error}</div>}
    </div>
  );
}

export const inputClass = "w-full rounded border border-border px-2.5 py-2 text-sm outline-none";
