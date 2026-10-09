import "server-only";
import { z } from "zod";
import { fail } from "~/server/errors";
import { createRequestCache } from "./bitcoin.cache";
import { getPhpRate } from "./bitcoin.fx";
import {
	MAX_CENTAVOS,
	BITCOIN_CANDLES,
	quoteIsFresh,
	type BitcoinCandle,
	type BitcoinQuote,
	type BitcoinRange,
} from "./bitcoin.types";

const numeric = z.coerce.number().finite().positive();
const ticker = z.object({
	symbol: z.literal("BTCUSDT"),
	lastPrice: numeric,
	openPrice: numeric,
	highPrice: numeric,
	lowPrice: numeric,
	volume: z.coerce.number().finite().nonnegative(),
	closeTime: z.number().int().positive(),
});
const conversionQuote = z
	.object({
		symbol: z.literal("USDTUSD"),
		bidPrice: numeric,
		askPrice: numeric,
	})
	.refine((value) => value.askPrice >= value.bidPrice);
const candle = z
	.tuple([
		z.number().int().positive(),
		numeric,
		numeric,
		numeric,
		numeric,
		z.coerce.number().finite().nonnegative(),
	])
	.rest(z.unknown());
const FEED_ERROR =
	"Bitcoin market data is unavailable. Please try again shortly.";
const quoteCache = createRequestCache<string, BitcoinQuote>(() => 5_000);
const chartCache = createRequestCache<BitcoinRange, BitcoinCandle[]>((range) =>
	range === "1MIN" ? 2_000 : 5_000,
);

async function read<T>(
	path: string,
	schema: z.ZodType<T>,
	base = "https://data-api.binance.vision/api/v3",
): Promise<T> {
	try {
		const response = await fetch(`${base}/${path}`, {
			cache: "no-store",
			signal: AbortSignal.timeout(8_000),
			headers: { Accept: "application/json" },
		});
		if (!response.ok) throw new Error("Market feed request failed");
		return schema.parse(await response.json());
	} catch {
		return fail("BAD_REQUEST", FEED_ERROR);
	}
}

export function getBitcoinQuote(): Promise<BitcoinQuote> {
	return quoteCache("BTCUSDT", () =>
		Promise.all([
			read("ticker/24hr?symbol=BTCUSDT", ticker),
			getPhpRate(),
			read(
				"ticker/bookTicker?symbol=USDTUSD",
				conversionQuote,
				"https://api.binance.us/api/v3",
			),
		]).then(([value, fx, peg]) => {
			const phpPerQuote = (fx.rate * (peg.bidPrice + peg.askPrice)) / 2;
			const result = {
				unitPriceCentavos: Math.round(value.lastPrice * phpPerQuote * 100),
				openCentavos: Math.round(value.openPrice * phpPerQuote * 100),
				highCentavos: Math.round(value.highPrice * phpPerQuote * 100),
				lowCentavos: Math.round(value.lowPrice * phpPerQuote * 100),
				volume: value.volume,
				asOf: value.closeTime,
				phpPerQuote,
				rateDate: fx.date,
			};
			if (
				result.unitPriceCentavos <= 0 ||
				result.unitPriceCentavos > MAX_CENTAVOS ||
				!quoteIsFresh(result.asOf, Date.now())
			)
				fail("BAD_REQUEST", FEED_ERROR);
			return result;
		}),
	);
}

export function getBitcoinChart(range: BitcoinRange) {
	const { interval, limit } = BITCOIN_CANDLES[range];
	return chartCache(range, () =>
		read(
			`klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`,
			z.array(candle).min(2),
		).then((rows) =>
			rows
				.map(([time, open, high, low, close, volume]) => ({
					time,
					open,
					high,
					low,
					close,
					volume,
				}))
				.sort((a, b) => a.time - b.time),
		),
	);
}
