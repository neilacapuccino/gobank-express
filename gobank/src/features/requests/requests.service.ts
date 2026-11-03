import { findRecipient } from "~/features/transfers/transfers.service";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { transfer } from "~/server/ledger";
import type { CardKind } from "../../../generated/prisma";

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

export const respondToRequest = (
	userId: string,
	id: string,
	accept: boolean,
	card: CardKind = "physical",
) =>
	db.$transaction(
		async (tx) => {
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
				card,
				request.note,
			);

			await tx.moneyRequest.update({
				where: { id },
				data: { reference: sent.reference },
			});

			return sent;
		},
		{ maxWait: 10_000, timeout: 15_000 },
	);

export async function cancelRequest(userId: string, id: string) {
	const cancelled = await db.moneyRequest.updateMany({
		where: { id, requesterId: userId, status: "pending" },
		data: { status: "cancelled" },
	});
	if (cancelled.count !== 1) fail("NOT_FOUND", MESSAGES.requestClosed);
}
