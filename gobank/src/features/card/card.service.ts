import type { CardKind } from "../../../generated/prisma";
import { env } from "~/env";
import { db } from "~/server/db";
import { fail, MESSAGES } from "~/server/errors";
import { decryptCvv } from "./card-cvv.server";

type CardSettings = {
	lock?: { kind: CardKind; locked: boolean };
	cardDailyLimit?: number;
};

const CARD_FIELDS = {
	kind: true,
	brand: true,
	number: true,
	expiresAt: true,
	locked: true,
	user: { select: { fullName: true } },
} as const;

export async function getCard(userId: string) {
	const { cards, cardDailyLimit } = await db.user.findUniqueOrThrow({
		where: { id: userId },
		select: { cardDailyLimit: true, cards: { select: CARD_FIELDS } },
	});

	const physical = cards.find((card) => card.kind === "physical");
	const virtual = cards.find((card) => card.kind === "virtual");
	if (!physical || !virtual) return fail("NOT_FOUND", MESSAGES.cardNotFound);

	return { physical, virtual, cardDailyLimit };
}

export async function updateCard(
	userId: string,
	{ lock, cardDailyLimit }: CardSettings,
) {
	await db.$transaction(async (tx) => {
		if (lock) {
			await tx.card.update({
				where: { userId_kind: { userId, kind: lock.kind } },
				data: { locked: lock.locked },
			});
		}

		if (cardDailyLimit !== undefined) {
			await tx.user.update({
				where: { id: userId },
				data: { cardDailyLimit },
			});
		}
	});

	return getCard(userId);
}

export async function revealCvv(userId: string, kind: CardKind) {
	const card = await db.card.findUniqueOrThrow({
		where: { userId_kind: { userId, kind } },
		select: { number: true, cvvEncrypted: true },
	});

	return {
		cvv: decryptCvv(card.cvvEncrypted, card.number, env.CARD_ENCRYPTION_KEY),
	};
}
