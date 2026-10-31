import { pointsValue } from "~/shared/lib/money";
import { db } from "~/server/db";
import { post } from "~/server/ledger";

export const redeemPoints = (userId: string, points: number) =>
	db.$transaction((tx) =>
		post(tx, {
			userId,
			kind: "reward",
			title: `Redeemed ${points.toLocaleString()} points`,
			amount: pointsValue(points),
			points: -points,
		}),
	);

export async function getRewardsSummary(userId: string) {
	const [user, earned, redeemed] = await Promise.all([
		db.user.findUniqueOrThrow({
			where: { id: userId },
			select: { points: true },
		}),
		db.transaction.aggregate({
			where: { userId, points: { gt: 0 } },
			_sum: { points: true },
		}),
		db.transaction.aggregate({
			where: { userId, kind: "reward", points: { lt: 0 } },
			_sum: { points: true, amount: true },
		}),
	]);
	return {
		points: user.points,
		lifetimeEarned: earned._sum.points ?? 0,
		lifetimeRedeemed: -(redeemed._sum.points ?? 0),
		cashBackReceived: redeemed._sum.amount ?? 0,
	};
}

export async function listRewardActivity(
	userId: string,
	cursor: string | null | undefined,
	limit: number,
) {
	const items = await db.transaction.findMany({
		where: { userId, points: { not: 0 } },
		select: {
			id: true,
			reference: true,
			kind: true,
			title: true,
			amount: true,
			points: true,
			createdAt: true,
		},
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		take: limit + 1,
		...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
	});
	const hasMore = items.length > limit;
	if (hasMore) items.pop();
	const next = hasMore ? items.at(-1)?.id : null;
	return { items, next };
}
