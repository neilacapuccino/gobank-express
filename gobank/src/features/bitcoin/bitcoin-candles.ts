import { z } from "zod";
import { quoteIsFresh, type BitcoinCandle } from "./bitcoin.types";

const price = z.coerce.number().finite().positive();

const binanceKlineMessage = z.object({
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
	const parsed = binanceKlineMessage.safeParse(value);
	if (!parsed.success) return null;

	const { E: sentAt, k: kline } = parsed.data;
	const candle: BitcoinCandle = {
		time: kline.t,
		open: kline.o,
		high: kline.h,
		low: kline.l,
		close: kline.c,
		volume: kline.v,
	};

	const wrongInterval = kline.i !== interval;
	const stale = !quoteIsFresh(sentAt, now);
	const startsAfterItWasSent = candle.time > sentAt;
	const impossibleRange =
		candle.low > Math.min(candle.open, candle.close) ||
		candle.high < Math.max(candle.open, candle.close);

	if (wrongInterval || stale || startsAfterItWasSent || impossibleRange) {
		return null;
	}

	return { asOf: sentAt, candle };
}

export function mergeLiveCandle(
	points: BitcoinCandle[],
	candle: BitcoinCandle,
	limit: number,
) {
	const last = points.at(-1);
	if (!last) return [candle];

	if (candle.time < last.time) {
		return points.map((point) => (point.time === candle.time ? candle : point));
	}

	const replacesLast = candle.time === last.time;
	const merged = replacesLast
		? [...points.slice(0, -1), candle]
		: [...points, candle];

	return merged.slice(-limit);
}

export function mergeCandleHistory(
	history: BitcoinCandle[],
	updates: BitcoinCandle[],
	limit: number,
) {
	const byTime = new Map(history.map((point) => [point.time, point]));

	for (const update of updates) {
		const existing = byTime.get(update.time);
		const isNewer = !existing || update.volume >= existing.volume;

		if (isNewer) byTime.set(update.time, update);
	}

	return [...byTime.values()].sort((a, b) => a.time - b.time).slice(-limit);
}

export function groupCandles(points: BitcoinCandle[], intervalMs: number) {
	const groups = new Map<number, BitcoinCandle>();

	for (const point of points) {
		const bucket = Math.floor(point.time / intervalMs) * intervalMs;
		const existing = groups.get(bucket);

		if (!existing) {
			groups.set(bucket, { ...point });
			continue;
		}

		groups.set(bucket, {
			...existing,
			high: Math.max(existing.high, point.high),
			low: Math.min(existing.low, point.low),
			close: point.close,
			volume: existing.volume + point.volume,
		});
	}

	return [...groups.values()];
}
