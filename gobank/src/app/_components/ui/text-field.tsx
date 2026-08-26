"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "~/lib/utils";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  prefix?: string;
  trailing?: ReactNode;
};

export function TextField({
  label,
  hint,
  error,
  optional,
  prefix,
  trailing,
  className,
  ...props
}: TextFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-ink-soft flex items-baseline justify-between text-[13px] font-medium"
      >
        <span>{label}</span>
        {optional ? (
          <span className="text-ink-faint text-[12px] font-normal">
            Optional
          </span>
        ) : null}
      </label>

      <div
        className={cn(
          "bg-surface flex items-center rounded-xl border transition-colors duration-150",
          error
            ? "border-danger"
            : "border-line-strong focus-within:border-brand focus-within:ring-brand/15 focus-within:ring-2",
        )}
      >
        {prefix ? (
          <span className="text-ink-faint pl-3.5 text-[15px] select-none">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          className={cn(
            "text-ink placeholder:text-ink-faint h-13 w-full bg-transparent px-3.5 text-[15px] outline-none",
            prefix ? "pl-1.5" : null,
            className,
          )}
          {...props}
        />
        {trailing ? <span className="pr-3.5">{trailing}</span> : null}
      </div>

      {error ? (
        <p className="text-danger text-[12.5px]">{error}</p>
      ) : hint ? (
        <p className="text-ink-muted text-[12.5px]">{hint}</p>
      ) : null}
    </div>
  );
}
