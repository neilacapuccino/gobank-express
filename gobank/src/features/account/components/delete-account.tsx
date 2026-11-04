"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { PIN_LENGTH } from "~/features/auth/auth.rules";
import { clearClientSession } from "~/features/auth/session.client";
import { Button } from "~/shared/ui/button";
import { TextField } from "~/shared/ui/text-field";
import { errorMessage } from "~/trpc/error-message";
import { api } from "~/trpc/react";

type DeleteAccountProps = {
	disabled: boolean;
	onActiveChange: (active: boolean) => void;
};

export function DeleteAccount({
	disabled,
	onActiveChange,
}: DeleteAccountProps) {
	const queryClient = useQueryClient();
	const [confirming, setConfirming] = useState(false);
	const [pin, setPin] = useState("");
	const headingId = useId();
	const warningId = useId();
	const focusPin = useCallback((form: HTMLFormElement | null) => {
		form?.querySelector("input")?.focus();
	}, []);

	const deletion = api.account.deleteAccount.useMutation({
		onSuccess: () => {
			setPin("");
			clearClientSession();
			queryClient.clear();
			window.location.replace("/signin");
		},
		onError: () => setPin(""),
	});
	const busy = deletion.isPending || deletion.isSuccess;
	const validPin = new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);

	const start = () => {
		if (disabled) return;
		setConfirming(true);
		onActiveChange(true);
	};

	const cancel = () => {
		if (busy) return;
		setConfirming(false);
		setPin("");
		deletion.reset();
		onActiveChange(false);
	};

	return (
		<section
			aria-label="Delete account"
			className="border-line mt-6 border-t pt-6"
		>
			{confirming ? (
				<form
					ref={focusPin}
					aria-labelledby={headingId}
					aria-describedby={warningId}
					aria-busy={busy}
					onSubmit={(event) => {
						event.preventDefault();
						if (!disabled && !busy && validPin) deletion.mutate({ pin });
					}}
					className="bg-danger-soft border-danger/25 flex flex-col gap-4 rounded-2xl border p-4"
				>
					<div>
						<h2 id={headingId} className="text-ink text-[16px] font-semibold">
							Delete your account?
						</h2>
						<p
							id={warningId}
							className="text-ink-soft mt-2 text-[13px] leading-relaxed"
						>
							This permanently deletes your account, remaining balance, savings,
							rewards, cards and transaction history. You cannot undo this.
						</p>
					</div>
					<TextField
						label="Current PIN"
						type="password"
						inputMode="numeric"
						pattern={`[0-9]{${PIN_LENGTH}}`}
						minLength={PIN_LENGTH}
						maxLength={PIN_LENGTH}
						required
						value={pin}
						disabled={disabled || busy}
						onChange={(event) => {
							setPin(
								event.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH),
							);
							if (deletion.isError) deletion.reset();
						}}
						hint="Enter the six-digit PIN you use to sign in."
					/>
					{deletion.error ? (
						<p role="alert" className="text-danger text-[13px]">
							{errorMessage(deletion.error)}
						</p>
					) : null}
					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							disabled={busy}
							onClick={cancel}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={disabled || busy || !validPin}
							className="bg-danger-strong! focus-visible:ring-danger-strong/40! enabled:hover:bg-danger-strong-hover! enabled:active:bg-danger-strong-hover! disabled:bg-danger-strong! text-white! disabled:text-white/65!"
						>
							{busy ? "Deleting…" : "Delete account"}
						</Button>
					</div>
				</form>
			) : (
				<Button
					type="button"
					variant="ghost"
					disabled={disabled}
					onClick={start}
					className="text-danger! enabled:hover:bg-danger-soft"
				>
					<Trash2 size={16} strokeWidth={1.9} aria-hidden />
					Delete account
				</Button>
			)}
		</section>
	);
}
