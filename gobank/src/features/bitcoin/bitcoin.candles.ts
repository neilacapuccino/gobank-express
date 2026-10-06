import { z } from "zod";
import { quoteIsFresh, type BitcoinCandle } from "./bitcoin.types";

const price = z.coerce.number().finite().positive();
const update = z.object({
	e: z.literal("kline"),
	E: z.number().int().positive(),
	s: z.literal("BTCUSDT"),
	k: z.object({
		t: z.number().int().positive(),
		s: z.literal("BTCUSDT"),
		i: z.string(),
		o: price,
		h: price,
		l: price,
		c: price,
		v: z.coerce.number().finite().nonnegative(),
	}),
});

export function parseCandleUpdate(
	value: unknown,
	interval: string,
	now: number,
) {
	const result = update.safeParse(value);
	if (
		!result.success ||
		result.data.k.i !== interval ||
		!quoteIsFresh(result.data.E, now)
	)
		return null;
	const { k, E } = result.data;
	if (k.t > E || k.l > Math.min(k.o, k.c) || k.h < Math.max(k.o, k.c))
		return null;
	return {
		asOf: E,
		candle: {
			time: k.t,
			open: k.o,
			high: k.h,
			low: k.l,
			close: k.c,
			volume: k.v,
		},
	};
}

export function mergeLiveCandle(
	points: BitcoinCandle[],
	candle: BitcoinCandle,
	limit: number,
) {
	const last = points.at(-1);
	if (!last) return [candle];
	if (candle.time < last.time)
		return points.map((point) => (point.time === candle.time ? candle : point));
	return (
		candle.time === last.time
			? [...points.slice(0, -1), candle]
			: [...points, candle]
	).slice(-limit);
}

// A delayed REST response cannot replace a more complete streamed candle.
export function mergeCandleHistory(
	history: BitcoinCandle[],
	updates: BitcoinCandle[],
	limit: number,
) {
	const points = new Map(history.map((point) => [point.time, point]));
	for (const update of updates) {
		const existing = points.get(update.time);
		if (!existing || update.volume >= existing.volume)
			points.set(update.time, update);
	}
	return [...points.values()].sort((a, b) => a.time - b.time).slice(-limit);
}

// Combine real OHLC bars so short views have readable candle bodies and wicks.
export function groupCandles(points: BitcoinCandle[], intervalMs: number) {
	const groups = new Map<number, BitcoinCandle>();
	for (const point of points) {
		const bucket = Math.floor(point.time / intervalMs) * intervalMs;
		const existing = groups.get(bucket);
		groups.set(
			bucket,
			existing
				? {
						...existing,
						high: Math.max(existing.high, point.high),
						low: Math.min(existing.low, point.low),
						close: point.close,
						volume: existing.volume + point.volume,
					}
				: { ...point },
		);
	}
	return [...groups.values()];
}
