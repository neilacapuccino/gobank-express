"use client";

import { useState } from "react";
import { Button } from "~/app/_components/ui/button";
import { getBrand } from "~/lib/card-brands";
import {
  cardholderName,
  formatMobile,
  type RegistrationDraft,
} from "~/lib/registration";
import { cn } from "~/lib/utils";
import { VirtualCard } from "~/app/_components/money/virtual-card";

type StepReviewProps = {
  draft: RegistrationDraft;
  onSubmit: () => void;
  onBack: () => void;
};

export function StepReview({ draft, onSubmit, onBack }: StepReviewProps) {
  const [accepted, setAccepted] = useState(false);

  const rows = [
    { label: "Username", value: `@${draft.username}` },
    { label: "PIN", value: "••••••" },
    { label: "Card", value: getBrand(draft.brand).name },
    { label: "Full name", value: draft.fullName.trim() },
    {
      label: "Mobile",
      value: draft.mobile.trim() ? formatMobile(draft.mobile) : "",
    },
    { label: "Email", value: draft.email.trim() },
    { label: "Google", value: draft.googleLinked ? "Linked" : "" },
  ];

  return (
    <div className="animate-rise flex flex-1 flex-col">
      <div className="flex flex-col gap-2">
        <h1 className="text-ink text-[24px] leading-tight font-semibold tracking-tight">
          Almost there
        </h1>
        <p className="text-ink-soft text-[14.5px] leading-relaxed">
          Check everything looks right before we open your account.
        </p>
      </div>

      <div className="mt-7">
        <VirtualCard
          brandId={draft.brand}
          holder={cardholderName(draft)}
          compact
        />
      </div>

      <dl className="divide-line border-line mt-6 divide-y rounded-xl border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 px-4 py-3"
          >
            <dt className="text-ink-muted shrink-0 text-[13px]">{row.label}</dt>
            <dd
              className={cn(
                "min-w-0 truncate text-[14px]",
                row.value ? "text-ink font-medium" : "text-ink-faint",
              )}
            >
              {row.value || "Not set"}
            </dd>
          </div>
        ))}
      </dl>

      <label className="mt-6 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="sr-only"
        />
        <span
          className={cn(
            "mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-150",
            accepted ? "border-brand bg-brand" : "border-line-strong",
          )}
        >
          {accepted ? (
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
          ) : null}
        </span>
        <span className="text-ink-soft text-[13px] leading-relaxed">
          I agree to the Terms of Service and Privacy Policy.
        </span>
      </label>

      <div className="flex-1" />

      <div className="mt-8 flex flex-col gap-1.5">
        <Button disabled={!accepted} onClick={onSubmit}>
          Create my account
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
