import assert from "node:assert/strict";
import test from "node:test";
import {
	calculateTrade,
	summarizeTrades,
	type TradingBalances,
} from "./bitcoin.rules";
import { btc, parseUnits, quoteIsFresh } from "./bitcoin.types";

const funded = (): TradingBalances => ({
	cashCentavos: 1_000_000,
	bitcoinUnits: 0n,
	costBasisCentavos: 0,
	realizedCentavos: 0,
});

void test("buying and selling apply fees and rounding and produce consistent history", () => {
	const bought = calculateTrade(
		funded(),
		{ action: "buy", cashCentavos: 10_000 },
		10_000_001,
	);
	assert.equal(bought.bitcoinUnits, 99_999n);
	assert.equal(bought.feeCentavos, 1_000);
	assert.equal(bought.next.cashCentavos, 989_000);
	assert.equal(bought.next.costBasisCentavos, 11_000);
	const sold = calculateTrade(
		bought.next,
		{ action: "sell", bitcoinUnits: bought.bitcoinUnits },
		10_000_001,
	);
	assert.deepEqual(sold.next, {
		cashCentavos: 997_999,
		bitcoinUnits: 0n,
		costBasisCentavos: 0,
		realizedCentavos: -2_001,
	});
	assert.equal(
		summarizeTrades([
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
		]).realizedCentavos,
		-2_001,
	);
});

void test("money guards reject insufficient funds, overselling and invalid amounts", () => {
	assert.throws(
		() =>
			calculateTrade(
				funded(),
				{ action: "buy", cashCentavos: 1_000_000 },
				10_000_000,
			),
		/Not enough PHP/,
	);
	assert.throws(
		() =>
			calculateTrade(
				funded(),
				{ action: "sell", bitcoinUnits: 1n },
				10_000_000,
			),
		/Not enough Bitcoin/,
	);
	assert.throws(
		() =>
			calculateTrade(
				funded(),
				{ action: "buy", cashCentavos: 100.5 },
				10_000_000,
			),
		/at least/,
	);
});

void test("trade inputs retain decimal precision and require a fresh quote", () => {
	assert.equal(parseUnits("0.00000001", 8), 1n);
	assert.equal(parseUnits("1.25", 2), 125n);
	assert.equal(btc(123456789n), "1.23456789");
	for (const value of ["-1", "1e8", "1.001"])
		assert.equal(parseUnits(value, 2), null);
	assert.equal(quoteIsFresh(100_000, 105_000), true);
	assert.equal(quoteIsFresh(100_000, 160_000), false);
	assert.equal(quoteIsFresh(120_000, 100_000), false);
});
