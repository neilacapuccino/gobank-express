import { pointsValue } from "~/shared/lib/money";
import { activityFields } from "~/features/activity/activity.fields";
import { db } from "~/server/db";
import { post } from "~/server/ledger";
import { pageArgs, toPage } from "~/server/pagination";

export const redeemPoints = (userId: string, points: number) =>
	db.$transaction((tx) =>
		post(tx, {
			userId,
			kind: "reward",
			title: `Cash back · ${points.toLocaleString("en-PH")} points`,
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
		lifetimeRedeemed: Math.abs(redeemed._sum.points ?? 0),
		cashBackReceived: redeemed._sum.amount ?? 0,
	};
}

export async function listRewardActivity(
	userId: string,
	cursor: string | null | undefined,
	limit: number,
) {
	const rows = await db.transaction.findMany({
		where: { userId, points: { not: 0 } },
		select: activityFields,
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		...pageArgs(cursor, limit),
	});

	return toPage(rows, limit);
}
