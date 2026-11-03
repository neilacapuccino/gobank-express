import {
	calculateTrade,
	type BitcoinTrade,
	type TradingBalances,
} from "./bitcoin.rules";
import {
	BITCOIN_FEE_CENTAVOS,
	btc,
	MAX_CENTAVOS,
	parseUnits,
} from "./bitcoin.types";

export type TradeAction = "buy" | "sell";

export type TradePreview = ReturnType<typeof calculateTrade>;

const DECIMAL_PLACES: Record<TradeAction, number> = { buy: 2, sell: 8 };

const NO_PROBLEM = "";

export function parseTradeInput(amount: string, action: TradeAction) {
	if (!amount) return { trade: null, problem: NO_PROBLEM };

	const units = parseUnits(amount, DECIMAL_PLACES[action]);
	if (units === null) {
		return {
			trade: null,
			problem: `Use up to ${DECIMAL_PLACES[action]} decimal places.`,
		};
	}

	if (action === "sell") {
		if (units === 0n) {
			return {
				trade: null,
				problem: "Enter a Bitcoin amount greater than zero.",
			};
		}

		const trade: BitcoinTrade = { action, bitcoinUnits: units };
		return { trade, problem: NO_PROBLEM };
	}

	if (units === 0n) return { trade: null, problem: "Enter at least ₱1.00." };
	if (units > BigInt(MAX_CENTAVOS)) {
		return { trade: null, problem: "This amount exceeds the account limit." };
	}

	const trade: BitcoinTrade = { action, cashCentavos: Number(units) };
	return { trade, problem: NO_PROBLEM };
}

export function previewTrade(
	balances: TradingBalances,
	trade: BitcoinTrade,
	unitPriceCentavos: number,
) {
	try {
		const preview = calculateTrade(balances, trade, unitPriceCentavos);
		return { preview, problem: NO_PROBLEM };
	} catch (error) {
		const problem =
			error instanceof Error ? error.message : "Check this amount.";
		return { preview: null, problem };
	}
}

export function presetAmount(
	balances: TradingBalances,
	action: TradeAction,
	percent: number,
) {
	if (action === "sell") {
		return btc((balances.bitcoinUnits * BigInt(percent)) / 100n);
	}

	const spendable = Math.max(0, balances.cashCentavos - BITCOIN_FEE_CENTAVOS);
	const centavos = Math.floor((spendable * percent) / 100);

	return (centavos / 100).toFixed(2);
}
