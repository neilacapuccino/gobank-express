"use client";

import { Check, CircleAlert, Copy, Smartphone } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { CardKind } from "../../../../generated/prisma";
import type { IssuedCardBrandId } from "../card-brands";
import { cn } from "~/shared/lib/cn";
import { formatAccount } from "~/shared/lib/format";
import { CardBrandLogo } from "./card-brand-logo";

export type { CardKind } from "../../../../generated/prisma";

type BankCardProps = {
	brand: IssuedCardBrandId;
	fullName: string;
	number: string;
	expiresAt: Date | string;
	kind?: CardKind;
	hideNumber?: boolean;
	compact?: boolean;
	securityDetails?: ReactNode;
};

export function BankCard({
	brand,
	fullName,
	number,
	expiresAt,
	kind = "virtual",
	hideNumber = false,
	compact = false,
	securityDetails,
}: BankCardProps) {
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
		"idle",
	);
	const expiry = new Date(expiresAt);
	const expiryLabel = `${String(expiry.getUTCMonth() + 1).padStart(2, "0")}/${String(expiry.getUTCFullYear()).slice(-2)}`;
	const numberLabel = hideNumber
		? "•••• •••• •••• ••••"
		: formatAccount(number);
	const copyNumber = async () => {
		if (hideNumber) return;
		try {
			await navigator.clipboard.writeText(number);
			setCopyStatus("copied");
		} catch {
			setCopyStatus("error");
		}
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
					{kind === "physical" ? (
						<div className="flex items-center gap-2.5">
							<Chip className={compact ? "h-6 w-8" : "h-8 w-10"} />
							<Contactless className="h-5 w-5 text-white/60" />
						</div>
					) : (
						<Smartphone
							size={25}
							strokeWidth={1.5}
							className="text-white/60"
							aria-hidden
						/>
					)}
					<div className="flex flex-col items-end">
						<span className="text-[11px] font-medium tracking-wide text-white/60">
							GoBank Express
						</span>
						{securityDetails}
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-1">
						<p
							aria-label={
								hideNumber ? "Card number hidden" : `Card number ${number}`
							}
							className={cn(
								"min-w-0 font-medium tracking-[0.12em] whitespace-nowrap text-white/90 tabular-nums",
								compact ? "text-[12px]" : "text-[clamp(12px,3.4vw,16px)]",
							)}
						>
							<span aria-hidden>{numberLabel}</span>
						</p>
						<button
							type="button"
							disabled={hideNumber}
							onClick={copyNumber}
							aria-label={
								copyStatus === "copied"
									? "Card number copied"
									: copyStatus === "error"
										? "Copy failed. Try again."
										: "Copy card number"
							}
							className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 disabled:opacity-30"
						>
							{copyStatus === "copied" ? (
								<Check size={14} aria-hidden />
							) : copyStatus === "error" ? (
								<CircleAlert size={14} className="text-danger" aria-hidden />
							) : (
								<Copy size={14} aria-hidden />
							)}
						</button>
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
						<div className="min-w-0">
							<p className="text-[9px] tracking-[0.18em] text-white/55 uppercase">
								Cardholder
							</p>
							<p
								className={cn(
									"truncate font-medium text-white uppercase",
									compact ? "text-[11px]" : "text-[13px]",
								)}
							>
								{fullName || "YOUR NAME"}
							</p>
						</div>
						<div className="shrink-0 text-right">
							<p className="text-[9px] tracking-[0.18em] text-white/55 uppercase">
								Expires
							</p>
							<p
								className={cn(
									"font-medium text-white tabular-nums",
									compact ? "text-[11px]" : "text-[13px]",
								)}
							>
								{expiryLabel}
							</p>
						</div>
						<CardBrandLogo
							id={brand}
							onDark
							className={cn("shrink-0", compact ? "h-6 w-10" : "h-8 w-13")}
						/>
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
