import { db } from "~/server/db";
import { pageArgs, toPage } from "~/server/pagination";
import { activityFields, MAIN_ACCOUNT_KINDS } from "./activity.fields";
import { filterWhere, type ActivityFilter } from "./activity.rules";

export async function listActivity(
	userId: string,
	cursor: string | null | undefined,
	limit: number,
	filter: ActivityFilter = "all",
) {
	const rows = await db.transaction.findMany({
		where: { userId, kind: MAIN_ACCOUNT_KINDS, ...filterWhere(filter) },
		select: activityFields,
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		...pageArgs(cursor, limit),
	});

	return toPage(rows, limit);
}

export const getTransaction = (userId: string, reference: string) =>
	db.transaction.findUniqueOrThrow({
		where: { reference_userId: { reference, userId } },
		include: {
			biller: { select: { name: true } },
			savingsGoal: { select: { name: true } },
			counterparty: { select: { username: true } },
		},
	});
