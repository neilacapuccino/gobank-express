"use client";

import Link from "next/link";
import { cn } from "~/shared/lib/cn";
import { buttonClass } from "~/shared/ui/button";
import { maskAccount } from "~/shared/lib/format";
import { cardholderName, type RegistrationDraft } from "../auth.rules";
import { VirtualCard } from "~/features/card/components/virtual-card";

type AccountReadyProps = {
  draft: RegistrationDraft;
  accountNumber: string;
  card: { number: string; locked: boolean } | null;
};

export function AccountReady({
  draft,
  accountNumber,
  card,
}: AccountReadyProps) {
  return (
    <div className="flex flex-1 flex-col justify-center py-6">
      <div className="flex flex-col items-center text-center">
        <span className="bg-brand grid h-14 w-14 place-items-center rounded-full">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>

        <h1 className="text-ink mt-6 text-[24px] leading-tight font-semibold tracking-tight">
          You are all set
        </h1>
        <p className="text-ink-soft mt-2 text-[14.5px] leading-relaxed">
          Welcome to GoBank Express,{" "}
          <span className="text-ink font-medium">@{draft.username}</span>.
        </p>
      </div>

      <div className="mt-8">
        <VirtualCard
          brandId={draft.brand}
          holder={cardholderName(draft)}
          last4={card?.number.slice(-4)}
        />
      </div>

      <dl className="divide-line border-line mt-6 flex divide-x rounded-xl border">
        <div className="flex-1 px-4 py-3.5">
          <dt className="text-ink-muted text-[11px] tracking-wide uppercase">
            Account number
          </dt>
          <dd className="text-ink mt-1 text-[15px] font-medium tabular-nums">
            {maskAccount(accountNumber)}
          </dd>
        </div>
        <div className="flex-1 px-4 py-3.5">
          <dt className="text-ink-muted text-[11px] tracking-wide uppercase">
            Card status
          </dt>
          <dd className="text-brand mt-1 text-[15px] font-medium">
            {card?.locked ? "Locked" : "Unlocked"}
          </dd>
        </div>
      </dl>

      <Link href="/dashboard" className={cn(buttonClass(), "mt-8")}>
        Go to dashboard
      </Link>
    </div>
  );
}
