const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365;

type Savings = {
	balance: number;
	annualInterestRate: number;
	interestRemainder: number;
	interestCalculatedAt: Date;
};

// A = P × (1 + r / 365)^days. Keep fractions of a centavo for later credits.
export function compoundInterest(savings: Savings, now: Date) {
	const days = Math.max(
		0,
		(now.getTime() - savings.interestCalculatedAt.getTime()) / DAY_MS,
	);
	if (!Number.isFinite(days)) throw new Error("Invalid savings date.");
	if (days === 0) return { ...savings, earned: 0, days: 0 };
	const grown =
		(savings.balance + savings.interestRemainder) *
		Math.exp(days * Math.log1p(savings.annualInterestRate / DAYS_PER_YEAR));
	const balance = Math.floor(grown);
	if (!Number.isSafeInteger(balance) || balance > 2_000_000_000)
		throw new Error("Savings interest exceeds the account limit.");
	return {
		...savings,
		balance,
		interestRemainder: grown - balance,
		interestCalculatedAt: now,
		earned: balance - savings.balance,
		days,
	};
}
