"use client";

import { ArrowRight, CheckCircle2, UserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dateTime, digitsOnly, peso } from "~/shared/lib/format";
import { toCentavos } from "~/shared/lib/money";
import { cn } from "~/shared/lib/cn";
import { BackButton } from "~/shared/ui/back-button";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";

type Step = "recipient" | "amount" | "review";

type Recipient = {
  id: string;
  username: string;
  fullName: string;
  profilePhoto: string | null;
};

export function TransferForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("recipient");
  const [recipientInput, setRecipientInput] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null,
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const recentRecipients = api.transfers.recent.useQuery();

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
      setSelectedRecipient(result.data);
      setStep("amount");
    }
  };

  const continueToReview = () => {
    if ((!recipient.data && !selectedRecipient) || amountInCentavos <= 0) {
      return;
    }

    setStep("review");
  };

  const sendMoney = () => {
    if ((!recipient.data && !selectedRecipient) || amountInCentavos <= 0) {
      return;
    }

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

  const currentRecipient = selectedRecipient ?? recipient.data ?? null;

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
                value={currentRecipient?.fullName ?? ""}
              />

              <Detail
                label="Username"
                value={`@${currentRecipient?.username ?? ""}`}
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
          <BackButton
            onClick={goBack}
            label="Go back"
            className="absolute left-0"
          />
        ) : (
          <BackButton
            href="/dashboard"
            label="Back to dashboard"
            className="absolute left-0"
          />
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
          recentRecipients={recentRecipients.data ?? []}
          recentLoading={recentRecipients.isLoading}
          onRecentSelect={(recent) => {
            setRecipientInput(recent.username);
            setSelectedRecipient(recent);
            setStep("amount");
          }}
          onChange={(value) => {
            setRecipientInput(value);
            setSelectedRecipient(null);
          }}
          onContinue={findRecipient}
        />
      ) : null}

      {step === "amount" && currentRecipient ? (
        <AmountStep
          recipient={currentRecipient}
          amount={amount}
          note={note}
          onAmountChange={setAmount}
          onNoteChange={setNote}
          onContinue={continueToReview}
        />
      ) : null}

      {step === "review" && currentRecipient ? (
        <ReviewStep
          recipient={currentRecipient}
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
  recentRecipients,
  recentLoading,
  onRecentSelect,
  onChange,
  onContinue,
}: {
  value: string;
  loading: boolean;
  error: string | null;
  recentRecipients: Recipient[];
  recentLoading: boolean;
  onRecentSelect: (recipient: Recipient) => void;
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
            Search for a recipient or choose someone you recently sent money to.
          </p>
        </div>
      </section>

      <section className="mt-7">
        <label className="text-ink-soft mb-2 block text-[13px] font-medium">
          Search recipient
        </label>

        <div
          className={cn(
            "border-line-strong bg-surface focus-within:border-brand focus-within:ring-brand/15 flex items-center rounded-xl border transition-colors focus-within:ring-2",
            error ? "border-danger" : null,
          )}
        >
          <input
            type="text"
            value={value}
            placeholder="Username, Gmail, account or mobile"
            onChange={(event) => onChange(event.target.value)}
            className="text-ink placeholder:text-ink-faint h-13 w-full bg-transparent px-3.5 text-[14px] outline-none"
          />
        </div>

        {error ? (
          <p className="text-danger mt-2 text-[12px]">{error}</p>
        ) : (
          <p className="text-ink-muted mt-2 text-[11px]">
            Example: @username or name@gmail.com
          </p>
        )}
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-ink text-[13px] font-semibold">Recent</h3>

          {recentRecipients.length > 0 ? (
            <span className="text-ink-muted text-[10px]">
              {recentRecipients.length} recipient
              {recentRecipients.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        {recentLoading ? (
          <div className="bg-surface-sunken text-ink-muted rounded-xl px-4 py-4 text-center text-[12px]">
            Loading recent recipients...
          </div>
        ) : recentRecipients.length === 0 ? (
          <div className="bg-surface-sunken text-ink-muted rounded-xl px-4 py-4 text-center text-[12px]">
            No recent recipients
          </div>
        ) : (
          <div className="space-y-2">
            {recentRecipients.map((recipient) => (
              <button
                key={recipient.id}
                type="button"
                onClick={() => onRecentSelect(recipient)}
                className="bg-surface hover:bg-surface-sunken border-line flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
              >
                {recipient.profilePhoto ? (
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={recipient.profilePhoto}
                      alt={`${recipient.fullName}'s profile`}
                      fill
                      sizes="44px"
                      unoptimized
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span className="bg-brand-soft text-brand grid h-11 w-11 shrink-0 place-items-center rounded-full">
                    <UserRound size={20} strokeWidth={1.8} />
                  </span>
                )}

                <span className="min-w-0">
                  <span className="text-ink block truncate text-[13px] font-semibold">
                    {recipient.fullName}
                  </span>

                  <span className="text-ink-muted mt-0.5 block truncate text-[11px]">
                    @{recipient.username}
                  </span>
                </span>

                <span className="text-ink-faint ml-auto text-[18px]">→</span>
              </button>
            ))}
          </div>
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
  recipient: Recipient;
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
        {recipient.profilePhoto ? (
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
            <Image
              src={recipient.profilePhoto}
              alt={`${recipient.fullName}'s profile`}
              fill
              sizes="44px"
              unoptimized
              className="object-cover"
            />
          </span>
        ) : (
          <div className="bg-brand-soft text-brand grid h-11 w-11 shrink-0 place-items-center rounded-full">
            <UserRound size={20} strokeWidth={1.8} />
          </div>
        )}

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

        <div className="border-line-strong bg-surface focus-within:border-brand focus-within:ring-brand/15 flex items-center rounded-2xl border px-5 py-2 transition-colors focus-within:ring-2">
          <span className="text-ink-muted text-[25px]">₱</span>

          <input
            type="text"
            inputMode="decimal"
            maxLength={6}
            value={amount}
            placeholder="0.00"
            onChange={(event) =>
              onAmountChange(digitsOnly(event.target.value, 6))
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
          className="border-line-strong bg-surface focus:border-brand focus:ring-brand/15 text-ink placeholder:text-ink-faint w-full resize-none rounded-xl border px-3.5 py-3 text-[13px] outline-none focus:ring-2"
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
  recipient: Recipient;
  amount: number;
  note: string;
  loading: boolean;
  error: string | null;
  onSend: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mt-6">
        <p className="text-ink-muted text-[11px]">You&apos;re sending to</p>

        <div className="mt-2 flex items-center gap-3">
          {recipient.profilePhoto ? (
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
              <Image
                src={recipient.profilePhoto}
                alt={`${recipient.fullName}'s profile`}
                fill
                sizes="48px"
                unoptimized
                className="object-cover"
              />
            </span>
          ) : (
            <div className="bg-brand-soft text-brand grid h-12 w-12 shrink-0 place-items-center rounded-full">
              <UserRound size={21} strokeWidth={1.8} />
            </div>
          )}

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
