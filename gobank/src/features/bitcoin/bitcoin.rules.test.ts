import assert from "node:assert/strict";
import test from "node:test";
import {
	calculateTrade,
	summarizeTrades,
	type TradingBalances,
} from "./bitcoin.rules";
import {
	BITCOIN_FEE_CENTAVOS,
	btc,
	parseUnits,
	quoteIsFresh,
	SATOSHIS,
} from "./bitcoin.types";

const FUNDED_CASH = 1_000_000;
const empty = (): TradingBalances => ({
	cashCentavos: FUNDED_CASH,
	satoshis: 0n,
	costBasisCentavos: 0,
	realizedCentavos: 0,
});

void test("trade history reproduces holdings and profit without mutating records", () => {
	const trades = Object.freeze([
		Object.freeze({ side: "buy", satoshis: SATOSHIS, phpCentavos: 10_000_000 }),
		Object.freeze({ side: "buy", satoshis: SATOSHIS, phpCentavos: 20_000_000 }),
		Object.freeze({
			side: "sell",
			satoshis: SATOSHIS / 2n,
			phpCentavos: 10_000_000,
		}),
	]);
	assert.deepEqual(summarizeTrades(trades), {
		satoshis: (SATOSHIS * 3n) / 2n,
		costBasisCentavos: 22_500_000,
		realizedCentavos: 2_500_000,
	});
	const sold = summarizeTrades([
		...trades,
		{ side: "sell", satoshis: (SATOSHIS * 3n) / 2n, phpCentavos: 25_000_000 },
	]);
	assert.deepEqual(sold, {
		satoshis: 0n,
		costBasisCentavos: 0,
		realizedCentavos: 5_000_000,
	});
	assert.deepEqual(summarizeTrades([]), {
		satoshis: 0n,
		costBasisCentavos: 0,
		realizedCentavos: 0,
	});
	assert.throws(() =>
		summarizeTrades([{ side: "sell", satoshis: 1n, phpCentavos: 100 }]),
	);
});

void test("fractional buys and full sales preserve balances and clear cost basis", () => {
	const bought = calculateTrade(
		empty(),
		{ side: "buy", cashCentavos: 10_000 },
		10_000_000,
	);
	assert.equal(bought.satoshis, 100_000n);
	assert.equal(bought.next.cashCentavos, 989_000);
	assert.equal(bought.next.costBasisCentavos, 11_000);
	const sold = calculateTrade(
		bought.next,
		{ side: "sell", satoshis: bought.satoshis },
		11_000_000,
	);
	assert.deepEqual(sold.next, {
		cashCentavos: 999_000,
		satoshis: 0n,
		costBasisCentavos: 0,
		realizedCentavos: -1_000,
	});
});

void test("partial sales realize only the sold portion's average cost", () => {
	const account = {
		cashCentavos: 0,
		satoshis: SATOSHIS,
		costBasisCentavos: 10_000_000,
		realizedCentavos: 0,
	};
	const sold = calculateTrade(
		account,
		{ side: "sell", satoshis: SATOSHIS / 4n },
		8_000_000,
	);
	assert.equal(sold.cashCentavos, 1_999_000);
	assert.equal(sold.realizedCentavos, -501_000);
	assert.equal(sold.next.costBasisCentavos, 7_500_000);
	assert.equal(sold.next.satoshis, (SATOSHIS * 3n) / 4n);
});

void test("insufficient funds, overselling, invalid amounts and tiny sales are rejected", () => {
	assert.throws(
		() =>
			calculateTrade(
				empty(),
				{ side: "buy", cashCentavos: FUNDED_CASH + 1 },
				10_000_000,
			),
		/PHP/,
	);
	assert.throws(
		() => calculateTrade(empty(), { side: "sell", satoshis: 1n }, 10_000_000),
		/Bitcoin/,
	);
	assert.throws(
		() =>
			calculateTrade(empty(), { side: "buy", cashCentavos: 99 }, 10_000_000),
		/at least/,
	);
	assert.throws(() =>
		calculateTrade(empty(), { side: "buy", cashCentavos: 100.5 }, 10_000_000),
	);
	assert.throws(() =>
		calculateTrade(empty(), { side: "buy", cashCentavos: 100 }, Number.NaN),
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
			{ side: "buy", cashCentavos: 1_100 + index * 173 },
			price,
		);
		const sell = calculateTrade(
			buy.next,
			{ side: "sell", satoshis: buy.satoshis },
			price,
		);
		assert.ok(sell.next.cashCentavos <= FUNDED_CASH - 2 * BITCOIN_FEE_CENTAVOS);
		assert.ok(
			sell.next.cashCentavos >= FUNDED_CASH - 2 * BITCOIN_FEE_CENTAVOS - 1,
		);
		assert.equal(sell.next.costBasisCentavos, 0);
		assert.equal(sell.next.satoshis, 0n);
	}
});

void test("fixed fees must fit the buy balance and leave positive sale proceeds", () => {
	const account = { ...empty(), cashCentavos: 11_000 };
	const buy = calculateTrade(
		account,
		{ side: "buy", cashCentavos: 10_000 },
		10_000_000,
	);
	assert.equal(buy.tradeCentavos, 10_000);
	assert.equal(buy.feeCentavos, 1_000);
	assert.equal(buy.cashCentavos, 11_000);
	assert.equal(buy.next.cashCentavos, 0);
	assert.throws(
		() =>
			calculateTrade(
				{ ...account, cashCentavos: 10_999 },
				{ side: "buy", cashCentavos: 10_000 },
				10_000_000,
			),
		/Not enough PHP/,
	);
	assert.throws(
		() =>
			calculateTrade(buy.next, { side: "sell", satoshis: 10_000n }, 10_000_000),
		/exceed.*fee/,
	);
	const sale = calculateTrade(
		buy.next,
		{ side: "sell", satoshis: 10_010n },
		10_000_000,
	);
	assert.equal(sale.tradeCentavos, 1_001);
	assert.equal(sale.cashCentavos, 1);
	assert.equal(sale.next.cashCentavos, 1);
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
