"use client";

import { ArrowDownLeft, ArrowUpRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { cn } from "~/shared/lib/cn";
import { api, type RouterOutputs } from "~/trpc/react";
import {
	BITCOIN_FEE_CENTAVOS,
	btc,
	money,
	type BitcoinQuote,
} from "../bitcoin.types";
import {
	parseTradeInput,
	presetAmount,
	previewTrade,
	type TradeAction,
	type TradePreview,
} from "../bitcoin-trade-input";
import { TradeReviewDialog } from "./bitcoin-trade-review";

type Portfolio = RouterOutputs["bitcoin"]["portfolio"];
type Order = RouterOutputs["bitcoin"]["trade"];

const ACTIONS: TradeAction[] = ["buy", "sell"];
const PRESET_PERCENTS = [25, 50, 75, 100];

const ACTION_STYLE: Record<TradeAction, string> = {
	buy: "bg-mint/10 text-mint",
	sell: "bg-rose-400/10 text-rose-300",
};

const SUBMIT_STYLE: Record<TradeAction, string> = {
	buy: "bg-mint text-[#0a211a] hover:bg-[#75edc3]",
	sell: "bg-rose-300 text-[#35151d] hover:bg-rose-200",
};

function availableLabel(portfolio: Portfolio | undefined, action: TradeAction) {
	if (!portfolio) return "Loading balance…";

	return action === "buy"
		? `${money(portfolio.cashCentavos)} PHP available`
		: `${btc(portfolio.bitcoinUnits)} BTC available`;
}

function previewLabel(preview: TradePreview, action: TradeAction) {
	if (action === "sell") {
		return `You receive ≈ ${money(preview.cashCentavos)} PHP`;
	}

	return `You receive ≈ ${btc(preview.bitcoinUnits)} BTC · Total ${money(preview.cashCentavos)} PHP`;
}

function idleHint(action: TradeAction) {
	return action === "sell"
		? "You can sell any fraction of your Bitcoin."
		: "Buy directly with PHP from your account.";
}

function ActionSwitch({
	selected,
	disabled,
	onSelect,
}: {
	selected: TradeAction;
	disabled: boolean;
	onSelect: (action: TradeAction) => void;
}) {
	return (
		<div className="bg-surface-sunken mb-5 flex rounded-xl p-1">
			{ACTIONS.map((action) => (
				<button
					key={action}
					type="button"
					disabled={disabled}
					aria-pressed={selected === action}
					onClick={() => onSelect(action)}
					className={cn(
						"flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold",
						selected === action ? ACTION_STYLE[action] : "text-ink-muted",
					)}
				>
					{action === "buy" ? (
						<ArrowDownLeft size={16} />
					) : (
						<ArrowUpRight size={16} />
					)}
					{action === "buy" ? "Buy Bitcoin" : "Sell Bitcoin"}
				</button>
			))}
		</div>
	);
}

function TradeSuccess({ order }: { order: Order }) {
	return (
		<div
			role="status"
			className="bg-mint/10 text-mint mt-4 flex items-start gap-2 rounded-xl p-3 text-[12px]"
		>
			<Check size={16} className="mt-0.5 shrink-0" />
			<div>
				<p className="font-semibold">
					{order.action === "buy" ? "Bitcoin bought" : "Bitcoin sold"}
				</p>
				<p className="mt-1 text-[11px]">
					{btc(order.bitcoinUnits)} BTC · {money(order.amountCentavos)} PHP
				</p>
			</div>
		</div>
	);
}

export function BitcoinTradeForm({
	portfolio,
	quote,
	fresh,
}: {
	portfolio?: Portfolio;
	quote?: BitcoinQuote;
	fresh: boolean;
}) {
	const router = useRouter();
	const [action, setAction] = useState<TradeAction>("buy");
	const [amount, setAmount] = useState("");
	const [attempted, setAttempted] = useState(false);
	const [reviewing, setReviewing] = useState(false);
	const [lastOrder, setLastOrder] = useState<Order | null>(null);
	const submissionId = useRef<string | null>(null);

	const tradeMutation = api.bitcoin.trade.useMutation({
		onSuccess: (order) => {
			setLastOrder(order);
			setReviewing(false);
			setAmount("");
			setAttempted(false);
			submissionId.current = null;
			router.refresh();
		},
	});

	const input = parseTradeInput(amount, action);
	const checked =
		portfolio && quote && input.trade
			? previewTrade(portfolio, input.trade, quote.unitPriceCentavos)
			: null;
	const preview = checked?.preview ?? null;

	const nothingToSell = action === "sell" && portfolio?.bitcoinUnits === 0n;
	let problem = input.problem;
	if (checked?.problem && attempted) problem = checked.problem;
	if (nothingToSell)
		problem = "Buy some Bitcoin before making your first sale.";

	const busy = tradeMutation.isPending;
	const canReview =
		Boolean(input.trade && portfolio && quote && fresh) && !busy;

	const changeAmount = (value: string) => {
		setAmount(value);
		setAttempted(false);
		setLastOrder(null);
		tradeMutation.reset();
		submissionId.current = null;
	};

	const switchAction = (next: TradeAction) => {
		setAction(next);
		changeAmount("");
	};

	const openReview = () => {
		setAttempted(true);
		if (!preview || !fresh) return;

		tradeMutation.reset();
		setReviewing(true);
	};

	const confirm = () => {
		const trade = input.trade;
		if (!trade || !preview || !fresh || busy) return;

		submissionId.current ??= crypto.randomUUID();
		const id = submissionId.current;

		tradeMutation.mutate(
			trade.action === "buy"
				? { ...trade, submissionId: id }
				: {
						action: "sell",
						bitcoinUnits: trade.bitcoinUnits.toString(),
						submissionId: id,
					},
		);
	};

	return (
		<section
			className="bg-card rounded-[24px] border border-white/[.07] p-5"
			aria-label="Bitcoin trading"
		>
			<ActionSwitch selected={action} disabled={busy} onSelect={switchAction} />

			<form
				onSubmit={(event) => {
					event.preventDefault();
					openReview();
				}}
			>
				<div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
					<label htmlFor="bitcoin-amount" className="text-ink-soft">
						{action === "buy" ? "Bitcoin purchase amount" : "Bitcoin to sell"}
					</label>
					<span className="text-ink-muted">
						{availableLabel(portfolio, action)}
					</span>
				</div>

				<div className="bg-surface-sunken focus-within:border-mint/50 flex items-center gap-3 rounded-xl border border-white/10 px-4">
					<input
						id="bitcoin-amount"
						type="text"
						inputMode="decimal"
						autoComplete="off"
						placeholder={action === "buy" ? "0.00" : "0.00000000"}
						value={amount}
						disabled={!portfolio || busy}
						onChange={(event) => changeAmount(event.target.value)}
						aria-describedby="bitcoin-amount-help"
						className="placeholder:text-ink-faint min-w-0 flex-1 bg-transparent py-4 text-[25px] font-medium text-white tabular-nums outline-none"
					/>
					<span className="text-ink-muted text-[12px] font-semibold">
						{action === "buy" ? "PHP" : "BTC"}
					</span>
				</div>

				<div className="mt-3 grid grid-cols-4 gap-2">
					{PRESET_PERCENTS.map((percent) => (
						<button
							type="button"
							key={percent}
							disabled={!portfolio || busy}
							onClick={() => {
								if (portfolio) {
									changeAmount(presetAmount(portfolio, action, percent));
								}
							}}
							className="text-ink-soft min-h-9 rounded-lg bg-white/[.04] text-[11px] font-medium hover:bg-white/10 disabled:opacity-40"
						>
							{percent === 100 ? "Max" : `${percent}%`}
						</button>
					))}
				</div>

				<div id="bitcoin-amount-help" className="mt-4 min-h-5 text-[11px]">
					{problem ? (
						<span
							role={attempted ? "alert" : undefined}
							className="text-rose-300"
						>
							{problem}
						</span>
					) : (
						<span className="text-ink-muted">
							{preview ? previewLabel(preview, action) : idleHint(action)}
						</span>
					)}
				</div>

				<button
					type="submit"
					disabled={!canReview}
					className={cn(
						"mt-3 min-h-12 w-full rounded-xl text-[13px] font-bold transition-opacity disabled:opacity-35",
						SUBMIT_STYLE[action],
					)}
				>
					{fresh ? `Review ${action}` : "Waiting for a fresh price"}
				</button>
			</form>

			<p className="text-ink-faint mt-3 text-center text-[10px] leading-relaxed">
				Fixed {money(BITCOIN_FEE_CENTAVOS)} PHP fee per trade
			</p>

			{lastOrder ? <TradeSuccess order={lastOrder} /> : null}

			{reviewing ? (
				<TradeReviewDialog
					action={action}
					preview={preview}
					fresh={fresh}
					pending={busy}
					error={tradeMutation.error?.message ?? null}
					onClose={() => setReviewing(false)}
					onConfirm={confirm}
				/>
			) : null}
		</section>
	);
}
