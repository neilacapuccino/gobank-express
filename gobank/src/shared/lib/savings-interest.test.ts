import assert from "node:assert/strict";
import test from "node:test";
import { compoundInterest } from "./savings-interest";

const start = new Date("2026-01-01T00:00:00Z");
const savings = {
	balance: 100_000,
	interestRate: 0.04,
	interestCarry: 0,
	interestUpdatedAt: start,
};
const day = (days: number) => new Date(start.getTime() + days * 86_400_000);

void test("elapsed system time earns daily compound interest separately from main funds", () => {
	const result = compoundInterest(savings, day(365));
	assert.equal(result.balance, Math.floor(100_000 * (1 + 0.04 / 365) ** 365));
	assert.equal(result.earned, result.balance - savings.balance);
	assert.equal(savings.balance, 100_000);
	assert.equal(compoundInterest(result, day(365)).earned, 0);
	assert.equal(compoundInterest(result, start).earned, 0);
});

void test("fractional centavos survive repeated visits and changing principal", () => {
	let frequent = { ...savings, balance: 100 };
	for (let index = 1; index <= 365; index++)
		frequent = compoundInterest(frequent, day(index));
	assert.equal(
		frequent.balance,
		compoundInterest({ ...savings, balance: 100 }, day(365)).balance,
	);
	assert.ok(frequent.balance > 100);
	const beforeDeposit = compoundInterest(savings, day(30));
	const deposited = {
		...beforeDeposit,
		balance: beforeDeposit.balance + 50_000,
	};
	assert.equal(compoundInterest(deposited, day(30)).earned, 0);
	assert.ok(compoundInterest(deposited, day(31)).earned > 0);
	assert.equal(
		compoundInterest({ ...savings, balance: 0 }, day(365)).balance,
		0,
	);
});
