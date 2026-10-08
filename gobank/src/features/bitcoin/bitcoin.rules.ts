import { BITCOIN_FEE_CENTAVOS, MAX_CENTAVOS, SATOSHIS } from "./bitcoin.types";

export type TradingBalances = {
	cashCentavos: number;
	satoshis: bigint;
	costBasisCentavos: number;
	realizedCentavos: number;
};
export type BitcoinTrade =
	{ side: "buy"; cashCentavos: number } | { side: "sell"; satoshis: bigint };

type Holdings = Omit<TradingBalances, "cashCentavos">;
type SettledTrade = { side: string; satoshis: bigint; phpCentavos: number };

function applyTrade(holdings: Holdings, trade: SettledTrade): Holdings {
	if (trade.side !== "buy" && trade.side !== "sell")
		throw new Error("Unknown Bitcoin trade type.");
	if (
		trade.satoshis <= 0n ||
		!Number.isSafeInteger(trade.phpCentavos) ||
		trade.phpCentavos <= 0
	)
		throw new Error("Invalid Bitcoin trade amount.");
	if (trade.side === "sell" && trade.satoshis > holdings.satoshis)
		throw new Error("Not enough Bitcoin to sell.");

	const buy = trade.side === "buy";
	const basis = buy
		? -trade.phpCentavos
		: Number(
				(BigInt(holdings.costBasisCentavos) * trade.satoshis) /
					holdings.satoshis,
			);
	return {
		satoshis: holdings.satoshis + (buy ? trade.satoshis : -trade.satoshis),
		costBasisCentavos: holdings.costBasisCentavos - basis,
		realizedCentavos:
			holdings.realizedCentavos + (buy ? 0 : trade.phpCentavos - basis),
	};
}

// History must be in execution order. This calculation never changes its inputs.
export function summarizeTrades(trades: readonly SettledTrade[]): Holdings {
	return trades.reduce(applyTrade, {
		satoshis: 0n,
		costBasisCentavos: 0,
		realizedCentavos: 0,
	});
}

// Integer centavos and satoshis avoid floating-point balance drift.
export function calculateTrade(
	account: TradingBalances,
	trade: BitcoinTrade,
	priceCentavos: number,
) {
	if (
		!Number.isSafeInteger(priceCentavos) ||
		priceCentavos <= 0 ||
		priceCentavos > MAX_CENTAVOS
	)
		throw new Error("Price is unavailable. Try again.");
	const price = BigInt(priceCentavos);
	let satoshis: bigint;
	let tradeCentavos: number;
	if (trade.side === "buy") {
		if (
			!Number.isSafeInteger(trade.cashCentavos) ||
			trade.cashCentavos < 100 ||
			trade.cashCentavos > MAX_CENTAVOS
		)
			throw new Error("Enter at least ₱1.00.");
		satoshis = (BigInt(trade.cashCentavos) * SATOSHIS) / price;
		if (satoshis === 0n)
			throw new Error("This amount is too small to buy Bitcoin.");
		// Round purchase costs up and sale proceeds down, preventing rounding profits.
		tradeCentavos = Number((satoshis * price + SATOSHIS - 1n) / SATOSHIS);
	} else {
		satoshis = trade.satoshis;
		if (satoshis <= 0n)
			throw new Error("Enter a Bitcoin amount greater than zero.");
		if (satoshis > account.satoshis)
			throw new Error("Not enough Bitcoin to sell.");
		tradeCentavos = Number((satoshis * price) / SATOSHIS);
		if (tradeCentavos === 0)
			throw new Error("This amount is worth less than ₱0.01.");
	}
	const cashCentavos =
		tradeCentavos +
		(trade.side === "buy" ? BITCOIN_FEE_CENTAVOS : -BITCOIN_FEE_CENTAVOS);
	if (trade.side === "buy" && cashCentavos > account.cashCentavos)
		throw new Error("Not enough PHP in your account.");
	if (cashCentavos <= 0)
		throw new Error("Sale proceeds must exceed the ₱10.00 fee.");
	const holdings = applyTrade(account, {
		side: trade.side,
		satoshis,
		phpCentavos: cashCentavos,
	});
	const realizedCentavos = holdings.realizedCentavos - account.realizedCentavos;
	const next = {
		cashCentavos:
			account.cashCentavos +
			(trade.side === "buy" ? -cashCentavos : cashCentavos),
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
		satoshis,
		tradeCentavos,
		cashCentavos,
		feeCentavos: BITCOIN_FEE_CENTAVOS,
		realizedCentavos,
	};
}
