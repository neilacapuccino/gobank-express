"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dateTime, digitsOnly, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { cn } from "~/shared/lib/cn";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";

type Step = "recipient" | "amount" | "review";

const AMOUNT_DIGITS = 6;

export function RequestForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("recipient");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const request = api.requests.create.useMutation();

  const amountInCentavos = toCentavos(Number(amount));

  const canContinueRecipient = recipient.trim().length > 0;

  const continueToAmount = () => {
    if (!canContinueRecipient) return;
    setStep("amount");
  };

  const continueToReview = () => {
    if (amountInCentavos <= 0) return;
    setStep("review");
  };

  const createRequest = () => {
    if (!recipient.trim() || amountInCentavos <= 0) return;

    request.mutate({
      from: recipient.trim(),
      amount: amountInCentavos,
      note: note.trim(),
    });
  };

  const goBack = () => {
    if (step === "amount") {
      setStep("recipient");
      return;
    }

    if (step === "review") {
      setStep("amount");
    }
  };

  const done = () => {
    router.push("/dashboard");
    router.refresh();
  };

  if (request.data) {
    return (
      <div className="flex flex-1 flex-col pb-10">
        <header className="relative flex h-16 items-center justify-center">
          <h1 className="text-[16px] font-semibold tracking-tight">
            Request sent
          </h1>
        </header>

        <div className="flex flex-1 flex-col items-center pt-10 text-center">
          <div className="bg-brand-soft text-brand grid h-20 w-20 place-items-center rounded-full">
            <CheckCircle2 size={42} strokeWidth={1.8} />
          </div>

          <h2 className="text-ink mt-6 text-[22px] font-semibold tracking-tight">
            Money requested successfully
          </h2>

          <p className="text-ink-soft mt-2 text-[13px]">
            Your request has been sent.
          </p>

          <section className="bg-surface-sunken mt-8 w-full rounded-2xl p-5 text-left">
            <div className="text-center">
              <p className="text-ink-muted text-[12px]">Amount requested</p>

              <p className="text-ink mt-1 text-[30px] font-semibold tracking-tight tabular-nums">
                {peso(request.data.amount)}
              </p>
            </div>

            <div className="border-line mt-6 space-y-4 border-t pt-4">
              <Detail label="Requested from" value={recipient} />

              {note ? <Detail label="Note" value={note} /> : null}

              <Detail label="Status" value="Pending" />

              <Detail label="Date" value={dateTime(request.data.createdAt)} />

              <Detail label="Request ID" value={request.data.id} />
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

  return (
    <div className="flex flex-1 flex-col pb-10">
      <header className="relative flex h-16 items-center justify-center">
        {step !== "recipient" ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="bg-surface-sunken text-ink-soft hover:bg-surface-raised absolute left-0 grid h-10 w-10 place-items-center rounded-full transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={1.9} />
          </button>
        ) : (
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="bg-surface-sunken text-ink-soft hover:bg-surface-raised absolute left-0 grid h-10 w-10 place-items-center rounded-full transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={1.9} />
          </Link>
        )}

        <div className="text-center">
          <p className="text-brand text-[11px] font-medium uppercase tracking-[0.18em]">
            Request
          </p>

          <h1 className="text-ink mt-0.5 text-[16px] font-semibold tracking-tight">
            Request money
          </h1>
        </div>
      </header>

      {step === "recipient" ? (
        <RecipientStep
          value={recipient}
          onChange={setRecipient}
          onContinue={continueToAmount}
        />
      ) : null}

      {step === "amount" ? (
        <AmountStep
          amount={amount}
          note={note}
          onAmountChange={setAmount}
          onNoteChange={setNote}
          onContinue={continueToReview}
        />
      ) : null}

      {step === "review" ? (
        <ReviewStep
          recipient={recipient}
          amount={amountInCentavos}
          note={note}
          loading={request.isPending}
          error={request.error ? errorMessage(request.error) : null}
          onRequest={createRequest}
        />
      ) : null}
    </div>
  );
}

