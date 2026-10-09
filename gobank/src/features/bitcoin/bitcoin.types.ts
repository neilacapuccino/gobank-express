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
// One Bitcoin equals 100,000,000 integer units.
export const UNITS_PER_BITCOIN = 100_000_000n;

export const MAX_CENTAVOS = 2_000_000_000;
export const BITCOIN_FEE_CENTAVOS = 1_000;

export const quoteIsFresh = (asOf: number, now: number) =>
	Number.isFinite(asOf) && now - asOf < 60_000 && asOf - now < 10_000;

const PHP_AMOUNT = new Intl.NumberFormat("en-PH", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export const money = (centavos: number) => PHP_AMOUNT.format(centavos / 100);

export const btc = (bitcoinUnits: bigint) =>
	`${bitcoinUnits / UNITS_PER_BITCOIN}.${(bitcoinUnits % UNITS_PER_BITCOIN).toString().padStart(8, "0")}`;

export const holdingValue = (bitcoinUnits: bigint, unitPriceCentavos: number) =>
	Number((bitcoinUnits * BigInt(unitPriceCentavos)) / UNITS_PER_BITCOIN);

export function parseUnits(value: string, decimals: number): bigint | null {
	const match = /^(\d+)(?:\.(\d*))?$/.exec(value.trim());
	if (!match || (match[2]?.length ?? 0) > decimals || value.length > 24)
		return null;
	return (
		BigInt(match[1]!) * 10n ** BigInt(decimals) +
		BigInt((match[2] ?? "").padEnd(decimals, "0") || "0")
	);
}
