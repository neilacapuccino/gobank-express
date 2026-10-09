import assert from "node:assert/strict";
import { test } from "node:test";
import { isPesoInput } from "./amount-input";
import { toCentavos } from "./money";

void test("amounts preserve centavos and partial typing while rejecting malformed values", () => {
	for (const value of ["", ".", ".5", "12.", "12.34"])
		assert.equal(isPesoInput(value), true, value);
	assert.equal(toCentavos(Number("12.34")), 1234);
	for (const value of ["-5", "1.234", "1.2.3", "1e3", "1,000"])
		assert.equal(isPesoInput(value), false, value);
});
