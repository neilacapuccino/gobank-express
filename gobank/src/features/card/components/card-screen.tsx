"use client";

import {
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Lock,
  LockKeyholeOpen,
  ShieldCheck,
  Snowflake,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { BackButton } from "~/shared/ui/back-button";
import { api } from "~/trpc/react";
import { VirtualCard } from "./virtual-card";

type CardMode = "physical" | "virtual";

export function CardScreen() {
  const [mode, setMode] = useState<CardMode>("physical");
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const card = api.card.get.useQuery();

  const updateCard = api.card.update.useMutation({
    onSuccess: () => {
      void card.refetch();
    },
  });

  if (card.isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="relative flex h-16 items-center justify-center">
          <BackButton
            href="/dashboard"
            label="Back to dashboard"
            className="absolute left-0"
          />

          <div className="text-center">
            <p className="text-ink-muted text-[11px]">GoBank</p>
            <h1 className="text-ink text-[19px] font-semibold tracking-tight">
              My Card
            </h1>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center">
          <p className="text-ink-muted text-[13px]">Loading your card...</p>
        </div>
      </div>
    );
  }

  if (card.error || !card.data) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="relative flex h-16 items-center justify-center">
          <BackButton
            href="/dashboard"
            label="Back to dashboard"
            className="absolute left-0"
          />

          <div className="text-center">
            <p className="text-ink-muted text-[11px]">GoBank</p>
            <h1 className="text-ink text-[19px] font-semibold tracking-tight">
              My Card
            </h1>
          </div>
        </header>

        <div className="bg-danger-soft text-danger mt-8 rounded-xl px-4 py-3 text-[12px]">
          We couldn&apos;t load your card. Please try again.
        </div>
      </div>
    );
  }

  const currentCard = card.data;

  const formattedNumber =
    currentCard.number.match(/.{1,4}/g)?.join(" ") ?? currentCard.number;

  const expiry = new Date(currentCard.expiresAt);

  const expiryLabel = `${String(expiry.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}/${String(expiry.getUTCFullYear()).slice(-2)}`;

  const toggleLock = () => {
    updateCard.mutate({
      locked: !currentCard.locked,
    });
  };

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(currentCard.number);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col pb-10">
      <header className="relative flex h-16 items-center justify-center">
        <BackButton
          href="/dashboard"
          label="Back to dashboard"
          className="absolute left-0"
        />

        <div className="text-center">
          <p className="text-ink-muted text-[11px]">GoBank</p>

          <h1 className="text-ink text-[19px] font-semibold tracking-tight">
            My Card
          </h1>
        </div>

        <div
          className={cn(
            "absolute right-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-medium",
            currentCard.locked
              ? "bg-surface-sunken text-ink-muted"
              : "bg-brand-soft text-brand",
          )}
        >
          {currentCard.locked ? (
            <>
              <Lock size={12} />
              Card locked
            </>
          ) : (
            <>
              <ShieldCheck size={12} />
              Card active
            </>
          )}
        </div>
      </header>

      <section className="mt-5">
        <div className="bg-surface-sunken flex rounded-xl p-1">
          <button
            type="button"
            onClick={() => {
              setMode("physical");
              setShowDetails(false);
            }}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[12px] font-semibold transition-all",
              mode === "physical"
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <WalletCards size={15} />
            Physical Card
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("virtual");
              setShowDetails(false);
            }}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[12px] font-semibold transition-all",
              mode === "virtual"
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <Sparkles size={15} />
            Virtual Card
          </button>
        </div>
      </section>

      <section className="mt-6">
        <div className="relative">
          <VirtualCard
            brandId={currentCard.brand}
            holder={currentCard.user.fullName}
            number={showDetails ? currentCard.number : undefined}
            last4={currentCard.number.slice(-4)}
            expiresAt={currentCard.expiresAt}
          />

          {currentCard.locked ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/35 backdrop-blur-[2px]">
              <div className="flex items-center gap-2 rounded-full bg-black/65 px-4 py-2 text-[12px] font-semibold text-white">
                <Lock size={14} />
                Card locked
              </div>
            </div>
          ) : null}
        </div>

        <p className="text-ink-muted mt-3 text-center text-[10px]">
          {mode === "physical"
            ? "Use your physical card for in-store purchases."
            : "Use your virtual card for online purchases."}
        </p>
      </section>

      <section className="mt-7">
        <div className="border-line bg-surface overflow-hidden rounded-2xl border">
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            className="hover:bg-surface-sunken flex w-full items-center gap-3 p-4 text-left transition-colors"
          >
            <div className="bg-brand-soft text-brand grid h-10 w-10 shrink-0 place-items-center rounded-xl">
              {showDetails ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-ink text-[13px] font-semibold">
                {showDetails ? "Hide card details" : "Show card details"}
              </p>

              <p className="text-ink-muted mt-0.5 text-[10px]">
                Card number and expiration date
              </p>
            </div>

            <ChevronRight
              size={17}
              className={cn(
                "text-ink-faint transition-transform",
                showDetails && "rotate-90",
              )}
            />
          </button>

          {showDetails ? (
            <div className="border-line space-y-4 border-t px-4 py-4">
              <div>
                <p className="text-ink-muted text-[10px]">Card number</p>

                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-ink text-[14px] font-medium tracking-[0.08em] tabular-nums">
                    {formattedNumber}
                  </p>

                  <button
                    type="button"
                    onClick={copyCardNumber}
                    className="text-brand hover:text-brand-hover shrink-0"
                    aria-label="Copy card number"
                  >
                    {copied ? (
                      <span className="text-[11px] font-medium">Copied</span>
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-ink-muted text-[10px]">Expires</p>

                  <p className="text-ink mt-1 text-[13px] font-medium tabular-nums">
                    {expiryLabel}
                  </p>
                </div>

                <div>
                  <p className="text-ink-muted text-[10px]">CVV</p>

                  <p className="text-ink mt-1 text-[13px] font-medium tracking-[0.15em]">
                    •••
                  </p>
                </div>
              </div>

              <p className="text-ink-faint text-[9.5px] leading-relaxed">
                Never share your card number, expiration date, or CVV with
                anyone.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-3">
        <button
          type="button"
          disabled={updateCard.isPending}
          onClick={toggleLock}
          className={cn(
            "border-line bg-surface hover:bg-surface-sunken flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
            updateCard.isPending && "cursor-not-allowed opacity-60",
          )}
        >
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              currentCard.locked
                ? "bg-brand-soft text-brand"
                : "bg-surface-sunken text-ink",
            )}
          >
            {currentCard.locked ? (
              <LockKeyholeOpen size={18} />
            ) : (
              <Lock size={18} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-ink text-[13px] font-semibold">
              {updateCard.isPending
                ? "Updating card..."
                : currentCard.locked
                  ? "Unlock card"
                  : "Lock card"}
            </p>

            <p className="text-ink-muted mt-0.5 text-[10px]">
              {currentCard.locked
                ? "Unlock your card to use it again."
                : "Temporarily disable card transactions."}
            </p>
          </div>

          <ChevronRight size={17} className="text-ink-faint" />
        </button>
      </section>

      <section className="bg-surface-sunken mt-6 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-surface text-brand grid h-9 w-9 shrink-0 place-items-center rounded-full">
            <Snowflake size={16} />
          </div>

          <div>
            <p className="text-ink text-[11px] font-semibold">
              Keep your card safe
            </p>

            <p className="text-ink-muted mt-1 text-[10px] leading-relaxed">
              Lock your card immediately if you notice suspicious activity. You
              can unlock it whenever you are ready to use it again.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
