"use client";

import { Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/shared/lib/cn";
import type { RouterOutputs } from "~/trpc/react";
import {
	BITCOIN_FEE_CENTAVOS,
	btc,
	holdingValue,
	money,
	type BitcoinQuote,
} from "../bitcoin.types";

type Portfolio = RouterOutputs["bitcoin"]["portfolio"];

const signedMoney = (centavos: number) =>
	`${centavos >= 0 ? "+" : "−"}${money(Math.abs(centavos))}`;

function Stat({
	label,
	children,
	className,
}: {
	label: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div>
			<dt className="text-mint-muted">{label}</dt>
			<dd className={cn("mt-1 text-[13px] font-semibold", className)}>
				{children}
			</dd>
		</div>
	);
}

function Php() {
	return (
		<span className="text-mint-muted ml-1 text-[9px] font-normal">PHP</span>
	);
}

function ProfitLoss({ pnl, costBasis }: { pnl: number; costBasis: number }) {
	const percent =
		costBasis > 0 ? ` (${((pnl / costBasis) * 100).toFixed(2)}%)` : "";

	return (
		<span className={pnl >= 0 ? "text-mint" : "text-rose-300"}>
			{signedMoney(pnl)}
			{percent}
		</span>
	);
}

export function BitcoinHoldings({
	portfolio,
	quote,
	fresh,
	failed,
	onRetry,
}: {
	portfolio: Portfolio | undefined;
	quote: BitcoinQuote | undefined;
	fresh: boolean;
	failed: boolean;
	onRetry: () => void;
}) {
	const value =
		portfolio && quote
			? holdingValue(portfolio.bitcoinUnits, quote.unitPriceCentavos)
			: null;

	const valueLabel =
		value === null
			? "Start your Bitcoin portfolio"
			: `${money(value)} PHP ${fresh ? "value" : "last value"}`;

	const lostMoney = portfolio !== undefined && portfolio.realizedCentavos < 0;

	return (
		<section
			className="border-mint/15 rounded-[24px] border bg-linear-to-br from-[#182820] to-[#151b18] p-5"
			aria-label="Bitcoin holdings"
		>
			<div className="flex items-center justify-between">
				<h2 className="flex items-center gap-2 text-[13px] font-semibold">
					<Wallet size={16} className="text-mint" />
					Your holdings
				</h2>
				<span className="text-mint-muted text-[9px]">Account holdings</span>
			</div>

			<p className="mt-4 text-[24px] font-semibold tracking-tight tabular-nums">
				{portfolio ? btc(portfolio.bitcoinUnits) : "—"}
				<span className="text-mint-muted ml-2 text-[11px] font-medium">
					BTC
				</span>
			</p>

			<div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
				<span className="text-mint-muted">{valueLabel}</span>
				{portfolio && value !== null ? (
					<ProfitLoss
						pnl={value - portfolio.costBasisCentavos}
						costBasis={portfolio.costBasisCentavos}
					/>
				) : null}
			</div>

			<dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-white/10 pt-4 text-[10px]">
				<Stat label="PHP account balance">
					{portfolio ? money(portfolio.cashCentavos) : "—"}
					<Php />
				</Stat>
				<Stat label="Fee">
					{money(BITCOIN_FEE_CENTAVOS)}
					<Php />
				</Stat>
				<Stat label="Total portfolio value" className="text-[12px]">
					{portfolio && value !== null
						? `${money(portfolio.cashCentavos + value)} PHP`
						: "—"}
				</Stat>
				<Stat
					label="Realized profit / loss"
					className={cn(
						"text-[12px]",
						lostMoney ? "text-rose-300" : "text-mint",
					)}
				>
					{portfolio ? `${signedMoney(portfolio.realizedCentavos)} PHP` : "—"}
				</Stat>
			</dl>

			{failed ? (
				<div role="alert" className="mt-4 text-[11px] text-amber-200">
					<p>Couldn’t load your portfolio.</p>
					<button
						type="button"
						onClick={onRetry}
						className="mt-2 underline underline-offset-4"
					>
						Try again
					</button>
				</div>
			) : null}
		</section>
	);
}
