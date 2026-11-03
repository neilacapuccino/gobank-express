import assert from "node:assert/strict";
import { test } from "node:test";
import { isPesoInput } from "./amount-input";
import { toCentavos } from "./money";

void test("half-typed peso amounts are allowed while typing", () => {
	for (const value of ["", ".", ".5", "12.", "12.34"]) {
		assert.equal(isPesoInput(value), true, value);
	}
});

void test("negative, over-precise and formatted amounts are blocked", () => {
	for (const value of ["-5", "1.234", "1.2.3", "1e3", "1,000"]) {
		assert.equal(isPesoInput(value), false, value);
	}
});

void test("pesos convert to whole centavos without rounding errors", () => {
	assert.equal(toCentavos(Number("12.34")), 1234);
});
