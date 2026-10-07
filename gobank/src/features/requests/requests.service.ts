import { findRecipient, PARTY } from "~/features/transfers/transfers.service";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { transfer } from "~/server/ledger";

export const MAX_REQUEST_AMOUNT = 2_000_000;

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

export const listPendingRequestsForNotifications = (userId: string) =>
	db.moneyRequest.findMany({
		where: {
			payerId: userId,
			status: "pending",
		},
		include: {
			requester: {
				select: PARTY,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

export async function requestMoney(
	userId: string,
	from: string,
	amount: number,
	note: string | null,
) {
	if (!Number.isInteger(amount)) {
		fail("BAD_REQUEST", "Request amount must be a whole centavo value.");
	}

	if (amount <= 0) {
		fail("BAD_REQUEST", "Request amount must be greater than ₱0.00.");
	}

	if (amount > MAX_REQUEST_AMOUNT) {
		fail("BAD_REQUEST", "You can request a maximum of ₱20,000.00.");
	}

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
			const request = await tx.moneyRequest.findFirst({
				where: {
					id,
					payerId: userId,
					status: "pending",
				},
				include: {
					requester: {
						select: PARTY,
					},
					payer: {
						select: PARTY,
					},
				},
			});

			if (!request) {
				fail("NOT_FOUND", MESSAGES.requestClosed);
			}

			if (!accept) {
				await tx.moneyRequest.update({
					where: {
						id: request.id,
					},
					data: {
						status: "declined",
					},
				});

				return null;
			}

			const sent = await transfer(
				tx,
				request.payer,
				request.requester,
				request.amount,
				request.note,
			);

			await tx.moneyRequest.update({
				where: {
					id: request.id,
				},
				data: {
					status: "paid",
					reference: sent.reference,
				},
			});

			return sent;
		},
		{
			timeout: 15000,
			maxWait: 10000,
		},
	);

export const cancelRequest = (userId: string, id: string) =>
	db.moneyRequest.update({
		where: {
			id,
			requesterId: userId,
			status: "pending",
		},
		data: {
			status: "cancelled",
		},
	});
