import { PARTY } from "~/features/transfers/transfers.service";
import { db } from "~/server/db";
import { toPage } from "~/server/pagination";

type Direction = "received" | "sent";

const partyFields = (includePhoto: boolean) => ({
	...PARTY,
	profilePhoto: includePhoto,
});

const withPhotoOrNull = <Party extends { profilePhoto?: string | null }>(
	party: Party,
) => ({ ...party, profilePhoto: party.profilePhoto ?? null });

export async function listNotifications(
	userId: string,
	direction: Direction,
	cursor?: string | null,
	limit = 20,
) {
	const received = direction === "received";
	const mine = received ? { payerId: userId } : { requesterId: userId };

	const rows = await db.moneyRequest.findMany({
		where: mine,
		include: {
			requester: { select: partyFields(received) },
			payer: { select: partyFields(!received) },
		},
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		take: limit + 1,
		...(cursor ? { cursor: { id: cursor, ...mine }, skip: 1 } : {}),
	});

	const { items, next } = toPage(rows, limit);

	return {
		items: items.map((request) => ({
			...request,
			requester: withPhotoOrNull(request.requester),
			payer: withPhotoOrNull(request.payer),
		})),
		next,
	};
}
