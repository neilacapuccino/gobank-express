"use client";

import { ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/shared/ui/button";
import { BackButton } from "~/shared/ui/back-button";
import { PinPad } from "~/shared/ui/pin-pad";
import { TextField } from "~/shared/ui/text-field";
import { PIN_LENGTH, USERNAME_MAX, USERNAME_MIN } from "../auth.rules";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { AuthHeading } from "./auth-heading";
import { GoogleButton } from "./google-button";
import { activateClientSession } from "../session-client";

export function SignInFlow({ googleEnabled }: { googleEnabled: boolean }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [phase, setPhase] = useState<"username" | "pin">("username");
	const [username, setUsername] = useState("");
	const [pin, setPin] = useState("");

	const signIn = api.auth.signIn.useMutation({
		onSuccess: ({ sessionId }) => {
			activateClientSession(sessionId);
			queryClient.clear();
			router.replace("/dashboard");
			router.refresh();
		},
		onError: () => setPin(""),
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
			<header className="flex">
				{phase === "pin" ? (
					<BackButton onClick={backToUsername} disabled={busy} />
				) : (
					<BackButton href="/" />
				)}
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
					<AuthHeading
						title="Log in"
						subtitle="Use your username and six-digit PIN."
					/>

					<div className="mt-8">
						<TextField
							label="Username"
							prefix="@"
							autoFocus
							autoCapitalize="none"
							autoCorrect="off"
							spellCheck={false}
							maxLength={USERNAME_MAX}
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
					{googleEnabled && (
						<div className="mt-5 flex flex-col gap-4">
							<div className="text-ink-muted flex items-center gap-3 text-xs">
								<span aria-hidden className="bg-line h-px flex-1" />
								<span>or</span>
								<span aria-hidden className="bg-line h-px flex-1" />
							</div>
							<GoogleButton />
						</div>
					)}
				</form>
			) : (
				<div key="pin" className="animate-step-in mt-10 flex flex-1 flex-col">
					<AuthHeading
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
