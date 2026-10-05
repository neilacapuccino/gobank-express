"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "~/shared/ui/button";
import { getBrand } from "~/features/card/card-brands";
import { cardholderName, type RegistrationDraft } from "../auth.rules";
import { formatMobile } from "~/shared/lib/contact";
import { cn } from "~/shared/lib/cn";
import { VirtualCard } from "~/features/card/components/virtual-card";
import type { RouterOutputs } from "~/trpc/react";

type StepReviewProps = {
  draft: RegistrationDraft;
  card: RouterOutputs["auth"]["prepareCard"];
  pending: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
  onRefreshCard: () => void;
};

export function StepReview({
  draft,
  card,
  pending,
  error,
  onSubmit,
  onBack,
  onRefreshCard,
}: StepReviewProps) {
  const [accepted, setAccepted] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const rows = [
    { label: "Username", value: "@" + draft.username },
    { label: "PIN", value: showPin ? draft.pin : "••••••" },
    { label: "Card", value: getBrand(draft.brand).name },
    { label: "CVV", value: showCard ? card.cvv : "•••" },
    { label: "Full name", value: draft.fullName.trim() },
    {
      label: "Mobile",
      value: draft.mobile.trim() ? formatMobile(draft.mobile) : "",
    },
  ];
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-2">
        <h1 className="text-ink text-[24px] leading-tight font-semibold tracking-tight">
          Review your account
        </h1>
        <p className="text-ink-soft text-[14.5px] leading-relaxed">
          Check your details before confirming.
        </p>
      </div>
      <div className="mt-7">
        <VirtualCard
          brandId={draft.brand}
          holder={cardholderName(draft)}
          first4={card.number.slice(0, 4)}
          last4={card.number.slice(-4)}
          number={showCard ? card.number : undefined}
          expiresAt={card.expiresAt}
          compact
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowCard((current) => !current)}
          aria-pressed={showCard}
          className="text-ink-soft enabled:hover:text-ink focus-visible:outline-brand mx-auto mt-3 flex min-h-10 items-center justify-center gap-2 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-45"
        >
          {showCard ? (
            <EyeOff size={16} aria-hidden />
          ) : (
            <Eye size={16} aria-hidden />
          )}
          {showCard ? "Hide card details" : "Show card details"}
        </button>
      </div>
      <dl className="divide-line border-line mt-4 divide-y rounded-xl border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <dt className="text-ink-muted shrink-0 text-[13px]">{row.label}</dt>
            <dd
              className={cn(
                "flex min-w-0 items-center gap-3 text-[14px]",
                row.value ? "text-ink font-medium" : "text-ink-faint",
              )}
            >
              <span className="truncate tabular-nums">
                {row.value || "Not set"}
              </span>
              {row.label === "PIN" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setShowPin((current) => !current)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  aria-pressed={showPin}
                  className="text-ink-muted enabled:hover:text-ink focus-visible:outline-brand flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 disabled:opacity-45"
                >
                  {showPin ? (
                    <EyeOff size={16} aria-hidden />
                  ) : (
                    <Eye size={16} aria-hidden />
                  )}
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <label className="mt-6 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={accepted}
          disabled={pending}
          onChange={(event) => setAccepted(event.target.checked)}
          className="sr-only"
        />
        <span
          className={cn(
            "mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-150",
            accepted ? "border-brand bg-brand" : "border-line-strong",
          )}
        >
          {accepted && (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          )}
        </span>
        <span className="text-ink-soft text-[13px] leading-relaxed">
          I agree to the Terms of Service and Privacy Policy.
        </span>
      </label>
      <div className="flex-1" />
      {error && (
        <div
          role="alert"
          className="bg-danger-soft mt-6 rounded-xl px-4 py-3 text-[13px]"
        >
          <p className="text-danger">{error}</p>
          <button
            type="button"
            disabled={pending}
            onClick={onRefreshCard}
            className="text-ink mt-2 min-h-9 font-medium underline"
          >
            Refresh card details
          </button>
        </div>
      )}
      <div className="mt-8 flex flex-col gap-1.5">
        <Button disabled={!accepted || pending} onClick={onSubmit}>
          {pending && (
            <span
              aria-hidden
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {pending ? "Opening your account" : "Create my account"}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
