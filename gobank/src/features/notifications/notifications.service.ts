import { PARTY } from "~/features/transfers/transfers.service";
import { db } from "~/server/db";

export async function listNotifications(
	userId: string,
	direction: "received" | "sent",
	cursor?: string | null,
	limit = 20,
) {
	const where =
		direction === "received" ? { payerId: userId } : { requesterId: userId };
	const items = await db.moneyRequest.findMany({
		where,
		include: {
			requester: {
				select: { ...PARTY, profilePhoto: direction === "received" },
			},
			payer: { select: { ...PARTY, profilePhoto: direction === "sent" } },
		},
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		take: limit + 1,
		...(cursor ? { cursor: { id: cursor, ...where }, skip: 1 } : {}),
	});
	const hasMore = items.length > limit;
	if (hasMore) items.pop();
	return {
		items: items.map((request) => ({
			...request,
			requester: {
				...request.requester,
				profilePhoto: request.requester.profilePhoto ?? null,
			},
			payer: {
				...request.payer,
				profilePhoto: request.payer.profilePhoto ?? null,
			},
		})),
		next: hasMore ? (items.at(-1)?.id ?? null) : null,
	};
}
