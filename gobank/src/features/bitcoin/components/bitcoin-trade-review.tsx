"use client";

import { X } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";
import { BITCOIN_FEE_CENTAVOS, btc, money } from "../bitcoin.types";
import type { TradeAction, TradePreview } from "../bitcoin-trade-input";

function keepFocusInside(event: KeyboardEvent<HTMLDivElement>) {
	const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
		"button:not(:disabled)",
	);
	const first = buttons[0];
	const last = buttons[buttons.length - 1];

	if (!first || !last) {
		event.preventDefault();
		return;
	}

	const leavingStart = event.shiftKey && document.activeElement === first;
	const leavingEnd = !event.shiftKey && document.activeElement === last;

	if (leavingStart) {
		event.preventDefault();
		last.focus();
	}

	if (leavingEnd) {
		event.preventDefault();
		first.focus();
	}
}

function ReviewRow({
	label,
	value,
	divided = false,
}: {
	label: string;
	value: string;
	divided?: boolean;
}) {
	return (
		<div
			className={
				divided
					? "flex justify-between border-t border-white/10 pt-4"
					: "flex justify-between"
			}
		>
			<dt className="text-ink-muted">{label}</dt>
			<dd className="font-semibold tabular-nums">{value}</dd>
		</div>
	);
}

export function TradeReviewDialog({
	action,
	preview,
	fresh,
	pending,
	error,
	onClose,
	onConfirm,
}: {
	action: TradeAction;
	preview: TradePreview | null;
	fresh: boolean;
	pending: boolean;
	error: string | null;
	onClose: () => void;
	onConfirm: () => void;
}) {
	const closeUnlessBusy = () => {
		if (!pending) onClose();
	};

	const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget) closeUnlessBusy();
	};

	const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") closeUnlessBusy();
		if (event.key === "Tab") keepFocusInside(event);
	};

	const inPhp = (centavos: number | undefined) =>
		centavos === undefined ? "— PHP" : `${money(centavos)} PHP`;

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 pb-3 backdrop-blur-sm sm:items-center"
			onClick={closeOnBackdrop}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="bitcoin-review-title"
				onKeyDown={handleKeys}
				className="bg-surface w-full max-w-[416px] rounded-[26px] border border-white/10 p-6 shadow-2xl"
			>
				<div className="flex items-center justify-between">
					<h2 id="bitcoin-review-title" className="text-lg font-semibold">
						Review {action}
					</h2>
					<button
						autoFocus
						type="button"
						aria-label="Close trade review"
						disabled={pending}
						onClick={onClose}
						className="text-ink-muted grid h-10 w-10 place-items-center"
					>
						<X size={20} />
					</button>
				</div>

				<dl className="mt-6 space-y-4 text-[13px]">
					<ReviewRow
						label="Bitcoin"
						value={`${preview ? btc(preview.bitcoinUnits) : "—"} BTC`}
					/>
					<ReviewRow
						label="Estimated Bitcoin value"
						value={inPhp(preview?.tradeCentavos)}
					/>
					<ReviewRow label="Trading fee" value={inPhp(BITCOIN_FEE_CENTAVOS)} />
					<ReviewRow
						label={action === "buy" ? "Total to pay" : "Net proceeds"}
						value={inPhp(preview?.cashCentavos)}
						divided
					/>
				</dl>

				<p className="text-ink-muted mt-5 rounded-xl bg-white/5 p-3 text-[11px] leading-relaxed">
					Your final fill uses the latest PHP quote when confirmed. Buying
					debits your PHP account. Selling credits PHP back to your account.
				</p>

				{error ? (
					<p role="alert" className="mt-4 text-[12px] text-rose-300">
						{error}
					</p>
				) : null}

				{!fresh ? (
					<p role="alert" className="mt-4 text-[12px] text-amber-300">
						The price is stale. Wait for the feed to reconnect.
					</p>
				) : null}

				<button
					type="button"
					onClick={onConfirm}
					disabled={!preview || !fresh || pending}
					className="bg-mint mt-5 min-h-12 w-full rounded-xl text-[13px] font-bold text-[#0a211a] disabled:opacity-40"
				>
					{pending ? "Completing trade…" : `Confirm ${action}`}
				</button>
			</div>
		</div>
	);
}
