import assert from "node:assert/strict";
import test from "node:test";
import {
	calculateTrade,
	summarizeTrades,
	type TradingBalances,
} from "./bitcoin.rules";
import { btc, parseUnits, quoteIsFresh } from "./bitcoin.types";

const PRICE = 10_000_001;
const ROUND_PRICE = 10_000_000;

const fundedAccount = (): TradingBalances => ({
	cashCentavos: 1_000_000,
	bitcoinUnits: 0n,
	costBasisCentavos: 0,
	realizedCentavos: 0,
});

const buyFor = (cashCentavos: number) => ({
	action: "buy" as const,
	cashCentavos,
});

const sellUnits = (bitcoinUnits: bigint) => ({
	action: "sell" as const,
	bitcoinUnits,
});

void test("buying rounds the Bitcoin down and charges the ₱10 fee", () => {
	const bought = calculateTrade(fundedAccount(), buyFor(10_000), PRICE);

	assert.equal(bought.bitcoinUnits, 99_999n);
	assert.equal(bought.feeCentavos, 1_000);
	assert.equal(bought.next.cashCentavos, 989_000);
	assert.equal(bought.next.costBasisCentavos, 11_000);
});

void test("selling everything back records the loss from fees", () => {
	const bought = calculateTrade(fundedAccount(), buyFor(10_000), PRICE);
	const sold = calculateTrade(
		bought.next,
		sellUnits(bought.bitcoinUnits),
		PRICE,
	);

	assert.deepEqual(sold.next, {
		cashCentavos: 997_999,
		bitcoinUnits: 0n,
		costBasisCentavos: 0,
		realizedCentavos: -2_001,
	});
});

void test("replaying the saved trades gives the same result", () => {
	const bought = calculateTrade(fundedAccount(), buyFor(10_000), PRICE);
	const sold = calculateTrade(
		bought.next,
		sellUnits(bought.bitcoinUnits),
		PRICE,
	);

	const history = summarizeTrades([
		{
			action: "buy",
			bitcoinUnits: bought.bitcoinUnits,
			amountCentavos: bought.cashCentavos,
		},
		{
			action: "sell",
			bitcoinUnits: sold.bitcoinUnits,
			amountCentavos: sold.cashCentavos,
		},
	]);

	assert.equal(history.realizedCentavos, -2_001);
});

void test("a purchase larger than the cash balance is refused", () => {
	assert.throws(
		() => calculateTrade(fundedAccount(), buyFor(1_000_000), ROUND_PRICE),
		/Not enough PHP/,
	);
});

void test("selling Bitcoin you do not own is refused", () => {
	assert.throws(
		() => calculateTrade(fundedAccount(), sellUnits(1n), ROUND_PRICE),
		/Not enough Bitcoin/,
	);
});

void test("fractions of a centavo are refused", () => {
	assert.throws(
		() => calculateTrade(fundedAccount(), buyFor(100.5), ROUND_PRICE),
		/at least/,
	);
});

void test("Bitcoin amounts keep every decimal place", () => {
	assert.equal(parseUnits("0.00000001", 8), 1n);
	assert.equal(parseUnits("1.25", 2), 125n);
	assert.equal(btc(123456789n), "1.23456789");

	for (const value of ["-1", "1e8", "1.001"]) {
		assert.equal(parseUnits(value, 2), null, value);
	}
});

void test("a price quote is only used while it is fresh", () => {
	assert.equal(quoteIsFresh(100_000, 105_000), true);
	assert.equal(quoteIsFresh(100_000, 160_000), false);
	assert.equal(quoteIsFresh(120_000, 100_000), false);
});
