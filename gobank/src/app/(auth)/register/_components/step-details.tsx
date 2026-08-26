"use client";

import { Button } from "~/app/_components/ui/button";
import { TextField } from "~/app/_components/ui/text-field";
import { validateEmail, validateMobile } from "~/lib/registration";
import { cn } from "~/lib/utils";
import { GoogleMark } from "./google-mark";

type StepDetailsProps = {
  fullName: string;
  mobile: string;
  email: string;
  googleLinked: boolean;
  onChange: (patch: {
    fullName?: string;
    mobile?: string;
    email?: string;
    googleLinked?: boolean;
  }) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
};

export function StepDetails({
  fullName,
  mobile,
  email,
  googleLinked,
  onChange,
  onNext,
  onSkip,
  onBack,
}: StepDetailsProps) {
  const mobileError = validateMobile(mobile);
  const emailError = validateEmail(email);
  const blocked = Boolean(mobileError ?? emailError);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-2">
        <h1 className="text-ink text-[24px] leading-tight font-semibold tracking-tight">
          Anything else?
        </h1>
        <p className="text-ink-soft text-[14.5px] leading-relaxed">
          All optional. You can add any of this later from settings.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-5">
        <TextField
          label="Full name"
          optional
          placeholder="Your full name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => onChange({ fullName: event.target.value })}
          hint="Printed on your card."
        />

        <TextField
          label="Mobile number"
          optional
          type="tel"
          inputMode="numeric"
          placeholder="09XX XXX XXXX"
          autoComplete="tel"
          value={mobile}
          onChange={(event) => onChange({ mobile: event.target.value })}
          error={mobileError}
          hint="Lets friends pay you by number."
        />

        <TextField
          label="Email"
          optional
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="none"
          value={email}
          onChange={(event) => onChange({ email: event.target.value })}
          error={emailError}
        />

        <button
          type="button"
          onClick={() => onChange({ googleLinked: !googleLinked })}
          aria-pressed={googleLinked}
          className={cn(
            "flex h-13 w-full items-center justify-center gap-2.5 rounded-xl border text-[14.5px] font-medium transition-colors duration-150",
            googleLinked
              ? "border-brand bg-brand-soft text-brand"
              : "border-line-strong text-ink hover:bg-surface-sunken",
          )}
        >
          <GoogleMark />
          {googleLinked ? "Google linked" : "Link Google"}
        </button>
      </div>

      <div className="flex-1" />

      <div className="mt-8 flex flex-col gap-1.5">
        <Button onClick={onNext} disabled={blocked}>
          Continue
        </Button>
        <Button variant="outline" onClick={onSkip}>
          Skip for now
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
