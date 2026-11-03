import { ChevronRight } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { ProfileAvatar } from "~/features/account/components/profile-avatar";
import { isPesoInput } from "~/shared/lib/amount-input";
import { cn } from "~/shared/lib/cn";
import { BackButton } from "~/shared/ui/back-button";
import { Button } from "~/shared/ui/button";
import { TransactionSummary } from "~/shared/ui/transaction-summary";
import type { Recipient } from "~/shared/hooks/use-recipient-search";

export type MoneyStep = "recipient" | "amount" | "review";

const STEP_NUMBER: Record<MoneyStep, number> = {
	recipient: 1,
	amount: 2,
	review: 3,
};

const NO_MATCH_FROM_SERVER = "No GoBank account matches that";

const INPUT_CLASS =
	"border-line-strong bg-surface-sunken text-ink focus:border-brand w-full rounded-xl border px-4 text-[16px] outline-none";

const submitWith = (action: () => void) => (event: FormEvent) => {
	event.preventDefault();
	action();
};

export function MoneyFormHeader({
	title,
	step,
	disabled,
	onBack,
}: {
	title: string;
	step: MoneyStep;
	disabled?: boolean;
	onBack: () => void;
}) {
	return (
		<header className="relative flex h-14 shrink-0 items-center justify-center">
			{step === "recipient" ? (
				<BackButton href="/dashboard" className="absolute left-0" />
			) : (
				<BackButton
					onClick={onBack}
					disabled={disabled}
					className="absolute left-0"
				/>
			)}

			<div className="text-center">
				<h1 className="text-ink text-[16px] font-semibold">{title}</h1>
				<p className="text-ink-muted mt-1 text-[12px]">
					Step {STEP_NUMBER[step]} of 3
				</p>
			</div>
		</header>
	);
}

export function FormError({ error }: { error?: string | null }) {
	if (!error) return null;

	return (
		<p role="alert" className="text-danger mt-3 text-[13px] leading-relaxed">
			{error}
		</p>
	);
}

export function RecipientIdentity({ recipient }: { recipient: Recipient }) {
	return (
		<div className="flex min-w-0 items-center gap-3">
			<ProfileAvatar
				photo={recipient.profilePhoto}
				size={44}
				className="shrink-0"
			/>

			<div className="min-w-0">
				<p className="text-ink truncate text-[14px] font-medium">
					{recipient.fullName || recipient.username}
				</p>
				<p className="text-ink-muted truncate text-[12px]">
					@{recipient.username}
				</p>
			</div>
		</div>
	);
}

function RecipientError({
	error,
	loading,
	onRetry,
}: {
	error: string;
	loading: boolean;
	onRetry: () => void;
}) {
	const message =
		error === NO_MATCH_FROM_SERVER ? "No matching account." : error;

	return (
		<p role="alert" className="text-danger mt-3 text-[13px] leading-relaxed">
			{message}{" "}
			<button
				type="button"
				onClick={onRetry}
				disabled={loading}
				className="text-danger focus-visible:outline-danger rounded-sm font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				Try again
			</button>
		</p>
	);
}

function RecipientMatch({
	recipient,
	loading,
	onContinue,
}: {
	recipient: Recipient;
	loading: boolean;
	onContinue: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onContinue}
			disabled={loading}
			className="border-line hover:bg-surface-sunken mt-5 flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-60"
		>
			<RecipientIdentity recipient={recipient} />
			<ChevronRight size={18} className="text-ink-muted shrink-0" aria-hidden />
		</button>
	);
}

