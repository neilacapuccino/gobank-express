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

const MIN_BUY_CENTAVOS = 100;

const isPositiveAmount = (value: number) =>
	Number.isSafeInteger(value) && value > 0 && value <= MAX_CENTAVOS;

const withinAccountLimit = (value: number) =>
	Number.isSafeInteger(value) && Math.abs(value) <= MAX_CENTAVOS;

function applyTrade(holdings: Holdings, trade: SettledTrade): Holdings {
	if (trade.action !== "buy" && trade.action !== "sell") {
		throw new Error("Unknown Bitcoin trade type.");
	}

	const validAmount =
		trade.bitcoinUnits > 0n &&
		Number.isSafeInteger(trade.amountCentavos) &&
		trade.amountCentavos > 0;
	if (!validAmount) throw new Error("Invalid Bitcoin trade amount.");

	if (trade.action === "buy") {
		return {
			bitcoinUnits: holdings.bitcoinUnits + trade.bitcoinUnits,
			costBasisCentavos: holdings.costBasisCentavos + trade.amountCentavos,
			realizedCentavos: holdings.realizedCentavos,
		};
	}

	if (trade.bitcoinUnits > holdings.bitcoinUnits) {
		throw new Error("Not enough Bitcoin to sell.");
	}

	const soldCostBasis = Number(
		(BigInt(holdings.costBasisCentavos) * trade.bitcoinUnits) /
			holdings.bitcoinUnits,
	);

	return {
		bitcoinUnits: holdings.bitcoinUnits - trade.bitcoinUnits,
		costBasisCentavos: holdings.costBasisCentavos - soldCostBasis,
		realizedCentavos:
			holdings.realizedCentavos + trade.amountCentavos - soldCostBasis,
	};
}

export function summarizeTrades(trades: readonly SettledTrade[]): Holdings {
	return trades.reduce(applyTrade, {
		bitcoinUnits: 0n,
		costBasisCentavos: 0,
		realizedCentavos: 0,
	});
}

function priceBuy(cashCentavos: number, price: bigint) {
	if (!isPositiveAmount(cashCentavos) || cashCentavos < MIN_BUY_CENTAVOS) {
		throw new Error("Enter at least ₱1.00.");
	}

	const bitcoinUnits = (BigInt(cashCentavos) * UNITS_PER_BITCOIN) / price;
	if (bitcoinUnits === 0n) {
		throw new Error("This amount is too small to buy Bitcoin.");
	}

	const costRoundedUp =
		(bitcoinUnits * price + UNITS_PER_BITCOIN - 1n) / UNITS_PER_BITCOIN;

	return { bitcoinUnits, tradeCentavos: Number(costRoundedUp) };
}

function priceSell(bitcoinUnits: bigint, owned: bigint, price: bigint) {
	if (bitcoinUnits <= 0n) {
		throw new Error("Enter a Bitcoin amount greater than zero.");
	}

	if (bitcoinUnits > owned) throw new Error("Not enough Bitcoin to sell.");

	const proceedsRoundedDown = (bitcoinUnits * price) / UNITS_PER_BITCOIN;
	if (proceedsRoundedDown === 0n) {
		throw new Error("This amount is worth less than ₱0.01.");
	}

	return { bitcoinUnits, tradeCentavos: Number(proceedsRoundedDown) };
}

export function calculateTrade(
	account: TradingBalances,
	trade: BitcoinTrade,
	unitPriceCentavos: number,
) {
	if (!isPositiveAmount(unitPriceCentavos)) {
		throw new Error("Price is unavailable. Try again.");
	}

	const price = BigInt(unitPriceCentavos);
	const buying = trade.action === "buy";

	const { bitcoinUnits, tradeCentavos } =
		trade.action === "buy"
			? priceBuy(trade.cashCentavos, price)
			: priceSell(trade.bitcoinUnits, account.bitcoinUnits, price);

	const cashCentavos = buying
		? tradeCentavos + BITCOIN_FEE_CENTAVOS
		: tradeCentavos - BITCOIN_FEE_CENTAVOS;

	if (buying && cashCentavos > account.cashCentavos) {
		throw new Error("Not enough PHP in your account.");
	}

	if (cashCentavos <= 0) {
		throw new Error("Sale proceeds must exceed the ₱10.00 fee.");
	}

	const holdings = applyTrade(account, {
		action: trade.action,
		bitcoinUnits,
		amountCentavos: cashCentavos,
	});

	const next = {
		cashCentavos: buying
			? account.cashCentavos - cashCentavos
			: account.cashCentavos + cashCentavos,
		...holdings,
	};

	const amounts = [
		next.cashCentavos,
		next.costBasisCentavos,
		next.realizedCentavos,
		cashCentavos,
	];
	if (!amounts.every(withinAccountLimit)) {
		throw new Error("This trade exceeds the account limit.");
	}

	return {
		next,
		bitcoinUnits,
		tradeCentavos,
		cashCentavos,
		feeCentavos: BITCOIN_FEE_CENTAVOS,
		realizedCentavos: holdings.realizedCentavos - account.realizedCentavos,
	};
}
