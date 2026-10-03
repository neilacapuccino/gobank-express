"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { maskAccount, peso } from "~/shared/lib/format";

export function BalanceCard({
  balance,
  accountNumber,
  points,
}: {
  balance: number;
  accountNumber: string;
  points: number;
}) {
  const [visible, setVisible] = useState(true);

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-white px-6 py-6 text-[#282938] shadow-[0_10px_26px_-12px_#256d8045]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-20 -z-10 h-64 w-64 rounded-full border-[30px] border-[#00d9df]/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-5 bottom-0 -z-10 h-36 w-36 rounded-full border border-[#00d9df]/20"
      />
      <p className="text-[13px] text-[#53616f]">Available balance</p>

      <div className="mt-2 flex items-center gap-3">
        <p className="min-w-0 text-[clamp(1.6rem,8vw,2.35rem)] leading-tight font-semibold tracking-tight break-all tabular-nums">
          {visible ? peso(balance) : "₱ ••••••"}
        </p>
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide balance" : "Show balance"}
          aria-pressed={!visible}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#4d5266] transition-colors hover:bg-[#e4f6f7] hover:text-[#242638]"
        >
          {visible ? (
            <Eye size={17} strokeWidth={2} aria-hidden />
          ) : (
            <EyeOff size={17} strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#deedf0] pt-4 text-[11px] text-[#53616f]">
        <span className="tabular-nums">{maskAccount(accountNumber)}</span>
        <span className="tabular-nums">{points.toLocaleString()} points</span>
      </div>
    </section>
  );
}
