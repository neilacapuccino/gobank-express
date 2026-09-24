"use client";

import {
  ProfileFields,
  profileIsValid,
} from "~/features/account/components/profile-fields";
import { cn } from "~/shared/lib/cn";
import { Button } from "~/shared/ui/button";
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
  const blocked = !profileIsValid({ fullName, mobile, email });

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
        <ProfileFields
          value={{ fullName, mobile, email }}
          onChange={onChange}
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
