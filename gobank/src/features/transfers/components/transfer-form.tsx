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

export function TransferForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("recipient");
  const [recipientInput, setRecipientInput] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const recipient = api.transfers.recipient.useQuery(
    {
      to: recipientInput.trim(),
    },
    {
      enabled: false,
    },
  );

  const send = api.transfers.send.useMutation();

  const amountInCentavos = toCentavos(Number(amount));

  const findRecipient = async () => {
    if (!recipientInput.trim()) return;

    const result = await recipient.refetch();

    if (result.data) {
      setStep("amount");
    }
  };

  const continueToReview = () => {
    if (!recipient.data || amountInCentavos <= 0) return;

    setStep("review");
  };

  const sendMoney = () => {
    if (!recipient.data || amountInCentavos <= 0) return;

    send.mutate({
      to: recipientInput.trim(),
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

  if (send.data) {
    return (
      <div className="flex flex-1 flex-col pb-10">
        <header className="relative flex h-16 items-center justify-center">
          <h1 className="text-[16px] font-semibold tracking-tight">
            Transfer complete
          </h1>
        </header>

        <div className="flex flex-1 flex-col items-center pt-10 text-center">
          <div className="bg-brand-soft text-brand grid h-20 w-20 place-items-center rounded-full">
            <CheckCircle2 size={42} strokeWidth={1.8} />
          </div>

          <h2 className="text-ink mt-6 text-[22px] font-semibold tracking-tight">
            Money sent successfully
          </h2>

          <p className="text-ink-soft mt-2 text-[13px]">
            Your transfer has been completed.
          </p>

          <section className="bg-surface-sunken mt-8 w-full rounded-2xl p-5 text-left">
            <div className="text-center">
              <p className="text-ink-muted text-[12px]">Amount sent</p>

              <p className="text-ink mt-1 text-[30px] font-semibold tracking-tight tabular-nums">
                {peso(Math.abs(send.data.amount))}
              </p>
            </div>

            <div className="border-line mt-6 space-y-4 border-t pt-4">
              <Detail
                label="Recipient"
                value={recipient.data?.fullName ?? ""}
              />

              <Detail
                label="Username"
                value={`@${recipient.data?.username ?? ""}`}
              />

              <Detail label="Reference" value={send.data.reference} />

              <Detail label="Date" value={dateTime(send.data.createdAt)} />

              <Detail
                label="New balance"
                value={peso(send.data.balanceAfter)}
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
          <h1 className="text-[16px] font-semibold tracking-tight">
            Send money
          </h1>

          <p className="text-ink-soft mt-0.5 text-[11px]">
            {step === "recipient"
              ? "Choose a recipient"
              : step === "amount"
                ? "Enter transfer details"
                : "Review your transfer"}
          </p>
        </div>
      </header>

      {step === "recipient" ? (
        <RecipientStep
          value={recipientInput}
          loading={recipient.isFetching}
          error={recipient.error ? errorMessage(recipient.error) : null}
          onChange={(value) => {
            setRecipientInput(value);
          }}
          onContinue={findRecipient}
        />
      ) : null}

      {step === "amount" && recipient.data ? (
        <AmountStep
          recipient={{
            ...recipient.data,
            fullName: recipient.data.fullName ?? "",
          }}
          amount={amount}
          note={note}
          onAmountChange={setAmount}
          onNoteChange={setNote}
          onContinue={continueToReview}
        />
      ) : null}

      {step === "review" && recipient.data ? (
        <ReviewStep
          recipient={{
            ...recipient.data,
            fullName: recipient.data.fullName ?? "",
          }}
          amount={amountInCentavos}
          note={note}
          loading={send.isPending}
          error={send.error ? errorMessage(send.error) : null}
          onSend={sendMoney}
        />
      ) : null}
    </div>
  );
}

function RecipientStep({
  value,
  loading,
  error,
  onChange,
  onContinue,
}: {
  value: string;
  loading: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
}) {
  const canContinue = value.trim().length > 0 && !loading;

  return (
    <div className="flex flex-1 flex-col">
      <section className="mt-8">
        <div className="bg-brand-soft text-brand mx-auto grid h-16 w-16 place-items-center rounded-full">
          <UserRound size={28} strokeWidth={1.8} />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-ink text-[21px] font-semibold tracking-tight">
            Who do you want to send to?
          </h2>

          <p className="text-ink-soft mt-2 text-[12px] leading-relaxed">
            Enter their account number, username, or mobile number.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <label className="text-ink-soft mb-2 block text-[13px] font-medium">
          Recipient
        </label>

        <div
          className={cn(
            "border-line-strong focus-within:border-brand focus-within:ring-brand/15 flex items-center rounded-xl border bg-white transition-colors focus-within:ring-2",
            error ? "border-danger" : null,
          )}
        >
          <input
            type="text"
            value={value}
            placeholder="Account number, username or mobile"
            onChange={(event) => onChange(event.target.value)}
            className="text-ink placeholder:text-ink-faint h-13 w-full bg-transparent px-3.5 text-[14px] outline-none"
          />
        </div>

        {error ? (
          <p className="text-danger mt-2 text-[12px]">{error}</p>
        ) : (
          <p className="text-ink-muted mt-2 text-[11px]">
            Example: 20123456789 or @username
          </p>
        )}
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
          {loading ? "Finding recipient..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

function AmountStep({
  recipient,
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onContinue,
}: {
  recipient: {
    fullName: string;
    username: string;
  };
  amount: string;
  note: string;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onContinue: () => void;
}) {
  const amountInCentavos = toCentavos(Number(amount));

  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-surface-sunken mt-6 flex items-center gap-3 rounded-2xl p-4">
        <div className="bg-brand-soft text-brand grid h-11 w-11 shrink-0 place-items-center rounded-full">
          <UserRound size={20} strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <p className="text-ink truncate text-[13px] font-semibold">
            {recipient.fullName}
          </p>

          <p className="text-ink-muted mt-0.5 text-[11px]">
            @{recipient.username}
          </p>
        </div>

        <CheckCircle2 size={18} className="text-brand ml-auto shrink-0" />
      </section>

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
          Enter the amount you want to send.
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
          Review transfer
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
  onSend,
}: {
  recipient: {
    fullName: string;
    username: string;
  };
  amount: number;
  note: string;
  loading: boolean;
  error: string | null;
  onSend: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mt-6">
        <p className="text-ink-muted text-[11px]">Youre sending to</p>

        <div className="mt-2 flex items-center gap-3">
          <div className="bg-brand-soft text-brand grid h-12 w-12 place-items-center rounded-full">
            <UserRound size={21} strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-ink text-[14px] font-semibold">
              {recipient.fullName}
            </p>

            <p className="text-ink-muted mt-0.5 text-[11px]">
              @{recipient.username}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface-sunken mt-7 rounded-2xl p-5">
        <p className="text-ink-muted text-center text-[12px]">Amount</p>

        <p className="text-ink mt-1 text-center text-[31px] font-semibold tracking-tight tabular-nums">
          {peso(amount)}
        </p>

        <div className="border-line mt-5 space-y-4 border-t pt-4">
          <Detail label="Transfer fee" value="₱0.00" />

          <Detail label="Total" value={peso(amount)} />

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
          onClick={onSend}
          className={cn(
            "flex h-13 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-colors",
            loading
              ? "bg-surface-sunken text-ink-soft/50 cursor-not-allowed"
              : "bg-brand hover:bg-brand-hover text-white",
          )}
        >
          {loading ? (
            "Sending money..."
          ) : (
            <>
              Send {peso(amount)}
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
