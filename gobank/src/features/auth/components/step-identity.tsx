"use client";

import { useState } from "react";
import { Button } from "~/shared/ui/button";
import { PinPad } from "~/shared/ui/pin-pad";
import { TextField } from "~/shared/ui/text-field";
import {
	PIN_LENGTH,
	USERNAME_MAX,
	validatePin,
	type UsernameCheck,
} from "../auth.rules";
import { useUsernameCheck } from "../hooks/use-username-check";
import { AuthHeading } from "./auth-heading";

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
	const [pin, setPin] = useState("");
	const [confirm, setConfirm] = useState("");
	const [pinError, setPinError] = useState<string | null>(null);
	const { check, retry } = useUsernameCheck(username);

	const enterPin = (value: string) => {
		setPinError(null);
		setPin(value);
		if (value.length < PIN_LENGTH) return;
		const problem = validatePin(value);
		if (problem) {
			setPinError(problem);
			setPin("");
			return;
		}
		setConfirm("");
		setPhase("confirm");
	};

	const confirmPin = (value: string) => {
		setPinError(null);
		setConfirm(value);
		if (value.length < PIN_LENGTH) return;
		if (value !== pin) {
			setPinError("Those did not match. Start again.");
			setPin("");
			setConfirm("");
			setPhase("pin");
			return;
		}
		onComplete(pin);
	};

	if (phase === "username") {
		return (
			<div className="flex flex-1 flex-col">
				<AuthHeading
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
						maxLength={USERNAME_MAX}
						value={username}
						onChange={(event) =>
							onUsernameChange(
								event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
							)
						}
						error={
							check.state === "invalid" ||
							check.state === "taken" ||
							check.state === "error"
								? check.message
								: null
						}
						hint="3 to 20 characters. Letters, numbers and underscore."
						trailing={<CheckState check={check} />}
					/>
					{check.state === "error" ? (
						<Button
							variant="ghost"
							className="mt-2"
							onClick={() => void retry()}
						>
							Try again
						</Button>
					) : null}
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
			<AuthHeading
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
					onChange={confirming ? confirmPin : enterPin}
					length={PIN_LENGTH}
					invalid={Boolean(pinError)}
				/>
				<p className="text-danger mt-7 h-5 text-[13px]">{pinError}</p>
			</div>

			<Button
				variant="ghost"
				onClick={() => {
					setPinError(null);
					setPin("");
					setConfirm("");
					setPhase(confirming ? "pin" : "username");
				}}
			>
				Back
			</Button>
		</div>
	);
}

function CheckState({ check }: { check: UsernameCheck }) {
	if (check.state === "checking") {
		return (
			<span
				aria-label="Checking username"
				className="border-line-strong border-t-brand block h-4 w-4 animate-spin rounded-full border-2"
			/>
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
