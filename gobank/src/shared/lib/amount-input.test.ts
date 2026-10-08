import assert from "node:assert/strict";
import { test } from "node:test";
import { isPesoInput } from "./amount-input";
import { toCentavos } from "./money";

void test("peso input preserves centavos and partially typed decimal amounts", () => {
	for (const value of ["", "0", ".", ".5", "12.", "12.34", "1000000.00"]) {
		assert.equal(isPesoInput(value), true, value);
	}
	assert.equal(toCentavos(Number("12.34")), 1234);
});

void test("peso input rejects malformed amounts instead of stripping punctuation", () => {
	for (const value of [
		"-5",
		"1.234",
		"1.2.3",
		"1e3",
		"12abc",
		"1,000",
		"12345678",
	]) {
		assert.equal(isPesoInput(value), false, value);
	}
});
