import assert from "node:assert/strict";
import test from "node:test";
import { calculateTrade, type TradingBalances } from "./bitcoin.rules";
import { btc, parseUnits, quoteIsFresh, SATOSHIS } from "./bitcoin.types";

const FUNDED_CASH = 1_000_000;
const empty = (): TradingBalances => ({
  cashCents: FUNDED_CASH,
  satoshis: 0n,
  costBasisCents: 0,
  realizedCents: 0,
});

void test("fractional buys and full sales preserve balances and clear cost basis", () => {
  const bought = calculateTrade(
    empty(),
    { side: "buy", cashCents: 10_000 },
    10_000_000,
  );
  assert.equal(bought.satoshis, 100_000n);
  assert.equal(bought.next.cashCents, 990_000);
  assert.equal(bought.next.costBasisCents, 10_000);
  const sold = calculateTrade(
    bought.next,
    { side: "sell", satoshis: bought.satoshis },
    11_000_000,
  );
  assert.deepEqual(sold.next, {
    cashCents: 1_001_000,
    satoshis: 0n,
    costBasisCents: 0,
    realizedCents: 1_000,
  });
});

void test("partial sales realize only the sold portion's average cost", () => {
  const account = {
    cashCents: 0,
    satoshis: SATOSHIS,
    costBasisCents: 10_000_000,
    realizedCents: 0,
  };
  const sold = calculateTrade(
    account,
    { side: "sell", satoshis: SATOSHIS / 4n },
    8_000_000,
  );
  assert.equal(sold.cashCents, 2_000_000);
  assert.equal(sold.realizedCents, -500_000);
  assert.equal(sold.next.costBasisCents, 7_500_000);
  assert.equal(sold.next.satoshis, (SATOSHIS * 3n) / 4n);
});

void test("insufficient funds, overselling, invalid amounts and tiny sales are rejected", () => {
  assert.throws(
    () =>
      calculateTrade(
        empty(),
        { side: "buy", cashCents: FUNDED_CASH + 1 },
        10_000_000,
      ),
    /PHP/,
  );
  assert.throws(
    () => calculateTrade(empty(), { side: "sell", satoshis: 1n }, 10_000_000),
    /Bitcoin/,
  );
  assert.throws(
    () => calculateTrade(empty(), { side: "buy", cashCents: 99 }, 10_000_000),
    /at least/,
  );
  assert.throws(() =>
    calculateTrade(empty(), { side: "buy", cashCents: 100.5 }, 10_000_000),
  );
  assert.throws(() =>
    calculateTrade(empty(), { side: "buy", cashCents: 100 }, Number.NaN),
  );
  assert.throws(
    () =>
      calculateTrade(
        { ...empty(), satoshis: 1n },
        { side: "sell", satoshis: 1n },
        10_000_000,
      ),
    /less than/,
  );
});

void test("round trips at the same price never manufacture cash through rounding", () => {
  for (let index = 1; index <= 250; index++) {
    const price = 8_000_001 + index * 13_357;
    const buy = calculateTrade(
      empty(),
      { side: "buy", cashCents: 100 + index * 173 },
      price,
    );
    const sell = calculateTrade(
      buy.next,
      { side: "sell", satoshis: buy.satoshis },
      price,
    );
    assert.ok(sell.next.cashCents <= FUNDED_CASH);
    assert.ok(sell.next.cashCents >= FUNDED_CASH - 1);
    assert.equal(sell.next.costBasisCents, 0);
    assert.equal(sell.next.satoshis, 0n);
  }
});

void test("decimal parsing is exact and rejects unsupported notation and precision", () => {
  assert.equal(parseUnits("0.00000001", 8), 1n);
  assert.equal(parseUnits("1.25", 2), 125n);
  assert.equal(btc(123456789n), "1.23456789");
  for (const invalid of ["-1", "1e8", "NaN", "1,000", "1.001", "1.2.3"])
    assert.equal(parseUnits(invalid, 2), null);
});

void test("stale, future and invalid quotes are not tradeable", () => {
  assert.equal(quoteIsFresh(100_000, 105_000), true);
  assert.equal(quoteIsFresh(100_000, 160_000), false);
  assert.equal(quoteIsFresh(120_000, 100_000), false);
  assert.equal(quoteIsFresh(Number.NaN, 100_000), false);
});
