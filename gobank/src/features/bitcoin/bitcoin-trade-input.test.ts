import assert from "node:assert/strict";
import { test } from "node:test";
import type { TradingBalances } from "./bitcoin.rules";
import {
	parseTradeInput,
	presetAmount,
	previewTrade,
} from "./bitcoin-trade-input";

const balances: TradingBalances = {
	cashCentavos: 1_000_000,
	bitcoinUnits: 100_000_000n,
	costBasisCentavos: 0,
	realizedCentavos: 0,
};

void test("an empty amount is not a trade and not an error", () => {
	assert.deepEqual(parseTradeInput("", "buy"), { trade: null, problem: "" });
});

void test("a peso amount becomes a buy in centavos", () => {
	assert.deepEqual(parseTradeInput("100", "buy").trade, {
		action: "buy",
		cashCentavos: 10_000,
	});
});

void test("a Bitcoin amount becomes a sell in satoshis", () => {
	assert.deepEqual(parseTradeInput("0.5", "sell").trade, {
		action: "sell",
		bitcoinUnits: 50_000_000n,
	});
});

void test("too many decimal places are refused", () => {
	assert.equal(
		parseTradeInput("12.345", "buy").problem,
		"Use up to 2 decimal places.",
	);
});

void test("zero amounts are refused for both buying and selling", () => {
	assert.equal(parseTradeInput("0", "buy").problem, "Enter at least ₱1.00.");
	assert.equal(
		parseTradeInput("0", "sell").problem,
		"Enter a Bitcoin amount greater than zero.",
	);
});

void test("a purchase above the account limit is refused", () => {
	assert.equal(
		parseTradeInput("20000000.01", "buy").problem,
		"This amount exceeds the account limit.",
	);
});

void test("the buy presets leave room for the ₱10 fee", () => {
	assert.equal(presetAmount(balances, "buy", 50), "4995.00");
	assert.equal(presetAmount(balances, "buy", 100), "9990.00");
});

void test("the sell presets use a share of the Bitcoin held", () => {
	assert.equal(presetAmount(balances, "sell", 25), "0.25000000");
});

void test("a preview explains why a trade cannot go through", () => {
	const result = previewTrade(
		balances,
		{ action: "buy", cashCentavos: 1_000_000 },
		10_000_000,
	);

	assert.equal(result.preview, null);
	assert.equal(result.problem, "Not enough PHP in your account.");
});
