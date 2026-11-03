const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365;
const MAX_SAVINGS_CENTAVOS = 2_000_000_000;

type Savings = {
	balance: number;
	annualInterestRate: number;
	interestRemainder: number;
	interestCalculatedAt: Date;
};

const daysBetween = (from: Date, to: Date) =>
	Math.max(0, (to.getTime() - from.getTime()) / DAY_MS);

const dailyGrowth = (annualRate: number, days: number) =>
	Math.exp(days * Math.log1p(annualRate / DAYS_PER_YEAR));

export function compoundInterest(savings: Savings, now: Date) {
	const days = daysBetween(savings.interestCalculatedAt, now);
	if (!Number.isFinite(days)) throw new Error("Invalid savings date.");
	if (days === 0) return { ...savings, earned: 0, days: 0 };

	const exactBalance =
		(savings.balance + savings.interestRemainder) *
		dailyGrowth(savings.annualInterestRate, days);
	const balance = Math.floor(exactBalance);

	if (!Number.isSafeInteger(balance) || balance > MAX_SAVINGS_CENTAVOS) {
		throw new Error("Savings interest exceeds the account limit.");
	}

	return {
		...savings,
		balance,
		interestRemainder: exactBalance - balance,
		interestCalculatedAt: now,
		earned: balance - savings.balance,
		days,
	};
}
