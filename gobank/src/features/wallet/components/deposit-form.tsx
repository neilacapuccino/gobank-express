"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dateTime, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { cn } from "~/shared/lib/cn";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";

const MAX_AMOUNT = 50_000;
const MAX_AMOUNT_INTEGER_DIGITS = String(MAX_AMOUNT).length;

const amountInput = (value: string) => {
  const sanitized = value.replace(/[^\d.]/g, "");
  const [wholePart = "", ...fractionParts] = sanitized.split(".");
  const whole = wholePart
    .replace(/^0+(?=\d)/, "")
    .slice(0, MAX_AMOUNT_INTEGER_DIGITS);
  const fraction = fractionParts.join("").slice(0, 2);

  if (!sanitized.includes(".")) return whole;

  return `${whole || "0"}.${fraction}`;
};

export function DepositForm() {
  const router = useRouter();

  const [amount, setAmount] = useState("");

  const deposit = api.wallet.deposit.useMutation();

  const amountInCentavos = toCentavos(Number(amount));

  const canContinue =
    amountInCentavos > 0 &&
    amountInCentavos <= MAX_AMOUNT * 100 &&
    !deposit.isPending;

  const handleDeposit = () => {
    if (!canContinue) return;

    deposit.mutate({
      amount: amountInCentavos,
    });
  };

  const handleDone = () => {
    router.push("/dashboard");
    router.refresh();
  };

  if (deposit.data) {
    return (
      <div className="flex flex-1 flex-col pb-10">
        <header className="relative flex h-16 items-center justify-center">
          <h1 className="text-[16px] font-semibold tracking-tight">Deposit</h1>
        </header>

        <div className="flex flex-1 flex-col items-center pt-10 text-center">
          <div className="bg-brand-soft text-brand grid h-20 w-20 place-items-center rounded-full">
            <CheckCircle2 size={42} strokeWidth={1.8} />
          </div>

          <h2 className="text-ink mt-6 text-[22px] font-semibold tracking-tight">
            Deposit successful
          </h2>

          <p className="text-ink-soft mt-2 text-[13px]">
            Your money has been added to your account.
          </p>

          <section className="bg-surface-sunken mt-8 w-full rounded-2xl p-5 text-left">
            <div className="text-center">
              <p className="text-ink-muted text-[12px]">Amount deposited</p>

              <p className="text-ink mt-1 text-[30px] font-semibold tracking-tight tabular-nums">
                {peso(Math.abs(deposit.data.amount))}
              </p>
            </div>

            <div className="border-line mt-6 space-y-4 border-t pt-4">
              <Detail label="Transaction" value="Cash in" />

              <Detail label="Reference" value={deposit.data.reference} />

              <Detail label="Date" value={dateTime(deposit.data.createdAt)} />

              <Detail
                label="New balance"
                value={peso(deposit.data.balanceAfter)}
              />
            </div>
          </section>

          <button
            type="button"
            onClick={handleDone}
            className="bg-brand hover:bg-brand-hover mt-auto h-13 w-full rounded-xl text-[15px] font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-10">
      <header className="relative flex h-16 items-center justify-center">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className="bg-surface-sunken text-ink-soft hover:bg-surface-raised absolute left-0 grid h-10 w-10 place-items-center rounded-full transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={1.9} aria-hidden />
        </Link>

        <div className="text-center">
          <h1 className="text-[16px] font-semibold tracking-tight">Deposit</h1>

          <p className="text-ink-soft mt-0.5 text-[11px]">
            Add money to your account
          </p>
        </div>
      </header>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">Amount</h2>

          <span className="text-ink-muted text-[11px]">Max ₱50,000</span>
        </div>

        <div className="border-line-strong focus-within:border-brand focus-within:ring-brand/15 flex items-center rounded-2xl border bg-white px-5 py-2 transition-colors focus-within:ring-2">
          <span className="text-ink-muted text-[25px]">₱</span>

          <input
            type="text"
            inputMode="decimal"
            value={amount}
            placeholder="0.00"
            maxLength={MAX_AMOUNT_INTEGER_DIGITS + 3}
            aria-label="Deposit amount"
            onChange={(event) => setAmount(amountInput(event.target.value))}
            className="text-ink placeholder:text-ink-faint h-16 w-full bg-transparent px-3 text-[30px] font-semibold tracking-tight outline-none"
          />
        </div>

        <p className="text-ink-muted mt-2 text-[11px]">
          Enter the amount you want to add to your GoBank account.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[13px] font-semibold">Deposit to</h2>

        <div className="border-brand bg-brand-soft flex items-center gap-3 rounded-2xl border p-4">
          <div className="bg-brand grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[16px] font-semibold text-white">
            ₱
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-ink text-[13px] font-semibold">
              Main Spending Account
            </p>

            <p className="text-ink-muted mt-0.5 text-[11px]">
              Your GoBank spending balance
            </p>
          </div>

          <div className="bg-brand grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold text-white">
            ✓
          </div>
        </div>
      </section>

      {deposit.error ? (
        <p
          role="alert"
          className="bg-danger-soft text-danger mt-5 rounded-xl px-4 py-3 text-[12px]"
        >
          {errorMessage(deposit.error)}
        </p>
      ) : null}

      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleDeposit}
          className={cn(
            "h-13 w-full rounded-xl text-[15px] font-semibold transition-all",
            canContinue
              ? "bg-brand hover:bg-brand-hover text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.8)] active:scale-[0.99]"
              : "bg-surface-sunken text-ink-soft/50 cursor-not-allowed",
          )}
        >
          {deposit.isPending
            ? "Processing deposit..."
            : canContinue
              ? "Continue"
              : "Enter a valid amount"}
        </button>

        <p className="text-ink-soft/60 mt-3 text-center text-[9.5px]">
          Please review your deposit details before continuing.
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-muted text-[12px]">{label}</span>

      <span className="text-ink text-right text-[12px] font-medium">
        {value}
      </span>
    </div>
  );
}
