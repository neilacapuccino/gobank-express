"use client";

import { ArrowDownLeft, ArrowUpRight, Bitcoin, RefreshCw } from "lucide-react";
import { cn } from "~/shared/lib/cn";
import { money, type BitcoinQuote } from "../bitcoin.types";

const COMPACT_NUMBER = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});

const CLOCK_TIME: Intl.DateTimeFormatOptions = {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
};

const dayChangePercent = (quote: BitcoinQuote) =>
	((quote.unitPriceCentavos - quote.openCentavos) / quote.openCentavos) * 100;

function DayChange({ quote }: { quote: BitcoinQuote | undefined }) {
	if (!quote) {
		return <span className="text-ink-muted">Connecting to market…</span>;
	}

	const change = dayChangePercent(quote);
	const up = change >= 0;

	return (
		<span
			className={cn(
				"flex items-center gap-1",
				up ? "text-mint" : "text-rose-300",
			)}
		>
			{up ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
			{up ? "+" : ""}
			{change.toFixed(2)}%
			<span className="text-ink-faint ml-1 font-normal">24h</span>
		</span>
	);
}

export function MarketPrice({
	quote,
	fresh,
	status,
	refreshing,
	onRefresh,
}: {
	quote: BitcoinQuote | undefined;
	fresh: boolean;
	status: string;
	refreshing: boolean;
	onRefresh: () => void;
}) {
	const updatedAt = quote
		? `Updated ${new Date(quote.asOf).toLocaleTimeString("en-US", CLOCK_TIME)}`
		: "Binance market data";

	return (
		<section aria-label="Bitcoin market price" className="pt-2">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-3">
					<span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f7931a] text-white shadow-[0_5px_22px_-8px_#f7931a80]">
						<Bitcoin size={28} />
					</span>
					<div>
						<h2 className="text-[16px] font-semibold">Bitcoin</h2>
						<p className="text-ink-muted mt-0.5 text-[11px]">BTC / PHP</p>
					</div>
				</div>

				<button
					type="button"
					onClick={onRefresh}
					aria-label="Refresh Bitcoin price"
					className="text-ink-muted flex min-h-10 items-center gap-1.5 text-[10px]"
				>
					<span
						className={cn(
							"h-1.5 w-1.5 rounded-full",
							fresh ? "bg-mint" : "bg-amber-300",
						)}
					/>
					{status}
					<RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
				</button>
			</div>

			<div className="mt-5 flex items-baseline gap-2">
				<p className="text-[clamp(1.8rem,8vw,2.5rem)] font-semibold tracking-[-.06em] tabular-nums">
					{quote ? money(quote.unitPriceCentavos) : "—"}
				</p>
				<span className="text-ink-muted text-[11px] font-medium">PHP</span>
			</div>

			<div className="mt-1.5 flex min-h-5 items-center justify-between gap-2">
				<p className="text-[12px] font-medium">
					<DayChange quote={quote} />
				</p>
				<span className="text-ink-faint text-[9px]">{updatedAt}</span>
			</div>

			{quote && !fresh ? (
				<p
					role="status"
					className="mt-3 rounded-xl bg-amber-300/5 p-3 text-[11px] text-amber-200"
				>
					Feed unavailable. Showing the last price; trading is paused until a
					fresh quote arrives.
				</p>
			) : null}

			{!quote && status === "Feed offline" ? (
				<p role="status" className="mt-3 text-[11px] text-amber-200">
					Market data is unavailable. Use refresh to try again.
				</p>
			) : null}
		</section>
	);
}

export function MarketStats({ quote }: { quote: BitcoinQuote | undefined }) {
	const stats = [
		{ label: "24h high", value: quote ? money(quote.highCentavos) : "—" },
		{ label: "24h low", value: quote ? money(quote.lowCentavos) : "—" },
		{
			label: "24h volume · BTC",
			value: quote ? COMPACT_NUMBER.format(quote.volume) : "—",
		},
	];

	return (
		<dl className="grid grid-cols-3 gap-2 px-1 text-[10px]">
			{stats.map(({ label, value }) => (
				<div key={label}>
					<dt className="text-ink-faint">{label}</dt>
					<dd className="text-ink-soft mt-1.5 text-[12px] font-medium tabular-nums">
						{value}
					</dd>
				</div>
			))}
		</dl>
	);
}
