"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PocketIcon, type PocketIconName } from "~/shared/ui/pocket-art";
import styles from "./go-menu.module.css";

const actions: { href: string; label: string; icon: PocketIconName }[] = [
  { href: "/transfer", label: "Send money", icon: "send" },
  { href: "/deposit", label: "Add money", icon: "deposit" },
  { href: "/request", label: "Request", icon: "request" },
  { href: "/stashes", label: "GoalSave", icon: "goal" },
  { href: "/bills", label: "Pay bills", icon: "bill" },
  { href: "/load", label: "Buy load", icon: "phone" },
  { href: "/card", label: "My card", icon: "card" },
  { href: "/rewards", label: "Rewards", icon: "spark" },
  { href: "/transactions", label: "Activity", icon: "chart" },
];

export function GoMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!mounted) return null;
  return createPortal(
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[440px] justify-center pb-[max(24px,env(safe-area-inset-bottom))]">
        <button
          ref={trigger}
          type="button"
          aria-label="Open GO shortcuts"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            dialog.current?.showModal();
            setOpen(true);
          }}
          className="pointer-events-auto grid h-[68px] w-[68px] place-items-center rounded-full border-2 border-[#04dfe7] bg-[#232234] text-[19px] font-bold tracking-tight text-[#00e6ed] shadow-[0_8px_24px_#26233e60,0_2px_5px_#6d35c940,inset_0_1px_0_#ffffff30] transition-transform duration-300 hover:-translate-y-1 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6440ce] active:scale-95"
        >
          GO
        </button>
      </div>
      <dialog
        ref={dialog}
        aria-label="GO shortcuts"
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
        className={`${styles.panel} fixed inset-0 m-auto h-dvh max-h-dvh w-full max-w-[440px] overflow-y-auto border-0 bg-[#eefafb] p-0 text-[#282938] outline-none`}
      >
        <div className="relative isolate flex min-h-full flex-col justify-center px-6 pt-8 pb-28">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 -z-10 h-72 w-72 overflow-hidden rounded-full border-[32px] border-[#00d9df]/10"
          />
          <header className="mb-7 text-center">
            <p className="text-[10px] font-semibold tracking-[.22em] text-[#5630bc] uppercase">
              Ready. Set. Go.
            </p>
            <h2 className="mt-3 text-[28px] leading-tight font-semibold tracking-tight">
              Your everyday,
              <br />
              one tap away.
            </h2>
            <p className="mt-3 text-[12px] text-[#53616f]">
              What would you like to do?
            </p>
          </header>
          <div className="grid grid-cols-3 gap-3">
            {actions.map(({ href, label, icon }, index) => (
              <Link
                key={href}
                href={href}
                onClick={() => dialog.current?.close()}
                style={{ animationDelay: `${60 + index * 35}ms` }}
                className={`${styles.tile} flex min-h-24 flex-col items-center justify-center gap-2.5 rounded-[22px] border border-[#d9edf0] bg-white px-1 py-4 shadow-[0_6px_12px_-4px_#0096ae25,inset_0_1px_0_#ffffff0a] transition-colors hover:bg-[#dff8fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5934d1]`}
              >
                <PocketIcon
                  name={icon}
                  className="text-[#5630bc]"
                  width={25}
                  height={25}
                />
                <span className="text-[11px] font-semibold text-[#282938]">
                  {label}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-5 text-center text-[10px] text-[#53616f]">
            GoBank Express · Made for your everyday
          </div>
          <button
            type="button"
            aria-label="Close GO shortcuts"
            onClick={() => dialog.current?.close()}
            className="absolute bottom-6 left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5934d1]"
          >
            <svg
              className={styles.flower}
              width="64"
              height="64"
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              {Array.from({ length: 8 }, (_, index) => (
                <ellipse
                  key={index}
                  cx="32"
                  cy="15"
                  rx="9"
                  ry="14"
                  fill="#00dce5"
                  transform={`rotate(${index * 45} 32 32)`}
                />
              ))}
              <circle cx="32" cy="32" r="12" fill="#272437" />
              <path
                d="m28 28 8 8m0-8-8 8"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </dialog>
    </>,
    document.body,
  );
}
