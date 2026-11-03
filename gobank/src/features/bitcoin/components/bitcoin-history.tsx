"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "~/shared/lib/cn";
import type { RouterOutputs } from "~/trpc/react";
import { btc, money } from "../bitcoin.types";

type Trade = RouterOutputs["bitcoin"]["portfolio"]["trades"][number];

const TRADE_TIME: Intl.DateTimeFormatOptions = {
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
};

function TradeRow({ trade }: { trade: Trade }) {
	const bought = trade.action === "buy";

	return (
		<div className="flex items-center gap-3 py-4">
			<span
				className={cn(
					"grid h-9 w-9 shrink-0 place-items-center rounded-xl",
					bought ? "bg-mint/10 text-mint" : "bg-rose-300/10 text-rose-300",
				)}
			>
				{bought ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
			</span>

			<div className="min-w-0 flex-1">
				<p className="text-[12px] font-medium">
					{bought ? "Bitcoin purchase" : "Bitcoin sale"}
				</p>
				<p className="text-ink-faint mt-1 text-[9px]">
					{trade.createdAt.toLocaleString("en-US", TRADE_TIME)}
				</p>
			</div>

			<div className="text-right">
				<p className="text-[11px] font-semibold tabular-nums">
					{bought ? "+" : "−"}
					{btc(trade.bitcoinUnits)} BTC
				</p>
				<p className="text-ink-muted mt-1 text-[10px] tabular-nums">
					{money(trade.amountCentavos)} PHP
				</p>
			</div>
		</div>
	);
}

function NoTrades() {
	return (
		<div className="rounded-[20px] border border-dashed border-white/10 px-5 py-6 text-center">
			<p className="text-ink-soft text-[12px]">Your first trade starts here.</p>
			<p className="text-ink-faint mt-2 text-[11px] leading-relaxed">
				Buy Bitcoin directly with your PHP account balance.
				<br />
				Buy a little Bitcoin and watch your holdings grow.
			</p>
		</div>
	);
}

export function BitcoinHistory({ trades }: { trades: Trade[] }) {
	return (
		<section aria-label="Bitcoin trade history">
			<div className="mb-3 flex items-center justify-between">
				<h2 className="text-[14px] font-semibold">Trade history</h2>
				<span className="text-ink-faint text-[10px]">Latest 20 trades</span>
			</div>

			{trades.length > 0 ? (
				<div className="bg-card divide-y divide-white/[.06] rounded-[20px] border border-white/[.06] px-4">
					{trades.map((trade) => (
						<TradeRow key={trade.id} trade={trade} />
					))}
				</div>
			) : (
				<NoTrades />
			)}
		</section>
	);
}
