import { db } from "~/server/db";
import { activityFields } from "./activity.fields";

export async function listActivity(
	userId: string,
	cursor: string | null | undefined,
	limit: number,
) {
	const items = await db.transaction.findMany({
		where: { userId },
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
