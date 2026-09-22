"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "~/app/_components/ui/button";
import { PinPad } from "~/app/_components/ui/pin-pad";
import { TextField } from "~/app/_components/ui/text-field";
import { PIN_LENGTH, USERNAME_MIN } from "~/lib/registration";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";

export function SignInFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<"username" | "pin">("username");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const signIn = api.auth.signIn.useMutation({
    onSuccess: () => {
      router.replace("/dashboard");
      router.refresh();
    },
    onError: () => setTimeout(() => setPin(""), 420),
  });

  const ready = username.length >= USERNAME_MIN;
  const busy = signIn.isPending || signIn.isSuccess;

  const enterPin = (next: string) => {
    if (busy) return;
    if (signIn.isError) signIn.reset();
    setPin(next);
    if (next.length === PIN_LENGTH) signIn.mutate({ username, pin: next });
  };

  const backToUsername = () => {
    setPin("");
    signIn.reset();
    setPhase("username");
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-ink-muted hover:text-ink text-[13px] transition-colors"
        >
          GoBank Express
        </Link>
        <Link
          href="/register"
          className="text-brand hover:text-brand-hover text-[13px] font-medium transition-colors"
        >
          Create account
        </Link>
      </header>

      {phase === "username" ? (
        <form
          key="username"
          onSubmit={(event) => {
            event.preventDefault();
            if (ready) setPhase("pin");
          }}
          className="animate-step-in mt-10 flex flex-1 flex-col"
        >
          <Heading
            title="Welcome back"
            subtitle="Sign in with your username and six-digit PIN."
          />

          <div className="mt-8">
            <TextField
              label="Username"
              prefix="@"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              spellCheck={false}
              placeholder="yourusername"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
            />
          </div>

          <div className="flex-1" />

          <Button type="submit" disabled={!ready}>
            Continue
            <ArrowRight size={17} strokeWidth={2} aria-hidden />
          </Button>
          <p className="text-ink-muted mt-5 text-center text-[13px]">
            New to GoBank?{" "}
            <Link
              href="/register"
              className="text-brand hover:text-brand-hover font-medium transition-colors"
            >
              Open an account
            </Link>
          </p>
        </form>
      ) : (
        <div key="pin" className="animate-step-in mt-10 flex flex-1 flex-col">
          <Heading
            title="Enter your PIN"
            subtitle={
              <>
                Signing in as{" "}
                <span className="text-ink font-medium">@{username}</span>
              </>
            }
          />

          <div className="mt-12 flex flex-1 flex-col items-center justify-center">
            <PinPad
              value={pin}
              onChange={enterPin}
              length={PIN_LENGTH}
              invalid={signIn.isError}
            />
            <p role="status" className="mt-7 h-5 text-[13px]">
              {busy ? (
                <span className="text-ink-muted inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="border-line-strong border-t-brand h-3.5 w-3.5 animate-spin rounded-full border-2"
                  />
                  {signIn.isSuccess ? "Opening your account" : "Checking"}
                </span>
              ) : (
                <span className="text-danger">
                  {errorMessage(signIn.error)}
                </span>
              )}
            </p>
          </div>

          <Button variant="ghost" disabled={busy} onClick={backToUsername}>
            Use a different username
          </Button>
        </div>
      )}
    </div>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-ink text-[24px] leading-tight font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-ink-soft text-[14.5px] leading-relaxed">{subtitle}</p>
    </div>
  );
}
