"use client";

import { GmailLink } from "~/features/account/components/gmail-link";
import {
  ProfileFields,
  profileIsValid,
} from "~/features/account/components/profile-fields";
import { Button } from "~/shared/ui/button";

type StepDetailsProps = {
  fullName: string;
  mobile: string;
  onChange: (patch: { fullName?: string; mobile?: string }) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepDetails({
  fullName,
  mobile,
  onChange,
  onNext,
  onBack,
}: StepDetailsProps) {
  const blocked = !profileIsValid({ fullName, mobile });
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-2">
        <h1 className="text-ink text-[24px] leading-tight font-semibold tracking-tight">
          Your details
        </h1>
        <p className="text-ink-soft text-[14.5px] leading-relaxed">
          Add your full name. Mobile number and Gmail are optional.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-5">
        <ProfileFields value={{ fullName, mobile }} onChange={onChange} />
        <GmailLink />
      </div>
      <div className="flex-1" />
      <div className="mt-8 flex flex-col gap-1.5">
        <Button onClick={onNext} disabled={blocked}>
          Continue
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
