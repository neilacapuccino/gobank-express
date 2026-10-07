import { MAX_STASHES } from "~/shared/lib/money";
import { db } from "~/server/db";
import { AppError, asDatabaseError, fail, MESSAGES } from "~/server/errors";
import { moveStash, settleStashInterest } from "~/server/ledger";
import type { Prisma } from "../../../generated/prisma";

type StashFields = { name?: string; goal?: number | null };

// Reading interest and changing a goal settle together; conflicts retry safely.
async function savingsTransaction<T>(
	work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
	for (let attempt = 0; attempt < 4; attempt++) {
		try {
			return await db.$transaction(work, { isolationLevel: "Serializable" });
		} catch (error) {
			if (
				asDatabaseError(error)?.code !== "P2034" &&
				!(error instanceof AppError && error.code === "CONFLICT")
			)
				throw error;
		}
	}
	return fail("CONFLICT", "Your savings changed. Please try again.");
}

export const listStashes = (userId: string) =>
	savingsTransaction(async (tx) => {
		const goals = await tx.stash.findMany({
			where: { userId },
			orderBy: { createdAt: "asc" },
		});
		for (const goal of goals) await settleStashInterest(tx, userId, goal.id);
		return tx.stash.findMany({
			where: { userId },
			orderBy: { createdAt: "asc" },
		});
	});

export const getStash = (userId: string, id: string) =>
	savingsTransaction(async (tx) => {
		await settleStashInterest(tx, userId, id);
		return tx.stash.findUniqueOrThrow({
			where: { id, userId },
			include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
		});
	});

export const createStash = (
	userId: string,
	name: string,
	goal?: number | null,
) =>
	savingsTransaction(async (tx) => {
		const count = await tx.stash.count({ where: { userId } });
		if (count >= MAX_STASHES) fail("BAD_REQUEST", MESSAGES.stashLimit);
		return tx.stash.create({
			data: { userId, name, goal, interestUpdatedAt: new Date() },
		});
	});

export const updateStash = (userId: string, id: string, fields: StashFields) =>
	savingsTransaction(async (tx) => {
		await settleStashInterest(tx, userId, id);
		return tx.stash.update({ where: { id, userId }, data: fields });
	});

export const moveMoney = (
	userId: string,
	id: string,
	amount: number,
	direction: "in" | "out",
) =>
	savingsTransaction(async (tx) => {
		await settleStashInterest(tx, userId, id);
		return moveStash(tx, userId, id, direction === "in" ? amount : -amount);
	});

export const removeStash = (userId: string, id: string) =>
	savingsTransaction(async (tx) => {
		const stash = await settleStashInterest(tx, userId, id);
		if (stash.balance > 0)
			await moveStash(tx, userId, stash.id, -stash.balance);
		await tx.stash.delete({ where: { id, userId, balance: 0 } });
		return { returned: stash.balance };
	});
