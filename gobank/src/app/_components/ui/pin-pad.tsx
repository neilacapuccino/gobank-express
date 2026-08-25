"use client";

import { useCallback, useEffect } from "react";
import { cn } from "~/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

type PinPadProps = {
  value: string;
  onChange: (next: string) => void;
  length: number;
  shake?: boolean;
};

export function PinPad({ value, onChange, length, shake }: PinPadProps) {
  const push = useCallback(
    (digit: string) => {
      if (value.length >= length) return;
      onChange(value + digit);
    },
    [value, length, onChange],
  );

  const pop = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [value, onChange]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        push(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        pop();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [push, pop]);

  return (
    <div className="flex w-full flex-col items-center gap-11">
      <div
        className={cn("flex gap-4", shake && "animate-shake")}
        role="status"
        aria-label={`${value.length} of ${length} digits entered`}
      >
        {Array.from({ length }, (_, index) => {
          const filled = index < value.length;
          return (
            <span
              key={index}
              className={cn(
                "h-3.5 w-3.5 rounded-full border-2 transition-all duration-150",
                filled
                  ? shake
                    ? "border-danger bg-danger"
                    : "border-brand bg-brand animate-pop"
                  : "border-line-strong bg-transparent",
              )}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-3 justify-items-center gap-x-7 gap-y-4">
        {KEYS.map((key, index) => {
          if (key === "") return <span key={index} className="h-17 w-17" />;

          if (key === "back") {
            return (
              <button
                key={index}
                type="button"
                onClick={pop}
                disabled={value.length === 0}
                aria-label="Delete last digit"
                className="text-ink-soft hover:bg-surface-sunken grid h-17 w-17 place-items-center rounded-full transition-all duration-100 active:scale-90 disabled:opacity-25"
              >
                <BackspaceIcon />
              </button>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => push(key)}
              disabled={value.length >= length}
              className="text-ink bg-surface-sunken hover:bg-surface-raised active:bg-line grid h-17 w-17 place-items-center rounded-full text-[24px] font-normal tabular-nums transition-all duration-100 active:scale-90 disabled:opacity-40"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BackspaceIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
      <path d="m16 9-5 6M11 9l5 6" />
    </svg>
  );
}
