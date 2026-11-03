"use client";

import { ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "~/shared/ui/button";
import { BackButton } from "~/shared/ui/back-button";
import { PinPad } from "~/shared/ui/pin-pad";
import { TextField } from "~/shared/ui/text-field";
import {
	cleanUsernameInput,
	PIN_LENGTH,
	USERNAME_MAX,
	USERNAME_MIN,
} from "../auth.rules";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";
import { AuthHeading } from "./auth-heading";
import { GoogleButton } from "./google-button";
import { OrDivider } from "./or-divider";
import { activateClientSession } from "../session.client";

type SignInFlowProps = {
	googleEnabled: boolean;
	googleUsername?: string;
};

function UsernameStep({
	username,
	googleEnabled,
	onChange,
	onContinue,
}: {
	username: string;
	googleEnabled: boolean;
	onChange: (username: string) => void;
	onContinue: () => void;
}) {
	const ready = username.length >= USERNAME_MIN;

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				if (ready) onContinue();
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
					onChange={(event) => onChange(cleanUsernameInput(event.target.value))}
				/>
			</div>

			<div className="flex-1" />

			<Button type="submit" disabled={!ready}>
				Continue
				<ArrowRight size={17} strokeWidth={2} aria-hidden />
			</Button>

			{googleEnabled ? (
				<div className="mt-5 flex flex-col gap-4">
					<OrDivider className="text-ink-muted text-xs" />
					<GoogleButton />
				</div>
			) : null}
		</form>
	);
}

function PinStatus({
	busy,
	opening,
	error,
}: {
	busy: boolean;
	opening: boolean;
	error: string | null;
}) {
	let content: ReactNode = <span className="text-danger">{error}</span>;

	if (busy) {
		content = (
			<span className="text-ink-muted inline-flex items-center gap-2">
				<span
					aria-hidden
					className="border-line-strong border-t-brand h-3.5 w-3.5 animate-spin rounded-full border-2"
				/>
				{opening ? "Opening your account" : "Checking"}
			</span>
		);
	}

	return (
		<p role="status" className="mt-7 h-5 text-[13px]">
			{content}
		</p>
	);
}

export function SignInFlow({ googleEnabled, googleUsername }: SignInFlowProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const viaGoogle = Boolean(googleUsername);

	const [phase, setPhase] = useState<"username" | "pin">(
		viaGoogle ? "pin" : "username",
	);
	const [username, setUsername] = useState(googleUsername ?? "");
	const [pin, setPin] = useState("");

	const finishSignIn = ({ sessionId }: { sessionId: string }) => {
		activateClientSession(sessionId);
		queryClient.clear();
		router.replace("/dashboard");
		router.refresh();
	};

	const clearPin = () => setPin("");

	const manualSignIn = api.auth.signIn.useMutation({
		onSuccess: finishSignIn,
		onError: clearPin,
	});
	const googleSignIn = api.auth.signInWithGooglePin.useMutation({
		onSuccess: finishSignIn,
		onError: clearPin,
	});
	const signIn = viaGoogle ? googleSignIn : manualSignIn;

	const busy = signIn.isPending || signIn.isSuccess;

	const enterPin = (next: string) => {
		if (busy) return;
		if (signIn.isError) signIn.reset();

		setPin(next);
		if (next.length < PIN_LENGTH) return;

		if (viaGoogle) {
			googleSignIn.mutate({ pin: next });
		} else {
			manualSignIn.mutate({ username, pin: next });
		}
	};

	const backToUsername = () => {
		setPin("");
		signIn.reset();

		if (viaGoogle) {
			router.replace("/signin");
			return;
		}

		setPhase("username");
	};

	if (phase === "username") {
		return (
			<div className="flex flex-1 flex-col">
				<header className="flex">
					<BackButton href="/" />
				</header>

				<UsernameStep
					username={username}
					googleEnabled={googleEnabled}
					onChange={setUsername}
					onContinue={() => setPhase("pin")}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col">
			<header className="flex">
				<BackButton onClick={backToUsername} disabled={busy} />
			</header>

			<div className="animate-step-in mt-10 flex flex-1 flex-col">
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
					<PinStatus
						busy={busy}
						opening={signIn.isSuccess}
						error={errorMessage(signIn.error)}
					/>
				</div>

				<Button variant="ghost" disabled={busy} onClick={backToUsername}>
					{viaGoogle ? "Use username instead" : "Use a different username"}
				</Button>
			</div>
		</div>
	);
}
