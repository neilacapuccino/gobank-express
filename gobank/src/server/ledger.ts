import {
	MAX_BALANCE_CENTAVOS,
	MAX_REWARD_POINTS,
	pointsEarned,
} from "~/shared/lib/money";
import { compoundInterest } from "~/shared/lib/savings-interest";
import { newReference } from "~/server/identifiers";
import { asDatabaseError, fail, MESSAGES } from "~/server/errors";
import type {
	CardKind,
	Prisma,
	SavingsGoal,
	TransactionKind,
} from "../../generated/prisma";

type Tx = Prisma.TransactionClient;

type Party = { id: string; username: string };

type Entry = {
	userId: string;
	kind: TransactionKind;
	title: string;
	amount: number;
	reference?: string;
	points?: number;
	counterpartyId?: string;
	savingsGoalId?: string;
	billerId?: string;
	details?: Prisma.InputJsonObject;
};

type Spending = Omit<Entry, "points"> & { card: CardKind };

const SPENDING_KINDS: TransactionKind[] = ["transfer", "bill", "load"];
const KINDS_THAT_EARN_POINTS: TransactionKind[] = ["transfer", "bill"];

const startOfManilaDay = (now: Date) => {
	const manilaDate = now.toLocaleDateString("en-CA", {
		timeZone: "Asia/Manila",
	});

	return new Date(`${manilaDate}T00:00:00+08:00`);
};

async function orFailWith<T>(
	conditionalUpdate: Promise<T>,
	explainFailure: string | (() => Promise<string>),
) {
	try {
		return await conditionalUpdate;
	} catch (error) {
		const noRowMatched = asDatabaseError(error)?.code === "P2025";
		if (!noRowMatched) throw error;

		const message =
			typeof explainFailure === "string"
				? explainFailure
				: await explainFailure();
		return fail("BAD_REQUEST", message);
	}
}

async function whyPostFailed(
	tx: Tx,
	userId: string,
	amount: number,
	points: number,
) {
	const current = await tx.user.findUniqueOrThrow({
		where: { id: userId },
		select: { balance: true, points: true },
	});

	if (current.balance + amount < 0) return MESSAGES.insufficientBalance;
	if (current.points + points < 0) return MESSAGES.notEnoughPoints;
	return MESSAGES.accountLimit;
}

export async function post(
	tx: Tx,
	{ userId, amount, points = 0, reference = newReference(), ...rest }: Entry,
) {
	const moneyOut = Math.max(0, -amount);
	const moneyIn = Math.max(0, amount);
	const pointsOut = Math.max(0, -points);
	const pointsIn = Math.max(0, points);

	const user = await orFailWith(
		tx.user.update({
			where: {
				id: userId,
				balance: { gte: moneyOut, lte: MAX_BALANCE_CENTAVOS - moneyIn },
				points: { gte: pointsOut, lte: MAX_REWARD_POINTS - pointsIn },
			},
			data: {
				balance: { increment: amount },
				points: { increment: points },
			},
			select: { balance: true },
		}),
		() => whyPostFailed(tx, userId, amount, points),
	);

	return tx.transaction.create({
		data: {
			...rest,
			userId,
			amount,
			points,
			reference,
			balanceAfter: user.balance,
		},
	});
}

export async function spentToday(tx: Tx, userId: string) {
	const today = await tx.transaction.aggregate({
		where: {
			userId,
			kind: { in: SPENDING_KINDS },
			amount: { lt: 0 },
			createdAt: { gte: startOfManilaDay(new Date()) },
		},
		_sum: { amount: true },
	});

	return -(today._sum.amount ?? 0);
}

