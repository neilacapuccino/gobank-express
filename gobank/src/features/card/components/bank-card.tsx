"use client";

import {
	Check,
	CircleAlert,
	Copy,
	Eye,
	EyeOff,
	Smartphone,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { CardKind } from "../../../../generated/prisma";
import type { CardBrandId } from "../card-brands";
import { cn } from "~/shared/lib/cn";
import { formatAccount } from "~/shared/lib/format";
import { CardBrandLogo } from "./card-brand-logo";

export type { CardKind } from "../../../../generated/prisma";

type CopyStatus = "idle" | "copied" | "error";

type BankCardProps = {
	brand: CardBrandId;
	fullName: string;
	number?: string;
	expiresAt?: Date | string;
	kind?: CardKind;
	hideNumber?: boolean;
	onToggleNumber?: () => void;
	compact?: boolean;
	securityDetails?: ReactNode;
};

const HIDDEN_NUMBER = "•••• •••• •••• ••••";

const COPY_LABEL: Record<CopyStatus, string> = {
	idle: "Copy card number",
	copied: "Card number copied",
	error: "Copy failed. Try again.",
};

const CARD_ICON_BUTTON =
	"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60";

function expiryLabel(expiresAt?: Date | string) {
	const expiry = expiresAt ? new Date(expiresAt) : null;
	if (!expiry || !Number.isFinite(expiry.getTime())) return "••/••";

	const month = String(expiry.getUTCMonth() + 1).padStart(2, "0");
	const year = String(expiry.getUTCFullYear()).slice(-2);

	return `${month}/${year}`;
}

function numberDescription(number: string | undefined, hidden: boolean) {
	if (!number) return "Card number not issued";
	return hidden ? "Card number hidden" : `Card number ${number}`;
}

function CopyIcon({ status }: { status: CopyStatus }) {
	if (status === "copied") return <Check size={14} aria-hidden />;
	if (status === "error") {
		return <CircleAlert size={14} className="text-danger" aria-hidden />;
	}

	return <Copy size={14} aria-hidden />;
}

function CardField({
	label,
	value,
	compact,
	align = "left",
}: {
	label: string;
	value: string;
	compact: boolean;
	align?: "left" | "right";
}) {
	return (
		<div
			className={cn(
				align === "right" ? "shrink-0 text-right" : "min-w-0 flex-1",
			)}
		>
			<p className="text-[9px] tracking-[0.18em] text-white/55 uppercase">
				{label}
			</p>
			<p
				className={cn(
					"truncate font-medium text-white uppercase tabular-nums",
					compact ? "text-[11px]" : "h-7 text-[13px] leading-7",
				)}
			>
				{value}
			</p>
		</div>
	);
}

function KindMark({ kind, compact }: { kind: CardKind; compact: boolean }) {
	if (kind === "virtual") {
		return (
			<Smartphone
				size={25}
				strokeWidth={1.5}
				className="text-white/60"
				aria-hidden
			/>
		);
	}

	return (
		<div className="flex items-center gap-2.5">
			<Chip className={compact ? "h-6 w-8" : "h-8 w-10"} />
			<Contactless className="h-5 w-5 text-white/60" />
		</div>
	);
}

export function BankCard({
	brand,
	fullName,
	number,
	expiresAt,
	kind = "virtual",
	hideNumber = false,
	onToggleNumber,
	compact = false,
	securityDetails,
}: BankCardProps) {
	const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

	const canCopy = !hideNumber && Boolean(number);
	const shownNumber = canCopy && number ? formatAccount(number) : HIDDEN_NUMBER;

	const copyNumber = async () => {
		if (!canCopy || !number) return;

		try {
			await navigator.clipboard.writeText(number);
			setCopyStatus("copied");
		} catch {
			setCopyStatus("error");
		}
	};

	const toggleNumber = () => {
		setCopyStatus("idle");
		onToggleNumber?.();
	};

	return (
		<div
			aria-label={`${kind === "physical" ? "Physical" : "Virtual"} card`}
			className={cn(
				"relative w-full overflow-hidden rounded-2xl bg-[#111113] p-5 ring-1 ring-white/10 ring-inset",
				"shadow-[0_1px_2px_rgba(13,18,32,0.16),0_12px_28px_-12px_rgba(13,18,32,0.45)]",
				compact ? "aspect-[16/9]" : "aspect-[1.586/1]",
			)}
		>
			<div className="relative flex h-full flex-col justify-between">
				<div className="flex items-start justify-between gap-3">
					<KindMark kind={kind} compact={compact} />

					<div className="flex flex-col items-end gap-0.5">
						<span className="text-[11px] font-medium tracking-wide text-white/60">
							GoBank Express
						</span>
						{securityDetails ? (
							<CardBrandLogo id={brand} onDark className="h-6 w-16 shrink-0" />
						) : null}
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-1">
						<p
							aria-label={numberDescription(number, hideNumber)}
							className={cn(
								"min-w-0 font-medium tracking-[0.12em] whitespace-nowrap text-white/90 tabular-nums",
								compact ? "text-[12px]" : "text-[clamp(12px,3.4vw,16px)]",
							)}
						>
							<span aria-hidden>{shownNumber}</span>
						</p>

						<button
							type="button"
							disabled={!canCopy}
							onClick={() => void copyNumber()}
							aria-label={COPY_LABEL[copyStatus]}
							className={cn(CARD_ICON_BUTTON, "disabled:opacity-30")}
						>
							<CopyIcon status={copyStatus} />
						</button>

						{onToggleNumber && number ? (
							<button
								type="button"
								onClick={toggleNumber}
								aria-label={
									hideNumber ? "Show card number" : "Hide card number"
								}
								aria-pressed={!hideNumber}
								className={CARD_ICON_BUTTON}
							>
								{hideNumber ? (
									<Eye size={15} aria-hidden />
								) : (
									<EyeOff size={15} aria-hidden />
								)}
							</button>
						) : null}
					</div>

					{copyStatus === "error" && !hideNumber ? (
						<p role="alert" className="text-danger -mt-2 text-[11px]">
							Could not copy card number. Try again.
						</p>
					) : (
						<span role="status" className="sr-only">
							{copyStatus === "copied" && !hideNumber
								? "Card number copied."
								: ""}
						</span>
					)}

					<div className="flex items-end justify-between gap-4">
						<CardField
							label="Cardholder"
							value={fullName || "YOUR NAME"}
							compact={compact}
						/>
						<CardField
							label="Expires"
							value={expiryLabel(expiresAt)}
							compact={compact}
							align="right"
						/>

						{securityDetails ?? (
							<CardBrandLogo
								id={brand}
								onDark
								className={cn("shrink-0", compact ? "h-6 w-10" : "h-8 w-13")}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function Chip({ className }: { className: string }) {
	return (
		<svg viewBox="0 0 40 31" className={className} aria-hidden>
			<rect width="40" height="31" rx="5" fill="#d8b46a" />
			<g stroke="#9c7c34" strokeWidth="1.1" fill="none">
				<path d="M14 0v31M26 0v31M0 10h14M26 10h14M0 21h14M26 21h14" />
				<rect x="14" y="10" width="12" height="11" rx="2.5" />
			</g>
		</svg>
	);
}

function Contactless({ className }: { className: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			aria-hidden
		>
			<path d="M5 9.5a4.5 4.5 0 0 1 0 5" />
			<path d="M9.5 6.5a9 9 0 0 1 0 11" />
			<path d="M14 3.5a13.5 13.5 0 0 1 0 17" />
		</svg>
	);
}
