"use client";

import { Check, Copy, Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "~/shared/lib/cn";
import type { RouterOutputs } from "~/trpc/react";
import { useCardSecrets } from "../hooks/use-card-secrets";
import { BankCard } from "./bank-card";
import styles from "./my-card-screen.module.css";

type Card = RouterOutputs["card"]["get"]["physical"];

const ICON_ACTION =
	"inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/60 enabled:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 disabled:opacity-30";

function CvvIcon({ loading, shown }: { loading: boolean; shown: boolean }) {
	if (loading) {
		return (
			<span
				className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
				aria-hidden
			/>
		);
	}

	return shown ? (
		<EyeOff size={15} aria-hidden />
	) : (
		<Eye size={15} aria-hidden />
	);
}

function SecurityCode({
	cvv,
	loading,
	copied,
	locked,
	onToggle,
	onCopy,
}: {
	cvv: string | null;
	loading: boolean;
	copied: boolean;
	locked: boolean;
	onToggle: () => void;
	onCopy: () => void;
}) {
	const shown = cvv !== null;

	return (
		<div aria-label="Card security code" className="flex shrink-0 flex-col">
			<span className="text-[9px] tracking-[0.18em] text-white/55">CVV</span>

			<div className="flex h-7 items-center gap-0.5">
				<span className="min-w-6 text-[13px] font-medium text-white tabular-nums">
					{cvv ?? "•••"}
				</span>

				<button
					type="button"
					aria-label={copied ? "CVV copied" : "Copy CVV"}
					disabled={locked || !shown}
					onClick={onCopy}
					className={ICON_ACTION}
				>
					{copied ? (
						<Check size={14} aria-hidden />
					) : (
						<Copy size={14} aria-hidden />
					)}
				</button>

				<button
					type="button"
					aria-label={shown ? "Hide CVV" : "Show CVV"}
					aria-pressed={shown}
					disabled={locked || loading}
					onClick={onToggle}
					className={ICON_ACTION}
				>
					<CvvIcon loading={loading} shown={shown} />
				</button>
			</div>
		</div>
	);
}

export function CardDetails({ card }: { card: Card }) {
	const locked = card.locked;
	const secrets = useCardSecrets(card.kind, locked);

	return (
		<section aria-label="Card details" className="mt-4">
			<div className={styles.cardStage}>
				<div className={styles.switchCard}>
					<div
						className={cn(styles.cardFace, locked && styles.cardFaceLocked)}
						inert={locked}
						aria-hidden={locked}
					>
						<BankCard
							key={locked ? "locked" : "unlocked"}
							brand={card.brand}
							fullName={card.user.fullName}
							number={card.number}
							hideNumber={!secrets.numberShown}
							onToggleNumber={locked ? undefined : secrets.toggleNumber}
							expiresAt={card.expiresAt}
							kind={card.kind}
							securityDetails={
								<SecurityCode
									cvv={secrets.cvvShown}
									loading={secrets.cvvLoading}
									copied={secrets.copied}
									locked={locked}
									onToggle={() => void secrets.toggleCvv()}
									onCopy={() => void secrets.copyCvv()}
								/>
							}
						/>
					</div>
				</div>

				{locked ? (
					<div role="status" className={styles.cardLockOverlay}>
						<Lock size={30} strokeWidth={1.6} aria-hidden />
						<p className="text-[14px] font-medium">Card locked</p>
					</div>
				) : null}
			</div>

			<span role="status" className="sr-only">
				{secrets.copied ? "CVV copied." : ""}
			</span>

			{secrets.error ? (
				<p role="alert" className="text-danger mt-1 text-[13px]">
					{secrets.error}
				</p>
			) : null}
		</section>
	);
}
