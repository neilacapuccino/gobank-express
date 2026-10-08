import { findRecipient, PARTY } from "~/features/transfers/transfers.service";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { transfer } from "~/server/ledger";

export const listRequests = (userId: string) =>
	db.moneyRequest.findMany({
		where: {
			OR: [{ requesterId: userId }, { payerId: userId }],
		},
		include: {
			requester: { select: PARTY },
			payer: { select: PARTY },
		},
		orderBy: { createdAt: "desc" },
	});

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
