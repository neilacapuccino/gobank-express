import assert from "node:assert/strict";
import test from "node:test";
import {
  groupCandles,
  mergeCandleHistory,
  mergeLiveCandle,
  parseCandleUpdate,
} from "./bitcoin.candles";
import { BITCOIN_CANDLES, BITCOIN_RANGES } from "./bitcoin.types";

const candle = {
  time: 60_000,
  open: 10,
  high: 12,
  low: 9,
  close: 11,
  volume: 1,
};
const event = {
  e: "kline",
  E: 90_000,
  s: "BTCUSDT",
  k: {
    t: 60_000,
    s: "BTCUSDT",
    i: "1m",
    o: "10",
    h: "12",
    l: "9",
    c: "11",
    v: "1",
  },
};

void test("live OHLC replaces the current bar without duplicates", () => {
  const points = [{ ...candle, time: 0 }, candle];
  const changed = { ...candle, high: 13, close: 12 };
  const next = mergeLiveCandle(points, changed, 60);
  assert.equal(next.length, 2);
  assert.deepEqual(next[1], changed);
  assert.equal(points[1]!.close, 11);
  assert.deepEqual(mergeLiveCandle([], candle, 60), [candle]);
});
void test("rollover bounds the window and delayed bars update the correct slot", () => {
  const points = [{ ...candle, time: 0 }, candle];
  const next = mergeLiveCandle(points, { ...candle, time: 120_000 }, 2);
  assert.deepEqual(
    next.map((p) => p.time),
    [60_000, 120_000],
  );
  assert.equal(
    mergeLiveCandle(points, { ...candle, time: 0, close: 12 }, 2)[0]!.close,
    12,
  );
  assert.deepEqual(mergeLiveCandle(next, { ...candle, time: 0 }, 2), next);
});
void test("streams require matching symbol, interval, freshness and OHLC bounds", () => {
  assert.deepEqual(parseCandleUpdate(event, "1m", 90_010), {
    asOf: 90_000,
    candle,
  });
  assert.deepEqual(
    parseCandleUpdate({ ...event, k: { ...event.k, i: "1s" } }, "1s", 90_010),
    { asOf: 90_000, candle },
  );
  assert.equal(parseCandleUpdate(event, "1h", 90_010), null);
  assert.equal(parseCandleUpdate(event, "1m", 160_000), null);
  assert.equal(
    parseCandleUpdate({ ...event, s: "BTCUSD" }, "1m", 90_010),
    null,
  );
  assert.equal(
    parseCandleUpdate(
      { ...event, k: { ...event.k, s: "ETHUSDT" } },
      "1m",
      90_010,
    ),
    null,
  );
  assert.equal(
    parseCandleUpdate({ ...event, k: { ...event.k, h: "8" } }, "1m", 90_010),
    null,
  );
  assert.equal(
    parseCandleUpdate({ ...event, k: { ...event.k, l: "12" } }, "1m", 90_010),
    null,
  );
  assert.equal(
    parseCandleUpdate(
      { ...event, k: { ...event.k, t: 120_000 } },
      "1m",
      90_010,
    ),
    null,
  );
  assert.equal(parseCandleUpdate({ ...event, E: 120_000 }, "1m", 90_010), null);
});
void test("the minute and hour views use sixty native candles", () => {
  assert.deepEqual(BITCOIN_RANGES, ["1MIN", "1H", "1W", "1M", "1Y"]);
  assert.equal(BITCOIN_CANDLES["1MIN"].interval, "1s");
  assert.equal(BITCOIN_CANDLES["1MIN"].limit, 60);
  assert.equal(BITCOIN_CANDLES["1H"].interval, "1m");
  assert.equal(BITCOIN_CANDLES["1H"].limit, 60);
  assert.equal(BITCOIN_CANDLES["1Y"].limit, 365);
});
void test("a delayed REST response cannot overwrite more complete streamed OHLC", () => {
  const old = [candle];
  const latest = [{ ...candle, close: 12, high: 12, volume: 2 }];
  assert.deepEqual(mergeCandleHistory(old, latest, 60), latest);
  assert.deepEqual(mergeCandleHistory(latest, old, 60), latest);
  assert.deepEqual(mergeCandleHistory(old, [{ ...candle, time: 120_000 }], 1), [
    { ...candle, time: 120_000 },
  ]);
});

void test("grouped candles preserve actual opens, extrema, closes and traded volume", () => {
  const points = [
    { ...candle, time: 60_000 },
    {
      ...candle,
      time: 61_000,
      open: 11,
      high: 14,
      low: 10,
      close: 13,
      volume: 2,
    },
    {
      ...candle,
      time: 62_000,
      open: 13,
      high: 13,
      low: 8,
      close: 9,
      volume: 3,
    },
    { ...candle, time: 63_000 },
  ];
  assert.deepEqual(groupCandles(points, 3_000), [
    { time: 60_000, open: 10, high: 14, low: 8, close: 9, volume: 6 },
    { ...candle, time: 63_000 },
  ]);
  assert.equal(points[0]!.close, 11);
  assert.deepEqual(groupCandles([], 3_000), []);
});
