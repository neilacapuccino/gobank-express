import { z } from "zod";
import { quoteIsFresh, type BitcoinCandle } from "./bitcoin.types";

const price = z.coerce.number().finite().positive();
const update = z.object({
  e: z.literal("kline"),
  E: z.number().int().positive(),
  s: z.literal("BTCUSD"),
  k: z.object({
    t: z.number().int().positive(),
    s: z.literal("BTCUSD"),
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
  if (!last || candle.time < last.time) return points;
  return (
    candle.time === last.time
      ? [...points.slice(0, -1), candle]
      : [...points, candle]
  ).slice(-limit);
}
