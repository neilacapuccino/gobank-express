"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { maskAccount, peso } from "~/lib/format";

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
    <section className="bg-brand rounded-3xl px-6 py-7 text-white">
      <p className="text-[13px] text-white/75">Total balance</p>

      <div className="mt-2 flex items-center gap-3">
        <p className="text-[34px] leading-none font-semibold tracking-tight tabular-nums">
          {visible ? peso(balance) : "₱ ••••••"}
        </p>
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide balance" : "Show balance"}
          className="text-white/70 transition-colors hover:text-white"
        >
          {visible ? (
            <Eye size={17} strokeWidth={2} aria-hidden />
          ) : (
            <EyeOff size={17} strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between text-[12.5px] text-white/75">
        <span className="tabular-nums">{maskAccount(accountNumber)}</span>
        <span className="tabular-nums">{points.toLocaleString()} points</span>
      </div>
    </section>
  );
}
