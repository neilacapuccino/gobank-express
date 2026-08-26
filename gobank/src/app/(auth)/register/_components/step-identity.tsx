"use client";

import { useEffect, useState } from "react";
import { Button } from "~/app/_components/ui/button";
import { PinPad } from "~/app/_components/ui/pin-pad";
import { TextField } from "~/app/_components/ui/text-field";
import {
  PIN_LENGTH,
  validatePin,
  validateUsername,
  type UsernameCheck,
} from "~/lib/registration";

type Phase = "username" | "pin" | "confirm";

type StepIdentityProps = {
  username: string;
  onUsernameChange: (value: string) => void;
  onComplete: (pin: string) => void;
};

export function StepIdentity({
  username,
  onUsernameChange,
  onComplete,
}: StepIdentityProps) {
  const [phase, setPhase] = useState<Phase>("username");
  const [check, setCheck] = useState<UsernameCheck>({ state: "idle" });
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const result = validateUsername(username);
    if (result.state !== "available") {
      setCheck(result);
      return;
    }
    setCheck({ state: "checking" });
    const timer = setTimeout(() => setCheck({ state: "available" }), 380);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (phase !== "pin" || pin.length !== PIN_LENGTH) return;
    const problem = validatePin(pin);
    if (problem) {
      setPinError(problem);
      setInvalid(true);
      const timer = setTimeout(() => {
        setPin("");
        setInvalid(false);
      }, 420);
      return () => clearTimeout(timer);
    }
    setPinError(null);
    const timer = setTimeout(() => setPhase("confirm"), 200);
    return () => clearTimeout(timer);
  }, [pin, phase]);

  useEffect(() => {
    if (phase !== "confirm" || confirm.length !== PIN_LENGTH) return;
    if (confirm !== pin) {
      setPinError("Those did not match. Start again.");
      setInvalid(true);
      const timer = setTimeout(() => {
        setPin("");
        setConfirm("");
        setInvalid(false);
        setPhase("pin");
      }, 600);
      return () => clearTimeout(timer);
    }
    setPinError(null);
    const timer = setTimeout(() => onComplete(pin), 220);
    return () => clearTimeout(timer);
  }, [confirm, pin, phase, onComplete]);

  if (phase === "username") {
    return (
      <div className="flex flex-1 flex-col">
        <Heading
          title="Pick your username"
          subtitle="This is how you sign in, and how friends find you."
        />

        <div className="mt-8">
          <TextField
            label="Username"
            prefix="@"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="yourusername"
            value={username}
            onChange={(event) =>
              onUsernameChange(
                event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              )
            }
            error={
              check.state === "invalid" || check.state === "taken"
                ? check.message
                : null
            }
            hint="3 to 20 characters. Letters, numbers and underscore."
            trailing={<CheckState check={check} />}
          />
        </div>

        <div className="flex-1" />

        <Button
          disabled={check.state !== "available"}
          onClick={() => setPhase("pin")}
        >
          Continue
        </Button>
      </div>
    );
  }

  const confirming = phase === "confirm";

  return (
    <div key={phase} className="flex flex-1 flex-col">
      <Heading
        title={confirming ? "Confirm your PIN" : "Create your PIN"}
        subtitle={
          confirming
            ? "Enter the same six digits again."
            : "Six digits. You will use this every time you sign in."
        }
      />

      <div className="mt-12 flex flex-1 flex-col items-center justify-center">
        <PinPad
          value={confirming ? confirm : pin}
          onChange={confirming ? setConfirm : setPin}
          length={PIN_LENGTH}
          invalid={invalid}
        />
        <p className="text-danger mt-7 h-5 text-[13px]">{pinError}</p>
      </div>

      <Button
        variant="ghost"
        onClick={() => {
          setPinError(null);
          if (confirming) {
            setConfirm("");
            setPhase("pin");
          } else {
            setPin("");
            setPhase("username");
          }
        }}
      >
        Back
      </Button>
    </div>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-ink text-[24px] leading-tight font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-ink-soft text-[14.5px] leading-relaxed">{subtitle}</p>
    </div>
  );
}

function CheckState({ check }: { check: UsernameCheck }) {
  if (check.state === "checking") {
    return (
      <span className="border-line-strong block h-4 w-4 rounded-full border-2" />
    );
  }
  if (check.state === "available") {
    return (
      <span className="bg-brand grid h-5 w-5 place-items-center rounded-full text-white">
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
      </span>
    );
  }
  return null;
}
