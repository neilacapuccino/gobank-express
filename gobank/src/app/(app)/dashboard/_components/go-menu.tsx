"use client";

import {
  ArrowLeftRight,
  CreditCard,
  PiggyBank,
  Receipt,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "~/lib/utils";

const ACTIONS = [
  { href: "/transfer", label: "Send", icon: Send },
  { href: "/bills", label: "Pay bills", icon: Receipt },
  { href: "/stashes", label: "Stashes", icon: PiggyBank },
  { href: "/rewards", label: "Rewards", icon: Sparkles },
  { href: "/card", label: "My card", icon: CreditCard },
  { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
];

export function GoMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mounted) return null;

  // Portalled to the body: the page transition animates a transform on an
  // ancestor, which would otherwise make these fixed layers scroll with the page.
  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal={open}
        aria-label="Everything you can do"
        className={cn(
          "fixed inset-0 z-40 mx-auto flex max-w-[440px] flex-col justify-center px-7 transition-all duration-300",
          "bg-[#16241f]",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <h2
          className={cn(
            "mb-9 text-center text-[22px] leading-snug font-semibold tracking-tight text-white transition-all duration-300",
            open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )}
        >
          Your daily banking needs
          <br />
          in one button
        </h2>

        <div className="grid grid-cols-3 gap-3.5">
          {ACTIONS.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: `${open ? 60 + index * 45 : 0}ms` }}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-[#20342c] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#284136]",
                  open
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-4 scale-90 opacity-0",
                )}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#1d4f3f] text-[#5eead4]">
                  <Icon size={20} strokeWidth={1.9} aria-hidden />
                </span>
                <span className="text-[11.5px] font-medium text-white/85">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[440px] justify-center pb-7">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close actions" : "Open actions"}
          className={cn(
            "pointer-events-auto grid h-16 w-16 place-items-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open
              ? "rotate-[135deg] bg-transparent"
              : "bg-ink shadow-[0_10px_26px_-8px_rgba(13,18,32,0.75)]",
          )}
        >
          {open ? (
            <Flower />
          ) : (
            <span className="text-[17px] font-semibold tracking-wide text-white">
              GO
            </span>
          )}
        </button>
      </div>
    </>,
    document.body,
  );
}

function Flower() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <ellipse
          key={index}
          cx="32"
          cy="15"
          rx="9"
          ry="14"
          fill="#2dd4bf"
          transform={`rotate(${index * 45} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="10" fill="#16241f" />
    </svg>
  );
}
