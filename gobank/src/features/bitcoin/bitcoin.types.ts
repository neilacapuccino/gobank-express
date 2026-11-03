export const BITCOIN_RANGES = ["1MIN", "1H", "1W", "1M", "1Y"] as const;

export type BitcoinRange = (typeof BITCOIN_RANGES)[number];

export const BITCOIN_CANDLES: Record<
	BitcoinRange,
	{ interval: string; limit: number; label: string }
> = {
	"1MIN": {
		interval: "1s",
		limit: 60,
		label: "1-second candles · last 60 seconds",
	},
	"1H": { interval: "1m", limit: 60, label: "1-minute candles" },
	"1W": { interval: "1h", limit: 168, label: "1-hour candles" },
	"1M": { interval: "4h", limit: 180, label: "4-hour candles" },
	"1Y": { interval: "1d", limit: 365, label: "1-day candles" },
};

export type BitcoinQuote = {
	unitPriceCentavos: number;
	openCentavos: number;
	highCentavos: number;
	lowCentavos: number;
	volume: number;
	asOf: number;
	phpPerQuote: number;
	rateDate: string;
};

export type BitcoinCandle = {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
};

export const UNITS_PER_BITCOIN = 100_000_000n;
export const MAX_CENTAVOS = 2_000_000_000;
export const BITCOIN_FEE_CENTAVOS = 1_000;

const QUOTE_MAX_AGE_MS = 60_000;
const QUOTE_MAX_CLOCK_AHEAD_MS = 10_000;

export const quoteIsFresh = (asOf: number, now: number) => {
	const age = now - asOf;

	return (
		Number.isFinite(asOf) &&
		age < QUOTE_MAX_AGE_MS &&
		-age < QUOTE_MAX_CLOCK_AHEAD_MS
	);
};

const PHP_AMOUNT = new Intl.NumberFormat("en-PH", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export const money = (centavos: number) => PHP_AMOUNT.format(centavos / 100);

export const btc = (bitcoinUnits: bigint) => {
	const whole = bitcoinUnits / UNITS_PER_BITCOIN;
	const fraction = (bitcoinUnits % UNITS_PER_BITCOIN)
		.toString()
		.padStart(8, "0");

	return `${whole}.${fraction}`;
};

export const holdingValue = (bitcoinUnits: bigint, unitPriceCentavos: number) =>
	Number((bitcoinUnits * BigInt(unitPriceCentavos)) / UNITS_PER_BITCOIN);

export function parseUnits(value: string, decimals: number): bigint | null {
	if (value.length > 24) return null;

	const match = /^(\d+)(?:\.(\d*))?$/.exec(value.trim());
	if (!match) return null;

	const [, whole = "0", fraction = ""] = match;
	if (fraction.length > decimals) return null;

	const scale = 10n ** BigInt(decimals);
	const fractionUnits = BigInt(fraction.padEnd(decimals, "0") || "0");

	return BigInt(whole) * scale + fractionUnits;
}
