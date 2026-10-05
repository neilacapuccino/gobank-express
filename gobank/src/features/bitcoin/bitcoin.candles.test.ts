import assert from "node:assert/strict";
import test from "node:test";
import { mergeLiveCandle, parseCandleUpdate } from "./bitcoin.candles";
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
  s: "BTCUSD",
  k: {
    t: 60_000,
    s: "BTCUSD",
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
});
void test("rollover bounds the window and late bars are ignored", () => {
  const points = [{ ...candle, time: 0 }, candle];
  const next = mergeLiveCandle(points, { ...candle, time: 120_000 }, 2);
  assert.deepEqual(
    next.map((p) => p.time),
    [60_000, 120_000],
  );
  assert.equal(mergeLiveCandle(points, { ...candle, time: 0 }, 2), points);
});
void test("stream messages require matching symbol, interval, freshness and OHLC bounds", () => {
  assert.deepEqual(parseCandleUpdate(event, "1m", 90_010), {
    asOf: 90_000,
    candle,
  });
  assert.equal(parseCandleUpdate(event, "1h", 90_010), null);
  assert.equal(parseCandleUpdate(event, "1m", 160_000), null);
  assert.equal(
    parseCandleUpdate({ ...event, s: "BTCUSDT" }, "1m", 90_010),
    null,
  );
  assert.equal(
    parseCandleUpdate({ ...event, k: { ...event.k, h: "8" } }, "1m", 90_010),
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
});
void test("ranges use minute short candles and a year of daily candles", () => {
  assert.deepEqual(BITCOIN_RANGES, ["1MIN", "1H", "1W", "1M", "1Y"]);
  assert.equal(BITCOIN_CANDLES["1MIN"].interval, "1m");
  assert.equal(BITCOIN_CANDLES["1H"].limit, 60);
  assert.equal(BITCOIN_CANDLES["1Y"].limit, 365);
});
