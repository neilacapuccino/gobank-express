"use client";

import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "~/shared/ui/button";
import { getBrand } from "~/features/card/card-brands";
import type { RegistrationDraft } from "../auth.rules";
import { formatMobile } from "~/shared/lib/contact";
import { cn } from "~/shared/lib/cn";
import { BankCard } from "~/features/card/components/bank-card";
import type { RouterOutputs } from "~/trpc/react";
import { AuthHeading } from "./auth-heading";

type StepReviewProps = {
	draft: RegistrationDraft;
	card: RouterOutputs["auth"]["prepareCard"];
	pending: boolean;
	error: string | null;
	onSubmit: () => void;
	onBack: () => void;
	onRefreshCard: () => void;
};

type CopyStatus = "idle" | "copied" | "error";

const SMALL_ICON_BUTTON =
	"text-ink-muted enabled:hover:text-ink focus-visible:outline-brand flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 disabled:opacity-45";

function SecretValue({
	label,
	value,
	disabled,
	copyable = false,
}: {
	label: string;
	value: string;
	disabled: boolean;
	copyable?: boolean;
}) {
	const [visible, setVisible] = useState(false);
	const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

	const toggle = () => {
		setVisible((current) => !current);
		setCopyStatus("idle");
	};

	const copy = async () => {
		if (!visible) return;

		try {
			await navigator.clipboard.writeText(value);
			setCopyStatus("copied");
		} catch {
			setCopyStatus("error");
		}
	};

	return (
		<div className="flex flex-col items-end">
			<div className="flex items-center gap-1.5">
				<span className="tabular-nums">
					{visible ? value : "•".repeat(value.length)}
				</span>

				{copyable ? (
					<button
						type="button"
						disabled={disabled || !visible}
						onClick={() => void copy()}
						aria-label={
							copyStatus === "copied" ? `${label} copied` : `Copy ${label}`
						}
						className={SMALL_ICON_BUTTON}
					>
						{copyStatus === "copied" ? (
							<Check size={14} aria-hidden />
						) : (
							<Copy size={14} aria-hidden />
						)}
					</button>
				) : null}

				<button
					type="button"
					disabled={disabled}
					onClick={toggle}
					aria-label={visible ? `Hide ${label}` : `Show ${label}`}
					aria-pressed={visible}
					className={SMALL_ICON_BUTTON}
				>
					{visible ? (
						<EyeOff size={16} aria-hidden />
					) : (
						<Eye size={16} aria-hidden />
					)}
				</button>
			</div>

			{copyStatus === "error" ? (
				<p role="alert" className="text-danger text-right text-[12px]">
					Could not copy {label}. Try again.
				</p>
			) : (
				<span role="status" className="sr-only">
					{copyStatus === "copied" ? `${label} copied.` : ""}
				</span>
			)}
		</div>
	);
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
	const isText = typeof value === "string";
	const empty = isText && value === "";

	return (
		<div className="flex items-center justify-between gap-4 px-4 py-3">
			<dt className="text-ink-muted shrink-0 text-[13px]">{label}</dt>
			<dd
				className={cn(
					"flex min-w-0 items-center gap-3 text-[14px]",
					empty ? "text-ink-faint" : "text-ink font-medium",
				)}
			>
				{isText ? (
					<span className="truncate tabular-nums">{value || "Not set"}</span>
				) : (
					value
				)}
			</dd>
		</div>
	);
}

function TermsCheckbox({
	checked,
	disabled,
	onChange,
}: {
	checked: boolean;
	disabled: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<label className="mt-6 flex cursor-pointer items-start gap-3">
			<input
				type="checkbox"
				checked={checked}
				disabled={disabled}
				onChange={(event) => onChange(event.target.checked)}
				className="peer sr-only"
			/>
			<span
				className={cn(
					"peer-focus-visible:ring-brand/40 mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
					checked ? "border-brand bg-brand" : "border-line-strong",
				)}
			>
				{checked ? (
					<svg
						width="11"
						height="11"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#ffffff"
						strokeWidth="3.4"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden
					>
						<path d="m5 13 4 4L19 7" />
					</svg>
				) : null}
			</span>
			<span className="text-ink-soft text-[13px] leading-relaxed">
				I agree to the Terms of Service and Privacy Policy.
			</span>
		</label>
	);
}

function CardError({
	error,
	disabled,
	onRefresh,
}: {
	error: string;
	disabled: boolean;
	onRefresh: () => void;
}) {
	return (
		<div
			role="alert"
			className="bg-danger-soft mt-6 rounded-xl px-4 py-3 text-[13px]"
		>
			<p className="text-danger">{error}</p>
			<button
				type="button"
				disabled={disabled}
				onClick={onRefresh}
				className="text-ink mt-2 min-h-9 font-medium underline"
			>
				Refresh card details
			</button>
		</div>
	);
}

export function StepReview({
	draft,
	card,
	pending,
	error,
	onSubmit,
	onBack,
	onRefreshCard,
}: StepReviewProps) {
	const [accepted, setAccepted] = useState(false);
	const [showNumber, setShowNumber] = useState(true);

	const mobile = draft.mobile.trim() ? formatMobile(draft.mobile) : "";

	return (
		<div className="flex flex-1 flex-col">
			<AuthHeading
				title="Review your account"
				subtitle="Check your details before confirming."
			/>

			<div className="mt-7">
				<BankCard
					brand={card.brand}
					fullName={draft.fullName.trim()}
					number={card.number}
					hideNumber={!showNumber}
					onToggleNumber={() => setShowNumber((current) => !current)}
					expiresAt={card.expiresAt}
					kind="physical"
					compact
				/>
			</div>

			<dl className="divide-line border-line mt-4 divide-y rounded-xl border">
				<ReviewRow label="Username" value={`@${draft.username}`} />
				<ReviewRow
					label="PIN"
					value={
						<SecretValue label="PIN" value={draft.pin} disabled={pending} />
					}
				/>
				<ReviewRow label="Card" value={getBrand(card.brand).name} />
				<ReviewRow
					label="CVV"
					value={
						<SecretValue
							label="CVV"
							value={card.cvv}
							disabled={pending}
							copyable
						/>
					}
				/>
				<ReviewRow label="Full name" value={draft.fullName.trim()} />
				<ReviewRow label="Mobile" value={mobile} />
			</dl>

			<TermsCheckbox
				checked={accepted}
				disabled={pending}
				onChange={setAccepted}
			/>

			<div className="flex-1" />

			{error ? (
				<CardError error={error} disabled={pending} onRefresh={onRefreshCard} />
			) : null}

			<div className="mt-8 flex flex-col gap-1.5">
				<Button disabled={!accepted || pending} onClick={onSubmit}>
					{pending ? (
						<span
							aria-hidden
							className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
						/>
					) : null}
					{pending ? "Opening your account" : "Create my account"}
				</Button>
				<Button variant="ghost" disabled={pending} onClick={onBack}>
					Back
				</Button>
			</div>
		</div>
	);
}
