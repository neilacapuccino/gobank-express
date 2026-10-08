"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
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
	const rows = [
		{ label: "Username", value: "@" + draft.username },
		{
			label: "PIN",
			value: <SecretValue label="PIN" value={draft.pin} disabled={pending} />,
		},
		{ label: "Card", value: getBrand(card.brand).name },
		{
			label: "CVV",
			value: <SecretValue label="CVV" value={card.cvv} disabled={pending} />,
		},
		{ label: "Full name", value: draft.fullName.trim() },
		{
			label: "Mobile",
			value: draft.mobile.trim() ? formatMobile(draft.mobile) : "",
		},
	];
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
					expiresAt={card.expiresAt}
					compact
				/>
				<button
					type="button"
					disabled={pending}
					onClick={() => setShowNumber((current) => !current)}
					aria-pressed={showNumber}
					className="text-ink-soft enabled:hover:text-ink focus-visible:outline-brand mt-2 ml-auto flex min-h-10 items-center justify-center gap-2 rounded-lg px-1 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-45"
				>
					{showNumber ? (
						<EyeOff size={16} aria-hidden />
					) : (
						<Eye size={16} aria-hidden />
					)}
					{showNumber ? "Hide number" : "Show number"}
				</button>
			</div>
			<dl className="divide-line border-line mt-4 divide-y rounded-xl border">
				{rows.map((row) => (
					<div
						key={row.label}
						className="flex items-center justify-between gap-4 px-4 py-3"
					>
						<dt className="text-ink-muted shrink-0 text-[13px]">{row.label}</dt>
						<dd
							className={cn(
								"flex min-w-0 items-center gap-3 text-[14px]",
								row.value ? "text-ink font-medium" : "text-ink-faint",
							)}
						>
							{typeof row.value === "string" ? (
								<span className="truncate tabular-nums">
									{row.value || "Not set"}
								</span>
							) : (
								row.value
							)}
						</dd>
					</div>
				))}
			</dl>
			<label className="mt-6 flex cursor-pointer items-start gap-3">
				<input
					type="checkbox"
					checked={accepted}
					disabled={pending}
					onChange={(event) => setAccepted(event.target.checked)}
					className="peer sr-only"
				/>
				<span
					className={cn(
						"peer-focus-visible:ring-brand/40 mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
						accepted ? "border-brand bg-brand" : "border-line-strong",
					)}
				>
					{accepted && (
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
					)}
				</span>
				<span className="text-ink-soft text-[13px] leading-relaxed">
					I agree to the Terms of Service and Privacy Policy.
				</span>
			</label>
			<div className="flex-1" />
			{error && (
				<div
					role="alert"
					className="bg-danger-soft mt-6 rounded-xl px-4 py-3 text-[13px]"
				>
					<p className="text-danger">{error}</p>
					<button
						type="button"
						disabled={pending}
						onClick={onRefreshCard}
						className="text-ink mt-2 min-h-9 font-medium underline"
					>
						Refresh card details
					</button>
				</div>
			)}
			<div className="mt-8 flex flex-col gap-1.5">
				<Button disabled={!accepted || pending} onClick={onSubmit}>
					{pending && (
						<span
							aria-hidden
							className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
						/>
					)}
					{pending ? "Opening your account" : "Create my account"}
				</Button>
				<Button variant="ghost" disabled={pending} onClick={onBack}>
					Back
				</Button>
			</div>
		</div>
	);
}

function SecretValue({
	label,
	value,
	disabled,
}: {
	label: "PIN" | "CVV";
	value: string;
	disabled: boolean;
}) {
	const [visible, setVisible] = useState(false);
	return (
		<>
			<span className="tabular-nums">
				{visible ? value : "•".repeat(value.length)}
			</span>
			<button
				type="button"
				disabled={disabled}
				onClick={() => setVisible((current) => !current)}
				aria-label={visible ? `Hide ${label}` : `Show ${label}`}
				aria-pressed={visible}
				className="text-ink-muted enabled:hover:text-ink focus-visible:outline-brand flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 disabled:opacity-45"
			>
				{visible ? (
					<EyeOff size={16} aria-hidden />
				) : (
					<Eye size={16} aria-hidden />
				)}
			</button>
		</>
	);
}
