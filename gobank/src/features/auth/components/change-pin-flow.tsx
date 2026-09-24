"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "~/shared/lib/cn";
import { buttonClass } from "~/shared/ui/button";
import { PageHeader } from "~/shared/ui/page-header";
import { PinPad } from "~/shared/ui/pin-pad";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { PIN_LENGTH, validatePin } from "../auth.rules";

type Step = "current" | "next" | "confirm";

const COPY: Record<Step, { title: string; subtitle: string }> = {
  current: {
    title: "Enter your current PIN",
    subtitle: "We check it before you set a new one.",
  },
  next: {
    title: "Choose a new PIN",
    subtitle: "Six digits, different from your current PIN.",
  },
  confirm: {
    title: "Confirm your new PIN",
    subtitle: "Enter the same six digits again.",
  },
};

const EMPTY = { current: "", next: "", confirm: "" };

export function ChangePinFlow() {
  const [step, setStep] = useState<Step>("current");
  const [pins, setPins] = useState(EMPTY);
  const [problem, setProblem] = useState<string | null>(null);

  const restart = (message: string | null, from: Step) => {
    setProblem(message);
    setTimeout(() => {
      setPins((kept) =>
        from === "current" ? EMPTY : { ...kept, next: "", confirm: "" },
      );
      setStep(from);
    }, 420);
  };

  const change = api.auth.changePin.useMutation({
    onError: (error) => restart(errorMessage(error), "current"),
  });

  const enter = (value: string) => {
    if (change.isPending) return;
    const entered = { ...pins, [step]: value };
    setProblem(null);
    setPins(entered);
    if (value.length < PIN_LENGTH) return;

    if (step === "current") return setStep("next");
    if (step === "next") {
      const weak =
        validatePin(value) ??
        (value === entered.current ? "Choose a different PIN" : null);
      return weak ? restart(weak, "next") : setStep("confirm");
    }
    if (value !== entered.next) {
      return restart("Those did not match. Start again.", "next");
    }
    change.mutate({ currentPin: entered.current, newPin: value });
  };

  if (change.isSuccess) return <PinChanged />;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Change PIN" back="/settings" />

      <div key={step} className="animate-step-in mt-8 flex flex-1 flex-col">
        <h2 className="text-ink text-[22px] leading-tight font-semibold tracking-tight">
          {COPY[step].title}
        </h2>
        <p className="text-ink-soft mt-2 text-[14.5px]">
          {COPY[step].subtitle}
        </p>

        <div className="mt-12 flex flex-1 flex-col items-center justify-center">
          <PinPad
            value={pins[step]}
            onChange={enter}
            length={PIN_LENGTH}
            invalid={Boolean(problem)}
          />
          <p role="status" className="text-danger mt-7 h-5 text-[13px]">
            {change.isPending ? (
              <span className="text-ink-muted">Saving your new PIN</span>
            ) : (
              problem
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function PinChanged() {
  return (
    <div className="animate-step-in flex flex-1 flex-col items-center justify-center text-center">
      <span className="bg-brand grid h-14 w-14 place-items-center rounded-full text-white">
        <Check size={26} strokeWidth={2.6} aria-hidden />
      </span>
      <h1 className="text-ink mt-6 text-[22px] font-semibold tracking-tight">
        PIN changed
      </h1>
      <p className="text-ink-soft mt-2 max-w-[300px] text-[14.5px] leading-relaxed">
        Use your new PIN next time you sign in. Any other devices have been
        signed out.
      </p>
      <Link href="/settings" className={cn(buttonClass(), "mt-8")}>
        Back to settings
      </Link>
    </div>
  );
}
