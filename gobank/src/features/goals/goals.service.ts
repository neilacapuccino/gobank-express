import { MAX_GOALS } from "~/shared/lib/money";
import { db } from "~/server/db";
import { AppError, asDatabaseError, fail, MESSAGES } from "~/server/errors";
import { moveGoalMoney, settleGoalInterest } from "~/server/ledger";
import type { Prisma } from "../../../generated/prisma";

type SavingsGoalFields = { name?: string; targetAmount?: number | null };

async function savingsTransaction<T>(
	work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
	for (let attempt = 0; attempt < 4; attempt++) {
		try {
			return await db.$transaction(work, { isolationLevel: "Serializable" });
		} catch (error) {
			const writeConflict = asDatabaseError(error)?.code === "P2034";
			const changedMeanwhile =
				error instanceof AppError && error.code === "CONFLICT";

			if (!writeConflict && !changedMeanwhile) throw error;
		}
	}

	return fail("CONFLICT", MESSAGES.savingsChanged);
}

export const listGoals = (userId: string) =>
	savingsTransaction(async (tx) => {
		const savingsGoals = await tx.savingsGoal.findMany({
			where: { userId },
			orderBy: { createdAt: "asc" },
		});

		const settled: typeof savingsGoals = [];
		for (const savingsGoal of savingsGoals) {
			settled.push(await settleGoalInterest(tx, savingsGoal));
		}

		return settled;
	});

const settleOwnedGoal = async (
	tx: Prisma.TransactionClient,
	userId: string,
	id: string,
	persist = false,
) =>
	settleGoalInterest(
		tx,
		await tx.savingsGoal.findUniqueOrThrow({ where: { id, userId } }),
		persist,
	);

export const getGoal = (userId: string, id: string) =>
	savingsTransaction(async (tx) => {
		const savingsGoal = await settleOwnedGoal(tx, userId, id);
		const transactions = await tx.transaction.findMany({
			where: { savingsGoalId: id, userId },
			orderBy: { createdAt: "desc" },
			take: 20,
		});
		return { ...savingsGoal, transactions };
	});

export const createGoal = (
	userId: string,
	name: string,
	targetAmount?: number | null,
) =>
	savingsTransaction(async (tx) => {
		const count = await tx.savingsGoal.count({ where: { userId } });
		if (count >= MAX_GOALS) fail("BAD_REQUEST", MESSAGES.goalLimit);
		return tx.savingsGoal.create({
			data: {
				userId,
				name,
				targetAmount,
				interestCalculatedAt: new Date(),
			},
		});
	});

export const updateGoal = (
	userId: string,
	id: string,
	fields: SavingsGoalFields,
) =>
	savingsTransaction(async (tx) => {
		await settleOwnedGoal(tx, userId, id, true);
		return tx.savingsGoal.update({ where: { id, userId }, data: fields });
	});

export const moveMoney = (
	userId: string,
	id: string,
	amountCentavos: number,
	direction: "in" | "out",
) =>
	savingsTransaction(async (tx) => {
		await settleOwnedGoal(tx, userId, id, true);
		return moveGoalMoney(
			tx,
			userId,
			id,
			direction === "in" ? amountCentavos : -amountCentavos,
		);
	});

export const removeGoal = (userId: string, id: string) =>
	savingsTransaction(async (tx) => {
		const savingsGoal = await settleOwnedGoal(tx, userId, id, true);

		if (savingsGoal.balance > 0) {
			await moveGoalMoney(tx, userId, savingsGoal.id, -savingsGoal.balance);
		}

		await tx.savingsGoal.delete({ where: { id, userId, balance: 0 } });
		return { returned: savingsGoal.balance };
	});