export async function spend(tx: Tx, { card, ...entry }: Spending) {
	await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${entry.userId} FOR UPDATE`;

	const user = await tx.user.findUniqueOrThrow({
		where: { id: entry.userId },
		select: {
			cardDailyLimit: true,
			cards: {
				where: { kind: card },
				select: { brand: true, number: true, locked: true },
			},
		},
	});

	const usedCard = user.cards[0];
	if (!usedCard) return fail("NOT_FOUND", MESSAGES.cardNotFound);
	if (usedCard.locked) fail("BAD_REQUEST", MESSAGES.cardLocked);

	const spent = await spentToday(tx, entry.userId);
	if (spent + entry.amount > user.cardDailyLimit) {
		fail("BAD_REQUEST", MESSAGES.overDailyLimit);
	}

	const earnsPoints = KINDS_THAT_EARN_POINTS.includes(entry.kind);

	return post(tx, {
		...entry,
		amount: -entry.amount,
		points: earnsPoints ? pointsEarned(entry.amount) : 0,
		details: {
			...entry.details,
			card: {
				kind: card,
				network: usedCard.brand,
				last4: usedCard.number.slice(-4),
			},
		},
	});
}

export async function transfer(
	tx: Tx,
	from: Party,
	to: Party,
	amount: number,
	card: CardKind,
	note?: string | null,
) {
	await tx.$queryRaw`
		SELECT "id" FROM "User"
		WHERE "id" IN (${from.id}, ${to.id})
		ORDER BY "id" FOR UPDATE
	`;

	const reference = newReference();
	const details = note ? { note } : undefined;

	const sent = await spend(tx, {
		userId: from.id,
		kind: "transfer",
		title: `Transfer to @${to.username}`,
		amount,
		reference,
		counterpartyId: to.id,
		details,
		card,
	});

	await post(tx, {
		userId: to.id,
		kind: "transfer",
		title: `Transfer from @${from.username}`,
		amount,
		reference,
		counterpartyId: from.id,
		details,
	});

	return sent;
}

export async function moveStash(
	tx: Tx,
	userId: string,
	savingsGoalId: string,
	amount: number,
) {
	const savingsGoal = await orFailWith(
		tx.savingsGoal.update({
			where: { id: savingsGoalId, userId, balance: { gte: -amount } },
			data: { balance: { increment: amount } },
		}),
		MESSAGES.notEnoughInStash,
	);

	const action = amount > 0 ? "deposit" : "withdrawal";

	return post(tx, {
		userId,
		kind: "stash",
		title: `GoalSave ${action} · ${savingsGoal.name}`,
		amount: -amount,
		savingsGoalId,
	});
}

async function recordInterest(
	tx: Tx,
	savingsGoal: SavingsGoal,
	result: ReturnType<typeof compoundInterest>,
) {
	const user = await tx.user.findUniqueOrThrow({
		where: { id: savingsGoal.userId },
		select: { balance: true },
	});

	await tx.transaction.create({
		data: {
			userId: savingsGoal.userId,
			savingsGoalId: savingsGoal.id,
			reference: newReference(),
			kind: "interest",
			title: `Interest earned · ${savingsGoal.name}`,
			amount: result.earned,
			balanceAfter: user.balance,
			details: {
				savingsBalanceAfter: result.balance,
				annualRate: savingsGoal.annualInterestRate,
				days: result.days,
			},
		},
	});
}

export async function settleStashInterest(
	tx: Tx,
	savingsGoal: SavingsGoal,
	persist = false,
) {
	const result = compoundInterest(savingsGoal, new Date());

	const nothingToSave = result.days === 0 || (result.earned === 0 && !persist);
	if (nothingToSave) return savingsGoal;

	const settled = {
		balance: result.balance,
		interestRemainder: result.interestRemainder,
		interestCalculatedAt: result.interestCalculatedAt,
		updatedAt: result.interestCalculatedAt,
	};

	const updated = await tx.savingsGoal.updateMany({
		where: {
			id: savingsGoal.id,
			userId: savingsGoal.userId,
			balance: savingsGoal.balance,
			interestCalculatedAt: savingsGoal.interestCalculatedAt,
		},
		data: settled,
	});
	if (updated.count !== 1) fail("CONFLICT", MESSAGES.savingsChanged);

	if (result.earned > 0) await recordInterest(tx, savingsGoal, result);

	return { ...savingsGoal, ...settled };
}
