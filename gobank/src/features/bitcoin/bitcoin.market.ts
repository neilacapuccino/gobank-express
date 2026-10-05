import "server-only";
import { z } from "zod";
import { fail } from "~/server/errors";
import { getPhpRate } from "./bitcoin.fx";
import {
  MAX_CENTS,
  BITCOIN_CANDLES,
  quoteIsFresh,
  type BitcoinCandle,
  type BitcoinQuote,
  type BitcoinRange,
} from "./bitcoin.types";

const numeric = z.coerce.number().finite().positive();
const ticker = z.object({
  symbol: z.literal("BTCUSD"),
  lastPrice: numeric,
  openPrice: numeric,
  highPrice: numeric,
  lowPrice: numeric,
  volume: z.coerce.number().finite().nonnegative(),
  closeTime: z.number().int().positive(),
});
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

async function read<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  try {
    const response = await fetch(`https://api.binance.us/api/v3/${path}`, {
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
        read("ticker/24hr?symbol=BTCUSD", ticker),
        getPhpRate(),
      ]).then(([value, fx]) => {
        const result = {
          priceCents: Math.round(value.lastPrice * fx.rate * 100),
          openCents: Math.round(value.openPrice * fx.rate * 100),
          highCents: Math.round(value.highPrice * fx.rate * 100),
          lowCents: Math.round(value.lowPrice * fx.rate * 100),
          volume: value.volume,
          asOf: value.closeTime,
          phpPerUsd: fx.rate,
          rateDate: fx.date,
        };
        if (
          result.priceCents <= 0 ||
          result.priceCents > MAX_CENTS ||
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
    expires: Date.now() + 5_000,
    promise: read(
      `klines?symbol=BTCUSD&interval=${interval}&limit=${limit}`,
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