function RecipientStep({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
}) {
  const canContinue = value.trim().length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <section className="mt-8">
        <div className="bg-brand-soft text-brand mx-auto grid h-16 w-16 place-items-center rounded-full">
          <UserRound size={28} strokeWidth={1.8} />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-ink text-[21px] font-semibold tracking-tight">
            Who are you requesting from?
          </h2>

          <p className="text-ink-soft mt-2 text-[12px] leading-relaxed">
            Enter their account number, username, or mobile number.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <label className="text-ink-soft mb-2 block text-[13px] font-medium">
          Person
        </label>

        <div className="border-line-strong focus-within:border-brand focus-within:ring-brand/15 flex items-center rounded-xl border bg-white transition-colors focus-within:ring-2">
          <input
            type="text"
            value={value}
            placeholder="Account number, username or mobile"
            onChange={(event) => onChange(event.target.value)}
            className="text-ink placeholder:text-ink-faint h-13 w-full bg-transparent px-3.5 text-[14px] outline-none"
          />
        </div>

        <p className="text-ink-muted mt-2 text-[11px]">
          Example: 20123456789 or @username
        </p>
      </section>

      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={cn(
            "h-13 w-full rounded-xl text-[15px] font-semibold transition-all",
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

function AmountStep({
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onContinue,
}: {
  amount: string;
  note: string;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onContinue: () => void;
}) {
  const amountInCentavos = toCentavos(Number(amount));

  return (
    <div className="flex flex-1 flex-col">
      <section className="mt-7">
        <label className="text-ink-soft mb-2 block text-[13px] font-medium">
          Amount
        </label>

        <div className="border-line-strong focus-within:border-brand focus-within:ring-brand/15 flex items-center rounded-2xl border bg-white px-5 py-2 transition-colors focus-within:ring-2">
          <span className="text-ink-muted text-[25px]">₱</span>

          <input
            type="text"
            inputMode="decimal"
            value={amount}
            placeholder="0.00"
            onChange={(event) =>
              onAmountChange(digitsOnly(event.target.value, AMOUNT_DIGITS))
            }
            className="text-ink placeholder:text-ink-faint h-16 w-full bg-transparent px-3 text-[30px] font-semibold tracking-tight outline-none"
          />
        </div>

        <p className="text-ink-muted mt-2 text-[11px]">
          Enter the amount you want to request.
        </p>
      </section>

      <section className="mt-6">
        <label className="text-ink-soft mb-2 block text-[13px] font-medium">
          Note
          <span className="text-ink-faint ml-1 font-normal">Optional</span>
        </label>

        <textarea
          value={note}
          maxLength={120}
          placeholder="What's this for?"
          onChange={(event) => onNoteChange(event.target.value)}
          rows={3}
          className="border-line-strong focus:border-brand focus:ring-brand/15 text-ink placeholder:text-ink-faint w-full resize-none rounded-xl border bg-white px-3.5 py-3 text-[13px] outline-none focus:ring-2"
        />

        <p className="text-ink-faint mt-1 text-right text-[10px]">
          {note.length}/120
        </p>
      </section>

      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={amountInCentavos <= 0}
          onClick={onContinue}
          className={cn(
            "h-13 w-full rounded-xl text-[15px] font-semibold transition-all",
            amountInCentavos > 0
              ? "bg-brand hover:bg-brand-hover text-white"
              : "bg-surface-sunken text-ink-soft/50 cursor-not-allowed",
          )}
        >
          Review request
        </button>
      </div>
    </div>
  );
}

function ReviewStep({
  recipient,
  amount,
  note,
  loading,
  error,
  onRequest,
}: {
  recipient: string;
  amount: number;
  note: string;
  loading: boolean;
  error: string | null;
  onRequest: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mt-6">
        <p className="text-ink-muted text-[11px]">You're requesting from</p>

        <div className="mt-2 flex items-center gap-3">
          <div className="bg-brand-soft text-brand grid h-12 w-12 place-items-center rounded-full">
            <UserRound size={21} strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-ink text-[14px] font-semibold">{recipient}</p>

            <p className="text-ink-muted mt-0.5 text-[11px]">
              Request recipient
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface-sunken mt-7 rounded-2xl p-5">
        <p className="text-ink-muted text-center text-[12px]">
          Amount requested
        </p>

        <p className="text-ink mt-1 text-center text-[31px] font-semibold tracking-tight tabular-nums">
          {peso(amount)}
        </p>

        <div className="border-line mt-5 space-y-4 border-t pt-4">
          <Detail label="From" value={recipient} />

          <Detail label="Status" value="Pending" />

          {note ? <Detail label="Note" value={note} /> : null}
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="bg-danger-soft text-danger mt-5 rounded-xl px-4 py-3 text-[12px]"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={loading}
          onClick={onRequest}
          className={cn(
            "flex h-13 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-colors",
            loading
              ? "bg-surface-sunken text-ink-soft/50 cursor-not-allowed"
              : "bg-brand hover:bg-brand-hover text-white",
          )}
        >
          {loading ? (
            "Sending request..."
          ) : (
            <>
              Request {peso(amount)}
              <ArrowRight size={17} />
            </>
          )}
        </button>

        <p className="text-ink-soft/60 mt-3 text-center text-[9.5px]">
          Please review the recipient and amount before sending.
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-muted text-[12px]">{label}</span>

      <span className="text-ink max-w-[60%] text-right text-[12px] font-medium">
        {value}
      </span>
    </div>
  );
}