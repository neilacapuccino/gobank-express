"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "~/lib/utils";

type Variant = "primary" | "outline" | "ghost";

const BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary:
    "h-13 text-[15px] bg-brand text-white hover:bg-brand-hover disabled:bg-line-strong disabled:text-white",
  outline:
    "h-13 text-[15px] border border-line-strong bg-surface text-ink hover:bg-surface-sunken disabled:opacity-45",
  ghost:
    "h-11 text-[14px] text-ink-muted hover:text-ink hover:bg-surface-sunken disabled:opacity-45",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(BASE, VARIANTS[variant], className)} {...props}>
      {children}
    </button>
  );
}
