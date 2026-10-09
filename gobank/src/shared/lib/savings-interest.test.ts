import assert from "node:assert/strict";
import test from "node:test";
import { compoundInterest } from "./savings-interest";

const start = new Date("2026-01-01T00:00:00Z");
const savings = {
	balance: 100_000,
	annualInterestRate: 0.04,
	interestRemainder: 0,
	interestCalculatedAt: start,
};
const day = (days: number) => new Date(start.getTime() + days * 86_400_000);

void test("daily compounding earns interest once without changing the original savings", () => {
	const result = compoundInterest(savings, day(365));
	assert.equal(result.balance, 104_080);
	assert.equal(result.earned, 4_080);
	assert.equal(savings.balance, 100_000);
	assert.equal(compoundInterest(result, day(365)).earned, 0);
	assert.equal(compoundInterest(result, start).earned, 0);
});

void test("fractional centavos survive repeated visits", () => {
	let frequent = { ...savings, balance: 100 };
	for (let index = 1; index <= 365; index++)
		frequent = compoundInterest(frequent, day(index));
	assert.equal(
		frequent.balance,
		compoundInterest({ ...savings, balance: 100 }, day(365)).balance,
	);
	assert.equal(frequent.balance, 104);
});
