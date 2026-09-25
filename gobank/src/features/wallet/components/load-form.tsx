"use client";

import { ArrowLeft, CheckCircle2, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dateTime, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { cn } from "~/shared/lib/cn";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";

const MIN_AMOUNT = 10;
const MAX_AMOUNT = 10_000;

const LOAD_AMOUNTS = [10, 15, 20, 50, 100, 300, 500, 1000];

type Step = "details" | "confirm";

export function LoadForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");

  const load = api.wallet.load.useMutation();

  const amountNumber = Number(amount);
  const amountInCentavos = toCentavos(amountNumber);

  const validMobile = /^9\d{9}$/.test(mobile);

  const validAmount = amountNumber >= MIN_AMOUNT && amountNumber <= MAX_AMOUNT;

  const canContinue = validMobile && validAmount;

  const handleMobileChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    setMobile(digits);
  };

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits === "") {
      setAmount("");
      return;
    }

    const number = Number(digits);

    if (number <= MAX_AMOUNT) {
      setAmount(digits);
    }
  };

  const selectAmount = (value: number) => {
    if (value >= MIN_AMOUNT && value <= MAX_AMOUNT) {
      setAmount(String(value));
    }
  };

  const continueToConfirm = () => {
    if (!canContinue) return;

    setStep("confirm");
  };

  const buyLoad = () => {
    if (!canContinue || load.isPending) return;

    load.mutate({
      mobile: `0${mobile}`,
      amount: amountInCentavos,
    });
  };

  const goBack = () => {
    setStep("details");
  };

  const done = () => {
    router.push("/dashboard");
    router.refresh();
  };

  if (load.data) {
    return (
      <div className="flex flex-1 flex-col pb-10">
        <header className="flex h-16 items-center justify-center">
          <h1 className="text-ink text-[16px] font-semibold">Buy load</h1>
        </header>

        <div className="flex flex-1 flex-col items-center pt-10 text-center">
          <div className="bg-brand-soft text-brand grid h-20 w-20 place-items-center rounded-full">
            <CheckCircle2 size={42} strokeWidth={1.8} />
          </div>

          <h2 className="text-ink mt-6 text-[22px] font-semibold">
            Load purchased
          </h2>

          <p className="text-ink-soft mt-2 text-[13px]">
            Your load purchase was successful.
          </p>

          <section className="bg-surface-sunken mt-8 w-full rounded-2xl p-5 text-left">
            <div className="text-center">
              <p className="text-ink-muted text-[12px]">Load amount</p>

              <p className="text-ink mt-1 text-[30px] font-semibold tabular-nums">
                {peso(Math.abs(load.data.amount))}
              </p>
            </div>

            <div className="border-line mt-6 space-y-4 border-t pt-4">
              <Detail label="Mobile number" value={`+63 ${mobile}`} />

              <Detail label="Transaction" value="Mobile load" />

              <Detail label="Reference" value={load.data.reference} />

              <Detail label="Date" value={dateTime(load.data.createdAt)} />

              <Detail
                label="New balance"
                value={peso(load.data.balanceAfter)}
              />
            </div>
          </section>

          <button
            type="button"
            onClick={done}
            className="bg-brand hover:bg-brand-hover mt-auto h-13 w-full rounded-xl text-[15px] font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-1 flex-col pb-10">
        <header className="relative flex h-16 items-center justify-center">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="bg-surface-sunken text-ink-soft absolute left-0 grid h-10 w-10 place-items-center rounded-full"
          >
            <ArrowLeft size={18} strokeWidth={1.9} />
          </button>

          <h1 className="text-ink text-[16px] font-semibold">
            Confirm purchase
          </h1>
        </header>

        <section className="mt-8">
          <div className="bg-surface-sunken rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="bg-brand-soft text-brand grid h-12 w-12 place-items-center rounded-full">
                <Smartphone size={21} strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-ink-muted text-[11px]">Mobile number</p>

                <p className="text-ink mt-0.5 text-[15px] font-semibold">
                  +63 {mobile}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <p className="text-ink-muted text-[12px]">Purchase details</p>

          <div className="border-line mt-2 overflow-hidden rounded-2xl border bg-white">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-ink-soft text-[13px]">Load amount</span>

              <span className="text-ink text-[14px] font-semibold">
                {peso(amountInCentavos)}
              </span>
            </div>

            <div className="border-line border-t px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft text-[13px]">Total</span>

                <span className="text-ink text-[18px] font-semibold">
                  {peso(amountInCentavos)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {load.error ? (
          <p
            role="alert"
            className="bg-danger-soft text-danger mt-5 rounded-xl px-4 py-3 text-[12px]"
          >
            {errorMessage(load.error)}
          </p>
        ) : null}

        <div className="mt-auto pt-8">
          <button
            type="button"
            disabled={load.isPending}
            onClick={buyLoad}
            className={cn(
              "h-13 w-full rounded-xl text-[15px] font-semibold transition-colors",
              load.isPending
                ? "bg-surface-sunken text-ink-soft/50"
                : "bg-brand hover:bg-brand-hover text-white",
            )}
          >
            {load.isPending ? "Processing..." : "Buy load"}
          </button>

          <p className="text-ink-soft/60 mt-3 text-center text-[9.5px]">
            Review your mobile number and amount before purchasing.
          </p>
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
          className="bg-surface-sunken text-ink-soft absolute left-0 grid h-10 w-10 place-items-center rounded-full"
        >
          <ArrowLeft size={18} strokeWidth={1.9} />
        </Link>

        <div className="text-center">
          <p className="text-brand text-[11px] font-medium tracking-[0.18em] uppercase">
            Buy load
          </p>

          <h1 className="text-ink mt-0.5 text-[16px] font-semibold">
            Mobile load
          </h1>
        </div>
      </header>

      <section className="mt-7">
        <p className="text-ink text-[14px] font-semibold">
          Enter mobile number
        </p>

        <p className="text-ink-muted mt-1 text-[11px]">
          Enter the number you want to buy load for.
        </p>

        <div className="border-line-strong focus-within:border-brand mt-4 flex h-14 items-center rounded-xl border bg-white px-4">
          <span className="text-ink-muted mr-2 text-[14px]">+63</span>

          <input
            type="tel"
            inputMode="numeric"
            value={mobile}
            placeholder="917 123 4567"
            maxLength={10}
            onChange={(event) => handleMobileChange(event.target.value)}
            className="text-ink placeholder:text-ink-faint h-full w-full bg-transparent text-[15px] outline-none"
          />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <p className="text-ink text-[14px] font-semibold">Choose amount</p>

          <span className="text-ink-muted text-[11px]">₱10 - ₱10,000</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {LOAD_AMOUNTS.map((value) => {
            const selected = Number(amount) === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => selectAmount(value)}
                className={cn(
                  "h-14 rounded-xl border text-[15px] font-semibold transition-all",
                  selected
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line-strong text-ink hover:bg-surface-sunken bg-white",
                )}
              >
                ₱{value.toLocaleString("en-PH")}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <p className="text-ink text-[14px] font-semibold">Or enter an amount</p>

        <div className="border-line-strong focus-within:border-brand mt-3 flex h-14 items-center rounded-xl border bg-white px-4">
          <span className="text-ink-muted mr-2 text-[18px]">₱</span>

          <input
            type="text"
            inputMode="numeric"
            value={amount}
            placeholder="0"
            maxLength={5}
            onChange={(event) => handleAmountChange(event.target.value)}
            className="text-ink placeholder:text-ink-faint h-full w-full bg-transparent text-[17px] font-semibold outline-none"
          />
        </div>

        <p className="text-ink-muted mt-2 text-[11px]">
          Enter an amount from ₱10 up to ₱10,000.
        </p>
      </section>

      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={!canContinue}
          onClick={continueToConfirm}
          className={cn(
            "h-13 w-full rounded-xl text-[15px] font-semibold transition-colors",
            canContinue
              ? "bg-brand hover:bg-brand-hover text-white"
              : "bg-surface-sunken text-ink-soft/50 cursor-not-allowed",
          )}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-muted text-[12px]">{label}</span>

      <span className="text-ink max-w-[65%] text-right text-[12px] font-medium">
        {value}
      </span>
    </div>
  );
}
