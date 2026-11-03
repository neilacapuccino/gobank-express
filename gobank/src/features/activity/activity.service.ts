import { db } from "~/server/db";
import { activityFields, MAIN_ACCOUNT_KINDS } from "./activity.fields";
import { filterWhere, type ActivityFilter } from "./activity.rules";

export async function listActivity(
	userId: string,
	cursor: string | null | undefined,
	limit: number,
	filter: ActivityFilter = "all",
) {
	const items = await db.transaction.findMany({
		where: { userId, kind: MAIN_ACCOUNT_KINDS, ...filterWhere(filter) },
		select: activityFields,
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		take: limit + 1,
		...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
	});
	const hasMore = items.length > limit;
	if (hasMore) items.pop();
	const next = hasMore ? items.at(-1)?.id : null;
	return { items, next };
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
