import { findRecipient, PARTY } from "~/features/transfers/transfers.service";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { transfer } from "~/server/ledger";

export async function listRequests(
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

export async function requestMoney(
	userId: string,
	from: string,
	amount: number,
	note: string | null,
) {
	const payer = await findRecipient(from, userId);

	return db.moneyRequest.create({
		data: {
			requesterId: userId,
			payerId: payer.id,
			amount,
			note,
		},
	});
}

export const respondToRequest = (userId: string, id: string, accept: boolean) =>
	db.$transaction(
		async (tx) => {
			// Claim the pending request before moving money; competing actions fail.
			const claimed = await tx.moneyRequest.updateMany({
				where: { id, payerId: userId, status: "pending" },
				data: { status: accept ? "paid" : "declined" },
			});
			if (claimed.count !== 1) fail("NOT_FOUND", MESSAGES.requestClosed);
			if (!accept) return null;

			const request = await tx.moneyRequest.findUniqueOrThrow({
				where: { id },
				include: {
					requester: { select: { id: true, username: true } },
					payer: { select: { id: true, username: true } },
				},
			});
			const sent = await transfer(
				tx,
				request.payer,
				request.requester,
				request.amount,
				request.note,
			);

			await tx.moneyRequest.update({
				where: { id },
				data: { reference: sent.reference },
			});

			return sent;
		},
		{
			timeout: 15000,
			maxWait: 10000,
		},
	);

export async function cancelRequest(userId: string, id: string) {
	const cancelled = await db.moneyRequest.updateMany({
		where: { id, requesterId: userId, status: "pending" },
		data: { status: "cancelled" },
	});
	if (cancelled.count !== 1) fail("NOT_FOUND", MESSAGES.requestClosed);
}
