import {
	MAX_BALANCE_CENTAVOS,
	MAX_REWARD_POINTS,
	pointsEarned,
} from "~/shared/lib/money";
import { compoundInterest } from "~/shared/lib/savings-interest";
import { newReference } from "~/server/codes";
import { asDatabaseError, fail, MESSAGES } from "~/server/errors";
import type {
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
	details?: Prisma.InputJsonValue;
};

const SPENDING: TransactionKind[] = ["transfer", "bill", "load"];

const startOfManilaDay = (now: Date) =>
	new Date(
		`${now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })}T00:00:00+08:00`,
	);

const guard = <T>(
	query: Promise<T>,
	message: string | (() => Promise<string>),
) =>
	query.catch(async (error: unknown) => {
		if (asDatabaseError(error)?.code === "P2025") {
			return fail(
				"BAD_REQUEST",
				typeof message === "string" ? message : await message(),
			);
		}
		throw error;
	});

export async function post(
	tx: Tx,
	{ userId, amount, points = 0, reference = newReference(), ...rest }: Entry,
) {
	const user = await guard(
		tx.user.update({
			where: {
				id: userId,
				balance: {
					gte: Math.max(0, -amount),
					lte: MAX_BALANCE_CENTAVOS - Math.max(0, amount),
				},
				points: {
					gte: Math.max(0, -points),
					lte: MAX_REWARD_POINTS - Math.max(0, points),
				},
			},
			data: {
				balance: { increment: amount },
				points: { increment: points },
			},
			select: { balance: true },
		}),
		async () => {
			const current = await tx.user.findUniqueOrThrow({
				where: { id: userId },
				select: { balance: true, points: true },
			});
			if (current.balance + amount < 0) return MESSAGES.insufficientBalance;
			if (current.points + points < 0) return MESSAGES.notEnoughPoints;
			return MESSAGES.accountLimit;
		},
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

export async function spend(tx: Tx, entry: Omit<Entry, "points">) {
	// Serialize spending before reading today's total.
	await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${entry.userId} FOR UPDATE`;
	const user = await tx.user.findUniqueOrThrow({
		where: { id: entry.userId },
		select: { cardLocked: true, cardDailyLimit: true },
	});
	if (user.cardLocked) fail("BAD_REQUEST", MESSAGES.cardLocked);

	const today = await tx.transaction.aggregate({
		where: {
			userId: entry.userId,
			kind: { in: SPENDING },
			amount: { lt: 0 },
			createdAt: { gte: startOfManilaDay(new Date()) },
		},
		_sum: { amount: true },
	});
	if (entry.amount - (today._sum.amount ?? 0) > user.cardDailyLimit) {
		fail("BAD_REQUEST", MESSAGES.overDailyLimit);
	}

	return post(tx, {
		...entry,
		amount: -entry.amount,
		points: pointsEarned(entry.amount),
	});
}

export async function transfer(
	tx: Tx,
	from: Party,
	to: Party,
	amount: number,
	note?: string | null,
) {
	// Opposite transfers lock both accounts in the same order.
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
		title: `Sent to @${to.username}`,
		amount,
		reference,
		counterpartyId: to.id,
		details,
	});
	await post(tx, {
		userId: to.id,
		kind: "transfer",
		title: `Received from @${from.username}`,
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
	const savingsGoal = await guard(
		tx.savingsGoal.update({
			where: { id: savingsGoalId, userId, balance: { gte: -amount } },
			data: { balance: { increment: amount } },
		}),
		MESSAGES.notEnoughInStash,
	);

	return post(tx, {
		userId,
		kind: "stash",
		title:
			amount > 0
				? `Moved to ${savingsGoal.name}`
				: `Moved from ${savingsGoal.name}`,
		amount: -amount,
		savingsGoalId,
	});
}

export async function settleStashInterest(tx: Tx, savingsGoal: SavingsGoal) {
	const result = compoundInterest(savingsGoal, new Date());
	if (result.days === 0) return savingsGoal;
	const data = {
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
		data,
	});
	if (updated.count !== 1)
		fail("CONFLICT", "Your savings changed. Please try again.");
	if (result.earned > 0) {
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
				title: `Interest in ${savingsGoal.name}`,
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
	return {
		...savingsGoal,
		...data,
	};
}
