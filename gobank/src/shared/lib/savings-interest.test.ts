import assert from "node:assert/strict";
import test from "node:test";
import { compoundInterest } from "./savings-interest";

const START = new Date("2026-01-01T00:00:00Z");
const ONE_DAY = 86_400_000;

const savings = {
	balance: 100_000,
	annualInterestRate: 0.04,
	interestRemainder: 0,
	interestCalculatedAt: START,
};

const daysLater = (days: number) => new Date(START.getTime() + days * ONE_DAY);

void test("a year of daily compounding at 4% earns the expected interest", () => {
	const result = compoundInterest(savings, daysLater(365));

	assert.equal(result.balance, 104_080);
	assert.equal(result.earned, 4_080);
});

void test("calculating interest does not change the original savings", () => {
	compoundInterest(savings, daysLater(365));

	assert.equal(savings.balance, 100_000);
});

void test("interest is never paid twice for the same days", () => {
	const afterOneYear = compoundInterest(savings, daysLater(365));

	assert.equal(compoundInterest(afterOneYear, daysLater(365)).earned, 0);
	assert.equal(compoundInterest(afterOneYear, START).earned, 0);
});

void test("checking every day earns the same as checking once a year", () => {
	let checkedDaily = { ...savings, balance: 100 };
	for (let day = 1; day <= 365; day++) {
		checkedDaily = compoundInterest(checkedDaily, daysLater(day));
	}

	const checkedOnce = compoundInterest(
		{ ...savings, balance: 100 },
		daysLater(365),
	);

	assert.equal(checkedDaily.balance, checkedOnce.balance);
	assert.equal(checkedDaily.balance, 104);
});
