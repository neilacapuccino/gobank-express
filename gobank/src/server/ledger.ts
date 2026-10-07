import { pointsEarned } from "~/shared/lib/money";
import { compoundInterest } from "~/shared/lib/savings-interest";
import { newReference } from "~/server/codes";
import { asDatabaseError, fail, MESSAGES } from "~/server/errors";
import type { Prisma, TransactionKind } from "../../generated/prisma";

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
	stashId?: string;
	billerId?: string;
	details?: Prisma.InputJsonValue;
};

const SPENDING: TransactionKind[] = ["transfer", "bill", "load"];

const startOfManilaDay = (now: Date) =>
	new Date(
		`${now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })}T00:00:00+08:00`,
	);

const guard = <T>(query: Promise<T>, message: string) =>
	query.catch((error: unknown) => {
		if (asDatabaseError(error)?.code === "P2025") {
			return fail("BAD_REQUEST", message);
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
				balance: { gte: -amount },
				points: { gte: -points },
			},
			data: {
				balance: { increment: amount },
				points: { increment: points },
			},
		}),
		amount < 0 ? MESSAGES.insufficientBalance : MESSAGES.notEnoughPoints,
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
  const card = await tx.card.findUniqueOrThrow({
    where: { userId: entry.userId },
  });
  if (card.locked) fail("BAD_REQUEST", MESSAGES.cardLocked);

  const today = await tx.transaction.aggregate({
    where: {
      userId: entry.userId,
      kind: { in: SPENDING },
      amount: { lt: 0 },
      createdAt: { gte: startOfManilaDay(new Date()) },
    },
    _sum: { amount: true },
  });
  if (
    entry.kind !== "transfer" &&
    entry.amount - (today._sum.amount ?? 0) > card.dailyLimit
  ) {
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
	stashId: string,
	amount: number,
) {
	const stash = await guard(
		tx.stash.update({
			where: { id: stashId, userId, balance: { gte: -amount } },
			data: { balance: { increment: amount } },
		}),
		MESSAGES.notEnoughInStash,
	);

	return post(tx, {
		userId,
		kind: "stash",
		title: amount > 0 ? `Moved to ${stash.name}` : `Moved from ${stash.name}`,
		amount: -amount,
		stashId,
	});
}

export async function settleStashInterest(tx: Tx, userId: string, id: string) {
	const stash = await tx.stash.findUniqueOrThrow({ where: { id, userId } });
	const result = compoundInterest(stash, new Date());
	if (result.days === 0) return stash;
	const updated = await tx.stash.updateMany({
		where: {
			id,
			userId,
			balance: stash.balance,
			interestUpdatedAt: stash.interestUpdatedAt,
		},
		data: {
			balance: result.balance,
			interestCarry: result.interestCarry,
			interestUpdatedAt: result.interestUpdatedAt,
		},
	});
	if (updated.count !== 1)
		fail("CONFLICT", "Your savings changed. Please try again.");
	if (result.earned > 0) {
		const user = await tx.user.findUniqueOrThrow({
			where: { id: userId },
			select: { balance: true },
		});
		await tx.transaction.create({
			data: {
				userId,
				stashId: id,
				reference: newReference(),
				kind: "interest",
				title: `Interest in ${stash.name}`,
				amount: result.earned,
				balanceAfter: user.balance,
				details: {
					savingsBalanceAfter: result.balance,
					annualRate: stash.interestRate,
					days: result.days,
				},
			},
		});
	}
	return {
		...stash,
		balance: result.balance,
		interestCarry: result.interestCarry,
		interestUpdatedAt: result.interestUpdatedAt,
	};
}
