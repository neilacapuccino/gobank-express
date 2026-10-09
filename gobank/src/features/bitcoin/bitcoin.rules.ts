import {
	BITCOIN_FEE_CENTAVOS,
	MAX_CENTAVOS,
	UNITS_PER_BITCOIN,
} from "./bitcoin.types";

export type TradingBalances = {
	cashCentavos: number;
	bitcoinUnits: bigint;
	costBasisCentavos: number;
	realizedCentavos: number;
};
export type BitcoinTrade =
	| { action: "buy"; cashCentavos: number }
	| { action: "sell"; bitcoinUnits: bigint };

type Holdings = Omit<TradingBalances, "cashCentavos">;
type SettledTrade = {
	action: string;
	bitcoinUnits: bigint;
	amountCentavos: number;
};

function applyTrade(holdings: Holdings, trade: SettledTrade): Holdings {
	if (trade.action !== "buy" && trade.action !== "sell")
		throw new Error("Unknown Bitcoin trade type.");
	if (
		trade.bitcoinUnits <= 0n ||
		!Number.isSafeInteger(trade.amountCentavos) ||
		trade.amountCentavos <= 0
	)
		throw new Error("Invalid Bitcoin trade amount.");
	if (trade.action === "sell" && trade.bitcoinUnits > holdings.bitcoinUnits)
		throw new Error("Not enough Bitcoin to sell.");

	const buy = trade.action === "buy";
	const basis = buy
		? -trade.amountCentavos
		: Number(
				(BigInt(holdings.costBasisCentavos) * trade.bitcoinUnits) /
					holdings.bitcoinUnits,
			);
	return {
		bitcoinUnits:
			holdings.bitcoinUnits + (buy ? trade.bitcoinUnits : -trade.bitcoinUnits),
		costBasisCentavos: holdings.costBasisCentavos - basis,
		realizedCentavos:
			holdings.realizedCentavos + (buy ? 0 : trade.amountCentavos - basis),
	};
}

// History must be in execution order. This calculation never changes its inputs.
export function summarizeTrades(trades: readonly SettledTrade[]): Holdings {
	return trades.reduce(applyTrade, {
		bitcoinUnits: 0n,
		costBasisCentavos: 0,
		realizedCentavos: 0,
	});
}

// Integer centavos and Bitcoin units avoid floating-point balance drift.
export function calculateTrade(
	account: TradingBalances,
	trade: BitcoinTrade,
	unitPriceCentavos: number,
) {
	if (
		!Number.isSafeInteger(unitPriceCentavos) ||
		unitPriceCentavos <= 0 ||
		unitPriceCentavos > MAX_CENTAVOS
	)
		throw new Error("Price is unavailable. Try again.");
	const price = BigInt(unitPriceCentavos);
	let bitcoinUnits: bigint;
	let tradeCentavos: number;
	if (trade.action === "buy") {
		if (
			!Number.isSafeInteger(trade.cashCentavos) ||
			trade.cashCentavos < 100 ||
			trade.cashCentavos > MAX_CENTAVOS
		)
			throw new Error("Enter at least ₱1.00.");
		bitcoinUnits = (BigInt(trade.cashCentavos) * UNITS_PER_BITCOIN) / price;
		if (bitcoinUnits === 0n)
			throw new Error("This amount is too small to buy Bitcoin.");
		// Round purchase costs up and sale proceeds down, preventing rounding profits.
		tradeCentavos = Number(
			(bitcoinUnits * price + UNITS_PER_BITCOIN - 1n) / UNITS_PER_BITCOIN,
		);
	} else {
		bitcoinUnits = trade.bitcoinUnits;
		if (bitcoinUnits <= 0n)
			throw new Error("Enter a Bitcoin amount greater than zero.");
		if (bitcoinUnits > account.bitcoinUnits)
			throw new Error("Not enough Bitcoin to sell.");
		tradeCentavos = Number((bitcoinUnits * price) / UNITS_PER_BITCOIN);
		if (tradeCentavos === 0)
			throw new Error("This amount is worth less than ₱0.01.");
	}
	const cashCentavos =
		tradeCentavos +
		(trade.action === "buy" ? BITCOIN_FEE_CENTAVOS : -BITCOIN_FEE_CENTAVOS);
	if (trade.action === "buy" && cashCentavos > account.cashCentavos)
		throw new Error("Not enough PHP in your account.");
	if (cashCentavos <= 0)
		throw new Error("Sale proceeds must exceed the ₱10.00 fee.");
	const holdings = applyTrade(account, {
		action: trade.action,
		bitcoinUnits,
		amountCentavos: cashCentavos,
	});
	const realizedCentavos = holdings.realizedCentavos - account.realizedCentavos;
	const next = {
		cashCentavos:
			account.cashCentavos +
			(trade.action === "buy" ? -cashCentavos : cashCentavos),
		...holdings,
	};
	if (
		[
			next.cashCentavos,
			next.costBasisCentavos,
			next.realizedCentavos,
			cashCentavos,
		].some(
			(value) => !Number.isSafeInteger(value) || Math.abs(value) > MAX_CENTAVOS,
		)
	)
		throw new Error("This trade exceeds the account limit.");
	return {
		next,
		bitcoinUnits,
		tradeCentavos,
		cashCentavos,
		feeCentavos: BITCOIN_FEE_CENTAVOS,
		realizedCentavos,
	};
}
