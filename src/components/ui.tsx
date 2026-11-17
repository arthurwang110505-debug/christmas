"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useReduce } from "@/lib/hooks";
import { useT } from "@/lib/i18n";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const btn = {
  primary: `${base} bg-accent text-on-accent hover:brightness-110`,
  outline: `${base} border border-line bg-surface/70 text-ink backdrop-blur hover:border-accent`,
  quiet: `${base} text-muted hover:text-ink`,
};

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof btn }) {
  return <button type="button" className={`${btn[variant]} ${className}`} {...rest} />;
}

export function IconButton({
  label,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface/70 text-ink backdrop-blur transition-colors hover:border-accent disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Slider({
  value,
  onChange,
  label,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={pct}
      aria-label={label}
      aria-valuetext={`${pct}%`}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className={`slider ${className}`}
      style={{ "--pct": `${pct}%` } as CSSProperties}
    />
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
        checked ? "border-accent bg-accent" : "border-line bg-surface-2"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-[22px] rounded-full transition-transform ${
          checked ? "translate-x-5 bg-on-accent" : "bg-ink"
        }`}
      />
    </button>
  );
}

/** Accessible modal built on the native <dialog> element (focus trap and Esc for free). */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const t = useT();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-auto max-h-[88svh] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl ${
        wide ? "w-[min(94vw,52rem)]" : "w-[min(92vw,34rem)]"
      }`}
    >
      {open && (
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id={id} className="display text-2xl leading-tight sm:text-3xl">
              {title}
            </h2>
            <IconButton label={t("Close", "關閉")} onClick={onClose} className="-mt-1 -mr-2">
              <X className="size-5" aria-hidden />
            </IconButton>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

/** Fade-and-rise on scroll into view; appears instantly, without movement, when reduced motion is requested. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReduce();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0.01 : 0.8, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Standard heading block for inner pages. */
export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <header className="max-w-3xl">
      <p className="eyebrow text-accent">{eyebrow}</p>
      <h1 className="display mt-3 text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.02] font-light">{title}</h1>
      {intro && <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{intro}</p>}
    </header>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-5 pt-24 pb-16 sm:px-8 sm:pt-28 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full min-h-11 rounded-2xl border border-line bg-bg/60 px-4 py-2.5 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus-visible:outline-2";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** Segmented choice control (radio group semantics). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-bg/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 rounded-full px-4 text-sm font-medium transition-colors ${
            value === o.value ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