export function RecipientPicker({
	label = "Recipient",
	value,
	loading,
	recipient,
	error,
	onChange,
	onContinue,
	onRetry,
	children,
}: {
	label?: string;
	value: string;
	loading: boolean;
	recipient: Recipient | null;
	error: string | null;
	onChange: (value: string) => void;
	onContinue: () => void;
	onRetry: () => void;
	children?: ReactNode;
}) {
	return (
		<form
			className="flex flex-1 flex-col pt-8"
			onSubmit={submitWith(onContinue)}
		>
			<label
				htmlFor="recipient"
				className="text-ink mb-2 text-[14px] font-medium"
			>
				{label}
			</label>
			<input
				id="recipient"
				value={value}
				autoComplete="off"
				autoCapitalize="none"
				spellCheck={false}
				aria-invalid={Boolean(error)}
				aria-describedby="recipient-help"
				onChange={(event) => onChange(event.target.value)}
				className={cn(INPUT_CLASS, "h-13")}
			/>
			<p
				id="recipient-help"
				className="text-ink-muted mt-2 text-[12px] leading-relaxed"
			>
				Username, linked Gmail, account number or mobile.
			</p>

			{error ? (
				<RecipientError error={error} loading={loading} onRetry={onRetry} />
			) : null}

			{!error && recipient ? (
				<RecipientMatch
					recipient={recipient}
					loading={loading}
					onContinue={onContinue}
				/>
			) : null}

			{children}

			<div className="mt-auto pt-8">
				<Button type="submit" disabled={!recipient || loading}>
					{loading ? "Finding recipient…" : "Continue"}
				</Button>
			</div>
		</form>
	);
}

export function AmountFields({
	recipient,
	amount,
	note,
	hint,
	error,
	canContinue,
	onAmountChange,
	onNoteChange,
	onContinue,
}: {
	recipient: Recipient;
	amount: string;
	note: string;
	hint: string;
	error: string | null;
	canContinue: boolean;
	onAmountChange: (value: string) => void;
	onNoteChange: (value: string) => void;
	onContinue: () => void;
}) {
	const acceptAmount = (value: string) => {
		if (isPesoInput(value)) onAmountChange(value);
	};

	return (
		<form
			className="flex flex-1 flex-col gap-6 pt-7"
			onSubmit={submitWith(onContinue)}
		>
			<div className="border-line rounded-2xl border p-4">
				<RecipientIdentity recipient={recipient} />
			</div>

			<div>
				<label
					htmlFor="amount"
					className="text-ink mb-2 block text-[14px] font-medium"
				>
					Amount
				</label>
				<div className="border-line-strong bg-surface-sunken focus-within:border-brand flex items-center rounded-xl border px-4">
					<span aria-hidden className="text-ink-muted text-[24px]">
						₱
					</span>
					<input
						id="amount"
						inputMode="decimal"
						autoComplete="off"
						placeholder="0.00"
						value={amount}
						aria-invalid={Boolean(error)}
						aria-describedby="amount-limit"
						onChange={(event) => acceptAmount(event.target.value)}
						className="text-ink placeholder:text-ink-faint h-20 min-w-0 flex-1 bg-transparent px-3 text-[28px] font-medium tabular-nums outline-none"
					/>
				</div>
				<p
					id="amount-limit"
					role={error ? "alert" : undefined}
					className={cn(
						"mt-2 text-[12px]",
						error ? "text-danger" : "text-ink-muted",
					)}
				>
					{error ?? hint}
				</p>
			</div>

			<div>
				<label
					htmlFor="note"
					className="text-ink mb-2 block text-[14px] font-medium"
				>
					Note <span className="text-ink-muted font-normal">(optional)</span>
				</label>
				<textarea
					id="note"
					autoComplete="off"
					value={note}
					maxLength={120}
					rows={3}
					onChange={(event) => onNoteChange(event.target.value)}
					className={cn(INPUT_CLASS, "resize-none py-3")}
				/>
			</div>

			<div className="mt-auto pt-2">
				<Button type="submit" disabled={!canContinue}>
					Review
				</Button>
			</div>
		</form>
	);
}

export function MoneySummary({
	recipient,
	amount,
	note,
	details = [],
}: {
	recipient: Recipient;
	amount: number;
	note?: string;
	details?: { label: string; value: string }[];
}) {
	return (
		<TransactionSummary amount={amount} details={details}>
			<RecipientIdentity recipient={recipient} />

			{note ? (
				<p className="text-ink-soft mt-4 text-[14px] break-words">{note}</p>
			) : null}
		</TransactionSummary>
	);
}
