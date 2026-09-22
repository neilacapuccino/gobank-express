"use client";

import Link from "next/link";
import { useReducer, useState } from "react";
import { StepBar } from "~/app/_components/ui/step-bar";
import { EMPTY_DRAFT, type RegistrationDraft } from "~/lib/registration";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { StepCard } from "./step-card";
import { StepDetails } from "./step-details";
import { StepIdentity } from "./step-identity";
import { StepReview } from "./step-review";
import { AccountReady } from "./account-ready";

const TOTAL_STEPS = 4;

type Action = { type: "patch"; patch: Partial<RegistrationDraft> };

function draftReducer(state: RegistrationDraft, action: Action) {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.patch };
  }
}

export function RegistrationFlow() {
  const [draft, dispatch] = useReducer(draftReducer, EMPTY_DRAFT);
  const [step, setStep] = useState(1);
  const register = api.auth.register.useMutation();

  const patch = (next: Partial<RegistrationDraft>) =>
    dispatch({ type: "patch", patch: next });

  if (register.data) {
    return (
      <AccountReady
        draft={draft}
        accountNumber={register.data.accountNumber}
        card={register.data.card}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-ink-muted hover:text-ink text-[13px] transition-colors"
          >
            GoBank Express
          </Link>
          <span className="text-ink-muted text-[12px] tabular-nums">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
        <StepBar current={step} total={TOTAL_STEPS} />
      </header>

      <div key={step} className="animate-step-in mt-10 flex flex-1 flex-col">
        {step === 1 ? (
          <StepIdentity
            username={draft.username}
            onUsernameChange={(username) => patch({ username })}
            onComplete={(pin) => {
              patch({ pin });
              setStep(2);
            }}
          />
        ) : null}

        {step === 2 ? (
          <StepCard
            brand={draft.brand}
            holder={draft.fullName.trim().toUpperCase() || "YOUR NAME"}
            onBrandChange={(brand) => patch({ brand })}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        ) : null}

        {step === 3 ? (
          <StepDetails
            fullName={draft.fullName}
            mobile={draft.mobile}
            email={draft.email}
            googleLinked={draft.googleLinked}
            onChange={patch}
            onNext={() => setStep(4)}
            onSkip={() => {
              patch({ fullName: "", mobile: "", email: "" });
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        ) : null}

        {step === 4 ? (
          <StepReview
            draft={draft}
            pending={register.isPending}
            error={errorMessage(register.error)}
            onSubmit={() =>
              register.mutate({
                username: draft.username,
                pin: draft.pin,
                brand: draft.brand,
                fullName: draft.fullName,
                mobile: draft.mobile,
                email: draft.email,
              })
            }
            onBack={() => setStep(3)}
          />
        ) : null}
      </div>
    </div>
  );
}
