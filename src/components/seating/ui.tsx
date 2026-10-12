"use client";

import { useState } from "react";

// Small form primitives for the seating planner, styled to match the rest of Organizza.

export const inputCls =
  "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-[13px] outline-none max-md:text-base focus:border-sage disabled:bg-canvas disabled:text-ink-faint";

export function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border-b border-border-soft px-4 py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-medium tracking-[0.12em] text-ink-faint uppercase">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-ink-soft">{text}</span>
      {children}
    </label>
  );
}

export function Btn({
  children,
  onClick,
  variant = "ghost",
  disabled,
  title,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  disabled?: boolean;
  title?: string;
  className?: string;
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-sage text-white hover:bg-sage-hover",
    ghost: "text-ink-soft hover:bg-border-soft hover:text-ink",
    outline: "border border-border bg-surface text-ink hover:border-sage",
    danger: "border border-border bg-surface text-terracotta hover:border-terracotta hover:bg-terracotta-tint",
  }[variant];
  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/** Text input that commits on blur / Enter instead of on every keystroke (keeps undo history clean). */
export function CommitInput({
  value,
  onCommit,
  className = inputCls,
  placeholder,
  disabled,
  ariaLabel,
  list,
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** id of a <datalist> with suggestions */
  list?: string;
}) {
  const [draft, setDraft] = useState(value);
  // resync when the value changes from outside (undo, another panel)
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <input
      aria-label={ariaLabel}
      className={className}
      list={list}
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

/** Length input shown in metres (accepts "2,5" or "2.5"), stored in centimetres. */
export function MetreInput({
  cm,
  onCommit,
  min = 0,
  max = 100_000,
  disabled,
  ariaLabel,
  unit = "m",
}: {
  cm: number;
  onCommit: (cm: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  ariaLabel?: string;
  unit?: "m" | "cm" | "°";
}) {
  const fmt = (v: number) => (unit === "m" ? String(Math.round(v) / 100).replace(".", ",") : String(Math.round(v)));
  const [draft, setDraft] = useState(fmt(cm));
  const [seen, setSeen] = useState(cm);
  if (seen !== cm) {
    setSeen(cm);
    setDraft(fmt(cm));
  }
  const commit = () => {
    const n = parseFloat(draft.replace(",", "."));
    if (!Number.isFinite(n)) return setDraft(fmt(cm));
    const v = Math.min(max, Math.max(min, unit === "m" ? Math.round(n * 100) : Math.round(n)));
    setDraft(fmt(v));
    if (v !== Math.round(cm)) onCommit(v);
  };
  return (
    <div className="relative">
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        className={`${inputCls} pr-8`}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] text-ink-faint">{unit}</span>
    </div>
  );
}

export function Stepper({ value, min, max, onChange, ariaLabel }: { value: number; min: number; max: number; onChange: (v: number) => void; ariaLabel?: string }) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border bg-surface" aria-label={ariaLabel}>
      <button type="button" className="px-3 py-1.5 text-ink-soft hover:bg-border-soft disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Menos">
        −
      </button>
      <span className="min-w-8 text-center text-[13px] font-medium tabular-nums">{value}</span>
      <button type="button" className="px-3 py-1.5 text-ink-soft hover:bg-border-soft disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Mais">
        +
      </button>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-md border border-border bg-canvas p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 rounded px-2 py-1 text-[12px] transition-colors ${value === v ? "bg-surface font-medium text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

type IconName =
  | "undo" | "redo" | "share" | "print" | "copy" | "trash" | "rotate" | "plus" | "minus" | "fit" | "grid" | "magnet"
  | "users" | "room" | "item" | "alert" | "check" | "close" | "drag" | "eye" | "list" | "map" | "tag" | "box";

export function I({ name, size = 16 }: { name: IconName; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "undo": return <svg {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>;
    case "redo": return <svg {...p}><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></svg>;
    case "share": return <svg {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>;
    case "print": return <svg {...p}><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>;
    case "copy": return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
    case "trash": return <svg {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>;
    case "rotate": return <svg {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "minus": return <svg {...p}><path d="M5 12h14" /></svg>;
    case "fit": return <svg {...p}><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" /></svg>;
    case "grid": return <svg {...p}><path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" /></svg>;
    case "magnet": return <svg {...p}><path d="M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3z" /><path d="M6 7h4M14 7h4" /></svg>;
    case "users": return <svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17.5" cy="9" r="2.5" /><path d="M16.5 14.2c2.8.4 5 2.5 5 5.8" /></svg>;
    case "room": return <svg {...p}><path d="M3 3h12v6h6v12H3z" /></svg>;
    case "item": return <svg {...p}><circle cx="12" cy="12" r="5" /><circle cx="12" cy="3.5" r="1.5" /><circle cx="12" cy="20.5" r="1.5" /><circle cx="3.5" cy="12" r="1.5" /><circle cx="20.5" cy="12" r="1.5" /></svg>;
    case "alert": return <svg {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>;
    case "check": return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
    case "close": return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case "drag": return <svg {...p}><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></svg>;
    case "eye": return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "list": return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case "map": return <svg {...p}><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z" /><path d="M8 2v16M16 6v16" /></svg>;
    case "box": return <svg {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg>;
    case "tag": return <svg {...p}><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" /><circle cx="7" cy="7" r="1.5" /></svg>;
  }
}
