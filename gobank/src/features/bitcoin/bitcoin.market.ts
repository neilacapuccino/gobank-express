import "server-only";
import { z } from "zod";
import { fail } from "~/server/errors";
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
type Cache<T> = { expires: number; promise: Promise<T> };
let quoteCache: Cache<BitcoinQuote> | undefined;
const charts = new Map<BitcoinRange, Cache<BitcoinCandle[]>>();

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

export async function getBitcoinQuote(): Promise<BitcoinQuote> {
	if (!quoteCache || quoteCache.expires <= Date.now()) {
		const entry = {
			expires: Date.now() + 5_000,
			promise: Promise.all([
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
					priceCentavos: Math.round(value.lastPrice * phpPerQuote * 100),
					openCentavos: Math.round(value.openPrice * phpPerQuote * 100),
					highCentavos: Math.round(value.highPrice * phpPerQuote * 100),
					lowCentavos: Math.round(value.lowPrice * phpPerQuote * 100),
					volume: value.volume,
					asOf: value.closeTime,
					phpPerQuote,
					rateDate: fx.date,
				};
				if (
					result.priceCentavos <= 0 ||
					result.priceCentavos > MAX_CENTAVOS ||
					!quoteIsFresh(result.asOf, Date.now())
				)
					fail("BAD_REQUEST", FEED_ERROR);
				return result;
			}),
		};
		quoteCache = entry;
		entry.promise.catch(() => {
			if (quoteCache === entry) quoteCache = undefined;
		});
	}
	return quoteCache.promise;
}

export function getBitcoinChart(range: BitcoinRange) {
	const existing = charts.get(range);
	if (existing && existing.expires > Date.now()) return existing.promise;
	const { interval, limit } = BITCOIN_CANDLES[range];
	const entry = {
		expires: Date.now() + (range === "1MIN" ? 2_000 : 5_000),
		promise: read(
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
	};
	charts.set(range, entry);
	entry.promise.catch(() => {
		if (charts.get(range) === entry) charts.delete(range);
	});
	return entry.promise;
}
